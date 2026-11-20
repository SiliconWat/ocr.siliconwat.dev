/** State 1b — the PDF page chooser: one page or a range, from small pictures of the file's pages. A whole volume runs to
 *  ~800 pages, so ⛔ nothing is "read all" by default: the person picks a page (page 1 to start) or a range.
 *  Pictures are drawn only as they scroll into view, two at a time. */
import { html } from "lit";
import { Light } from "./base";
import { t, num, parseNum } from "../i18n";
import { FILE, dots } from "./icons";
import type { PdfDoc } from "../read/index";

export interface PagePick { from: number; to: number }

export class OcrPages extends Light {
  static properties = {
    doc: { attribute: false },
    name: {},
    busy: { type: Boolean },
    mode: { state: true },
    from: { state: true },
    to: { state: true },
    pics: { state: true },
  };
  declare doc: PdfDoc | null;
  declare name: string;
  declare busy: boolean;
  declare mode: "one" | "range";
  declare from: number;
  declare to: number;
  declare pics: Map<number, string>;

  private endNext = false; // in a range: the next tapped page sets its end
  private io: IntersectionObserver | null = null;
  private queue: number[] = [];
  private drawing = 0;
  private asked = new Set<number>();

  constructor() {
    super();
    this.doc = null;
    this.name = "";
    this.busy = false;
    this.mode = "one";
    this.from = 1;
    this.to = 1;
    this.pics = new Map();
  }

