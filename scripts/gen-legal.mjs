#!/usr/bin/env node
// legal/terms.md → src/ui/legal-terms.ts (scripts/legal.mjs says why and how).
//   node scripts/gen-legal.mjs           write it
//   node scripts/gen-legal.mjs --check   fail when it has drifted from the markdown (`npm run build` and `build:dev` run this,
//                                        so a stale page never ships; test/legal.test.ts checks the same)
import { readFileSync, writeFileSync } from "node:fs";
import { generate } from "./legal.mjs";

const md = new URL("../legal/terms.md", import.meta.url);
const out = new URL("../src/ui/legal-terms.ts", import.meta.url);
const want = generate(readFileSync(md, "utf8"));
if (process.argv.includes("--check")) {
  let have = "";
  try { have = readFileSync(out, "utf8"); } catch { /* missing = drifted */ }
  if (have !== want) {
    console.error("✗ src/ui/legal-terms.ts has drifted from legal/terms.md. Run: node scripts/gen-legal.mjs");
    process.exit(1);
  }
  console.log("✓ src/ui/legal-terms.ts matches legal/terms.md");
} else {
  writeFileSync(out, want);
  console.log("wrote src/ui/legal-terms.ts from legal/terms.md");
}
