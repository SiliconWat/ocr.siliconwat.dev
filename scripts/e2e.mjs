#!/usr/bin/env node
// End to end, in real Chrome, under the page's own CSP: serve dist/, open the page, hand the file input a page (an image or
// a PDF, as a visitor would), wait for "Read another page", and write what was read plus every console error and CSP
// report. No puppeteer: the DevTools protocol over Node's own WebSocket. Usage:
//   node scripts/e2e.mjs --out <result.json> <file>…      (needs `npm run build:dev` first; serves dist/ on :4318)
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const out = args[args.indexOf("--out") + 1];
const listen = args.includes("--listen");
const model = args.includes("--model") ? args[args.indexOf("--model") + 1] : null;
const base = args.includes("--url") ? args[args.indexOf("--url") + 1].replace(/\/$/, "") : "http://localhost:4318";   // a deployed copy instead of dist/   // accurate | public (the reader picker's stored choice)
const range = args.includes("--range") ? args[args.indexOf("--range") + 1].split("-").map(Number) : null;   // a PDF: read pages a–b
const files = args.filter((a, i) => a !== "--out" && a !== "--listen" && a !== "--range" && a !== "--model" && a !== "--url" && args[i - 1] !== "--out" && args[i - 1] !== "--range" && args[i - 1] !== "--model" && args[i - 1] !== "--url").map((f) => resolve(f));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = base.startsWith("http://localhost") ? spawn("nice", ["-n", "10", "npx", "vite", "preview", "--port", "4318", "--strictPort"], { stdio: "ignore" }) : null;
const prof = mkdtempSync(join(tmpdir(), "ocr-e2e-"));
const chrome = spawn("nice", ["-n", "10", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new",
  "--disable-gpu", "--remote-debugging-port=0", `--user-data-dir=${prof}`, "--no-first-run", "--lang=en-US", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((ok, no) => {
  let buf = ""; chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); });
  setTimeout(() => no(new Error("Chrome gave no DevTools address")), 20000);
});
const ws = new WebSocket(wsUrl); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(), listeners = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.no(new Error(JSON.stringify(m.error))) : p.ok(m.result); }
  else listeners.forEach((l) => l(m));
});
const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const i = ++id; pending.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const evalIn = async (s, expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, s)).result.value;

