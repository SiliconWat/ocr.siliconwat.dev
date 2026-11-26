#!/usr/bin/env -S npx tsx
// After `vite build`: write dist/terms/index.html, the static Privacy and terms page (scripts/terms-page.ts says why), and
// refuse the build if that page does not carry every line of legal/terms.md (legal.333.eco's own check, scripts/served.mjs).
// Usage: tsx scripts/build-terms-page.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error plain .mjs, no types
import { missingFromServed } from "./served.mjs";
import { termsPage } from "./terms-page";

const page = termsPage(readFileSync("dist/index.html", "utf8"));
const missing: string[] = missingFromServed(readFileSync("legal/terms.md", "utf8"), page);
if (missing.length) {
  console.error(`✗ dist/terms/index.html lacks ${missing.length} line(s) of legal/terms.md, first: ${missing[0].slice(0, 90)}…`);
  process.exit(1);
}
mkdirSync("dist/terms", { recursive: true });
writeFileSync("dist/terms/index.html", page);
console.log(`terms/index.html: every line of legal/terms.md (${(page.length / 1024).toFixed(1)} KB, no app script)`);
