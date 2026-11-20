#!/usr/bin/env node
// DEV ONLY until launch: copy the reader models from the private training repo into public/models/ (git-ignored) under the
// versioned names src/read/models.ts serves. At launch the released files (Hugging Face, A64) are copied in instead.
import { cpSync, mkdirSync, existsSync } from "node:fs";
const SRC = process.env.MODELS_SRC ?? new URL("../../../tipitaka-khmer/data/ocr-train/out/", import.meta.url).pathname;
const MAP = { "pali-a-p3": "candidates/khm-bedok2-int", "pali-b-p3": "candidates/khm-scratch-int", "khmer-kseed": "khm-kseed-int" };
mkdirSync("public/models", { recursive: true });
for (const [name, from] of Object.entries(MAP)) {
  const f = `${SRC}${from}.traineddata`;
  if (!existsSync(f)) { console.log(`missing ${f}`); process.exitCode = 1; continue; }
  cpSync(f, `public/models/${name}.traineddata`);
}
console.log("models → public/models/");
