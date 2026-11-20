/** The two bottom sheets over the text: state 8, a word's entry in Samdech Chuon Nath's dictionary (⛔ never a guess: no
 *  entry says so), and state 10, Ask about this passage (⛔ nothing leaves the page until the person presses Ask).
 *  Native <dialog>: focus stays inside, Escape closes, a tap above the sheet closes. */
import { html, type PropertyValues } from "lit";
import { Light } from "./base";
import { t } from "../i18n";
import { COPY, EXT, dots } from "./icons";
import { copyText, toast } from "./toast";
import { DESTINATIONS, prompt, type Destination } from "../ask";
import type { Entry } from "../dict/index";

/** Opens and closes the sheet's <dialog> with the `open` property; reports a close the person made. */
class Sheet extends Light {
  static properties = { open: { type: Boolean } };
  declare open: boolean;
  constructor() {
    super();
    this.open = false;
  }
  protected get dialog() {
    return this.querySelector("dialog");
  }
  protected updated(changed: PropertyValues) {
    const d = this.dialog;
    if (!d || !changed.has("open")) return;
    if (this.open && !d.open) { d.showModal(); d.scrollTop = 0; }
    if (!this.open && d.open) d.close();
  }
  protected shut = () => {
    if (this.open) this.emit("close");
  };
  /** a click outside the sheet's box lands on the dialog itself: the backdrop */
  protected backdrop = (e: MouseEvent) => {
    const d = this.dialog;
    if (!d || e.target !== d) return;
    const r = d.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) d.close();
  };
}

// ── 8 · a word's entry ────────────────────────────────────────────────────────────────────────────────────────────────
/** The abbreviations the drawings explain (S8's legend). Only these are explained; others are left as printed. */
const ABBR: { mark: string; key: "abbrPali" | "abbrNoun" }[] = [
  { mark: "បា.", key: "abbrPali" },
  { mark: "ន.", key: "abbrNoun" },
];

export class OcrDict extends Sheet {
  static properties = { ...Sheet.properties, entry: { attribute: false }, fromRef: { type: Boolean } };
  declare entry: Entry | null;
  declare fromRef: boolean;
  constructor() {
    super();
    this.entry = null;
    this.fromRef = false;
  }
  render() {
    const e = this.entry;
    const flat = e ? e.parts.map((p) => p.text).join("") : "";
    const legend = ABBR.filter((a) => new RegExp(`(^|[\\s(])${a.mark.replace(".", "\\.")}`).test(flat));
    return html`<dialog class="sheet" aria-label=${t("dictName")} @close=${this.shut} @click=${this.backdrop}>
      <button class="grab" tabindex="-1" aria-label=${t("close")} @click=${() => this.dialog?.close()}></button>
      <p class="sh mt-0 focus:outline-none" tabindex="-1" autofocus>${t("dictName")}</p>
      ${e ? html`
        <div class="my-2 font-print text-head leading-head" lang="km">${e.head}</div>
        ${e.via === "ending" && !this.fromRef ? html`<p class="fine mt-0">${t("viaEnding", { tapped: e.tapped, head: e.head })}</p>` : ""}
        <p class="mt-8 mb-0 font-khmer text-label leading-rom whitespace-pre-line" lang="km">${e.parts.map((p) =>
          p.ref !== undefined
            ? html`<button class="inline text-left text-ink underline decoration-edge decoration-dotted underline-offset-4 hover:text-accent" @click=${() => this.emit("ref", p.ref)}>${p.text}</button>`
            : p.text)}</p>
        ${legend.length ? html`<div class="mt-10 flex flex-wrap gap-6">${legend.map((a) =>
          html`<span class="rounded-pill border border-line px-9 py-2 text-caption text-ink-dim"><span lang="km">${a.mark}</span> ${t(a.key)}</span>`)}</div>` : ""}
      ` : html`<p class="mt-8 mb-0">${t("noEntry")}</p>`}
      <p class="fine mt-12">${t("dictNote")}</p>
      <button class="btn btn-ghost mt-10" @click=${() => this.dialog?.close()}>${t("close")}</button>
    </dialog>`;
  }
}
customElements.define("ocr-dict", OcrDict);

