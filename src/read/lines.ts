/** Find the printed lines on a page — a line-for-line port of `tools/lines.py` `text_lines` (A64; measured on 40 pages
 *  against the transcriber's own line counts, then in pilot 3). Keep it identical: `scripts/parity.ts` checks every band
 *  against the Python's on the test pages. Returns [top, bottom) rows, in the pixels of the image it was given. */
import type { Gray } from "./gray";

export interface LineOpts { gap?: number; frag?: number; splitTall?: boolean }

/** Ink per row: dark pixels (< 128) in every second column, exactly as the Python counts. */
export function inkProfile(g: Gray): Int32Array {
  const ink = new Int32Array(g.h);
  for (let y = 0; y < g.h; y++) {
    const row = y * g.w; let n = 0;
    for (let x = 0; x < g.w; x += 2) if (g.data[row + x] < 128) n++;
    ink[y] = n;
  }
  return ink;
}

export function textLines(g: Gray, { gap = 6, frag = 0.15, splitTall = false }: LineOpts = {}): [number, number][] {
  const { w, h } = g, ink = inkProfile(g);
  const runs: [number, number][] = [];
  let inrun = false, st = 0;
  for (let y = 0; y <= h; y++) {
    const v = y < h ? ink[y] : 0;
    if (v > 2 && !inrun) { inrun = true; st = y; }
    else if (v <= 2 && inrun) { inrun = false; runs.push([st, y]); }
  }
  const merged: [number, number][] = [];
  for (const r of runs) {
    if (merged.length && r[0] - merged[merged.length - 1][1] < gap) merged[merged.length - 1][1] = r[1];
    else merged.push([r[0], r[1]]);
  }
  type L = [number, number, number];   // top, bottom, ink — mutable, shared between `lines` and `out` as in the Python
  const lines: L[] = [];
  for (const [a, b] of merged) {
    let mx = 0, sum = 0;
    for (let y = a; y < b; y++) { if (ink[y] > mx) mx = ink[y]; sum += ink[y]; }
    const rule = b - a <= 10 && mx > 0.25 * (w / 2);   // the footnote rule: one long thin stroke
    if (!rule) lines.push([a, b, sum]);
  }
  if (!lines.length) return [];
  const med = lines.map((l) => l[2]).sort((x, y) => x - y)[Math.floor(lines.length / 2)];
  const keep = (i: number, l: L) => i === 0 || l[2] >= frag * med;   // the top run is the page number
  const out = lines.filter((l, i) => keep(i, l));
  lines.forEach((l, i) => {
    if (keep(i, l) || !out.length) return;
    const [a, b] = l;
    let near = out[0], best = Infinity;
    for (const o of out) {
      const d = Math.min(Math.abs(a - o[1]), Math.abs(o[0] - b));
      if (d < best) { best = d; near = o; }   // strict <: Python's min keeps the first on a tie
    }
    near[0] = Math.min(near[0], a); near[1] = Math.max(near[1], b);
  });
  out.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
  const res: [number, number][] = out.map((l) => [l[0], l[1]]);
  if (splitTall) {   // stacked vowels and tall forms make two lines touch (the Khmer leaf; Pāli too since pilot 5's PIPE-S); split a band > 1.6 × the median height
    const hs = res.map(([a, b]) => b - a).sort((x, y) => x - y);
    const medH = hs.length ? hs[Math.floor(hs.length / 2)] : 0;
    let again = true;
    while (again && medH) {
      again = false;
      for (let i = 0; i < res.length; i++) {
        const [a, b] = res[i];
        if (b - a > 1.6 * medH) {
          const lo = a + Math.trunc(0.3 * (b - a)), hi = b - Math.trunc(0.3 * (b - a));
          let cut = lo;
          for (let y = lo; y < hi; y++) if (ink[y] < ink[cut]) cut = y;
          if (cut === a) break;   // (the Python would loop forever here; never seen, but never hang a phone)
          res.splice(i, 1, [a, cut], [cut, b]); again = true; break;
        }
      }
    }
  }
  return res;
}
