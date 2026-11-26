#!/usr/bin/env node
// Is legal/terms.md what the page SERVES? Opens each URL's Privacy and terms (#terms) in real headless Chrome, takes the
// rendered page, and runs legal.333.eco's own check (scripts/served.mjs) on it: every line of the markdown must be found.
// The page draws its text with JavaScript, so a plain fetch of the URL holds none of it (index.html carries no terms).
//   node scripts/legal-check.mjs https://ocr.siliconwat.dev/ https://ocr.siliconwat.dev/km/     the live site
//   node scripts/legal-check.mjs --serve                                                        dist/ (after a build), / and /km/
//   --md <file>  check another copy of the markdown (default legal/terms.md)
// Exit 1 when any line is missing. No puppeteer: the DevTools protocol over Node's own WebSocket, as scripts/e2e.mjs.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { missingFromServed } from "./served.mjs";

const args = process.argv.slice(2);
const mdPath = args.includes("--md") ? args[args.indexOf("--md") + 1] : new URL("../legal/terms.md", import.meta.url);
const md = readFileSync(mdPath, "utf8");
const serve = args.includes("--serve");
const urls = serve ? ["http://localhost:4318/", "http://localhost:4318/km/"]
  : args.filter((a, i) => a.startsWith("http") && args[i - 1] !== "--md");
if (!urls.length) { console.error("usage: node scripts/legal-check.mjs <url>… | --serve [--md <file>]"); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = serve ? spawn("nice", ["-n", "10", "npx", "vite", "preview", "--port", "4318", "--strictPort"], { stdio: "ignore" }) : null;
const prof = mkdtempSync(join(tmpdir(), "ocr-legal-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--disable-gpu",
  "--remote-debugging-port=0", `--user-data-dir=${prof}`, "--no-first-run", "--lang=en-US", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((ok, no) => {
  let buf = ""; chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); });
  setTimeout(() => no(new Error("Chrome gave no DevTools address")), 20000);
});
const ws = new WebSocket(wsUrl); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.no(new Error(JSON.stringify(m.error))) : p.ok(m.result); }
});
const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const i = ++id; pending.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const evalIn = async (s, expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, s)).result.value;

let failed = 0;
try {
  if (server) await sleep(2500);   // the preview server
  for (const base of urls) {
    const url = base.replace(/#.*$/, "") + "#terms";
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId: s } = await send("Target.attachToTarget", { targetId, flatten: true });
    await send("Network.enable", {}, s); await send("Network.setCacheDisabled", { cacheDisabled: true }, s);
    await send("Page.enable", {}, s); await send("Page.navigate", { url }, s);
    let drawn = false;
    for (let i = 0; i < 80 && !(drawn = await evalIn(s, "!!document.querySelector('ocr-terms h2')").catch(() => false)); i++) await sleep(250);
    if (!drawn) { failed++; console.error(`✗ ${url}: the Privacy and terms page never drew`); continue; }
    await sleep(300);
    const missing = missingFromServed(md, await evalIn(s, "document.documentElement.outerHTML"));
    const lang = await evalIn(s, "document.documentElement.lang");
    if (missing.length) {
      failed++;
      console.error(`✗ ${url} (lang ${lang}): ${missing.length} line(s) of the markdown not on the page`);
      for (const l of missing) console.error(`    ${l.slice(0, 120)}${l.length > 120 ? "…" : ""}`);
    } else console.log(`✓ ${url} (lang ${lang}): every line of the markdown is on the page`);
    await send("Target.closeTarget", { targetId });
  }
} finally {
  ws.close(); chrome.kill(); server?.kill();
  await sleep(300); rmSync(prof, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
