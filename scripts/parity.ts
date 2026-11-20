/** Browser parity, part 1 (spec §Acceptance; A64): run THIS repo's reading code on the exact pixels the measured Python
 *  pipeline used (written by tipitaka-khmer's tools/dump_parity.py), and
 *    1. require every band and every crop box to equal the Python's — the port itself, exactly;
 *    2. with --read, read every line with tesseract.js (the same WebAssembly the browser runs) and write each page's text
 *       in pilot 1's format, so the Python scorer scores it exactly as it scored pilot 3.
 *  Usage: tsx scripts/parity.ts <parity-dir> [--leaf pali|khmer] [--read <model> --models <dir> --out <dir>] [--workers 2]
 *  No data is kept in this repo. */
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createScheduler, createWorker, OEM, PSM } from "tesseract.js";
import { fromPGM, toPGM } from "../src/read/gray";
import { textLines } from "../src/read/lines";
import { lineBox, crop } from "../src/read/crop";

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const dir = argv[0], leaf = opt("--leaf", "pali")!, model = opt("--read"), workers = +opt("--workers", "2")!;
const pages = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

let bandBad = 0, boxBad = 0, lines = 0;
const jobs: { stem: string; crops: Uint8Array[] }[] = [];
for (const f of pages) {
  const ref = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const stem = f.replace(/\.json$/, "");
  const app = fromPGM(readFileSync(join(dir, stem + ".app.pgm")));
  const r300 = fromPGM(readFileSync(join(dir, stem + ".r300.pgm")));
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
console.log(`port: ${pages.length} pages, ${lines} lines · bands identical ${pages.length - bandBad}/${pages.length} · boxes identical ${pages.length - boxBad}/${pages.length}`);

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
