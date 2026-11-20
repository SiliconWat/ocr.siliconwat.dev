/** Does straightening work, and does it leave the measured scans alone? (2026-11-20; exploratory, synthetic tilts.)
 *  1. On every test page (the parity set): the measured tilt must be inside ±MIN_DEG, so nothing measured is rotated.
 *  2. On N held-out pages turned by known angles: the angle found, and — with --read <model> — the median page CER with and
 *     without straightening (written for the private repo's scorer as JSON). Usage:
 *     tsx scripts/deskew-check.ts <parity-dir> [--n 10] [--angles 1,2,3,5] [--read pali-a-p3 --out <dir>] */
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createWorker, OEM, PSM } from "tesseract.js";
import { fromPGM, resize, toPGM, type Gray } from "../src/read/gray";
import { textLines } from "../src/read/lines";
import { lineBox, crop } from "../src/read/crop";
import { skewAngle, rotate, MIN_DEG } from "../src/read/deskew";

const argv = process.argv.slice(2), opt = (k: string, d?: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const dir = argv[0], n = +opt("--n", "10")!, angles = opt("--angles", "1,2,3,5")!.split(",").map(Number), model = opt("--read");
const stems = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
const lineCopy = (g: Gray) => resize(g, Math.round(g.w / 2), Math.round(g.h / 2));

let outside = 0; const found: number[] = [];
for (const st of stems) { const a = skewAngle(fromPGM(readFileSync(join(dir, st + ".app.pgm")))); found.push(a); if (Math.abs(a) >= MIN_DEG) { outside++; console.log(`  rotated: ${st} at ${a}°`); } }
console.log(`1. the ${stems.length} test pages: tilt found ${Math.min(...found)}…${Math.max(...found)}° · would be rotated: ${outside}`);

const pick = stems.filter((_, i) => i % Math.max(1, Math.floor(stems.length / n)) === 0).slice(0, n);
const worker = model ? await createWorker(model, OEM.LSTM_ONLY, { langPath: new URL("../public/models", import.meta.url).pathname, gzip: false, cacheMethod: "none" }, { load_system_dawg: "0", load_freq_dawg: "0" }) : null;
if (worker) await worker.setParameters({ tessedit_pageseg_mode: PSM.RAW_LINE });
async function read(g: Gray) {
  const line = lineCopy(g), out: string[] = [];
  for (const [a, b] of textLines(line)) out.push((await worker!.recognize(Buffer.from(toPGM(crop(g, lineBox(line, a, b, g.w / line.w, [g.w, g.h])))))).data.text.trim());
  return out.join("\n");
}
const rows: { stem: string; angle: number; found: number; plain?: string; straightened?: string }[] = [];
// the test scans whose own small tilt is past MIN_DEG: read as they are and straightened (does rotating a real scan help?)
const flagged: { stem: string; found: number; plain?: string; straightened?: string }[] = [];
if (worker) for (const st of stems) {
  const f = skewAngle(fromPGM(readFileSync(join(dir, st + ".app.pgm"))));
  if (Math.abs(f) < MIN_DEG) continue;
  const g = fromPGM(readFileSync(join(dir, st + ".r300.pgm")));
  flagged.push({ stem: st, found: f, plain: await read(g), straightened: await read(rotate(g, f)) });
}
const out = opt("--out"); if (out) mkdirSync(out, { recursive: true });
for (const st of pick) {
  const g = fromPGM(readFileSync(join(dir, st + ".r300.pgm")));
  for (const ang of angles.flatMap((x) => [x, -x])) {
    const tilted = rotate(g, -ang);                       // a page photographed `ang` degrees off level
    const f = skewAngle(lineCopy(tilted));
    const row = { stem: st, angle: ang, found: f } as (typeof rows)[number];
    if (worker) { row.plain = await read(tilted); row.straightened = await read(Math.abs(f) >= MIN_DEG ? rotate(tilted, f) : tilted); }
    rows.push(row);
  }
}
const err = rows.map((r) => Math.abs(r.found - r.angle)).sort((a, b) => a - b);
console.log(`2. ${rows.length} tilted pages: angle error median ${err[Math.floor(err.length / 2)].toFixed(2)}° · worst ${err.at(-1)!.toFixed(2)}°`);
if (out) writeFileSync(join(out, "deskew.json"), JSON.stringify({ rows, flagged }));
await worker?.terminate();
