#!/usr/bin/env node
// Samdech Chuon Nath's Khmer dictionary, split for one-tap lookup (F1; A64). Source: the estate's own published copy,
// khmer.siliconwat.dev's Dictionary.json (17,328 entries; every word of a definition links to its own entry).
// Writes public/dict/<first letter's code point, hex>.json = { headword: [[id, parts], …] } and public/dict/ids.txt, where
// the character at position <id> is that entry's first letter (so a linked word's file is known without a search).
// parts = a definition as [ "plain text" | [linkedId, "text"] , … ]; <br> becomes "\n". Every other tag is DROPPED and the
// build fails if one appears, so no markup from the source ever reaches the page. Usage: node scripts/build-dict.mjs [Dictionary.json]
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
const src = process.argv[2] ?? new URL("../../khmer.siliconwat.dev/Dictionary.json", import.meta.url).pathname;
const entries = JSON.parse(readFileSync(src, "utf8"));
const out = "public/dict"; rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const files = new Map(); const first = [];
// a literal "<" is text in this dictionary ("< កំ" = derived from), so only a real tag counts as markup
const TOKEN = /<span data-word='(\d+)'>([^<]*)<\/span>|<br\s*\/?>|<\/?[a-zA-Z][^>]*>|<|[^<]+/g;
for (const e of entries) {
  const parts = []; let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(e.definition))) {
    if (m[1]) parts.push([+m[1], m[2]]);
    else if (/^<br/i.test(m[0])) parts.push("\n");
    else if (m[0].length > 1 && m[0].startsWith("<")) throw new Error(`unexpected markup in entry ${e.id}: ${m[0]}`);
    else parts.push(m[0]);
  }
  const merged = []; for (const p of parts) (typeof p === "string" && typeof merged.at(-1) === "string") ? merged[merged.length - 1] += p : merged.push(p);
  const head = e.word.trim(), key = head.codePointAt(0).toString(16);
  if (!files.has(key)) files.set(key, {});
  (files.get(key)[head] ??= []).push([e.id, merged]);
  first[e.id] = head[0];
}
let big = 0;
for (const [key, obj] of files) { const s = JSON.stringify(obj); big = Math.max(big, s.length); writeFileSync(`${out}/${key}.json`, s); }
writeFileSync(`${out}/ids.txt`, Array.from({ length: first.length }, (_, i) => first[i] ?? " ").join(""));
console.log(`${entries.length} entries → ${files.size} files in ${out}/, largest ${(big / 1e6).toFixed(2)} MB (before the host's gzip)`);
