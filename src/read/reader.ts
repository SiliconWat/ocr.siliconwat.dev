/** The real reader: the pipeline pilot 3 measured, run in the browser (spec §The pipeline; A64).
 *  Lines are found on a copy at the scale the line finder was measured at (src/read/lines.ts), each line is cropped from the
 *  full image exactly as training cropped (src/read/crop.ts), and read by tesseract.js (raw line, no word lists). Everything
 *  is served by this site — tesseract.js's worker and WebAssembly core, pdf.js and its worker, the models — so the page's
 *  Content-Security-Policy can forbid every other host, and the image never leaves the device. */
import { createWorker, OEM, PSM, type Worker } from "tesseract.js";
import { get as idbGet } from "idb-keyval";
import type { Reader, Page, PdfDoc, ReadResult, ReadHooks, ModelId, Leaf, Line } from "./types";
import { fromRGBA, resize, toPGM, type Gray } from "./gray";
import { textLines } from "./lines";
import { lineBox, crop } from "./crop";
import { detectLeaf } from "./leaf";
import { fileFor, MODELS } from "./models";

const abs = (p: string) => new URL(import.meta.env.BASE_URL + p, location.href).href;
/** The app images the line finder was measured on are 1,332–1,380 px tall; an image of any size is brought to this. */
const LINE_LONG_SIDE = 1340;
/** A crop copy larger than this gains nothing (Tesseract scales each line to its own height) and costs a phone memory. */
const MAX_LONG_SIDE = 3400;
/** ⏳ PROVISIONAL — to calibrate before launch on the test pages and on pages of other prints: a page whose lines' median
 *  confidence falls below this is "not this print" (state 6). */
const NOT_THIS_PRINT = 40;

interface Pixels { crop: Gray; line: Gray }
const pixels = new WeakMap<Page, Pixels>();

function grayOf(src: CanvasImageSource, w: number, h: number): Gray {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(src, 0, 0, w, h);
  return fromRGBA(g.getImageData(0, 0, w, h).data, w, h);
}

function makePage(cropGray: Gray, preview: string, pw: number, ph: number, exactHalf: boolean): Page {
  const line = exactHalf
    ? resize(cropGray, Math.round(cropGray.w / 2), Math.round(cropGray.h / 2))   // a 300-dpi render → 150 dpi, as pilot 3
    : (() => { const s = LINE_LONG_SIDE / Math.max(cropGray.w, cropGray.h); return resize(cropGray, Math.round(cropGray.w * s), Math.round(cropGray.h * s)); })();
  const page: Page = { preview, width: pw, height: ph, scale: pw / cropGray.w };
  pixels.set(page, { crop: cropGray, line });
  return page;
}

// ── tesseract.js: one worker per model file, kept for the visit ─────────────────────────────────────────────────────
const workers = new Map<string, Promise<Worker>>();
function worker(file: string): Promise<Worker> {
  if (!workers.has(file)) {
    workers.set(file, (async () => {
      const w = await createWorker(file, OEM.LSTM_ONLY, {
        workerPath: abs("vendor/tesseract/worker.min.js"), corePath: abs("vendor/tesseract/core"), langPath: abs("models"),
        gzip: false, workerBlobURL: false, cacheMethod: "write",
      }, { load_system_dawg: "0", load_freq_dawg: "0" });
      await w.setParameters({ tessedit_pageseg_mode: PSM.RAW_LINE });
      return w;
    })().catch((e) => { workers.delete(file); throw e; }));
  }
  return workers.get(file)!;
}
const filesOf = (m: ModelId) => [...new Set([MODELS[m].pali, MODELS[m].khmer])];

