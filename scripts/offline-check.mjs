#!/usr/bin/env node
// Offline and share, in real Chrome against the built site (vite preview of dist/): (1) the worker takes control; (2) read a
// page online (the reader's files are kept as they are used); (3) go OFFLINE, reload: the page must still open and READ another
// page; (4) back online, a shared picture POSTed to /share (what Android's share sheet does) is opened and read, and the
// device's share inbox is empty afterwards. Usage: node scripts/offline-check.mjs <first.pdf> <second.pdf> <shared.jpg>
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const [first, second, shared] = process.argv.slice(2).map((f) => resolve(f));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), base = "http://localhost:4318";
const server = spawn("nice", ["-n", "10", "npx", "vite", "preview", "--port", "4318", "--strictPort"], { stdio: "ignore" });
const prof = mkdtempSync(join(tmpdir(), "ocr-offline-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${prof}`, "--lang=en-US", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((ok) => { let b = ""; chrome.stderr.on("data", (d) => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
const ws = new WebSocket(wsUrl); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pend = new Map(); ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.no(new Error(JSON.stringify(m.error))) : p.ok(m.result); } });
const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const ev = async (s, e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, s)).result.value;
const result = {};
try {
  await sleep(2500);
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId: s } = await send("Target.attachToTarget", { targetId, flatten: true });
  for (const d of ["Runtime", "Page", "Network", "DOM"]) await send(`${d}.enable`, {}, s);
  const go = async (url) => { await send("Page.navigate", { url }, s); for (let i = 0; i < 60 && !(await ev(s, "document.readyState === 'complete' && !!document.querySelector('#pick-file')")); i++) await sleep(250); };
  const upload = async (f) => {
    const { root } = await send("DOM.getDocument", {}, s); const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: "#pick-file" }, s);
    await send("DOM.setFileInputFiles", { nodeId, files: [f] }, s);
    for (let i = 0; i < 200; i++) {
      await sleep(1000);
      await ev(s, "(() => { const b = [...document.querySelectorAll('button')].find(x => /^\\s*Read this page\\s*$/.test(x.textContent)); if (b) b.click(); })()");
      if (await ev(s, "[...document.querySelectorAll('button')].some(b => /Read another page|Try another page/.test(b.textContent))")) break;
    }
    return ev(s, "document.querySelectorAll('[data-line]').length");
  };
  await go(base + "/");
  await ev(s, "navigator.serviceWorker.ready.then(() => true)");
  await go(base + "/");
  result.controlled = await ev(s, "!!navigator.serviceWorker.controller");
  result.onlineLines = await upload(first);
  result.runtimeKept = await ev(s, "caches.open('runtime-v1').then(c => c.keys()).then(ks => ks.map(k => new URL(k.url).pathname))");
  result.shellPdf = await ev(s, "caches.keys().then(async ns => { const out = []; for (const n of ns) if (n.startsWith('shell-')) { const c = await caches.open(n); for (const k of await c.keys()) if (/pdf/.test(k.url)) out.push(new URL(k.url).pathname); } return out; })");
  result.pdfRequests = await ev(s, "performance.getEntriesByType('resource').map(e => new URL(e.name).pathname).filter(p => /pdf|jbig|wasm|fonts\\//.test(p))");
  const failed = []; let offline = false;
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (!offline || m.sessionId !== s) return;
    if (m.method === "Network.requestWillBeSent") failed.push({ id: m.params.requestId, url: m.params.request.url });
    if (m.method === "Network.loadingFailed") { const r = failed.find((x) => x.id === m.params.requestId); if (r) r.failed = m.params.errorText; }
    if (m.method === "Runtime.exceptionThrown") failed.push({ exception: m.params.exceptionDetails.exception?.description?.slice(0, 200) });
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") failed.push({ console: m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 200) }); });
  offline = true;
  await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }, s);
  await go(base + "/");
  result.offlinePageOpens = await ev(s, "!!document.querySelector('#pick-file')");
  // what the page says (the toast), and an image as well as the PDF, to tell pdf.js from the reader
  await ev(s, "(() => { window.__toasts = []; new MutationObserver(() => { const t = document.querySelector('[role=status]')?.textContent?.trim(); if (t) window.__toasts.push(t); }).observe(document.body, { subtree: true, childList: true, characterData: true }); })()");
  result.offlineLines = await upload(second);
  result.offlineToasts = await ev(s, "window.__toasts");
  await go(base + "/");
  result.offlineImageLines = await upload(shared);
  result.offlineFailures = failed.filter((x) => x.failed || x.exception || x.console).slice(0, 12);
  result.offlineScreen = await ev(s, "document.querySelector('main')?.innerText.slice(0, 160)");
  offline = false;
  await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }, s);
  // the share: a file input made for the test carries the picture; the page POSTs it to /share exactly as the share sheet would
  await go(base + "/");
  await ev(s, "(() => { const i = document.createElement('input'); i.type = 'file'; i.id = 'share-test'; document.body.append(i); })()");
  const { root } = await send("DOM.getDocument", {}, s); const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: "#share-test" }, s);
  await send("DOM.setFileInputFiles", { nodeId, files: [shared] }, s);
  result.shareStatus = await ev(s, "(async () => { const fd = new FormData(); fd.append('page', document.querySelector('#share-test').files[0]); const r = await fetch('/share', { method: 'POST', body: fd, redirect: 'manual' }); return r.type + ' ' + r.status; })()");
  await send("Page.navigate", { url: base + "/?share=1" }, s);
  for (let i = 0; i < 200; i++) {
    await sleep(1000);
    await ev(s, "(() => { const b = [...document.querySelectorAll('button')].find(x => /^\\s*Read this page\\s*$/.test(x.textContent)); if (b) b.click(); })()");
    if (await ev(s, "[...document.querySelectorAll('button')].some(b => /Read another page|Try another page/.test(b.textContent))")) break;
  }
  result.sharedLines = await ev(s, "document.querySelectorAll('[data-line]').length");
  result.inboxEmptyAfter = !(await ev(s, "caches.has('share-inbox')"));
  result.addressCleared = await ev(s, "location.search === ''");
} finally {
  console.log(JSON.stringify(result));
  ws.close(); chrome.kill(); server.kill(); await sleep(400); rmSync(prof, { recursive: true, force: true });
}
