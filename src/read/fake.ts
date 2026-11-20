/** A stand-in reader for building and checking the screens (`?demo` in the URL, or before the real one is wired):
 *  the opening lines of a sutta in Pāli, arriving one by one. It reads nothing. */
import type { Reader, Page, PdfDoc, ReadResult, Line } from "./types";

const PALI = [
  "នមោ តស្ស ភគវតោ អរហតោ សម្មាសម្ពុទ្ធស្ស ។",
  "ឯវំ មេ សុតំ ។ ឯកំ សមយំ ភគវា សាវត្ថិយំ",
  "វិហរតិ ជេតវនេ អនាថបិណ្ឌិកស្ស អារាមេ ។",
  "តត្រ ខោ ភគវា ភិក្ខូ អាមន្តេសិ ភិក្ខវោតិ ។",
  "ភទន្តេតិ តេ ភិក្ខូ ភគវតោ បច្ចស្សោសុំ ។",
  "ភគវា ឯតទវោច ។",
];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function blankPage(w = 860, h = 1340): Page {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d")!; g.fillStyle = "#f3ecdc"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#2a2420"; g.font = "28px serif";
  PALI.forEach((t, i) => g.fillText(t, 80, 160 + i * 64));
  return { preview: c.toDataURL(), width: w, height: h, scale: 0.5 };
}

let ready = false;
export const fakeReader: Reader = {
  async isReady() { return ready; },
  async prepare() { if (!ready) { await wait(1500); ready = true; } },
  async openImage() { return blankPage(); },
  async openPdf(): Promise<PdfDoc> {
    return { pages: 12, async thumbnail() { return blankPage(172, 268).preview; }, async page() { return blankPage(); }, close() {} };
  },
  async read(_page, opts, hooks, signal): Promise<ReadResult> {
    const boxes = PALI.map((_, i) => [140, 270 + i * 128, 1500, 330 + i * 128] as [number, number, number, number]);
    hooks?.onFound?.(boxes);
    const lines: Line[] = [];
    for (let i = 0; i < PALI.length; i++) {
      await wait(450); if (signal?.aborted) throw new DOMException("aborted", "AbortError");
      const line = { box: boxes[i], text: PALI[i], confidence: 92 };
      lines.push(line); hooks?.onLine?.(i, line);
    }
    return { leaf: opts.leaf ?? "pali", leafFound: !opts.leaf, lines, status: "ok" };
  },
};