async function readBox(file: string, px: Pixels, box: Line["box"]): Promise<Line> {
  const w = await worker(file);
  const r = await w.recognize(toPGM(crop(px.crop, box)) as unknown as Blob);   // PGM bytes: the crop exactly, no re-encoding
  return { box, text: r.data.text.trim(), confidence: r.data.confidence };
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const aborted = (s?: AbortSignal) => { if (s?.aborted) throw new DOMException("The read was stopped", "AbortError"); };

export const reader: Reader = {
  async isReady(model) {
    for (const f of filesOf(model)) if (!workers.has(f) && (await idbGet(`./${f}.traineddata`).catch(() => undefined)) === undefined) return false;
    return true;
  },
  async prepare(model) { await Promise.all(filesOf(model).map(worker)); },

  async openImage(blob) {
    const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
    const s = Math.min(1, MAX_LONG_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * s), h = Math.round(bmp.height * s);
    const g = grayOf(bmp, w, h); bmp.close();
    return makePage(g, URL.createObjectURL(blob), w, h, false);
  },

  async openPdf(blob): Promise<PdfDoc> {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = abs("vendor/pdfjs/pdf.worker.min.mjs");
    // (pdf.js 6 has no isEvalSupported option; the page's CSP refuses eval anyway, and pdf.js falls back without it)
    const task = pdfjs.getDocument({
      data: new Uint8Array(await blob.arrayBuffer()),
      wasmUrl: abs("vendor/pdfjs/wasm/"), standardFontDataUrl: abs("vendor/pdfjs/standard_fonts/"),
    });
    const doc = await task.promise;
    const urls: string[] = [];
    const render = async (n: number, scale: (w1: number) => number) => {
      const p = await doc.getPage(n), vp = p.getViewport({ scale: scale(p.getViewport({ scale: 1 }).width) });
      const c = document.createElement("canvas"); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      const g = c.getContext("2d", { willReadFrequently: true })!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      await p.render({ canvas: c, canvasContext: g, viewport: vp }).promise;
      return c;
    };
    const urlOf = async (c: HTMLCanvasElement) => {
      const b = await new Promise<Blob>((ok, no) => c.toBlob((x) => (x ? ok(x) : no(new Error("toBlob"))), "image/jpeg", 0.85));
      const u = URL.createObjectURL(b); urls.push(u); return u;
    };
    return {
      pages: doc.numPages,
      async thumbnail(n, width) { return urlOf(await render(n, (w1) => width / w1)); },
      async page(n) {
        const c = await render(n, () => 300 / 72);   // 300 dpi, the size pilot 3 cropped from
        const g = grayOf(c, c.width, c.height);
        return makePage(g, await urlOf(c), c.width, c.height, true);
      },
      close() { urls.forEach(URL.revokeObjectURL); task.destroy(); },
    };
  },

  async read(page, opts, hooks?: ReadHooks, signal?): Promise<ReadResult> {
    const px = pixels.get(page); if (!px) throw new Error("not a page this reader opened");
    const k = px.crop.w / px.line.w;
    const boxesOf = (bands: [number, number][]) => bands.map(([a, b]) => lineBox(px.line, a, b, k, [px.crop.w, px.crop.h]));
    const plain = textLines(px.line);
    if (!plain.length) return { leaf: opts.leaf ?? "pali", leafFound: !opts.leaf, lines: [], status: "nothing" };

    // Which leaf: the person's choice, or a quiet look at up to six lines spread over the page (read with the Pāli file).
    let leaf: Leaf = opts.leaf ?? "pali";
    const seen = new Map<string, Line>();   // file + box → line, so a line read for the look is not read twice
    if (!opts.leaf) {
      const boxes = boxesOf(plain);
      const pick = [...new Set([0.2, 0.35, 0.5, 0.65, 0.8, 0.95].map((q) => Math.min(boxes.length - 1, Math.floor(q * boxes.length))))];
      const look = async (f: string) => {
        const probe: Line[] = [];
        for (const i of pick) { aborted(signal); const l = await readBox(f, px, boxes[i]); probe.push(l); seen.set(f + boxes[i].join(), l); }
        return probe;
      };
      const pf = fileFor(opts.model, "pali"), kf = fileFor(opts.model, "khmer");
      if (pf === kf) {
        // one model that knows both alphabets (pilot 4's joint models): the letters it reads decide (src/read/leaf.ts)
        leaf = detectLeaf((await look(pf)).map((l) => l.text).join(" "));
      } else {
        // two single-leaf models (interim): each can only write its own alphabet, so text cannot decide — a Pāli model never
        // writes Khmer-only letters. The model that reads the page more confidently decides (2026-11-20, four test pages:
        // Pāli page 80 vs 19 · Khmer page 36 vs 65 · Khmer in another typeface 13 vs 56 · English 11 vs 13)
        const conf = (ls: Line[]) => median(ls.map((l) => l.confidence));
        leaf = conf(await look(kf)) > conf(await look(pf)) ? "khmer" : "pali";
      }
    }
    hooks?.onLeaf?.(leaf);
    const bands = leaf === "khmer" ? textLines(px.line, { splitTall: true }) : plain;   // Khmer: touching lines are split
    const boxes = boxesOf(bands), file = fileFor(opts.model, leaf);
    hooks?.onFound?.(boxes);
    const lines: Line[] = [];
    for (let i = 0; i < boxes.length; i++) {
      aborted(signal);
      const line = seen.get(file + boxes[i].join()) ?? await readBox(file, px, boxes[i]);
      lines.push(line); hooks?.onLine?.(i, line);
    }
    const status = median(lines.map((l) => l.confidence)) < NOT_THIS_PRINT ? "not-this-print" : "ok";
    return { leaf, leafFound: !opts.leaf, lines, status };
  },
};
