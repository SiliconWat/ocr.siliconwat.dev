/** Phone photos and phone screenshots (2026-11-20, A64; the transcriber: *"the best use case is for monks and scholars to take a
 *  photo of a real textbook page or a screenshot of a pdf page with their phone"*). Pure — no browser in it, so the harness
 *  (scripts/photo-check.ts) runs exactly this. Three steps, used only when the picture is NOT a clean scan (`analyze`):
 *   1. find the page — the largest bright region of a heavily blurred copy (a page on a table, a dark-mode viewer), or, when
 *      that finds no edge (a light-mode viewer: gray around white), the largest near-pure-white region;
 *   2. flatten it from its four corners (a homography);
 *   3. even out the light — divide by the paper's own brightness, estimated around the text — and stretch the contrast, so
 *      the line finder's fixed darkness cutoff (128) works on shadows and faded print.
 *  A clean scan or PDF render (the measured path) is left untouched: white, even paper filling the picture. */
import { resize, type Gray } from "./gray";
import type { Quad } from "./types";

function boxBlur(g: Gray, r: number): Gray {
  const { w, h } = g, tmp = new Float32Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {           // horizontal
    let s = 0; const row = y * w;
    for (let x = -r; x <= r; x++) s += g.data[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = s / (2 * r + 1);
      s += g.data[row + Math.min(w - 1, x + r + 1)] - g.data[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {           // vertical
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = Math.round(s / (2 * r + 1));
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return { w, h, data: out };
}

function otsu(g: Gray): number {
  const hist = new Array(256).fill(0); for (const v of g.data) hist[v]++;
  const n = g.data.length; let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, t = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i]; if (!wB) continue; const wF = n - wB; if (!wF) break;
    sB += i * hist[i]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) ** 2;
    if (v > best) { best = v; t = i; }
  }
  return t;
}

/** The largest 4-connected region of `mask`, as its pixel indices. */
function largest(mask: Uint8Array, w: number, h: number): Int32Array {
  const seen = new Uint8Array(w * h), stack = new Int32Array(w * h); let best: Int32Array = new Int32Array(0);
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || seen[i]) continue;
    let top = 0, n = 0; stack[top++] = i; seen[i] = 1; const comp: number[] = [];
    while (top) {
      const p = stack[--top]; comp.push(p); n++;
      const x = p % w, y = (p - x) / w;
      if (x > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[top++] = p - 1; }
      if (x < w - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[top++] = p + 1; }
      if (y > 0 && mask[p - w] && !seen[p - w]) { seen[p - w] = 1; stack[top++] = p - w; }
      if (y < h - 1 && mask[p + w] && !seen[p + w]) { seen[p + w] = 1; stack[top++] = p + w; }
    }
    if (n > best.length) best = Int32Array.from(comp);
  }
  return best;
}

/** Four extreme corners of a region: top-left = smallest x+y, bottom-right = largest x+y, top-right = largest x−y,
 *  bottom-left = smallest x−y. */
function cornersOf(idx: Int32Array, w: number): Quad {
  let tl = 0, br = 0, tr = 0, bl = 0, a = Infinity, b = -Infinity, c = -Infinity, d = Infinity;
  for (const p of idx) {
    const x = p % w, y = (p - x) / w, s = x + y, t = x - y;
    if (s < a) { a = s; tl = p; } if (s > b) { b = s; br = p; } if (t > c) { c = t; tr = p; } if (t < d) { d = t; bl = p; }
  }
  const xy = (p: number): [number, number] => [p % w, (p - (p % w)) / w];
  return [xy(tl), xy(tr), xy(br), xy(bl)];
}

const area = (q: Quad) => Math.abs(q.reduce((s, [x, y], i) => { const [x2, y2] = q[(i + 1) % 4]; return s + x * y2 - x2 * y; }, 0)) / 2;

export interface Analysis { photo: boolean; corners: Quad; cover: number; paper: number; spread: number; method: "blur" | "white" | "whole" }

