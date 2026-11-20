/** The page: header (language, share), the current state, footer (About and credits, the beacon sentence, the theme),
 *  and the two sheets. It drives the reader through the one contract (src/read/index.ts), never what is behind it.
 *
 *  1 empty → (a PDF) 1b choose pages → (first use only) 2 getting ready → 3 reading → 4 the text · 5 nothing · 6 not this print
 *  7 About (#about) · 8 a word's entry · 9 a selection's bar · 10 Ask.  */
import { html, type PropertyValues } from "lit";
import { Light } from "./base";
import { t, getLang, setLang, type Lang } from "../i18n";
import { SHARE, siteIcon } from "./icons";
import { copyText, mountToast, toast } from "./toast";
import { reportError } from "../report";
import { modelChoice, setModel, setTheme, themeChoice, DEMO, demoParam, type ThemeChoice } from "./prefs";
import { newRun, readLines, textLang, type Run } from "./run";
import type { Tap } from "./result";
import type { PagePick } from "./pages";
import { getReader, type Leaf, type ModelId, type PdfDoc, type ReadResult } from "../read/index";
import { lookup, entryById, wordAt, type Entry } from "../dict/index";
import "./empty";
import "./pages";
import "./progress";
import "./result";
import "./outcome";
import "./sheets";
import "./about";
import "./terms";

type View = "empty" | "pages" | "ready" | "reading" | "result" | "nothing" | "other";

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
const isImage = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif|avif)$/i.test(f.name);

export class OcrApp extends Light {
  static properties = {
    view: { state: true },
    about: { state: true },
    terms: { state: true },
    model: { state: true },
    opening: { state: true },
    rev: { state: true },
    tap: { state: true },
    dict: { state: true },
    ask: { state: true },
  };
  declare view: View;
  declare about: boolean;
  declare terms: boolean;
  declare model: ModelId;
  declare opening: boolean;
  declare rev: number;
  declare tap: Tap | null;
  declare dict: { entry: Entry | null; fromRef: boolean } | null;
  declare ask: { passage: string; lang: string; initial: string } | null;

  name = "";
  doc: PdfDoc | null = null;
  runs: Run[] = [];
  current = 0;
  private ac: AbortController | null = null;
  private session = 0;

  // dev-only screen checks (src/ui/demo.ts), honored only under ?demo
  demoFreeze: "" | "ready" | "reading" = "";
  demoStatus: ReadResult["status"] | "" = "";
  pagesPreset: { mode: "one" | "range"; from: number; to: number } | null = null;

  constructor() {
    super();
    this.view = "empty";
    this.about = location.hash === "#about";
    this.terms = location.hash === "#terms";
    this.model = modelChoice();
    this.opening = false;
    this.rev = 0;
    this.tap = null;
    this.dict = null;
    this.ask = null;
  }

  connectedCallback() {
    super.connectedCallback();
    mountToast();
    window.addEventListener("hashchange", this.onHash);
    this.syncTitle();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("hashchange", this.onHash);
  }
  private onHash = () => {
    this.about = location.hash === "#about";
    this.terms = location.hash === "#terms";
  };

  firstUpdated() {
    const s = demoParam("state");
    if (DEMO && s) import("./demo").then((m) => m.jump(this, s));
  }

  protected updated(changed: PropertyValues) {
    if (changed.has("view") || changed.has("about") || changed.has("terms")) {
      window.scrollTo(0, 0);
      // move focus to the new screen's heading, for a screen reader (not on the first paint)
      if (changed.get("view") !== undefined || changed.get("about") !== undefined || changed.get("terms") !== undefined) {
        this.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
      }
    }
  }

  private syncTitle() {
    document.title = `${t("title")} · ocr.siliconwat.dev`;
  }
  private pickLang(l: Lang) {
    setLang(l);
    this.syncTitle();
  }

  private bump() {
    this.rev++;
  }

