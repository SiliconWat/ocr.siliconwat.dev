/** Browser parity, part 1 (spec §Acceptance; A64): run THIS repo's reading code on the exact pixels the measured Python
 *  pipeline used (written by tipitaka-khmer's tools/dump_parity.py), and
 *    1. require every band and every crop box to equal the Python's — the port itself, exactly;
 *    2. with --read, read every line with tesseract.js (the same WebAssembly the browser runs) and write each page's text
 *       in pilot 1's format, so the Python scorer scores it exactly as it scored pilot 3.
 *  Part 3 (spec §acceptance): --single r300|app hands the page over as ONE image (the 300-dpi scan, or the app image as
 *  bedok publishes it) and prepares it with src/read/page.ts — exactly what a visitor's browser does with an image.
 *  Usage: tsx scripts/parity.ts <parity-dir> [--leaf pali|khmer] [--single r300|app] [--read <model> --models <dir> --out <dir>] [--workers 2]
 *  No data is kept in this repo. */
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createScheduler, createWorker, OEM, PSM } from "tesseract.js";
import { fromPGM, toPGM } from "../src/read/gray";
import { textLines } from "../src/read/lines";
import { lineBox, crop } from "../src/read/crop";
import { preparePage } from "../src/read/page";

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const dir = argv[0], leaf = opt("--leaf", "pali")!, model = opt("--read"), workers = +opt("--workers", "2")!, single = opt("--single");
const pages = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

let bandBad = 0, boxBad = 0, lines = 0;
const jobs: { stem: string; crops: Uint8Array[] }[] = [];
for (const f of pages) {
  const ref = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const stem = f.replace(/\.json$/, "");
  const app = fromPGM(readFileSync(join(dir, stem + ".app.pgm")));
  const r300 = fromPGM(readFileSync(join(dir, stem + ".r300.pgm")));
  if (single) {   // part 3: one image, prepared as the browser prepares an image
    const p = preparePage(single === "app" ? app : r300, false);
    const bands = textLines(p.line, { splitTall: leaf === "khmer" });
    if (bands.length !== ref.bands.length) { bandBad++; console.log(`LINE COUNT differs ${stem}: ${bands.length} vs Python ${ref.bands.length}${p.turned ? ` (turned ${p.tilt}°)` : ""}`); }
    lines += bands.length;
    const boxes = bands.map(([a, b]) => lineBox(p.line, a, b, p.crop.w / p.line.w, [p.crop.w, p.crop.h]));
    if (model) jobs.push({ stem, crops: boxes.map((bx) => toPGM(crop(p.crop, bx))) });
    continue;
  }
  const bands = textLines(app, { splitTall: leaf === "khmer" });
  if (JSON.stringify(bands) !== JSON.stringify(ref.bands)) {
    bandBad++; console.log(`BANDS differ ${stem}: js ${bands.length} vs py ${ref.bands.length}`);
  }
  const k = r300.w / app.w;
  const boxes = bands.map(([a, b]) => lineBox(app, a, b, k, [r300.w, r300.h]));
  if (JSON.stringify(boxes) !== JSON.stringify(ref.boxes)) { boxBad++; console.log(`BOXES differ ${stem}`); }
  lines += bands.length;
  if (model) jobs.push({ stem, crops: boxes.map((bx) => toPGM(crop(r300, bx))) });
}
console.log(single ? `single image (${single}): ${pages.length} pages, ${lines} lines · same line count as the Python ${pages.length - bandBad}/${pages.length}`
  : `port: ${pages.length} pages, ${lines} lines · bands identical ${pages.length - bandBad}/${pages.length} · boxes identical ${pages.length - boxBad}/${pages.length}`);

if (model) {
  const out = opt("--out")!; mkdirSync(out, { recursive: true });
  const scheduler = createScheduler();
  for (let i = 0; i < workers; i++) {
    const w = await createWorker(model, OEM.LSTM_ONLY, { langPath: opt("--models"), gzip: false, cacheMethod: "none" },
      { load_system_dawg: "0", load_freq_dawg: "0" });
    await w.setParameters({ tessedit_pageseg_mode: PSM.RAW_LINE });
    scheduler.addWorker(w);
  }
  const t0 = Date.now();
  for (const { stem, crops } of jobs) {
    const t = Date.now();
    const texts = await Promise.all(crops.map((c) => scheduler.addJob("recognize", Buffer.from(c)).then((r: any) => r.data.text.trim())));
    writeFileSync(join(out, stem + ".json"), JSON.stringify({ text: texts.join("\n"), stop: "ok", cost: 0, seconds: (Date.now() - t) / 1000 }));
  }
  await scheduler.terminate();
  console.log(`read ${jobs.length} pages with ${model} (tesseract.js) in ${((Date.now() - t0) / 60000).toFixed(1)} min → ${out}`);
}
