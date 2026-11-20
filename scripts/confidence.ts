/** Per-line text and confidence through THIS repo's pipeline, in Node (the same tesseract.js WebAssembly as the browser) — the
 *  instrument for calibrating "not this print" (state 6). Usage: tsx scripts/confidence.ts <page.pgm>… --models a,b [--json out]
 *  A page is given as an 8-bit PGM at full size; the line copy is made exactly as reader.ts makes it for an image. */
import { readFileSync, writeFileSync } from "node:fs";
import { createWorker, OEM, PSM } from "tesseract.js";
import { fromPGM, resize, toPGM } from "../src/read/gray";
import { textLines } from "../src/read/lines";
import { lineBox, crop } from "../src/read/crop";
import { detectLeaf } from "../src/read/leaf";

const argv = process.argv.slice(2);
const models = argv[argv.indexOf("--models") + 1].split(",");
const out = argv.includes("--json") ? argv[argv.indexOf("--json") + 1] : null;
const files = argv.filter((a, i) => !a.startsWith("--") && !["--models", "--json"].includes(argv[i - 1]));
const rows: unknown[] = [];
for (const m of models) {
  const w = await createWorker(m, OEM.LSTM_ONLY, { langPath: new URL("../public/models", import.meta.url).pathname, gzip: false, cacheMethod: "none" },
    { load_system_dawg: "0", load_freq_dawg: "0" });
  await w.setParameters({ tessedit_pageseg_mode: PSM.RAW_LINE });
  for (const f of files) {
    const g = fromPGM(readFileSync(f)); const s = 1340 / Math.max(g.w, g.h);
    const line = resize(g, Math.round(g.w * s), Math.round(g.h * s));
    const bands = textLines(line, { splitTall: m.startsWith("khmer") });
    const lines: { text: string; confidence: number }[] = [];
    for (const [a, b] of bands) {
      const r = await w.recognize(Buffer.from(toPGM(crop(g, lineBox(line, a, b, g.w / line.w, [g.w, g.h])))));
      lines.push({ text: r.data.text.trim(), confidence: Math.round(r.data.confidence) });
    }
    const c = lines.map((l) => l.confidence).sort((x, y) => x - y), med = c.length ? c[Math.floor(c.length / 2)] : 0;
    console.log(`${f.split("/").pop()} · ${m}: ${lines.length} lines · median confidence ${med} · leaf ${detectLeaf(lines.map((l) => l.text).join(" "))} · [${lines.map((l) => l.confidence).join(",")}]`);
    rows.push({ file: f, model: m, median: med, lines });
  }
  await w.terminate();
}
if (out) writeFileSync(out, JSON.stringify(rows, null, 1));