// ── 10 · ask about this passage ───────────────────────────────────────────────────────────────────────────────────────
export class OcrAsk extends Sheet {
  static properties = {
    ...Sheet.properties,
    passage: {},
    passageLang: {},
    initial: {},
    question: { state: true },
    dest: { state: true },
    busy: { state: true },
  };
  declare passage: string;
  declare passageLang: string;
  /** the question box's text when the sheet opens (empty; the demo's screen check fills the drawing's sample) */
  declare initial: string;
  declare question: string;
  declare dest: string;
  declare busy: boolean;
  constructor() {
    super();
    this.passage = "";
    this.passageLang = "und-Khmr";
    this.initial = "";
    this.question = "";
    this.dest = DESTINATIONS[0].id;
    this.busy = false;
  }
  protected updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("open") && this.open) { this.busy = false; this.question = this.initial; }
  }
  private name(d: Destination) {
    return typeof d.name === "string" ? t(d.name) : d.name.proper;
  }
  private async ask() {
    const d = DESTINATIONS.find((x) => x.id === this.dest) ?? DESTINATIONS[0];
    this.busy = true;
    const p = prompt(this.passage, this.question);
    try {
      if (d.link) {
        window.open(d.link(p), "_blank", "noopener,noreferrer");
      } else {
        toast(t((await copyText(p)) ? "copied" : "cannotCopy"));
      }
      this.dialog?.close();
    } finally {
      this.busy = false;
    }
  }
  render() {
    const chosen = DESTINATIONS.find((x) => x.id === this.dest) ?? DESTINATIONS[0];
    return html`<dialog class="sheet scrim" aria-label=${t("askTitle")} @close=${this.shut} @click=${this.backdrop}>
      <button class="grab" tabindex="-1" aria-label=${t("close")} @click=${() => this.dialog?.close()}></button>
      <h2 class="mt-0 mb-6 text-field focus:outline-none" tabindex="-1" autofocus>${t("askTitle")}</h2>
      <blockquote class="mx-0 mt-8 mb-6 max-h-180 overflow-y-auto border-l-3 border-accent py-4 pl-12 font-print text-quote leading-quote"
        lang=${this.passageLang}>${this.passage}</blockquote>
      <label class="field min-h-84">
        <span>${t("yourQuestion")}</span>
        <textarea rows="2" .value=${this.question} @input=${(e: Event) => { this.question = (e.target as HTMLTextAreaElement).value; }}></textarea>
      </label>
      <p class="sh">${t("askIn")}</p>
      <div class="card" role="radiogroup" aria-label=${t("askIn")}>
        ${DESTINATIONS.map((d) => html`<label class="flex cursor-pointer items-start gap-12 border-t border-line py-11 first:border-t-0 first:pt-2">
          <input type="radio" name="ask-in" value=${d.id} .checked=${this.dest === d.id} @change=${() => { this.dest = d.id; }}
            class="mt-3 size-18 flex-none cursor-pointer appearance-none rounded-pill border-2 border-line-strong checked:border-6 checked:border-accent" />
          <span>
            <span class="block text-label font-strong">${this.name(d)}</span>
            <span class="block text-small text-ink-dim">${t(d.note)}</span>
          </span>
        </label>`)}
      </div>
      <div class="note">${t("askCaution")}</div>
      <button class="btn mt-10" ?disabled=${this.busy} aria-busy=${this.busy ? "true" : "false"} @click=${this.ask}>
        ${this.busy ? html`${dots()}<span class="sr-only">${t("working")}</span>` : html`${chosen.link ? EXT() : COPY()}${t("ask")}`}
      </button>
      <p class="fine mt-12 mb-0">${t("nothingLeaves")}</p>
    </dialog>`;
  }
}
customElements.define("ocr-ask", OcrAsk);
