/** State 1c — Adjust the page (NOT DRAWN: our screen, 2026-11-20). For a photo or a screenshot, the reader finds the page
 *  inside the picture; this shows the person's ORIGINAL picture with that page outlined and four corners to move:
 *  dragged with a finger, a mouse or a pen (pointer events), or moved with the arrow keys (each corner is a button with
 *  its own name). "Read this page" sends the corners up (the app cuts the page there with Reader.recrop and reads it);
 *  "Use the whole picture" sends the picture's own four corners.
 *
 *  ⛔ The CSP refuses style attributes, so nothing here writes one: the picture's aspect ratio is a custom property set
 *  through the CSSOM, CSS sizes the picture from it to fit the screen (`.adj` in styles.css), and each corner is placed in
 *  percent through the CSSOM, so it follows the picture at any size. Corners are kept inside the picture. */
import { html, type PropertyValues } from "lit";
import { Light } from "./base";
import { t } from "../i18n";
import { dots } from "./icons";
import type { Page, Quad } from "../read/index";

/** top-left, top-right, bottom-right, bottom-left: the contract's order (src/read/types.ts) */
const NAMES = ["cornerTL", "cornerTR", "cornerBR", "cornerBL"] as const;
const KEYS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export const wholeQuad = (w: number, h: number): Quad => [[0, 0], [w, 0], [w, h], [0, h]];
export const sameQuad = (a: Quad | undefined, b: Quad): boolean =>
  Boolean(a) && a!.every((p, i) => p[0] === b[i][0] && p[1] === b[i][1]);
const copyQuad = (q: Quad): Quad => q.map((p) => [p[0], p[1]]) as Quad;

export class OcrAdjust extends Light {
  static properties = {
    page: { attribute: false },
    start: { attribute: false },
    busy: { type: Boolean },
    back: { type: Boolean },
    corners: { state: true },
    pressed: { state: true },
  };
  /** the page as the reader opened it: `source` is the original picture */
  declare page: Page | null;
  /** the corners to begin from: where the page was last cut (the person's own, or the reader's) */
  declare start: Quad | null;
  declare busy: boolean;
  /** opened from the text (the page was read already): offer "Back to the text" */
  declare back: boolean;
  declare corners: Quad;
  /** which button the person pressed, so that one shows the dots while the app works */
  declare pressed: "" | "read" | "whole";

  private drag: { i: number; id: number; dx: number; dy: number } | null = null;

  constructor() {
    super();
    this.page = null;
    this.start = null;
    this.busy = false;
    this.back = false;
    this.corners = wholeQuad(1, 1);
    this.pressed = "";
  }

  protected willUpdate(changed: PropertyValues) {
    if (changed.has("page") || changed.has("start")) {
      const s = this.page?.source;
      if (s) this.corners = this.inside(copyQuad(this.start ?? this.page?.corners ?? wholeQuad(s.width, s.height)));
    }
    if (changed.has("busy") && !this.busy) this.pressed = "";
  }

  protected updated() {
    const s = this.page?.source;
    if (!s) return;
    this.pic()?.style.setProperty("--ar", String(s.width / s.height));
    this.querySelectorAll<HTMLElement>("[data-corner]").forEach((el) => {
      const [x, y] = this.corners[+el.dataset.corner!];
      el.style.left = `${(x / s.width) * 100}%`;
      el.style.top = `${(y / s.height) * 100}%`;
    });
  }

