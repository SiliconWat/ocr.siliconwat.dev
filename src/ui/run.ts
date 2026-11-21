/** One page being read, or read: an image, or one page of a PDF. A range (or several pictures) is a list of these, read in
 *  order. */
import { html, type TemplateResult } from "lit";
import { t, num } from "../i18n";
import { toRoman, type Page, type Line, type Leaf, type Quad, type ReadResult } from "../read/index";
import type { Box, Mark } from "./scan";

export interface Run {
  /** the PDF page number, or a picture's place among several; null for a picture on its own */
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
  /** the reader judged the picture a photo or a screenshot: "Adjust this page" (state 1c) is offered */
  photo?: boolean;
  /** the corners the person set in state 1c, in the original picture's pixels (a re-opened page is cut there again) */
  adjusted?: Quad;
  /** the text as the person edited it (Edit), one line per printed line. In memory only, ⛔ never stored: the privacy page
   *  promises that only the language, theme and reader choice are kept. A new reading of the page replaces it. */
  edited?: string;
}

export function newRun(n: number | null, get: () => Promise<Page>, page: Page | null = null): Run {
  return { n, get, page, boxes: [], lines: [], status: "waiting", leafFound: false };
}

export const readLines = (r: Run): Line[] => r.lines.filter((l): l is Line => Boolean(l));

/** The text shown for each line, by line index: the person's edit if there is one, else what was read (a line not read yet
 *  is missing). The result, Copy, Download and a tapped word all read it here, so they always agree. */
export const lineTexts = (r: Run): (string | undefined)[] =>
  r.edited !== undefined ? r.edited.split("\n") : r.lines.map((l) => l?.text);

/** The page's text as one string, as the Edit box starts it. */
export const runText = (r: Run): string =>
  r.edited !== undefined ? r.edited : readLines(r).map((l) => l.text).join("\n");

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

/** The plain text of the runs, for Copy and Download (the person's edits included): in a range, each page under its
 *  heading. */
export function plainText(runs: Run[], roman: boolean): string {
  const multi = runs.length > 1;
  return runs
    .map((r) => {
      const body = runText(r).split("\n").map((s) => (roman && r.leaf === "pali" ? toRoman(s) : s)).join("\n");
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
