/** Phone pictures through THIS repo's preparation and the browser's engine (Node, tesseract.js): read every picture in a
 *  manifest (tipitaka-khmer tools/make_photo_dev.py, synthetic; or the photo pilot's real samples) and write the text per file,
 *  for the private repo's scorer. Usage: tsx scripts/photo-check.ts <manifest.json> --model joint-a-p4 --out <file.json> */
import { readFileSync, writeFileSync } from "node:fs";
import { createWorker, OEM, PSM } from "tesseract.js";
import { fromPGM, toPGM } from "../src/read/gray";
import { textLines } from "../src/read/lines";
import { lineBox, crop } from "../src/read/crop";
import { preparePage } from "../src/read/page";

const argv = process.argv.slice(2), opt = (k: string) => argv[argv.indexOf(k) + 1];
const items: { file: string; kind: string; leaf: "pali" | "khmer"; corners?: [number, number][] | null }[] = JSON.parse(readFileSync(argv[0], "utf8"));
const trueCorners = argv.includes("--true-corners");   // the corners the synthetic picture was made with: is corner-finding the weak step?
const w = await createWorker(opt("--model"), OEM.LSTM_ONLY, { langPath: new URL("../public/models", import.meta.url).pathname, gzip: false, cacheMethod: "none" },
  { load_system_dawg: "0", load_freq_dawg: "0" });
await w.setParameters({ tessedit_pageseg_mode: PSM.RAW_LINE });
const out: Record<string, { text: string; lines: number; photo: boolean; median: number }> = {};
for (const it of items) {
  const opts = trueCorners && it.corners ? { corners: it.corners as never } : {};
  const p = preparePage(fromPGM(readFileSync(it.file)), false, undefined, opts);
  const bands = textLines(p.line, { splitTall: it.leaf === "khmer" });
  const texts: string[] = [], conf: number[] = [];
  for (const [a, b] of bands) {
    const r = await w.recognize(Buffer.from(toPGM(crop(p.crop, lineBox(p.line, a, b, p.crop.w / p.line.w, [p.crop.w, p.crop.h])))));
    texts.push(r.data.text.trim()); conf.push(r.data.confidence);
  }
  conf.sort((x, y) => x - y);
  out[it.file] = { text: texts.join("\n"), lines: bands.length, photo: Boolean(p.photo), median: conf.length ? conf[Math.floor(conf.length / 2)] : 0 };
}
await w.terminate();
writeFileSync(opt("--out"), JSON.stringify(out));
console.log(`${items.length} pictures read → ${opt("--out")}`);