  private pic() {
    return this.querySelector<HTMLElement>("[data-pic]");
  }
  private inside(q: Quad): Quad {
    const s = this.page!.source!;
    const c = (v: number, max: number) => Math.round(Math.min(Math.max(v, 0), max));
    return q.map(([x, y]) => [c(x, s.width), c(y, s.height)]) as Quad;
  }
  private put(i: number, x: number, y: number) {
    const q = copyQuad(this.corners);
    q[i] = [x, y];
    this.corners = this.inside(q);
  }
  /** a point on the screen → the original picture's pixels */
  private toPicture(clientX: number, clientY: number): [number, number] {
    const s = this.page!.source!;
    const r = this.pic()!.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * s.width, ((clientY - r.top) / r.height) * s.height];
  }

  // ── dragging (mouse, touch, pen) ────────────────────────────────────────────────────────────────────────────────────
  private down(i: number, e: PointerEvent) {
    if (this.busy || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    el.focus({ preventScroll: true });
    const [px, py] = this.toPicture(e.clientX, e.clientY);
    // keep the grip: the corner moves with the finger, not to it
    this.drag = { i, id: e.pointerId, dx: this.corners[i][0] - px, dy: this.corners[i][1] - py };
  }
  private move = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    const [px, py] = this.toPicture(e.clientX, e.clientY);
    this.put(d.i, px + d.dx, py + d.dy);
  };
  private up = (e: PointerEvent) => {
    if (this.drag?.id === e.pointerId) this.drag = null;
  };

  // ── the keyboard: two screen pixels a press, twenty with Shift ──────────────────────────────────────────────────────
  private key(i: number, e: KeyboardEvent) {
    const dir = KEYS[e.key];
    if (!dir || this.busy) return;
    e.preventDefault();
    const s = this.page!.source!;
    const per = s.width / Math.max(this.pic()!.getBoundingClientRect().width, 1);
    const step = per * (e.shiftKey ? 20 : 2);
    this.put(i, this.corners[i][0] + dir[0] * step, this.corners[i][1] + dir[1] * step);
  }

  private read() {
    if (this.busy) return;
    this.pressed = "read";
    this.emit<Quad>("adjust", copyQuad(this.corners));
  }
  private whole() {
    if (this.busy) return;
    const s = this.page!.source!;
    this.corners = wholeQuad(s.width, s.height);
    this.pressed = "whole";
    this.emit<Quad>("adjust", copyQuad(this.corners));
  }

  private label(which: "read" | "whole", key: "readThis" | "wholePicture") {
    return this.busy && this.pressed === which ? html`${dots()}<span class="sr-only">${t("working")}</span>` : t(key);
  }

  render() {
    const s = this.page?.source;
    if (!s) return html``;
    const q = this.corners;
    const pts = q.map((p) => p.join(",")).join(" ");
    // everything outside the page is shaded: the picture's rectangle with the page cut out of it (even-odd)
    const shade = `M0 0H${s.width}V${s.height}H0Z M${q.map((p) => p.join(" ")).join(" L")}Z`;
    return html`<div class="desk:mt-8 desk:grid desk:grid-cols-[1.2fr_1fr] desk:grid-rows-[auto_1fr] desk:gap-x-40">
      <div class="desk:col-start-2 desk:row-start-1">
        <h1 class="h1" tabindex="-1">${t("adjustTitle")}</h1>
        <p class="lede mb-0">${t("adjustHelp")}</p>
        <p id="adj-keys" class="sr-only">${t("adjustKeys")}</p>
      </div>
      <div class="-mx-20 px-22 py-22 desk:col-start-1 desk:row-span-2 desk:row-start-1 desk:mx-0 desk:self-start">
        <div data-pic class="adj relative mx-auto select-none">
          <img class="block size-full rounded-box bg-paper" src=${s.url} width=${s.width} height=${s.height} alt=${t("yourPicture")}
            draggable="false" />
          <svg class="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox="0 0 ${s.width} ${s.height}"
            preserveAspectRatio="none" aria-hidden="true">
            <path class="adj-shade" fill-rule="evenodd" d=${shade}></path>
            <polygon class="adj-halo" points=${pts}></polygon>
            <polygon class="adj-edge" points=${pts}></polygon>
          </svg>
          ${q.map((_, i) => html`<button type="button" data-corner=${i}
              class="absolute -mt-22 -ml-22 grid size-44 touch-none place-items-center rounded-pill"
              aria-label=${t(NAMES[i])} aria-describedby="adj-keys" ?disabled=${this.busy}
              @pointerdown=${(e: PointerEvent) => this.down(i, e)} @pointermove=${this.move} @pointerup=${this.up}
              @pointercancel=${this.up} @lostpointercapture=${this.up} @keydown=${(e: KeyboardEvent) => this.key(i, e)}>
              <span class="block size-22 rounded-pill border-2 border-mark bg-knob shadow-bar"></span>
            </button>`)}
        </div>
      </div>
      <div class="desk:col-start-2 desk:row-start-2 desk:mt-22">
        <button class="btn" ?disabled=${this.busy} aria-busy=${this.busy && this.pressed === "read" ? "true" : "false"}
          @click=${this.read}>${this.label("read", "readThis")}</button>
        <button class="btn btn-ghost mt-10" ?disabled=${this.busy} aria-busy=${this.busy && this.pressed === "whole" ? "true" : "false"}
          @click=${this.whole}>${this.label("whole", "wholePicture")}</button>
        ${this.back ? html`<button class="btn btn-ghost mt-10" ?disabled=${this.busy} @click=${() => this.emit("back")}>${t("backToText")}</button>` : ""}
      </div>
    </div>`;
  }
}
customElements.define("ocr-adjust", OcrAdjust);
