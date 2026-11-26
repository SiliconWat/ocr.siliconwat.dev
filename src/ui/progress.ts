/** State 2 (getting the reader ready, first use only) and state 3 (reading: the lines outlined, the text growing).
 *  ⛔ Never a progress figure, a count or a countdown: the dots move and the text simply grows. */
import { html } from "lit";
import { Light } from "./base";
import { t } from "../i18n";
import { dots, spot } from "./icons";
import { leafRow, pageHeading, readingMarks, readLines, textLang, type Run } from "./run";
import "./scan";
import type { ModelId } from "../read/index";

export class OcrProgress extends Light {
  static properties = {
    view: {},
    runs: { attribute: false },
    current: { type: Number },
    model: {},
    rev: { type: Number },
  };
  declare view: "ready" | "reading";
  declare runs: Run[];
  declare current: number;
  declare model: ModelId;
  declare rev: number;

  constructor() {
    super();
    this.view = "reading";
    this.runs = [];
    this.current = 0;
    this.model = "accurate";
    this.rev = 0;
  }

  private ready() {
    const first = this.runs[this.current] ?? this.runs[0];
    return html`<div class="mx-auto max-w-560">
      <h1 class="h1" tabindex="-1">${t("ready")}</h1>
      <p class="lede">${t("readyLede")}</p>
      <ocr-scan dim .page=${first?.page ?? null}></ocr-scan>
      <p class="-mt-4 mb-10 text-center text-caption text-ink-faint">${t("waiting")}</p>
      <div class="btn opacity-88" role="status" aria-label=${t("working")}>${dots()}</div>
      <div class="card mt-14">
        ${spot("device")}
        <h2>${t(this.model)}</h2>
        <p>${t("fromSite")}</p>
      </div>
    </div>`;
  }

  private reading() {
    const run = this.runs[this.current];
    const multi = this.runs.length > 1;
    const shown = this.runs.filter((r) => r === run || readLines(r).length || r.status === "nothing");
    return html`<div class="desk:mt-8 desk:grid desk:grid-cols-[1.2fr_1fr] desk:grid-rows-[auto_1fr] desk:gap-x-40">
      <div class="desk:col-start-2 desk:row-start-1">
        <div class="mt-10 mb-8 flex items-center gap-10 text-body font-strong" role="status">
          <span>${t("reading")}</span>${dots()}
        </div>
        ${run?.leaf ?? run?.want ? leafRow(run!) : ""}
      </div>
      <div class="desk:sticky desk:top-16 desk:col-start-1 desk:row-span-2 desk:row-start-1 desk:self-start">
        <p class="sh hidden desk:block">${t("yourPage")}</p>
        ${multi && run ? pageHeading(run, true) : ""}
        <ocr-scan .page=${run?.page ?? null} .boxes=${run?.boxes ?? []} .marks=${run ? readingMarks(run) : []}></ocr-scan>
      </div>
      <div class="desk:col-start-2 desk:row-start-2">
        <p class="sh">${t("readSoFar")}</p>
        ${shown.map((r) => html`${pageHeading(r, multi)}
          <div class="ocr" lang=${textLang(r.leaf ?? r.want)}>
            ${readLines(r).map((l) => html`<span class="ln">${l.text}</span>`)}
            ${r === run ? html`<span class="ln">${dots()}</span>` : ""}
          </div>`)}
        <button class="btn btn-ghost mt-10" @click=${() => this.emit("stop")}>${t("stop")}</button>
      </div>
    </div>`;
  }

  render() {
    return this.view === "ready" ? this.ready() : this.reading();
  }
}
customElements.define("ocr-progress", OcrProgress);
