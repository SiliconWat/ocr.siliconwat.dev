/** Straighten a tilted page (2026-11-20, A64). The line finder (lines.ts) reads horizontal rows of ink, so a page photographed
 *  a degree or two off level smears its lines together. The tilt is the angle at which the rows of ink are SHARPEST: for each
 *  candidate angle the dark pixels are projected onto a rotated vertical axis and the squared row counts summed (crisp rows
 *  score high, smeared rows low). A coarse search over ±MAX° then a fine one around the best.
 *  Measured 2026-11-20 (scripts/deskew-check.ts, 10 held-out Pāli pages turned by known angles; EXPLORATORY — synthetic tilts,
 *  not phone photos): angle found within 0.05° (median), 0.30° at worst; median CER as tilted → straightened: ±1° 1.9 → 2.0% ·
 *  ±2° 5.9 → 2.0% · ±3° 56 → 2.2% · ±5° 95 → 2.0%. The scans' own small tilts (10 of 80 test pages, −0.5…0.65°) are NOT worth
 *  straightening: 2.2 → 2.8%, 5 better, 4 worse (resampling blurs). So MIN_DEG = 1: no measured scan is rotated, and the
 *  measured pipeline is unchanged for them. */
import type { Gray } from "./gray";

export const MAX_DEG = 6;
export const MIN_DEG = 1;

/** Dark pixels (< 128) of the image, every `step`-th pixel each way. */
function inkPoints(g: Gray, step: number): Float64Array {
  const pts: number[] = [];
  for (let y = 0; y < g.h; y += step) for (let x = 0; x < g.w; x += step) if (g.data[y * g.w + x] < 128) pts.push(x, y);
  return Float64Array.from(pts);
}

const STEP = 2;   // ink is sampled every STEP pixels each way, so rows are counted in bins STEP tall — ⚠️ with 1-px bins every
                 // sample lands on an even row at exactly 0°, the counts double up, and 0° beats a real 1–2° tilt (found 2026-11-20)
function sharpness(pts: Float64Array, deg: number, h: number, w: number): number {
  const a = (deg * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a);
  const pad = Math.ceil((w * Math.abs(s)) / STEP) + 2, rows = new Int32Array(Math.ceil(h / STEP) + 2 * pad);
  for (let i = 0; i < pts.length; i += 2) {
    const yr = Math.round((-pts[i] * s + pts[i + 1] * c) / STEP) + pad;   // the row bin this ink falls in once the page is turned by -deg
    if (yr >= 0 && yr < rows.length) rows[yr]++;
  }
  let e = 0; for (let i = 0; i < rows.length; i++) e += rows[i] * rows[i];
  return e;
}

/** The page's tilt in degrees (positive = the text rises to the right… as y grows downward: clockwise). Measure it on a copy
 *  of about 1,340 px; it does not depend on scale. */
export function skewAngle(g: Gray): number {
  const pts = inkPoints(g, STEP);
  if (pts.length < 200) return 0;
  let best = 0, bestE = -1;
  for (let d = -MAX_DEG; d <= MAX_DEG + 1e-9; d += 0.25) { const e = sharpness(pts, d, g.h, g.w); if (e > bestE) { bestE = e; best = d; } }
  const coarse = best;
  for (let d = coarse - 0.25; d <= coarse + 0.25 + 1e-9; d += 0.05) { const e = sharpness(pts, d, g.h, g.w); if (e > bestE) { bestE = e; best = d; } }
  return Math.round(best * 100) / 100;
}

/** Turn the image by -deg about its center (bilinear), same size, corners filled white. */
export function rotate(g: Gray, deg: number): Gray {
  const a = (-deg * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a), cx = g.w / 2, cy = g.h / 2;
  const out = new Uint8Array(g.w * g.h);
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      // inverse map: where in the source does this output pixel come from
      const dx = x - cx, dy = y - cy;
      const sx = c * dx + s * dy + cx, sy = -s * dx + c * dy + cy;
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
      if (x0 < 0 || y0 < 0 || x0 + 1 >= g.w || y0 + 1 >= g.h) { out[y * g.w + x] = 255; continue; }
      const i = y0 * g.w + x0, d = g.data;
      out[y * g.w + x] = Math.round((d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + g.w] * (1 - fx) + d[i + g.w + 1] * fx) * fy);
    }
  }
  return { w: g.w, h: g.h, data: out };
}
