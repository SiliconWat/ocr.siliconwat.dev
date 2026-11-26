/** The texts that stay ENGLISH in Khmer mode until a native reader approves a translation: About's privacy, licenses and
 *  credits (state 7), and the whole Privacy and terms page (#terms, legal D9). Pure data (no Lit, no page), so the screens
 *  and scripts/review-km.mjs (the review sheet that shows the reader what is waiting) read the very same words.
 *  ⛔ Never shipped in unreviewed Khmer. */
import { TERMS_DATE_LINE } from "./legal-terms";

/** English only, verbatim from the drawings (S7). */
export const PRIVACY =
  "Your images and text are read on this device and never uploaded: the page is built so that it cannot send them. " +
  "Two things leave only when you press: a passage you choose to hear (to our voice service and Azure) and a passage " +
  "you ask about (to the assistant you chose). Visits are counted without cookies, and the count never sees an image or a word.";
export const LICENSES =
  "Most accurate: Apache-2.0. Both Public domain readers: CC0. The license matters only if you share a model file itself. " +
  "The page images used in training are not released; the transcriber's typed text is published as a dataset (CC0), crediting the Buddhist Institute.";
/** The released models and data (founder 2026-11-23: "Footer link + About section"; the footer's "Models and data" opens
 *  #models, this list). English only, beside the licenses they name. */
export const RELEASES: [string, string][] = [
  ["Most accurate (Apache-2.0)", "https://huggingface.co/siliconwat/khmer-pali-ocr"],
  ["Public domain (CC0)", "https://huggingface.co/siliconwat/khmer-pali-ocr-cc0"],
  ["The typed text, a dataset (CC0)", "https://huggingface.co/datasets/siliconwat/khmer-tipitaka-transcription"],
];
export const CREDITS: [string, string][] = [
  ["Transcription", "Se Mong Ly (លី ម៉ុង សែ)"],
  ["Text", "the Buddhist Institute edition of the Tipiṭaka (Phnom Penh, 1927–69)"],
  ["Scans", "Upāsikā Kang Huychan and family · Lok Kru Aggapaṇḍita But Savong · Srong Chanda · 5000-years.org, given as dhamma dāna"],
  ["Made by", "Silicon Wat ℠, with Miss Aquarius℠ (AI collaboration, disclosed)"],
];

/** Privacy and terms (#terms): legal D9's draft. ⭐ Its one source is legal/terms.md (A709 M2, 2026-11-25), which legal.333.eco
 *  publishes version by version; src/ui/legal-terms.ts is generated from it (scripts/gen-legal.mjs). Edit the markdown, never
 *  these names. */
export { CONTACT, TERMS, TERMS_DATE_LINE, TERMS_TITLE } from "./legal-terms";
/** The page's notice beside the document's own date line: the frame's words, not the document's. */
export const NOT_REVIEWED = "Not yet reviewed by a lawyer.";
export const TERMS_DRAFT = `${TERMS_DATE_LINE} ${NOT_REVIEWED}`;
