#!/usr/bin/env -S npx tsx
// This site's words for the native readers' Khmer review (/khmer-review): every entry of src/i18n.ts, in its order and
// under its section, plus the texts that stay English until a Khmer translation is approved (src/ui/english-only.ts),
// written as the shared strings contract (version 1). The skill turns it into the review page on demo.siliconwat.dev.
//
//   npm run khmer-strings          → staging/khmer-strings.json   (staging/ is ignored by git; never in the site's build)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRIES } from "../src/i18n.ts";
import { CONTACT, CREDITS, LICENSES, PRIVACY, TERMS, TERMS_DRAFT, TERMS_TITLE } from "../src/ui/english-only.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "staging", "khmer-strings.json");
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

// the screen each entry belongs to: the section comments in src/i18n.ts ("// ── 1 · empty ───")
const sectionOf = new Map();
let section = "";
for (const line of readFileSync(join(ROOT, "src", "i18n.ts"), "utf8").split("\n")) {
  const h = line.match(/^\s*\/\/ ── (.+?) ─+\s*$/);
  if (h) section = h[1];
  const k = line.match(/^ {2}(\w+): \[/);
  if (k && k[1] in ENTRIES) sectionOf.set(k[1], section);
}
const keys = Object.keys(ENTRIES);
const unplaced = keys.filter((k) => !sectionOf.has(k));
if (unplaced.length) throw new Error(`no section found in src/i18n.ts for: ${unplaced.join(", ")}`);

const groups = [];
for (const key of keys) {
  const name = sectionOf.get(key);
  if (groups.at(-1)?.name !== name) groups.push({ name, entries: [] });
  const [en, km] = ENTRIES[key];
  groups.at(-1).entries.push({ key, en, km });
}
const W = (name, entries) => groups.push({ name, waiting: true, entries: entries.map(([key, en]) => ({ key, en, km: null })) });
W("Waiting · About and credits (shown in English until translated)", [
  ["x.privacy", PRIVACY],
  ["x.licenses", LICENSES],
  ...CREDITS.flatMap(([k, v]) => [[`x.credits.${slug(k)}.label`, k], [`x.credits.${slug(k)}`, v]]),
]);
W("Waiting · Privacy and terms (shown in English until translated)", [
  ["x.terms.title", TERMS_TITLE],
  ["x.terms.draft", TERMS_DRAFT],
  ...TERMS.flatMap(([h, ps]) => [[`x.terms.${slug(h)}`, h], ...ps.map((p, j) => [`x.terms.${slug(h)}.p${j + 1}`, p])]),
  ["x.contact", CONTACT],
]);

// The group names in Khmer, for the review page's Khmer side (our draft, like the page's own words): by the section's English name.
const GROUP_KM = {
  "header, footer, band": "ក្បាលទំព័រ បាតទំព័រ និងបន្ទះព័ត៌មាន",
  "1 · empty": "1 · ទំព័រដើម មុនពេលជ្រើសរើសទំព័រ",
  "1b · PDF page chooser": "1b · ការជ្រើសរើសទំព័រ PDF",
  "1c · adjust the page (a photo or a screenshot)": "1c · កែតម្រូវទំព័រ (រូបថត ឬរូបថតអេក្រង់)",
  "2 · first use": "2 · ការប្រើលើកដំបូង",
  "3 · reading": "3 · កំពុងអាន",
  "4 · result": "4 · លទ្ធផល",
  "5 · nothing found": "5 · រកមិនឃើញបន្ទាត់",
  "6 · not this print": "6 · មិនមែនជាការបោះពុម្ពនេះ",
  "7 · about and credits": "7 · អំពី និងការទទួលស្គាល់",
  "8 · a word's entry": "8 · ពាក្យមួយក្នុងវចនានុក្រម",
  "9 · a passage selected": "9 · អត្ថបទដែលបានជ្រើសរើស",
  "10 · ask": "10 · សួរ",
  "toasts and problems: NOT DRAWN": "សារខ្លីៗ និងបញ្ហា",
  "Waiting · About and credits (shown in English until translated)": "កំពុងរង់ចាំ · អំពី និងការទទួលស្គាល់ (បង្ហាញជាភាសាអង់គ្លេស រហូតដល់មានការបកប្រែ)",
  "Waiting · Privacy and terms (shown in English until translated)": "កំពុងរង់ចាំ · ឯកជនភាព និងលក្ខខណ្ឌ (បង្ហាញជាភាសាអង់គ្លេស រហូតដល់មានការបកប្រែ)",
};
for (const g of groups) if (GROUP_KM[g.name]) g.name_km = GROUP_KM[g.name];
const missingKm = groups.filter((g) => !g.name_km).map((g) => g.name);
if (missingKm.length) console.warn(`khmer-strings: no Khmer name for group(s): ${missingKm.join(" | ")} — add them to GROUP_KM`);

// Where each entry appears is shown by its SCREENSHOT (npm run khmer-capture; founder 2026-11-21: "no drawings, just screenshots").

let commit = null;
try { commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch {}
const d = new Date();
const sheet = {
  version: 1,
  surface: "ocr.siliconwat.dev",
  title: "ocr.siliconwat.dev",
  about: "The free page that reads printed pages of the Buddhist Institute Tipiṭaka (Pāli and Khmer) in a visitor's own browser.",
  about_km: "ទំព័រឥតគិតថ្លៃ ដែលអានទំព័របោះពុម្ពនៃព្រះត្រៃបិដក វិទ្យាស្ថានពុទ្ធសាសនបណ្ឌិត្យ (បាលី និងខ្មែរ) នៅក្នុងកម្មវិធីរុករករបស់អ្នកផ្ទាល់។",
  accent: "#c2410c",
  made: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  commit,
  groups,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(sheet, null, 1) + "\n");
const n = groups.reduce((a, g) => a + g.entries.length, 0);
console.log(`wrote ${OUT}: ${n} entries (${keys.length} from src/i18n.ts, ${n - keys.length} waiting) in ${groups.length} groups`);
