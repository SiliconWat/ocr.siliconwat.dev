/** Icons, as the drawings draw them (build-boards.py: the stroke icons and the spot illustrations). currentColor strokes.
 *  ⛔ No B-Emblem and no heart: this is a Silicon Wat surface. */
import { svg, html, type TemplateResult } from "lit";

/** The PLACEHOLDER icon (the drawings' brand.py ICON_GLYPH): a page with three printed lines, in a 24-unit box. NOT a mark;
 *  Silicon Wat's own is not settled. scripts/build-icons.py reads these two constants to draw the favicons. */
export const ICON_RECT = { x: 5, y: 3, width: 14, height: 18, rx: 2.2 };
export const ICON_LINES = "M8.5 8h7M8.5 12h7M8.5 16h4.5";

export function siteIcon(size: number): TemplateResult {
  return html`<svg class="flex-none text-accent" width=${size} height=${size} viewBox="0 0 24 24" aria-hidden="true">
    <rect x=${ICON_RECT.x} y=${ICON_RECT.y} width=${ICON_RECT.width} height=${ICON_RECT.height} rx=${ICON_RECT.rx}
      fill="none" stroke="currentColor" stroke-width="1.8"></rect>
    <path d=${ICON_LINES} stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
  </svg>`;
}

const ic = (body: TemplateResult, size = 16) =>
  html`<svg class="flex-none" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const SHARE = () => ic(svg`<path d="M12 15V3m0 0L7 8m5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>`);
export const COPY = () => ic(svg`<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>`);
export const DOWN = () => ic(svg`<path d="M12 3v12m0 0-5-5m5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>`);
export const SPEAK = () => ic(svg`<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>`);
export const ASK = () => ic(svg`<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 2-2.2 2M12 15.5h.01"/>`);
export const EXT = () => ic(svg`<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>`);
export const CAM = () => ic(svg`<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>`);
export const FILE = () => ic(svg`<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>`);
export const DEVICE = () => ic(svg`<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>`, 18);
export const TICK = () =>
  html`<svg class="mt-3 flex-none text-accent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17l9-10"/></svg>`;

export type Spot = "page" | "measure" | "device" | "file" | "voice";
const SPOTS: Record<Spot, TemplateResult> = {
  page: svg`<rect class="sf" x="14" y="2" width="28" height="36" rx="3"/><path class="ss" d="M20 11h16M20 18h16M20 25h10"/>`,
  measure: svg`<rect class="sf" x="4" y="12" width="48" height="16" rx="3"/><path class="sk" d="M12 12v6M20 12v4M28 12v6M36 12v4M44 12v6"/><path class="ss" d="M10 33l6-5 6 3 8-7"/>`,
  device: svg`<rect class="sf" x="18" y="3" width="20" height="34" rx="4"/><path class="ss" d="M24 14h8M24 20h8M24 26h5"/><path class="sk" d="M8 20h6M42 20h6" stroke-dasharray="2 3"/>`,
  file: svg`<path class="sf" d="M14 3h20l8 8v26H14z"/><path class="ss" d="M20 18h16M20 25h12"/><rect class="sa" x="28" y="29" width="18" height="8" rx="4"/>`,
  voice: svg`<path class="sf" d="M10 15h7l8-7v24l-8-7h-7z"/><path class="ss" d="M31 14a8 8 0 0 1 0 12M36 9a15 15 0 0 1 0 22"/>`,
};
export const spot = (kind: Spot) =>
  html`<svg class="mb-10 block" width="56" height="40" viewBox="0 0 56 40" aria-hidden="true">${SPOTS[kind]}</svg>`;

/** The drop zone's page with an arrow. */
export const dropArt = () =>
  html`<svg class="mx-auto mb-8 block h-46 w-64 desk:h-60 desk:w-84" viewBox="0 0 56 40" aria-hidden="true">
    <rect class="sf" x="16" y="2" width="24" height="32" rx="3"/><path class="ss" d="M22 10h12M22 16h12M22 22h8"/>
    <path class="ss" d="M28 38V28m0 0-4 4m4-4 4 4"/></svg>`;

export const dots = () => html`<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
