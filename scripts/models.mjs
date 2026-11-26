#!/usr/bin/env node
// DEV ONLY until launch: copy the reader models from the private training repo into public/models/ (git-ignored) under the
// versioned names src/read/models.ts serves. At launch the released files (Hugging Face, A64) are copied in instead.
import { cpSync, mkdirSync, existsSync } from "node:fs";
const SRC = process.env.MODELS_SRC ?? new URL("../../../tipitaka-khmer/data/ocr-train/out/", import.meta.url).pathname;
// pilot 5's A (released 2026-11-24) and pilot 4's B, compact
const MAP = { "joint-a-p5": "../out5/candidates/khm-joint-a5-int", "joint-b-p4": "candidates/khm-joint-b-int" };
mkdirSync("public/models", { recursive: true });
for (const [name, from] of Object.entries(MAP)) {
  const f = `${SRC}${from}.traineddata`;
  if (!existsSync(f)) { console.log(`missing ${f}`); process.exitCode = 1; continue; }
  cpSync(f, `public/models/${name}.traineddata`);
}
console.log("models → public/models/");
