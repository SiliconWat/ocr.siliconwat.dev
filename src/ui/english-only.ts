/** The texts that stay ENGLISH in Khmer mode until a native reader approves a translation: About's privacy, licenses and
 *  credits (state 7), and the whole Privacy and terms page (#terms, legal D9). Pure data (no Lit, no page), so the screens
 *  and scripts/review-km.mjs (the review sheet that shows the reader what is waiting) read the very same words.
 *  ⛔ Never shipped in unreviewed Khmer. */

/** English only, verbatim from the drawings (S7). */
export const PRIVACY =
  "Your images and text are read on this device and never uploaded: the page is built so that it cannot send them. " +
  "Two things leave only when you press: a passage you choose to hear (to our voice service and Azure) and a passage " +
  "you ask about (to the assistant you chose). Visits are counted without cookies, and the count never sees an image or a word.";
export const LICENSES =
  "Most accurate: Apache-2.0. Public domain: CC0. The license matters only if you share a model file itself. " +
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

/** Privacy and terms (#terms): legal D9's draft. */
export const TERMS_DRAFT = "Draft of 20 November 2026. Not yet reviewed by a lawyer.";

export const TERMS: [string, string[]][] = [
  ["Who runs this page", [
    "ocr.siliconwat.dev is run by Thon Ly, personally, until Silicon Wat ℠ has a legal entity of its own. It is free, it has no accounts, and nothing is sold here.",
  ]],
  ["Privacy: what never leaves your device", [
    "The pages you give it, as images or PDFs, are read in your own browser and are never uploaded. The page is built so that it cannot send them: its Content-Security-Policy lets it contact only this site, the visit counter below, and the voice service, and only when you ask.",
    "The text it reads stays on your device unless you choose otherwise: Copy and Download keep it on your device; Ask copies a passage for you to paste wherever you like, under that service's own terms.",
  ]],
  ["Privacy: what does leave, and when", [
    "Listen: only the words you selected, and only when you press Listen, go to our voice service (tts.siliconwat.dev), which has Microsoft Azure's Khmer voices read them aloud. The service keeps the audio of each passage, filed under a fingerprint of the passage and never with who asked, so a repeated passage need not be read again; it counts requests per network address for about a minute to prevent abuse, and keeps no record of the passages themselves.",
    "Visits: each page view is counted without cookies, by Cloudflare Web Analytics and by Silicon Wat's own counter (thonly.org), which records the page, the referring page, your time zone, your browser's description of itself, and a random identifier kept in your browser's storage. The count never sees an image or a word you read.",
    "Errors: when reading fails, a short report of the error (where it happened, its name and message, with every Khmer-script character removed, and the version of this page) goes to the same counter, so it can be fixed. It never carries an image or any of the text.",
    "Stored in your browser, nowhere else: your language, theme and reader choice, the random visit identifier, and the reader models once downloaded, so they need not be downloaded again. Clearing this site's data in your browser removes them all.",
  ]],
  ["What the reader gives you", [
    "A machine reading of a printed page. It makes mistakes, and it was trained on one edition's typeface. Check what it reads against the print before you rely on it.",
    "The text you read is yours to use. The text of the Tipiṭaka belongs to everyone; please credit the Buddhist Institute's edition when you share a transcription of it.",
    "The reader models are released separately: Most accurate under Apache-2.0, Public domain under CC0. The typed text they learned from is published as a dataset (CC0), crediting the Buddhist Institute; the page images used in training are not released.",
  ]],
  ["Fair use", [
    "Do not attack the page or the voice service, try to get around its limits, or use it to harass anyone.",
  ]],
  ["Availability", [
    "We aim to keep this page running, and we do not promise it will be uninterrupted or last forever. The models can be downloaded and run on your own machine.",
  ]],
  ["Still to be settled", [
    "Warranties, limits on liability, which law applies, and how disputes are handled will be set out in the final version.",
  ]],
  ["Changes", [
    "We will post changes here with a new date.",
  ]],
];

export const TERMS_TITLE = "Privacy and terms";
export const CONTACT = "Contact: support@siliconwat.dev";
