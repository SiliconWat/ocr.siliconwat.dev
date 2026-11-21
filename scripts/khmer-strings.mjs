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

// Where each group's words appear: the drawing of that screen on demo.siliconwat.dev (canvas.json lists every board), matched by
// the screen number the group name and the board title share ("1b · …"). No board → no link (1c, the toasts, the terms page).
const CANVAS = join(ROOT, "..", "demo.siliconwat.dev", "canvas.json");
let boards = [];
try { boards = JSON.parse(readFileSync(CANVAS, "utf8")).artboards; } catch { console.warn("no demo.siliconwat.dev/canvas.json beside this repo: the sheet will have no drawing links"); }
const SAME_AS = { "header, footer, band": "1", "Waiting · About and credits (shown in English until translated)": "7" };
for (const g of groups) {
  const screen = SAME_AS[g.name] ?? g.name.match(/^(\w+) · /)?.[1];
  if (!screen) continue;
  const pick = (lang) => boards.find((b) => b.title.startsWith(`${screen} · `) && b.title.endsWith(`, ${lang}, phone`) && !/dark pass/.test(b.title));
  const context = [["km", pick("Khmer")], ["en", pick("English")]].filter(([, b]) => b).map(([lang, b]) => ({ url: "/" + b.file, lang, kind: "drawing" }));
  if (context.length) g.context = context;
}

let commit = null;
try { commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch {}
const d = new Date();
const sheet = {
  version: 1,
  surface: "ocr.siliconwat.dev",
  title: "ocr.siliconwat.dev",
  about: "The free page that reads printed pages of the Buddhist Institute Tipiṭaka (Pāli and Khmer) in a visitor's own browser.",
  accent: "#c2410c",
  made: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  commit,
  groups,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(sheet, null, 1) + "\n");
const n = groups.reduce((a, g) => a + g.entries.length, 0);
console.log(`wrote ${OUT}: ${n} entries (${keys.length} from src/i18n.ts, ${n - keys.length} waiting) in ${groups.length} groups, ${groups.filter((g) => g.context).length} with a drawing`);