  // ── files ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  async onFile(file: File): Promise<void> {
    if (!isPdf(file) && !isImage(file)) { toast(t("notAFile"), true); return; }
    this.reset();
    const session = this.session;
    this.name = file.name;
    this.opening = true;
    try {
      const reader = await getReader();
      if (isPdf(file)) {
        const doc = await reader.openPdf(file);
        if (session !== this.session) { doc.close(); return; }
        this.doc = doc;
        this.opening = false;
        if (doc.pages <= 1) return await this.readPages({ from: 1, to: 1 });
        this.view = "pages";
        if (this.pagesPreset) {
          await this.updateComplete;
          const p = this.pagesPreset;
          this.querySelector<HTMLElement & { preset(m: string, f: number, t: number): void }>("ocr-pages")?.preset(p.mode, p.from, p.to);
        }
      } else {
        const page = await reader.openImage(file);
        if (session !== this.session) return;
        this.opening = false;
        this.runs = [newRun(null, async () => page, page)];
        await this.readRuns([0]);
      }
    } catch (e) {
      reportError("open", e);
      if (session !== this.session) return;
      this.opening = false;
      this.view = "empty";
      toast(t("cannotOpen"), true);
    }
  }

  async readPages(p: PagePick): Promise<void> {
    const doc = this.doc;
    if (!doc) return;
    this.runs = [];
    for (let n = p.from; n <= p.to; n++) this.runs.push(newRun(n, () => doc.page(n)));
    this.opening = true; // the button shows its dots while the first page is drawn
    await this.readRuns(this.runs.map((_, i) => i));
  }

  /** Reads the given runs in order: state 2 first if the reader is not on this device yet, then state 3, then 4/5/6. */
  async readRuns(which: number[]): Promise<void> {
    const session = this.session;
    const ac = new AbortController();
    this.ac = ac;
    const live = () => session === this.session && !ac.signal.aborted;
    const reader = await getReader();
    try {
      const first = this.runs[which[0]];
      this.current = which[0];
      first.page ??= await first.get();
      this.opening = false;
      if (!live()) return;
      if (!(await reader.isReady(this.model))) {
        this.view = "ready";
        if (this.demoFreeze === "ready") return;
        await reader.prepare(this.model);
        if (!live()) return;
      }
      this.view = "reading";
      for (const i of which) {
        const run = this.runs[i];
        this.current = i;
        run.page ??= await run.get();
        if (!live()) return;
        run.boxes = [];
        run.lines = [];
        run.status = "reading";
        run.leaf = undefined;
        run.leafFound = false;
        this.bump();
        const res = await reader.read(run.page, { model: this.model, leaf: run.want }, {
          onLeaf: (l) => { if (live()) { run.leaf = l; run.leafFound = !run.want; this.bump(); } },
          onFound: (b) => { if (live()) { run.boxes = b; this.bump(); } },
          onLine: (k, line) => {
            if (!live()) return;
            run.lines[k] = line;
            this.bump();
            if (this.demoFreeze === "reading" && k >= 2) ac.abort("demo");
          },
        }, ac.signal);
        if (!live()) return;
        run.lines = res.lines.slice();
        run.leaf = res.leaf;
        run.leafFound = res.leafFound;
        run.status = this.demoStatus || res.status;
        if (this.demoStatus === "nothing") { run.lines = []; run.boxes = []; }
        // in a range, a finished page's picture is not shown again: let it go (the run re-opens it if re-read)
        if (this.runs.length > 1 && run.page && i !== which[which.length - 1]) {
          URL.revokeObjectURL(run.page.preview);
          run.page = null;
        }
        this.bump();
      }
      this.finish();
    } catch (e) {
      if (session !== this.session) return;
      if (ac.signal.aborted) {
        if (this.demoFreeze === "reading") return; // the screen check holds state 3 still
        this.finish(true);
        return;
      }
      this.opening = false;
      reportError("read", e);
      toast(t("cannotRead"), true);
      this.finish(true);
    }
  }

  /** After reading (or Stop): one page → its own state; a range → the text, page by page. */
  private finish(stopped = false) {
    if (stopped) {
      for (const r of this.runs) if (r.status === "reading" || r.status === "waiting") r.status = readLines(r).length ? "partial" : "waiting";
      this.runs = this.runs.filter((r) => r.status !== "waiting");
      if (!this.runs.length) { this.again(); return; }
    }
    this.bump();
    if (this.runs.length === 1) {
      const s = this.runs[0].status;
      this.view = s === "nothing" ? "nothing" : s === "not-this-print" ? "other" : "result";
    } else {
      this.view = "result";
    }
  }

  private stop() {
    this.ac?.abort();
  }

  /** Back to state 1, letting go of every picture and the PDF. */
  again() {
    this.reset();
    this.view = "empty";
  }
  private reset() {
    this.session++;
    this.ac?.abort();
    this.ac = null;
    for (const r of this.runs) if (r.page) URL.revokeObjectURL(r.page.preview);
    this.runs = [];
    this.doc?.close();
    this.doc = null;
    this.tap = null;
    this.dict = null;
    this.ask = null;
    this.opening = false;
  }

  private reread(i: number, leaf: Leaf) {
    const run = this.runs[i];
    if (!run) return;
    run.want = leaf;
    this.tap = null;
    void this.readRuns([i]);
  }

  // ── 8 · a word ──────────────────────────────────────────────────────────────────────────────────────────────────────
  async onWord(d: { run: number; line: number; offset: number }) {
    const text = this.runs[d.run]?.lines[d.line]?.text;
    if (!text) return;
    const entry = await lookup(text, d.offset);
    let span = wordAt(text, d.offset);
    if (entry && span && text.slice(span[0], span[1]) !== entry.tapped) {
      // the browser's Khmer segmenter found a word inside the run of letters: outline that word
      const from = Math.max(span[0], d.offset - entry.tapped.length);
      const at = text.indexOf(entry.tapped, from);
      if (at >= 0 && at <= d.offset) span = [at, at + entry.tapped.length];
    }
    this.tap = span ? { run: d.run, line: d.line, start: span[0], end: span[1] } : null;
    this.dict = { entry, fromRef: false };
  }
  private async onRef(id: number) {
    const entry = await entryById(id);
    this.dict = { entry, fromRef: true };
  }

  // ── header and footer ───────────────────────────────────────────────────────────────────────────────────────────────
  private async share() {
    const url = location.origin + location.pathname;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: t("title"), text: t("lede"), url });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return; // the person closed the sheet
      }
    }
    toast(t((await copyText(url)) ? "linkCopied" : "cannotCopy"));
  }
  private home(e: Event) {
    e.preventDefault();
    if (location.hash) history.pushState(null, "", location.pathname + location.search);
    this.about = false;
    this.terms = false;
    this.again();
  }
  private theme(c: ThemeChoice) {
    setTheme(c);
    this.requestUpdate();
  }

  private header() {
    const l = getLang();
    return html`<header class="flex items-center justify-between gap-10 pt-16 pb-8 desk:pt-22 desk:pb-12">
      <a href="/" class="flex min-w-0 items-center gap-8 text-ink no-underline" @click=${this.home}>
        ${siteIcon(26)}<span class="text-field font-strong tracking-wm whitespace-nowrap">ocr.siliconwat.dev</span>
      </a>
      <div class="flex items-center gap-8">
        <div class="seg" role="group">
          <button lang="en" aria-pressed=${l === "en" ? "true" : "false"} @click=${() => this.pickLang("en")}>EN</button>
          <button lang="km" aria-pressed=${l === "km" ? "true" : "false"} @click=${() => this.pickLang("km")}>ខ្មែរ</button>
        </div>
        <button class="grid size-32 flex-none place-items-center rounded-pill border border-line-strong text-ink" aria-label=${t("share")}
          @click=${this.share}>${SHARE()}</button>
      </div>
    </header>`;
  }

  private footer() {
    const c = themeChoice();
    const b = (v: ThemeChoice, k: "system" | "light" | "dark") =>
      html`<button aria-pressed=${c === v ? "true" : "false"} @click=${() => this.theme(v)}>${t(k)}</button>`;
    return html`<footer class="mt-20 flex flex-wrap items-center justify-between gap-10 border-t border-line pt-12 pb-24 text-foot text-ink-faint">
      <span><a href="#about" class="text-ink-dim underline underline-offset-2">${t("aboutLink")}</a> · <a href="#terms" class="text-ink-dim underline underline-offset-2">${t("termsLink")}</a> · ${t("visits")}</span>
      <div class="seg" role="group">${b("system", "system")}${b("light", "light")}${b("dark", "dark")}</div>
    </footer>`;
  }

  private main() {
    if (this.terms) return html`<ocr-terms></ocr-terms>`;
    if (this.about) return html`<ocr-about></ocr-about>`;
    switch (this.view) {
      case "empty":
        return html`<ocr-empty .model=${this.model} ?opening=${this.opening}
          @file=${(e: CustomEvent<File>) => this.onFile(e.detail)}
          @model=${(e: CustomEvent<ModelId>) => { this.model = e.detail; setModel(e.detail); }}></ocr-empty>`;
      case "pages":
        return html`<ocr-pages .doc=${this.doc} .name=${this.name} ?busy=${this.opening}
          @pages=${(e: CustomEvent<PagePick>) => this.readPages(e.detail)}
          @file=${(e: CustomEvent<File>) => this.onFile(e.detail)}></ocr-pages>`;
      case "ready":
      case "reading":
        return html`<ocr-progress .view=${this.view} .runs=${this.runs} .current=${this.current} .model=${this.model} .rev=${this.rev}
          @stop=${this.stop}></ocr-progress>`;
      case "nothing":
      case "other":
        return html`<ocr-outcome .kind=${this.view} .run=${this.runs[0] ?? null}
          @another=${() => this.again()} @anyway=${() => { this.view = "result"; }}></ocr-outcome>`;
      case "result":
        return html`<ocr-result .runs=${this.runs} .name=${this.name} .rev=${this.rev} .tap=${this.tap}
          @leaf=${(e: CustomEvent<{ run: number; leaf: Leaf }>) => this.reread(e.detail.run, e.detail.leaf)}
          @another=${() => this.again()}
          @untap=${() => { this.tap = null; }}
          @word=${(e: CustomEvent<{ run: number; line: number; offset: number }>) => this.onWord(e.detail)}
          @ask=${(e: CustomEvent<{ passage: string }>) => { this.openAsk(e.detail.passage); }}></ocr-result>`;
    }
  }

  openAsk(passage: string, initial = "") {
    const leaf = this.runs.find((r) => r.leaf)?.leaf;
    this.ask = { passage, lang: /[a-z]/i.test(passage) ? textLang(leaf, true) : textLang(leaf), initial };
  }

  render() {
    const km = getLang() === "km";
    return html`
      ${km ? html`<div class="bg-surface-2 px-20 py-6 text-center text-tiny leading-body text-ink-dim">
        <span lang="en">${t("bandEn")}</span> · <span lang="km">${t("bandKm")}</span></div>` : ""}
      <div class="mx-auto flex min-h-dvh max-w-1280 flex-col px-20 desk:px-64">
        ${this.header()}
        <main class="flex-1">${this.main()}</main>
        ${this.footer()}
      </div>
      <ocr-dict ?open=${Boolean(this.dict)} .entry=${this.dict?.entry ?? null} ?fromRef=${Boolean(this.dict?.fromRef)}
        @close=${() => { this.dict = null; this.tap = null; }} @ref=${(e: CustomEvent<number>) => this.onRef(e.detail)}></ocr-dict>
      <ocr-ask ?open=${Boolean(this.ask)} .passage=${this.ask?.passage ?? ""} .passageLang=${this.ask?.lang ?? "und-Khmr"}
        .initial=${this.ask?.initial ?? ""} @close=${() => { this.ask = null; }}></ocr-ask>`;
  }
}
customElements.define("ocr-app", OcrApp);
