/** The person's page, with the lines the reader found outlined over it (states 2, 3, 4 on a computer, 5, 6).
 *  The page image keeps its own colors in dark mode (it is a picture of a printed page). The outlines are SVG rectangles
 *  in the image's own pixels, so no inline style is needed (the page's CSP refuses style attributes). */
import { html, svg } from "lit";
import { Light } from "./base";
import { t } from "../i18n";
import type { Page } from "../read/index";

export type Box = [number, number, number, number];
/** found = outlined, not read yet · read · now = being read · faint = read with very low confidence (not this print) */
export type Mark = "found" | "read" | "now" | "faint";

export class OcrScan extends Light {
  static properties = {
    page: { attribute: false },
    boxes: { attribute: false },
    marks: { attribute: false },
    dim: { type: Boolean },
  };
  declare page: Page | null;
  declare boxes: Box[];
  declare marks: Mark[];
  declare dim: boolean;

  constructor() {
    super();
    this.page = null;
    this.boxes = [];
    this.marks = [];
    this.dim = false;
  }

  render() {
    const p = this.page;
    if (!p) return html``;
    const s = p.scale;
    return html`<div class="relative mb-10 overflow-hidden rounded-scan border border-line bg-paper shadow-scan ${this.dim ? "opacity-45" : ""}">
      <img class="block h-auto w-full" src=${p.preview} width=${p.width} height=${p.height} alt=${t("yourPage")} draggable="false" />
      <svg class="absolute inset-0 size-full" viewBox="0 0 ${p.width} ${p.height}" preserveAspectRatio="none" aria-hidden="true">
        ${this.boxes.map((b, i) => {
          const m = this.marks[i] ?? "found";
          const pad = 3; // the drawing's breathing room around a line, in preview pixels
          return svg`<rect class="box ${m}" x=${b[0] * s - pad} y=${b[1] * s - pad} width=${(b[2] - b[0]) * s + 2 * pad}
            height=${(b[3] - b[1]) * s + 2 * pad} rx="3"></rect>`;
        })}
      </svg>
    </div>`;
  }
}
customElements.define("ocr-scan", OcrScan);
