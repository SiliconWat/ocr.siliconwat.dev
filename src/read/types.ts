/** The one contract between the reader (src/read/, src/dict/, src/listen.ts) and the screens (src/ui/). The screens import
 *  ONLY from src/read/index.ts, src/dict/index.ts and src/listen.ts, never from the files behind them. */

/** The two readers, as the page names them: "accurate" = Most accurate (fine-tuned, Apache-2.0) · "public" = Public domain
 *  (trained from scratch, CC0). */
export type ModelId = "accurate" | "public";
/** Which leaf of the opening a page is: the Pāli, or its Khmer translation. Both are printed in Khmer script. */
export type Leaf = "pali" | "khmer";

/** A page ready to read: an image the screens can show, and the scale from line boxes to that image. */
export interface Page {
  preview: string;            // an object URL of the page image, for drawing the lines found over it
  width: number; height: number;   // the preview's size in pixels
  scale: number;              // a Line box × scale = preview pixels
}

/** A PDF the person chose: its pages, read one at a time on request. A volume runs to ~800 pages, so nothing is read
 *  until the person picks a page or a range (state 1b). */
export interface PdfDoc {
  pages: number;
  thumbnail(n: number, width: number): Promise<string>;   // n is 1-based; an object URL
  page(n: number): Promise<Page>;
  close(): void;
}

/** One printed line: where it is on the page and what was read there. */
export interface Line { box: [number, number, number, number]; text: string; confidence: number }

export interface ReadHooks {
  onLeaf?(leaf: Leaf): void;                                    // the leaf, once decided (before onFound)
  onFound?(boxes: [number, number, number, number][]): void;   // the lines found, before any is read (outline them)
  onLine?(index: number, line: Line): void;                     // each line as it is read (the text grows)
}
/** ⛔ The screens never show a progress figure or a count ("3 of 20"): the text simply grows (Sig-8). */

export interface ReadResult {
  leaf: Leaf;
  leafFound: boolean;          // true = the reader decided the leaf; false = the person chose it
  lines: Line[];
  status: "ok" | "nothing" | "not-this-print";   // nothing = no lines found (state 5); not-this-print = state 6
}

export interface Reader {
  /** Is this reader's model already on this device (no download needed)? */
  isReady(model: ModelId): Promise<boolean>;
  /** Download the model once (state 2, "Getting the reader ready"). Safe to call twice. */
  prepare(model: ModelId): Promise<void>;
  openImage(file: Blob): Promise<Page>;
  openPdf(file: Blob): Promise<PdfDoc>;
  read(page: Page, opts: { model: ModelId; leaf?: Leaf }, hooks?: ReadHooks, signal?: AbortSignal): Promise<ReadResult>;
}
