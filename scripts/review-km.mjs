#!/usr/bin/env -S npx tsx
// The Khmer review sheet, for a native reader who will approve (or correct) our Khmer: every word the page shows, in the
// order src/i18n.ts keeps them, numbered, with the English, our Khmer draft and an empty column for the correction; then
// the texts that stay English until a Khmer translation is approved (About's privacy, licenses and credits, and the whole
// Privacy and terms page), so the reader sees what is waiting.
//
//   npm run review-km          (= tsx scripts/review-km.mjs; tsx, because it reads the page's own TypeScript sources)
//
// Writes staging/review-km.html: ONE self-contained, printable file (the Khmer font is embedded from node_modules/@fontsource,
// so it shows the same on any computer and prints; no Google Fonts, nothing fetched). ⛔ staging/ is not public/: the file is
// never in the site's build, and staging/ is ignored by git.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRIES } from "../src/i18n.ts";
import { CONTACT, CREDITS, LICENSES, PRIVACY, TERMS, TERMS_DRAFT, TERMS_TITLE } from "../src/ui/english-only.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "staging", "review-km.html");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** {n}, {tapped}, {head}: filled in by the page; shown marked, so the reader keeps them */
const marked = (s) => esc(s).replace(/\{(\w+)\}/g, '<span class="ph">{$1}</span>');

