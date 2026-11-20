/** State 4 — the text (and 8–9 begin here): the leaf switch, the text in Khmer script, roman letters on Pāli pages only,
 *  Copy, Download .txt, "Check it against the print.", a tap on a word (→ the dictionary sheet), and a selection
 *  (→ the bar: Listen, only if the voice service exists · Ask about this · Copy). In a range, each page under its heading. */
import { html, nothing } from "lit";
import { Light, clicks } from "./base";
import { t, langOf } from "../i18n";
import { ASK, COPY, DOWN, SPEAK, dots, spot } from "./icons";
import { leafRow, pageHeading, readLines, textLang, plainText, type Run } from "./run";
import { copyText, downloadText, toast } from "./toast";
import { demoParam, DEMO } from "./prefs";
import { toRoman, type Leaf } from "../read/index";
import { available, speak, type Voice } from "../listen";
import "./scan";

export interface Tap { run: number; line: number; start: number; end: number }

interface Caret { node: Node; offset: number }
type CaretDoc = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};
function caretAt(x: number, y: number): Caret | null {
  const d = document as CaretDoc;
  if (d.caretPositionFromPoint) {
    const p = d.caretPositionFromPoint(x, y);
    return p ? { node: p.offsetNode, offset: p.offset } : null;
  }
  if (d.caretRangeFromPoint) {
    const r = d.caretRangeFromPoint(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  return null;
}

/** Listen is shown ONLY when the voice service exists (a button that cannot work is never shown). `?demo&voice` shows its
 *  layout for a screen check; pressing it there reports a problem. */
const listenShown = () => available() || (DEMO && demoParam("voice") !== null);

export class OcrResult extends Light {
  static properties = {
    runs: { attribute: false },
    name: {},
    rev: { type: Number },
    tap: { attribute: false },
    roman: { state: true },
    sel: { state: true },
    voice: { state: true },
    speaking: { state: true },
  };
  declare runs: Run[];
  declare name: string;
  declare rev: number;
  declare tap: Tap | null;
  declare roman: boolean;
  declare sel: string;
  declare voice: Voice;
  declare speaking: "" | "busy" | "playing";

  private hideTimer = 0;
  private audio: HTMLAudioElement | null = null;
  private listenAbort: AbortController | null = null;

  constructor() {
    super();
    this.runs = [];
    this.name = "";
    this.rev = 0;
    this.tap = null;
    this.roman = false;
    this.sel = "";
    this.voice = "sreymom";
    this.speaking = "";
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("selectionchange", this.onSelection);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("selectionchange", this.onSelection);
    this.stopVoice();
  }

  /** The selection, if it lies inside the text read. A collapse hides the bar a moment later, so a press on the bar
   *  (which can clear the selection on a phone) still finds the words. */
  private onSelection = () => {
    const s = getSelection();
    const area = this.querySelector("[data-text]");
    let text = "";
    if (s && !s.isCollapsed && s.rangeCount && area) {
      const r = s.getRangeAt(0);
      if (area.contains(r.commonAncestorContainer)) text = s.toString().replace(/\s+\n/g, "\n").trim();
    }
    window.clearTimeout(this.hideTimer);
    if (text) this.sel = text;
    else if (this.sel) this.hideTimer = window.setTimeout(() => { this.sel = ""; }, 400);
  };

  private onTextClick(e: MouseEvent) {
    const box = e.currentTarget as HTMLElement;
    if (box.classList.contains("rom")) return; // the dictionary is in Khmer script
    const s = getSelection();
    if (s && !s.isCollapsed) return;
    const pos = caretAt(e.clientX, e.clientY);
    if (!pos) return;
    const from = pos.node.nodeType === Node.ELEMENT_NODE ? (pos.node as Element) : pos.node.parentElement;
    const lineEl = from?.closest<HTMLElement>("[data-line]");
    if (!lineEl || !box.contains(lineEl)) return;
    // only on the words themselves, not the empty end of a line
    const all = document.createRange();
    all.selectNodeContents(lineEl);
    const hit = Array.from(all.getClientRects()).some(
      (r) => e.clientX >= r.left - 2 && e.clientX <= r.right + 2 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2);
    if (!hit) return;
    const upto = document.createRange();
    upto.setStart(lineEl, 0);
    upto.setEnd(pos.node, pos.offset);
    this.emit("word", { run: +box.dataset.run!, line: +lineEl.dataset.line!, offset: upto.toString().length });
  }

  private lineText(ri: number, li: number, text: string) {
    const tp = this.tap;
    if (!tp || tp.run !== ri || tp.line !== li) return text;
    return html`${text.slice(0, tp.start)}<mark>${text.slice(tp.start, tp.end)}</mark>${text.slice(tp.end)}`;
  }

  private body(r: Run, ri: number) {
    if (r.status === "nothing") return html`<p class="fine mt-0 mb-10">${t("nothingTitle")}</p>`;
    const rom = this.roman && r.leaf === "pali";
    return html`${r.status === "not-this-print" ? html`<div class="note">${t("otherTitle")}</div>` : ""}
      <div class="ocr ${rom ? "rom" : ""}" data-run=${ri} lang=${textLang(r.leaf, rom)} @click=${this.onTextClick}>
        ${r.lines.map((l, li) => (l ? html`<span class="ln" data-line=${li}>${rom ? toRoman(l.text) : this.lineText(ri, li, l.text)}</span>` : nothing))}
      </div>`;
  }

  private async copyAll() {
    toast(t((await copyText(plainText(this.runs, this.roman))) ? "copied" : "cannotCopy"), false);
  }
  private download() {
    const base = (this.name || "page").replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "-") || "page";
    const ns = this.runs.map((r) => r.n).filter((n): n is number => n !== null);
    const range = ns.length ? (ns.length > 1 ? `-p${ns[0]}-${ns[ns.length - 1]}` : `-p${ns[0]}`) : "";
    downloadText(`${base}${range}${this.roman ? "-roman" : ""}.txt`, plainText(this.runs, this.roman) + "\n");
  }
  private async copySel() {
    const text = this.sel;
    if (!text) return;
    toast(t((await copyText(text)) ? "copied" : "cannotCopy"));
  }

  private stopVoice() {
    this.listenAbort?.abort();
    this.listenAbort = null;
    if (this.audio) { this.audio.pause(); this.audio = null; }
    this.speaking = "";
  }
  private async listen() {
    if (this.speaking) { this.stopVoice(); return; }
    const text = this.sel;
    if (!text) return;
    this.speaking = "busy";
    const ac = new AbortController();
    this.listenAbort = ac;
    try {
      const a = await speak(text, this.voice, ac.signal);
      if (ac.signal.aborted) return;
      this.audio = a;
      a.addEventListener("ended", () => { if (this.audio === a) this.stopVoice(); }, { once: true });
      this.speaking = "playing";
      await a.play();
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") toast(t("didNotWork"), true);
      this.stopVoice();
    }
  }

  private bar() {
    if (!this.sel) return "";
    const listenOn = listenShown() && !/[a-zA-Z]/.test(this.sel);
    const item = "flex flex-1 items-center justify-center gap-6 rounded-thumb px-6 py-9 text-tool font-strong whitespace-nowrap";
    return html`<div class="sticky bottom-12 z-10 my-6 mb-10 flex gap-6 rounded-btn bg-ink p-6 text-bg shadow-bar"
        @mousedown=${(e: Event) => e.preventDefault()}>
        ${listenOn ? html`<button class=${item} ?disabled=${this.speaking === "busy"} @click=${this.listen}>
          ${this.speaking === "busy" ? dots() : html`${SPEAK()}${t(this.speaking === "playing" ? "stop" : "listen")}`}</button>` : ""}
        <button class=${item} @click=${() => this.emit("ask", { passage: this.sel })}>${ASK()}${t("askAbout")}</button>
        <button class=${item} @click=${this.copySel}>${COPY()}${t("copy")}</button>
      </div>
      ${listenOn ? html`<div class="card">
        ${spot("voice")}
        <h2>${t("khmerVoice")}</h2>
        <span class="seg mt-4 mb-10 text-small" role="group" aria-label=${t("khmerVoice")}>
          <button aria-pressed=${this.voice === "sreymom" ? "true" : "false"} @click=${() => { this.voice = "sreymom"; }}>Sreymom · ${t("woman")}</button>
          <button aria-pressed=${this.voice === "piseth" ? "true" : "false"} @click=${() => { this.voice = "piseth"; }}>Piseth · ${t("man")}</button>
        </span>
        <p>${t("listenNote")}</p>
      </div>` : ""}`;
  }

  render() {
    const runs = this.runs;
    const multi = runs.length > 1;
    const single = !multi ? runs[0] : null;
    const anyPali = runs.some((r) => r.leaf === "pali" && readLines(r).length);
    const hintKey = clicks()
      ? (listenShown() ? "clickHint" : "clickHintNoListen")
      : (listenShown() ? "tapHint" : "tapHintNoListen");
    const showScan = single?.page && single.boxes.length;
    const text = html`
      <h1 class="h1" tabindex="-1">${t("theText")}</h1>
      <div data-text>
        ${runs.map((r, ri) => html`<section>
          ${pageHeading(r, multi)}
          ${r.status !== "nothing" ? leafRow(r, (leaf: Leaf) => this.emit("leaf", { run: ri, leaf })) : ""}
          ${this.body(r, ri)}
        </section>`)}
      </div>
      ${this.bar()}
      ${anyPali ? html`<div class="flex items-center justify-between gap-12 py-10">
        <span id="roman-label">${t("roman")}</span>
        <button class="tog" role="switch" aria-checked=${this.roman ? "true" : "false"} aria-labelledby="roman-label"
          @click=${() => { this.roman = !this.roman; this.emit("untap"); }}></button>
      </div>` : ""}
      <div class="mt-4 flex flex-wrap gap-8">
        <button class="tool" @click=${this.copyAll}>${COPY()}${t("copy")}</button>
        <button class="tool" @click=${this.download}>${DOWN()}${t("download")}</button>
      </div>
      <div class="note">${t("checkPrint")}</div>
      <p class="fine mt-12">${this.roman && anyPali ? t("romanNote") : t(hintKey)}</p>
      <button class="btn btn-ghost mt-10 desk:inline-flex desk:w-auto desk:px-22 desk:py-12" @click=${() => this.emit("another")}>${t("readAnother")}</button>`;

    if (!showScan) return html`<div class="mx-auto max-w-760">${text}</div>`;
    return html`<div class="desk:mt-8 desk:grid desk:grid-cols-[1.2fr_1fr] desk:items-start desk:gap-40">
      <div class="hidden desk:sticky desk:top-16 desk:block">
        <p class="sh mt-18">${t("yourPage")}</p>
        <ocr-scan .page=${single!.page} .boxes=${single!.boxes} .marks=${single!.boxes.map(() => (single!.status === "not-this-print" ? "faint" : "read"))}></ocr-scan>
        <p class="-mt-4 mb-10 text-center text-caption text-ink-faint" lang=${langOf("linesOutlined")}>${t("linesOutlined")}</p>
      </div>
      <div>${text}</div>
    </div>`;
  }
}
customElements.define("ocr-result", OcrResult);
