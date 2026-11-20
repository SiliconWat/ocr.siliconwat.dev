# ocr.siliconwat.dev

A free page that reads printed pages of the **Buddhist Institute edition of the Tipiṭaka** (Phnom Penh, 1927–69), both
leaves of each opening: the Pāli and its Khmer translation, both printed in Khmer script. It reads a photo, a scan or a PDF
**in the visitor's own browser**. The image is never uploaded.

After reading: Samdech Chuon Nath's dictionary in one tap, a passage read aloud by Khmer voices, and a passage copied for
asking an AI assistant.

## How the privacy holds

It's held by the page, not by a promise. The Content-Security-Policy in `index.html` lets the page contact only:
- **this site**, which serves everything the reader needs (tesseract.js and its WebAssembly core, pdf.js, the models, the
  dictionary);
- **the estate's visit counter,** which never sees an image or a word;
- **`tts.siliconwat.dev`,** which receives only the words the visitor selects and only when they press Listen.

Ask copies the passage; nothing is sent. Error reports carry no Khmer script at all (`src/report.ts`; proved in
`test/report.test.ts`).

## Layout

| Path | What it is |
|---|---|
| `src/read/` | The reader. `lines.ts` finds printed lines, `crop.ts` cuts each one out, `page.ts` prepares a page (straightened if tilted, `deskew.ts`), `reader.ts` runs tesseract.js and pdf.js, `leaf.ts` tells Pāli from Khmer, `roman.ts` gives roman letters, `models.ts` names the model files. |
| `src/dict/` | One-tap lookup in Chuon Nath's dictionary. The data is in `public/dict/`, one file per first letter, built by `scripts/build-dict.mjs` from khmer.siliconwat.dev's published copy. |
| `src/ui/` | The screens (Lit, light DOM, Tailwind fed by the drawing's tokens in `src/styles.css`). Words, English and Khmer, are in `src/i18n.ts`. |
| `src/listen.ts` · `src/ask.ts` · `src/report.ts` | Listen · Ask · error reports. |
| `public/models/` | The reader models: not in git before launch; copied in by `scripts/models.mjs`. |
| `public/vendor/` | tesseract.js and pdf.js, copied from `node_modules` by `scripts/vendor.mjs` on every dev and build. |

## Build and check

```sh
npm install
node scripts/models.mjs     # before launch only: the models, from the training repo
npm run dev                 # local; add ?demo to the URL for a stand-in reader (every screen, no models needed)
npm run build               # REFUSES while a model is interim or missing (scripts/check-models.mjs)
npm run build:dev           # the same build without that refusal, for local checks
npm test                    # the dictionary and the error report
```

The checks that hold the reader to what was measured:

- **`scripts/parity.ts <dir>`** runs this repo's line finder and cropper on the exact pixels the measured Python pipeline used.
  Every line and box must be identical; they were on all 80 test pages. With `--read`, the browser's engine reads them;
  with `--single r300|app`, the page arrives as one image, as a visitor gives it.
- **`scripts/e2e.mjs --out <file> <pages>…`** runs real Chrome against the built site, under its real CSP. Add
  `--range a-b` for a PDF and `--listen` to test Listen.
- **`scripts/confidence.ts`** gives each line's confidence, used to calibrate *"this may not be the print it knows"*.
- **`scripts/deskew-check.ts`** shows the tilt found and the reading with and without straightening.

Each check was first seen to fail on a deliberately broken case. A check that has only ever passed is untested.

## What is not verified

- **The Khmer copy is our own draft** until a native reader approves it, and the page says so. The credits, license and
  privacy text stay in English until then.
- **Phone photos have not been measured.** Synthetic tilts were; perspective, curl and shadow were not.
- **The "not this print" threshold is provisional** until it is calibrated on the final models.

## Credits

Transcription: Se Mong Ly (សេ ម៉ុងលី). Text: the Buddhist Institute edition of the Tipiṭaka. Scans: Upāsikā Kang Huychan and
family · Lok Kru Aggapaṇḍita But Savong · Srong Chanda · 5000-years.org, given as dhamma dāna. Dictionary: Samdech Chuon
Nath. Made by Silicon Wat℠, with Miss Aquarius℠ (AI collaboration, disclosed).

Where this file and the project's own records disagree, the records are canonical. The design follows a private spec.
