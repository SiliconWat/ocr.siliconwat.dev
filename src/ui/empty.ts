/** State 1 — empty: drop a page, choose a file, take a photo; the privacy line; the reader picker (phone S1, computer D1).
 *  Several pictures may be chosen, dropped or pasted at once (they are read in order, each under its page heading); every
 *  file goes up to the app as one list (`files`), which sorts them and says when a PDF must be read on its own. */
import { html } from "lit";
import { Light } from "./base";
import { t, langOf } from "../i18n";
import { CAM, DEVICE, FILE, dots, dropArt, spot } from "./icons";
import type { ModelId } from "../read/index";

export class OcrEmpty extends Light {
  static properties = {
    model: {},
    opening: { type: Boolean },
    over: { state: true },
  };
  declare model: ModelId;
  declare opening: boolean;
  declare over: boolean;

  constructor() {
    super();
    this.model = "accurate";
    this.opening = false;
    this.over = false;
  }

  private onPaste = (e: ClipboardEvent) => {
    const fs = [...(e.clipboardData?.files ?? [])];
    if (fs.length) { e.preventDefault(); this.emit<File[]>("files", fs); }
  };
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("paste", this.onPaste);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("paste", this.onPaste);
  }

  private pick(sel: string) {
    if (this.opening) return;
    this.querySelector<HTMLInputElement>(sel)?.click();
  }
  private picked(e: Event) {
    const input = e.target as HTMLInputElement;
    const fs = [...(input.files ?? [])];
    input.value = "";
    if (fs.length) this.emit<File[]>("files", fs);
  }
  private drop(e: DragEvent) {
    e.preventDefault();
    this.over = false;
    const fs = [...(e.dataTransfer?.files ?? [])];
    if (fs.length && !this.opening) this.emit<File[]>("files", fs);
  }

  private radio(id: ModelId, name: "accurate" | "public", sub: "accurateSub" | "publicSub", lic: string) {
    return html`<label class="flex cursor-pointer items-start gap-12 border-t border-line py-11 first:border-t-0 first:pt-2">
      <input type="radio" name="model" value=${id} .checked=${this.model === id} @change=${() => this.emit("model", id)}
        class="mt-3 size-18 flex-none cursor-pointer appearance-none rounded-pill border-2 border-line-strong checked:border-6 checked:border-accent" />
      <span>
        <span class="flex flex-wrap items-center gap-8 text-label font-strong">${t(name)} <span class="lic">${lic}</span></span>
        <span class="block text-small text-ink-dim">${t(sub)}</span>
      </span>
    </label>`;
  }

  render() {
    return html`<div class="desk:mt-8 desk:grid desk:grid-cols-[1.2fr_1fr] desk:items-start desk:gap-40">
      <div>
        <h1 class="h1" tabindex="-1">${t("title")}</h1>
        <p class="lede desk:text-ocr">${t("lede")}</p>
        <div class="mt-4 cursor-pointer rounded-drop border-2 border-dashed px-18 pt-22 pb-18 text-center desk:px-24 desk:pt-56 desk:pb-48
            ${this.over ? "border-accent bg-hl" : "border-edge bg-wash"}"
          @click=${() => this.pick("#pick-file")}
          @dragenter=${(e: DragEvent) => { e.preventDefault(); this.over = true; }}
          @dragover=${(e: DragEvent) => { e.preventDefault(); this.over = true; }}
          @dragleave=${() => { this.over = false; }}
          @drop=${this.drop}>
          ${dropArt()}
          <b class="block text-ocr">${t("dropTitle")}</b>
          <span class="block text-tool text-ink-dim">${t("dropSub")}</span>
        </div>
        <div class="mt-10 grid grid-cols-2 gap-10">
          <button class="btn" ?disabled=${this.opening} aria-busy=${this.opening ? "true" : "false"} @click=${() => this.pick("#pick-file")}>
            ${this.opening ? html`${dots()}<span class="sr-only">${t("working")}</span>` : html`${FILE()}${t("chooseFile")}`}
          </button>
          <button class="btn btn-ghost" ?disabled=${this.opening} @click=${() => this.pick("#pick-photo")}>${CAM()}${t("takePhoto")}</button>
        </div>
        <input id="pick-file" type="file" hidden multiple accept="image/*,application/pdf,.pdf" @change=${this.picked} />
        <input id="pick-photo" type="file" hidden accept="image/*" capture="environment" @change=${this.picked} />
        <div class="note flex items-start gap-10">${DEVICE()}<span>${t("privacy")}</span></div>
      </div>
      <div>
        <fieldset class="m-0 min-w-0 border-0 p-0">
          <legend class="sh float-left w-full p-0 desk:mt-22">${t("readerHead")}</legend>
          <div class="card clear-both">
            ${this.radio("accurate", "accurate", "accurateSub", "Apache-2.0")}
            ${this.radio("public", "public", "publicSub", "CC0")}
            <p class="fine mt-6 mb-0">${t("licenseNote")}</p>
          </div>
        </fieldset>
        <div class="card hidden desk:block">
          ${spot("page")}
          <h2>${t("whatReads")}</h2>
          <p lang=${langOf("whatReadsShort")}>${t("whatReadsShort")}</p>
        </div>
      </div>
    </div>`;
  }
}
customElements.define("ocr-empty", OcrEmpty);
