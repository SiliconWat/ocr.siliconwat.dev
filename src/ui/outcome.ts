/** State 5 (no lines of text found) and state 6 (this may not be the print it knows), for a single page. */
import { html } from "lit";
import { Light } from "./base";
import { t } from "../i18n";
import { TICK } from "./icons";
import type { Run } from "./run";
import "./scan";

export class OcrOutcome extends Light {
  static properties = {
    kind: {},
    run: { attribute: false },
  };
  declare kind: "nothing" | "other";
  declare run: Run | null;

  constructor() {
    super();
    this.kind = "nothing";
    this.run = null;
  }

  render() {
    const r = this.run;
    if (this.kind === "nothing") {
      return html`<div class="mx-auto max-w-560">
        <div class="mt-10"><ocr-scan .page=${r?.page ?? null}></ocr-scan></div>
        <h1 class="h1" tabindex="-1">${t("nothingTitle")}</h1>
        <p class="lede">${t("nothingLede")}</p>
        <p class="sh">${t("whatHelps")}</p>
        <div class="card">
          <ul class="m-0 list-none p-0">
            ${(["help1", "help2", "help3"] as const).map((k) => html`<li class="flex items-start gap-10 border-t border-line py-7 text-card first:border-t-0">${TICK()}<span>${t(k)}</span></li>`)}
          </ul>
        </div>
        <p class="fine mt-12">${t("scanBest")}</p>
        <button class="btn mt-10" @click=${() => this.emit("another")}>${t("tryAnother")}</button>
      </div>`;
    }
    return html`<div class="mx-auto max-w-560">
      <div class="mt-10"><ocr-scan .page=${r?.page ?? null} .boxes=${r?.boxes ?? []} .marks=${(r?.boxes ?? []).map(() => "faint")}></ocr-scan></div>
      <h1 class="h1" tabindex="-1">${t("otherTitle")}</h1>
      <p class="lede">${t("otherLede")}</p>
      <button class="btn mt-10" @click=${() => this.emit("another")}>${t("tryAnother")}</button>
      <button class="btn btn-ghost mt-10" @click=${() => this.emit("anyway")}>${t("showAnyway")}</button>
    </div>`;
  }
}
customElements.define("ocr-outcome", OcrOutcome);
