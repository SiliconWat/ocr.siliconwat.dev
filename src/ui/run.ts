/** One page being read, or read: an image, or one page of a PDF. A range is a list of these, read in order. */
import { html, type TemplateResult } from "lit";
import { t, num } from "../i18n";
import { toRoman, type Page, type Line, type Leaf, type ReadResult } from "../read/index";
import type { Box, Mark } from "./scan";

export interface Run {
  /** the PDF page number, or null for a picture */
  n: number | null;
  /** opens (or re-opens) the page for reading */
  get: () => Promise<Page>;
  page: Page | null;
  boxes: Box[];
  /** by line index; a line not read yet is missing */
  lines: (Line | undefined)[];
  /** waiting · reading · partial (stopped) · or the reader's own status */
  status: "waiting" | "reading" | "partial" | ReadResult["status"];
  leaf?: Leaf;
  leafFound: boolean;
  /** the leaf the person chose with the switch, if any */
  want?: Leaf;
}

export function newRun(n: number | null, get: () => Promise<Page>, page: Page | null = null): Run {
  return { n, get, page, boxes: [], lines: [], status: "waiting", leafFound: false };
}

export const readLines = (r: Run): Line[] => r.lines.filter((l): l is Line => Boolean(l));

/** The outline marks while reading: read · the one being read now · found. */
export function readingMarks(r: Run): Mark[] {
  const now = r.boxes.findIndex((_, i) => !r.lines[i]);
  return r.boxes.map((_, i) => (r.lines[i] ? "read" : i === now ? "now" : "found"));
}

/** BCP 47 for the text: Pāli in Khmer script, or Khmer; Pāli in roman letters when shown so. */
export function textLang(leaf: Leaf | undefined, roman = false): string {
  if (leaf === "khmer") return "km";
  if (leaf === "pali") return roman ? "pi-Latn" : "pi-Khmr";
  return "und-Khmr";
}

/** The plain text of the runs, for Copy and Download: in a range, each page under its heading. */
export function plainText(runs: Run[], roman: boolean): string {
  const multi = runs.length > 1;
  return runs
    .map((r) => {
      const body = readLines(r).map((l) => (roman && r.leaf === "pali" ? toRoman(l.text) : l.text)).join("\n");
      return multi && r.n !== null ? `${t("pageN", { n: r.n })}\n${body}` : body;
    })
    .join("\n\n");
}

/** The small heading over one page's text in a range. */
export const pageHeading = (r: Run, multi: boolean): TemplateResult | string =>
  multi && r.n !== null ? html`<h2 class="mt-18 mb-4 text-fine font-strong text-ink-dim" data-page=${num(r.n)}>${t("pageN", { n: r.n })}</h2>` : "";

/** "This page is in  [Pāli | Khmer]" with the drawing's note when the reader found it. Tapping the other re-reads the page
 *  as that leaf (`pick`); while reading, the switch only shows (no `pick`). Nothing selected = not known yet. */
export function leafRow(r: Run, pick?: (leaf: Leaf) => void): TemplateResult {
  const leaf = r.leaf ?? r.want;
  const b = (l: Leaf, key: "pali" | "khmer") =>
    html`<button class="px-12 aria-pressed:bg-accent aria-pressed:text-accent-ink" aria-pressed=${leaf === l ? "true" : "false"}
      ?disabled=${!pick} @click=${() => { if (pick && leaf !== l) pick(l); }}>${t(key)}</button>`;
  return html`<div class="mt-6 mb-10 flex items-center justify-between gap-10">
      <span class="text-fine text-ink-dim">${t("leafIs")}</span>
      <span class="seg text-fine" role="group" aria-label=${t("leafIs")}>${b("pali", "pali")}${b("khmer", "khmer")}</span>
    </div>
    ${r.leafFound && pick ? html`<p class="-mt-6 mb-10 text-right text-foot text-ink-faint">${t("leafNote")}</p>` : ""}`;
}
