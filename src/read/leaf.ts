/** Is a page the Pāli leaf or its Khmer translation? Khmer-language text uses vowels and signs that Pāli written in Khmer
 *  script never does. Measured on the transcriber's typed pages (2026-11-19): at a rate of 1.5% of letters, whole pages
 *  disagree with their label 0.6% of the time (161 Pāli→Khmer, 162 Khmer→Pāli of 51,838), some of them labeling slips.
 *  The page says the leaf was found by the reader and offers the other. */
import type { Leaf } from "./types";
const KHMER_ONLY = new Set("់៉៊៍័៌ៗើឿៀែៃៅួ");
export function khmerRate(text: string): number {
  let letters = 0, kh = 0;
  for (const c of text) { if (c >= "ក" && c <= "៿") { letters++; if (KHMER_ONLY.has(c)) kh++; } }
  return letters ? kh / letters : 0;
}
export const detectLeaf = (text: string): Leaf => (khmerRate(text) >= 0.015 ? "khmer" : "pali");