await sleep(2500);   // the preview server
const results = [];
try {
  for (const f of files) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId: s } = await send("Target.attachToTarget", { targetId, flatten: true });
    const problems = [];
    listeners.push((m) => {
      if (m.sessionId !== s) return;
      if (m.method === "Runtime.exceptionThrown") problems.push("exception: " + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text));
      if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) problems.push(`console.${m.params.type}: ` + m.params.args.map((a) => a.value ?? a.description).join(" "));
      if (m.method === "Log.entryAdded" && ["error", "warning"].includes(m.params.entry.level)) problems.push(`log.${m.params.entry.level}: ${m.params.entry.text}`);
    });
    await send("Runtime.enable", {}, s); await send("Performance.enable", {}, s); await send("Log.enable", {}, s); await send("Page.enable", {}, s); await send("DOM.enable", {}, s);
    await send("Page.navigate", { url: base + "/" }, s);
    if (model) {   // the reader picker's stored choice (src/ui/prefs.ts KEYS.model), then a fresh load so the page reads it
      for (let i = 0; i < 40 && !(await evalIn(s, "document.readyState === 'complete'")); i++) await sleep(250);
      await evalIn(s, `localStorage.setItem("ocr-reader", ${JSON.stringify(model)})`);
      await send("Page.navigate", { url: base + "/" }, s);
    }
    for (let i = 0; i < 40 && !(await evalIn(s, "!!document.querySelector('#pick-file')")); i++) await sleep(250);
    const { root } = await send("DOM.getDocument", {}, s);
    const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: "#pick-file" }, s);
    const t0 = Date.now();
    await send("DOM.setFileInputFiles", { nodeId, files: [f] }, s);
    let chooser = null;
    if (range) {   // the page chooser (state 1b): A range, tap the first and last page, Read these pages
      for (let i = 0; i < 240 && !(await evalIn(s, "!!document.querySelector('[data-n]')")); i++) await sleep(250);
      await sleep(2000);   // let the first thumbnails draw
      const heap = (await send("Performance.getMetrics", {}, s).catch(async () => { await send("Performance.enable", {}, s); return send("Performance.getMetrics", {}, s); })).metrics;
      chooser = { seconds: (Date.now() - t0) / 1000, pages: await evalIn(s, "document.querySelectorAll('[data-n]').length"),
        thumbsDrawn: await evalIn(s, "[...document.querySelectorAll('[data-n] img')].filter(i => i.getAttribute('src')).length"),
        heapMB: Math.round((heap.find((m) => m.name === "JSHeapUsedSize")?.value ?? 0) / 1e6) };
      await evalIn(s, `document.querySelector('[data-n="${range[1]}"]')?.scrollIntoView()`);
      await evalIn(s, `(() => { const b = (re) => [...document.querySelectorAll('button')].find(x => re.test(x.textContent.trim()));
        b(/^A range$/).click(); document.querySelector('[data-n="${range[0]}"]').click(); document.querySelector('[data-n="${range[1]}"]').click();
        setTimeout(() => b(/^Read these pages$/).click(), 300); })()`);
    }
    let done = false;
    while (!done && Date.now() - t0 < 600000) {
      await sleep(1500);
      done = await evalIn(s, "[...document.querySelectorAll('button')].some(b => /Read another page|Try another page/.test(b.textContent))");
    }
    const page = await evalIn(s, `({ lines: [...document.querySelectorAll('[data-line]')].map(e => e.textContent),
      leaf: [...document.querySelectorAll('[role=group][aria-label="This page is in"] [aria-pressed=true]')].map(e => e.textContent.trim()).join(","),
      pages: [...document.querySelectorAll('[data-page]')].map(e => e.textContent.trim()), h1: document.querySelector('h1')?.textContent?.trim(),
      shown: document.querySelector('main')?.innerText.slice(0, 400) })`);
    let heard = null;
    if (listen && done) {   // select line 2, press Listen with a real click, and wait for the voice to play
      const tts = [];
      await send("Network.enable", {}, s);
      listeners.push((m) => { if (m.sessionId === s && m.method === "Network.responseReceived" && m.params.response.url.startsWith("https://tts.siliconwat.dev/")) tts.push(m.params.response.status); });
      await evalIn(s, `(() => { const el = document.querySelector('[data-line="2"]'); const r = document.createRange(); r.selectNodeContents(el);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.dispatchEvent(new Event('selectionchange')); })()`);
      await sleep(800);
      const at = await evalIn(s, `(() => { const b = [...document.querySelectorAll('button')].find(b => /^\\s*Listen\\s*$/.test(b.textContent)); if (!b) return null;
        const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      if (at) {
        for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: at.x, y: at.y, button: "left", clickCount: 1 }, s);
        let playing = false;
        for (let i = 0; i < 30 && !playing; i++) { await sleep(500); playing = await evalIn(s, "[...document.querySelectorAll('button')].some(b => /^\\s*Stop\\s*$/.test(b.textContent))"); }
        heard = { button: true, playing, ttsStatus: tts };
      } else heard = { button: false };
      console.log(`  listen: ${JSON.stringify(heard)}`);
    }
    const end = (await send("Performance.getMetrics", {}, s)).metrics;
    results.push({ file: f, seconds: (Date.now() - t0) / 1000, finished: done, ...page, problems, heard, chooser, heapEndMB: Math.round((end.find((m) => m.name === "JSHeapUsedSize")?.value ?? 0) / 1e6) });
    console.log(`${f.split("/").pop()}: ${done ? "read" : "TIMED OUT"} in ${((Date.now() - t0) / 1000).toFixed(0)} s · ${page.lines.length} lines · leaf ${page.leaf} · ${problems.length} console/CSP problems`);
    await send("Target.closeTarget", { targetId });
  }
} finally {
  writeFileSync(out, JSON.stringify(results, null, 1));
  ws.close(); chrome.kill(); server?.kill(); await sleep(500); rmSync(prof, { recursive: true, force: true });
}