/** Is this a phone photo or screenshot, and where is the page? Corners in `g`'s pixels. */
export function analyze(g: Gray): Analysis {
  const s = 600 / Math.max(g.w, g.h), small = resize(g, Math.max(1, Math.round(g.w * s)), Math.max(1, Math.round(g.h * s)));
  const W = small.w, H = small.h, full: Quad = [[0, 0], [g.w - 1, 0], [g.w - 1, g.h - 1], [0, g.h - 1]];
  const blur = boxBlur(boxBlur(small, 6), 6), t = otsu(blur);
  const bright = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) bright[i] = blur.data[i] >= t ? 1 : 0;
  let comp = largest(bright, W, H), method: Analysis["method"] = "blur";
  let q = cornersOf(comp, W), cover = area(q) / (W * H);
  if (cover > 0.9 || comp.length < 0.1 * W * H) {
    // no edge from brightness alone (a light-mode viewer: gray around a white page) → the near-pure-white region, text closed over
    const white = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) white[i] = small.data[i] >= 248 ? 1 : 0;
    const closed = boxBlur({ w: W, h: H, data: white.map((v) => v * 255) }, 4);
    for (let i = 0; i < W * H; i++) white[i] = closed.data[i] >= 128 ? 1 : 0;
    const c2 = largest(white, W, H), q2 = cornersOf(c2, W), cover2 = area(q2) / (W * H);
    if (cover2 > 0.2 && cover2 < 0.9) { comp = c2; q = q2; cover = cover2; method = "white"; }
    else method = "whole";
  }
  // the paper's own light: the bright class of the blurred copy inside the page
  const vals: number[] = []; for (const p of comp) if (bright[p]) vals.push(blur.data[p]);
  vals.sort((a, b) => a - b);
  const pct = (f: number) => (vals.length ? vals[Math.min(vals.length - 1, Math.floor(f * vals.length))] : 255);
  const paper = pct(0.5), spread = pct(0.9) - pct(0.1);
  const photo = (method !== "whole" && cover < 0.9) || paper < 230 || spread > 25;
  const corners = method === "whole" ? full : (q.map(([x, y]) => [Math.round(x / s), Math.round(y / s)]) as Quad);
  return { photo, corners, cover, paper, spread, method };
}

/** The 3×3 homography taking the rectangle (0,0)–(W,H) to the quad, solved by Gaussian elimination. */
function homography(q: Quad, W: number, H: number): number[] {
  const src = [[0, 0], [W, 0], [W, H], [0, H]], A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = q[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]); A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]; }
  }
  return [...A.map((r, i) => r[8] / r[i]), 1];
}

/** The page cut out at `q` and flattened to a rectangle of its own size. */
export function warp(g: Gray, q: Quad): Gray {
  const d = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const W = Math.max(8, Math.round((d(q[0], q[1]) + d(q[3], q[2])) / 2)), H = Math.max(8, Math.round((d(q[0], q[3]) + d(q[1], q[2])) / 2));
  const m = homography(q, W, H), out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const z = m[6] * x + m[7] * y + 1, sx = (m[0] * x + m[1] * y + m[2]) / z, sy = (m[3] * x + m[4] * y + m[5]) / z;
    const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
    if (x0 < 0 || y0 < 0 || x0 + 1 >= g.w || y0 + 1 >= g.h) { out[y * W + x] = 255; continue; }
    const i = y0 * g.w + x0, v = g.data;
    out[y * W + x] = Math.round((v[i] * (1 - fx) + v[i + 1] * fx) * (1 - fy) + (v[i + g.w] * (1 - fx) + v[i + g.w + 1] * fx) * fy);
  }
  return { w: W, h: H, data: out };
}

/** Even out the light: divide by the paper's brightness (the brightest nearby pixels, wider than a letter), then stretch
 *  so the darkest print is black and the paper white. */
export function flatten(g: Gray): Gray {
  const k = 8, small = resize(g, Math.max(1, Math.round(g.w / k)), Math.max(1, Math.round(g.h / k)));
  const r = 5, mx = new Uint8Array(small.data.length);       // max filter, radius r (≈ 40 px at full size)
  for (let y = 0; y < small.h; y++) for (let x = 0; x < small.w; x++) {
    let m = 0;
    for (let yy = Math.max(0, y - r); yy <= Math.min(small.h - 1, y + r); yy++)
      for (let xx = Math.max(0, x - r); xx <= Math.min(small.w - 1, x + r); xx++) m = Math.max(m, small.data[yy * small.w + xx]);
    mx[y * small.w + x] = m;
  }
  const bg = resize(boxBlur({ w: small.w, h: small.h, data: mx }, 3), g.w, g.h);
  const out = new Uint8Array(g.data.length);
  for (let i = 0; i < out.length; i++) out[i] = Math.min(255, Math.round((g.data[i] * 255) / Math.max(1, bg.data[i])));
  // stretch, in two parts (the dev set, 2026-11-20: each part alone was better on some kinds and worse on others):
  //  (a) always, mildly: the darkest 1% of pixels to black (the first version; best on ordinary photos);
  //  (b) only for a FAINT print — the ink found as its OWN class (Otsu) has a mean above 90 — the ink to black. ⚠️ (a) alone took
  //      paper for ink on a sparse faded page (ink under 1% of the pixels): nothing was stretched and NO lines were found.
  const sorted = Uint8Array.from(out).sort(), lo = sorted[Math.floor(0.01 * sorted.length)];
  if (lo > 0 && lo < 200) for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.round(((out[i] - lo) * 255) / (255 - lo)));
  const norm: Gray = { w: g.w, h: g.h, data: out }, t = otsu(norm);
  let inkSum = 0, inkN = 0; for (const v of out) if (v < t) { inkSum += v; inkN++; }
  const ink = inkN ? inkSum / inkN : 0;
  if (inkN && ink > 90 && 255 - ink > 40) {
    for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(((out[i] - ink) * 255) / (255 - ink))));
  }
  return norm;
}