// the screen each entry belongs to: the section comments in src/i18n.ts ("// ── 1 · empty ───")
const source = readFileSync(join(ROOT, "src", "i18n.ts"), "utf8").split("\n");
const sectionOf = new Map();
let section = "";
for (const line of source) {
  const h = line.match(/^\s*\/\/ ── (.+?) ─+\s*$/);
  if (h) section = h[1];
  const k = line.match(/^ {2}(\w+): \[/);
  if (k && k[1] in ENTRIES) sectionOf.set(k[1], section);
}
const keys = Object.keys(ENTRIES);
const unplaced = keys.filter((k) => !sectionOf.has(k));
if (unplaced.length) throw new Error(`no section found in src/i18n.ts for: ${unplaced.join(", ")}`);

const font = (w) => readFileSync(join(ROOT, "node_modules/@fontsource/noto-sans-khmer/files", `noto-sans-khmer-khmer-${w}-normal.woff2`)).toString("base64");
const KHMER_RANGE = "U+1780-17FF, U+19E0-19FF, U+200C-200D, U+25CC";

// ── the table ─────────────────────────────────────────────────────────────────────────────────────────────────────────
let rows = "";
let last = null;
keys.forEach((key, i) => {
  const [en, km] = ENTRIES[key];
  if (sectionOf.get(key) !== last) {
    last = sectionOf.get(key);
    rows += `<tr class="sec"><td colspan="4">${esc(last)}</td></tr>\n`;
  }
  const enCell = en === "" ? '<span class="note">(shown in Khmer only)</span>' : marked(en);
  const kmCell = km === null
    ? '<span class="note" lang="en">No Khmer yet: shown in English until a translation is approved (listed again at the end).</span>'
    : `<span lang="km">${marked(km)}</span>`;
  rows += `<tr><td class="n">${i + 1}<span class="key">${esc(key)}</span></td><td>${enCell}</td><td>${kmCell}</td><td class="fix"></td></tr>\n`;
});

// ── what is waiting ───────────────────────────────────────────────────────────────────────────────────────────────────
const sm = (s) => esc(s);
const waiting = [
  ["About and credits · Your privacy", `<p>${sm(PRIVACY)}</p>`],
  ["About and credits · The two readers", `<p>${sm(LICENSES)}</p>`],
  ["About and credits · Credits", `<ul>${CREDITS.map(([k, v]) => `<li><b>${esc(k)}:</b> ${sm(v)}</li>`).join("")}</ul>`],
  [`${TERMS_TITLE} · the whole page`,
    `<p><i>${esc(TERMS_DRAFT)}</i></p>` + TERMS.map(([h, ps]) => `<h4>${esc(h)}</h4>${ps.map((p) => `<p>${sm(p)}</p>`).join("")}`).join("") +
    `<p>${esc(CONTACT)}</p>`],
  ...keys.filter((k) => ENTRIES[k][1] === null).map((k) =>
    [`${sectionOf.get(k)} · entry ${keys.indexOf(k) + 1} (${k})`, `<p>${sm(ENTRIES[k][0])}</p>`]),
];

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Khmer review · ocr.siliconwat.dev</title>
<style>
@font-face { font-family: "Review Khmer"; font-weight: 400; src: url(data:font/woff2;base64,${font(400)}) format("woff2"); unicode-range: ${KHMER_RANGE}; }
@font-face { font-family: "Review Khmer"; font-weight: 600; src: url(data:font/woff2;base64,${font(600)}) format("woff2"); unicode-range: ${KHMER_RANGE}; }
:root { color: #16141c; background: #fff; }
body { margin: 24px auto; max-width: 1180px; padding: 0 16px; font: 15px/1.5 "Review Khmer", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; }
:lang(km) { font-family: "Review Khmer", "Noto Sans Khmer", "Khmer Sangam MN", sans-serif; font-size: 18px; line-height: 1.85; }
h1 { font-size: 22px; margin: 0 0 4px; }
h2 { font-size: 18px; margin: 32px 0 6px; break-after: avoid; }
h3 { font-size: 15px; margin: 18px 0 4px; break-after: avoid; }
h4 { font-size: 14px; margin: 12px 0 2px; }
.lede { color: #5b5766; margin: 0 0 14px; }
.how { border-left: 3px solid #c2410c; background: #fbf3ee; padding: 10px 14px; margin: 12px 0 18px; }
.how p { margin: 0 0 6px; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
col.n { width: 104px; } col.en { width: 30%; } col.km { width: 33%; }
th, td { border: 1px solid #b9b5c4; padding: 6px 8px; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
th { background: #f4f1fb; font-size: 13px; font-weight: 600; }
th span[lang="km"] { display: block; font-size: 14px; font-weight: 400; line-height: 1.6; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
tr.sec td { background: #ebe7f5; font-weight: 600; font-size: 13px; padding: 5px 8px; }
td.n { font-weight: 600; text-align: right; }
.key { display: block; margin-top: 2px; font: 10px/1.3 ui-monospace, Menlo, monospace; font-weight: 400; color: #8b8796; overflow-wrap: anywhere; }
td.fix { background: repeating-linear-gradient(transparent 0 33px, #e4e1ec 33px 34px); height: 68px; }
.ph { background: #fde7d9; border-radius: 3px; padding: 0 2px; font-family: ui-monospace, Menlo, monospace; font-size: 0.85em; }
.note { color: #5b5766; font-size: 13px; font-style: italic; }
.wait { border: 1px solid #b9b5c4; border-radius: 8px; padding: 4px 14px 10px; margin: 10px 0; font-size: 13.5px; break-inside: avoid-page; }
.wait p { margin: 4px 0; } .wait ul { margin: 4px 0; padding-left: 18px; }
footer { margin-top: 28px; color: #8b8796; font-size: 12px; }
@page { size: landscape; margin: 12mm; }
@media print { body { margin: 0; max-width: none; padding: 0; font-size: 12.5px; } :lang(km) { font-size: 15px; } .how { break-inside: avoid; } }
</style>
</head>
<body>
<h1>Khmer review · ocr.siliconwat.dev</h1>
<p class="lede">The page that reads printed pages of the Buddhist Institute Tipiṭaka in a visitor's own browser. Sheet made ${date}.</p>
<div class="how">
  <p>This is every piece of text the page shows, in the order the page keeps it. The Khmer is our own draft. Where the Khmer is wrong, unclear or unnatural, please write the correction in the right-hand column; where it is right, leave that column empty.</p>
  <p>Words in braces, such as <span class="ph">{n}</span>, are filled in by the page (a number or a word). Please keep them as they are.</p>
  <p lang="km">នេះជាអត្ថបទទាំងអស់ដែលទំព័រនេះបង្ហាញ តាមលំដាប់ដែលទំព័ររក្សាទុក។ ភាសាខ្មែរនេះជាសេចក្តីព្រាងរបស់យើង។ កន្លែងណាដែលភាសាខ្មែរខុស មិនច្បាស់ ឬមិនធម្មជាតិ សូមសរសេរការកែតម្រូវនៅជួរខាងស្តាំ។ កន្លែងណាដែលត្រឹមត្រូវ សូមទុកជួរនោះឱ្យនៅទទេ។ ពាក្យក្នុងវង់ក្រចក ដូចជា {n} ទំព័របំពេញដោយខ្លួនឯង (លេខ ឬពាក្យ)។ សូមរក្សាវាទុកដដែល។</p>
  <p class="note">The Khmer of these instructions is our draft too.</p>
</div>
<table>
<colgroup><col class="n"><col class="en"><col class="km"><col class="fix"></colgroup>
<thead><tr><th>#</th><th>English</th><th>Our Khmer draft<span lang="km">សេចក្តីព្រាងខ្មែររបស់យើង</span></th><th>Correction<span lang="km">ការកែតម្រូវ</span></th></tr></thead>
<tbody>
${rows}</tbody>
</table>
<h2>Waiting for an approved Khmer translation</h2>
<p class="lede">Until a Khmer translation of these is approved, the page shows them in English, also in Khmer mode, and says so in Khmer. They are listed so you can see what is waiting; nothing here needs a correction now.</p>
<p class="lede" lang="km">រហូតដល់ការបកប្រែជាភាសាខ្មែរត្រូវបានអនុម័ត ទំព័របង្ហាញអត្ថបទទាំងនេះជាភាសាអង់គ្លេស។</p>
${waiting.map(([h, body]) => `<div class="wait" lang="en"><h3>${esc(h)}</h3>${body}</div>`).join("\n")}
<footer>Made by scripts/review-km.mjs from src/i18n.ts and src/ui/english-only.ts, the page's own words. Not part of the site.</footer>
</body>
</html>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(`wrote ${OUT}: ${keys.length} entries in ${new Set(sectionOf.values()).size} sections, ${waiting.length} waiting`);
