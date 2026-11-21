#!/usr/bin/env node
// Bring the native readers' approved Khmer into src/i18n.ts: the file `/khmer-review pull --out` wrote, applied entry by
// entry. Only the Khmer half of each `key: ["English", "Khmer"],` line changes; the English, the order and the comments stay.
//
//   node scripts/khmer-apply.mjs <pulled.json> [--file src/i18n.ts] [--dry]
//
// The `x.*` keys (About, credits, privacy and terms) are reported, not applied: the site shows those in English until it
// is given a Khmer version of them. ⛔ Review the diff, run `npm test`, then commit and deploy like any change.
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const pulled = JSON.parse(readFileSync(args[0], "utf8"));
const file = args.includes("--file") ? args[args.indexOf("--file") + 1] : "src/i18n.ts";
const lines = readFileSync(file, "utf8").split("\n");
let changed = 0, same = 0;
const unplaced = [], waiting = [];
for (const [key, km] of Object.entries(pulled.khmer ?? {})) {
  if (key.startsWith("x.")) { waiting.push(key); continue; }
  const i = lines.findIndex((l) => l.startsWith(`  ${key}: [`));
  const m = i < 0 ? null : lines[i].match(/^( {2}\w+: )(\[.*\])(,?)(\s*\/\/.*)?$/);
  let pair = null;
  try { pair = m ? JSON.parse(m[2]) : null; } catch {}
  if (!pair || pair.length !== 2 || typeof pair[0] !== "string") { unplaced.push(key); continue; }
  if (pair[1] === km) { same++; continue; }
  lines[i] = `${m[1]}[${JSON.stringify(pair[0])}, ${JSON.stringify(km)}]${m[3]}${m[4] ?? ""}`;
  changed++;
}
if (!args.includes("--dry")) writeFileSync(file, lines.join("\n"));
console.log(`${file}: ${changed} changed · ${same} already so${args.includes("--dry") ? " · (dry run: nothing written)" : ""}`);
if (waiting.length) console.log(`  ${waiting.length} About/terms texts translated but not applied (the site shows those in English): ${waiting.join(", ")}`);
if (unplaced.length) { console.log(`  ⚠️ not found as a one-line entry in the file, edit by hand: ${unplaced.join(", ")}`); process.exitCode = 1; }
