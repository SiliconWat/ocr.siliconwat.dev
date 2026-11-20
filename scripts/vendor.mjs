#!/usr/bin/env node
// Copy what the reader runs from node_modules into public/vendor/ (git-ignored), so this site serves all of it itself and
// its Content-Security-Policy can refuse every other host: tesseract.js's worker and its LSTM-only WebAssembly cores (every
// SIMD variant; tesseract.js picks one per device), and pdf.js's worker, its WebAssembly decoders (JBIG2 — the Institute
// edition's scans are JBIG2 — JPEG 2000) and its standard fonts. Runs before dev and build.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
const out = "public/vendor"; rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/tesseract/core`, { recursive: true });
cpSync("node_modules/tesseract.js/dist/worker.min.js", `${out}/tesseract/worker.min.js`);
for (const f of readdirSync("node_modules/tesseract.js-core")) if (/^tesseract-core.*lstm.*\.(js|wasm)$/.test(f)) cpSync(`node_modules/tesseract.js-core/${f}`, `${out}/tesseract/core/${f}`);
mkdirSync(`${out}/pdfjs`, { recursive: true });
cpSync("node_modules/pdfjs-dist/build/pdf.worker.min.mjs", `${out}/pdfjs/pdf.worker.min.mjs`);
cpSync("node_modules/pdfjs-dist/wasm", `${out}/pdfjs/wasm`, { recursive: true });
cpSync("node_modules/pdfjs-dist/standard_fonts", `${out}/pdfjs/standard_fonts`, { recursive: true });
console.log("vendor: tesseract.js worker + LSTM cores, pdf.js worker + wasm + standard fonts → public/vendor/");
