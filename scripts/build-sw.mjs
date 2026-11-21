#!/usr/bin/env node
// After `vite build`: write dist/sw.js from scripts/sw.template.js — the app shell to keep (the two pages, the hashed assets, the
// boot script, the manifest and icons) and a VERSION from their bytes, so any change to the site is a new worker.
// ⛔ vendor/, models/ and dict/ are NOT precached: they are kept when first used (a visitor who reads one Pāli page never
// downloads every reader file). Usage: node scripts/build-sw.mjs
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
const D = "dist", list = ["/", "/km/", "/boot.js", "/site.webmanifest", "/favicon.svg", "/favicon-96x96.png", "/apple-touch-icon.png", "/icon-192.png"];
for (const f of readdirSync(`${D}/assets`)) list.push(`/assets/${f}`);
const h = createHash("sha256");
for (const p of list) h.update(p).update(readFileSync(`${D}${p.endsWith("/") ? p + "index.html" : p}`));
const version = h.digest("hex").slice(0, 12);
const bytes = list.reduce((s, p) => s + statSync(`${D}${p.endsWith("/") ? p + "index.html" : p}`).size, 0);
writeFileSync(`${D}/sw.js`, readFileSync("scripts/sw.template.js", "utf8").replace("__VERSION__", version).replace("__PRECACHE__", JSON.stringify(list)));
console.log(`sw.js: version ${version} · ${list.length} files kept for offline (${(bytes / 1e6).toFixed(1)} MB)`);
