/** Crop one printed line — a port of `tools/ocr_tess.py` `line_box`, the SAME crop training used: the line's own ink
 *  extent ± 8 px across and its rows ± 6 px, measured on the line-finding copy, then scaled by k to the crop copy.
 *  (Pilot 2 read full-width crops while it trained on tight ones; margin specks read as letters — 2026-11-18.) */
import type { Gray } from "./gray";

/** Python 3's round(): halves go to the even neighbor. */
export function pyRound(x: number): number {
  const f = Math.floor(x), d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

export function lineBox(app: Gray, a: number, b: number, k: number, size: [number, number], padX = 8, padY = 6):
  [number, number, number, number] {
  let mn = Infinity, mx = -Infinity;
  for (let y = a; y < b; y++) {
    const row = y * app.w;
    for (let x = 0; x < app.w; x += 2) if (app.data[row + x] < 128) { if (x < mn) mn = x; if (x > mx) mx = x; }
  }
  if (mn === Infinity) { mn = 0; mx = app.w - 1; }
  const x0 = Math.max(mn - padX, 0), x1 = mx + padX;
  return [pyRound(x0 * k), pyRound(Math.max(a - padY, 0) * k), Math.min(pyRound(x1 * k), size[0]), Math.min(pyRound((b + padY) * k), size[1])];
}

/** Pillow's crop: columns [l, r), rows [t, b). */
export function crop(g: Gray, [l, t, r, b]: [number, number, number, number]): Gray {
  const w = Math.max(r - l, 0), h = Math.max(b - t, 0), data = new Uint8Array(w * h).fill(0);
  for (let y = 0; y < h; y++) {
    const sy = t + y; if (sy < 0 || sy >= g.h) continue;
    for (let x = 0; x < w; x++) { const sx = l + x; if (sx >= 0 && sx < g.w) data[y * w + x] = g.data[sy * g.w + sx]; }
  }
  return { w, h, data };
}