  /** Preset a choice (the demo's screen check uses it). */
  preset(mode: "one" | "range", from: number, to: number) {
    this.mode = mode;
    this.from = from;
    this.to = to;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    this.pics.forEach((u) => URL.revokeObjectURL(u));
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has("doc")) {
      this.pics.forEach((u) => URL.revokeObjectURL(u));
      this.pics = new Map();
      this.asked.clear();
      this.queue = [];
      this.io?.disconnect();
      const box = this.querySelector<HTMLElement>("[data-thumbs]");
      if (box) {
        this.io = new IntersectionObserver((es) => {
          for (const e of es) if (e.isIntersecting) this.want(+(e.target as HTMLElement).dataset.n!);
        }, { root: box, rootMargin: "200px 0px" });
      }
    }
    this.querySelectorAll<HTMLElement>("[data-n]").forEach((el) => {
      if (!el.dataset.watched) { el.dataset.watched = "1"; this.io?.observe(el); }
    });
  }

  private want(n: number) {
    if (this.asked.has(n) || !this.doc) return;
    this.asked.add(n);
    this.queue.push(n);
    this.pump();
  }
  private pump() {
    while (this.drawing < 2 && this.queue.length && this.doc) {
      const n = this.queue.shift()!;
      const doc = this.doc;
      this.drawing++;
      doc.thumbnail(n, 200)
        .then((u) => {
          if (doc !== this.doc) { URL.revokeObjectURL(u); return; }
          const m = new Map(this.pics); m.set(n, u); this.pics = m;
        })
        .catch(() => { /* a page that will not draw stays blank; it can still be chosen */ })
        .finally(() => { this.drawing--; this.pump(); });
    }
  }

  private get pages() { return this.doc?.pages ?? 1; }
  private clamp(n: number) { return Math.min(Math.max(1, n), this.pages); }
  private selected(n: number) {
    return this.mode === "one" ? n === this.from : n >= Math.min(this.from, this.to) && n <= Math.max(this.from, this.to);
  }

  private tap(n: number) {
    if (this.mode === "one") { this.from = this.to = n; return; }
    if (this.endNext) {
      if (n >= this.from) this.to = n; else { this.to = this.from; this.from = n; }
      this.endNext = false;
    } else {
      this.from = this.to = n;
      this.endNext = true;
    }
  }
  private setMode(m: "one" | "range") {
    this.mode = m;
    this.endNext = false;
    if (m === "one") this.to = this.from;
  }
  private typed(which: "from" | "to", e: Event) {
    const input = e.target as HTMLInputElement;
    const v = parseNum(input.value);
    if (Number.isNaN(v)) { input.value = num(this[which]); return; }
    const n = this.clamp(v);
    if (which === "from") { this.from = n; if (this.mode === "one" || this.to < n) this.to = n; }
    else { this.to = n; if (this.from > n) this.from = n; }
    input.value = num(this[which]);
    this.endNext = false;
    this.show(n);
  }
  /** Scrolls the pictures (not the page) so page n is in view. */
  private show(n: number) {
    const box = this.querySelector<HTMLElement>("[data-thumbs]");
    const cell = box?.querySelector<HTMLElement>(`[data-n="${n}"]`);
    if (!box || !cell) return;
    const top = cell.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top + cell.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = Math.max(0, top - 8);
  }
  firstUpdated() {
    this.show(this.from);
  }

  private read() {
    if (this.busy) return;
    const a = Math.min(this.from, this.to), b = Math.max(this.from, this.to);
    this.emit<PagePick>("pages", { from: a, to: this.mode === "one" ? a : b });
  }

  private field(label: "page" | "fromPage" | "toPage", which: "from" | "to") {
    return html`<label class="field mt-0">
      <span>${t(label)}</span>
      <input type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" .value=${num(this[which])}
        @change=${(e: Event) => this.typed(which, e)} />
    </label>`;
  }

  render() {
    const n = this.pages;
    const cells = Array.from({ length: n }, (_, i) => i + 1);
    return html`<div class="mx-auto max-w-760">
      <h1 class="h1" tabindex="-1">${t("choosePages")}</h1>
      <div class="mt-2 mb-12 flex items-center gap-10 text-card">${FILE()}<span class="min-w-0 break-words"><b>${this.name}</b> · ${t("nPages", { n })}</span></div>
      <div class="seg text-small" role="group">
        <button aria-pressed=${this.mode === "one" ? "true" : "false"} @click=${() => this.setMode("one")}>${t("onePage")}</button>
        <button aria-pressed=${this.mode === "range" ? "true" : "false"} @click=${() => this.setMode("range")}>${t("aRange")}</button>
      </div>
      <div class="mt-16 grid grid-cols-2 gap-10">
        ${this.mode === "one" ? this.field("page", "from") : html`${this.field("fromPage", "from")}${this.field("toPage", "to")}`}
      </div>
      <p class="sh">${t("pagesInFile")}</p>
      <div data-thumbs class="relative -mx-8 max-h-520 overflow-y-auto overscroll-contain px-8 pt-8 pb-4">
        <div class="grid grid-cols-3 gap-10 desk:grid-cols-6">
          ${cells.map((p) => {
            const on = this.selected(p);
            const pic = this.pics.get(p);
            return html`<button data-n=${p} aria-pressed=${on ? "true" : "false"} aria-label=${t("pageN", { n: p })} @click=${() => this.tap(p)}
              class="relative rounded-thumb border text-left ${on ? "border-2 border-accent bg-wash p-5" : "border-line bg-surface p-6"}">
              ${on ? html`<span class="absolute -top-7 -right-7 grid size-22 place-items-center rounded-pill bg-accent text-caption font-heavy text-accent-ink" aria-hidden="true">✓</span>` : ""}
              <span class="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sel bg-paper">
                ${pic ? html`<img class="block h-full w-full object-contain" src=${pic} alt="" draggable="false" />` : ""}
              </span>
              <span class="mt-3 block text-center text-caption ${on ? "font-strong text-ink" : "text-ink-dim"}">${num(p)}</span>
            </button>`;
          })}
        </div>
      </div>
      <p class="fine mt-12">${t("pagesNote")}</p>
      <button class="btn mt-10" ?disabled=${this.busy} aria-busy=${this.busy ? "true" : "false"} @click=${this.read}>
        ${this.busy ? html`${dots()}<span class="sr-only">${t("working")}</span>` : t("readThese")}
      </button>
      <button class="btn btn-ghost mt-10" ?disabled=${this.busy} @click=${() => this.querySelector<HTMLInputElement>("#pick-another")?.click()}>${t("chooseAnother")}</button>
      <input id="pick-another" type="file" hidden accept="image/*,application/pdf,.pdf"
        @change=${(e: Event) => { const i = e.target as HTMLInputElement; const f = i.files?.[0]; i.value = ""; if (f) this.emit("file", f); }} />
    </div>`;
  }
}
customElements.define("ocr-pages", OcrPages);
