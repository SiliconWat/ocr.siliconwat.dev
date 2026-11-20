/** Getting a page ready to read — the part of reader.ts with no browser in it, so the test harness (scripts/parity.ts) runs
 *  EXACTLY the code a visitor's browser runs. From one grayscale image: straighten it if it is 1° or more off level
 *  (deskew.ts), then make the line-finding copy — half size for a 300-dpi PDF render (as pilot 3: lines found at 150 dpi),
 *  or brought to the app images' 1,340 px for an image of any other size. Lines are cropped from the full image. */
import { resize, type Gray } from "./gray";
import { skewAngle, rotate, MIN_DEG } from "./deskew";

/** The app images the line finder was measured on are 1,332–1,380 px tall. */
export const LINE_LONG_SIDE = 1340;

/** The line finder's rules are in pixels (a 6-px gap joins a vowel sign to its line), tuned at 150 dpi — the app images, 1,300 to
 *  1,380 px tall. ⚠️ Rescaling an image that is already that size breaks them: a 1,300-px page enlarged 3% to 1,340 px found 31
 *  lines instead of 19 (2026-11-20, part 3 of the acceptance test). So an image whose long side is within 8% of 1,340 px after
 *  reduction by a WHOLE number (1 = as it is, 2 = a 300-dpi scan, 3 = a 12-megapixel photo…) is reduced by exactly that; only
 *  an image no whole number fits is scaled to 1,340 px (unmeasured: phone photos). A PDF page is rendered at 300 dpi and halved. */
export function lineScale(longSide: number): number {
  const n = Math.max(1, Math.round(longSide / LINE_LONG_SIDE));
  return Math.abs(longSide / n - LINE_LONG_SIDE) / LINE_LONG_SIDE <= 0.08 ? 1 / n : LINE_LONG_SIDE / longSide;
}
export const lineOf = (g: Gray, exactHalf: boolean): Gray => {
  const s = exactHalf ? 0.5 : lineScale(Math.max(g.w, g.h));
  return s === 1 ? g : resize(g, Math.round(g.w * s), Math.round(g.h * s));
};

export interface Prepared { crop: Gray; line: Gray; tilt: number; turned: boolean }
/** `line150`: a PDF page's own 150-dpi render, used as the line-finding copy (as pilot 3 found lines on the app images, which
 *  ARE 150-dpi renders). ⚠️ Halving the 300-dpi render is not the same picture: the finder split lines on 11 of 80 test pages
 *  that a 150-dpi render kept whole (2026-11-20) — the way ink is smoothed decides whether a vowel sign touches its line. */
export function preparePage(g: Gray, exactHalf: boolean, line150?: Gray): Prepared {
  let crop = g, line = line150 ?? lineOf(g, exactHalf);
  const tilt = skewAngle(line);
  const turned = Math.abs(tilt) >= MIN_DEG;
  if (turned) { crop = rotate(g, tilt); line = line150 ? rotate(line150, tilt) : lineOf(crop, exactHalf); }
  return { crop, line, tilt, turned };
}
