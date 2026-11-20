/** Which model file each reader uses, per leaf. Files live in public/models/ (copied in by scripts/models.mjs; released on
 *  Hugging Face at launch, A64). ⚠️ The browser caches a model under its FILE NAME alone (tesseract.js's cache key), so a
 *  new model is ALWAYS a new name — never overwrite a served file, or returning visitors keep reading with the old one.
 *  ⛔ `interim: true` = not the release (pilot 4's joint models replace these); scripts/check-models.mjs refuses a
 *  production build while any entry is interim. */
import type { ModelId, Leaf } from "./types";

export interface ModelFiles { pali: string; khmer: string; interim?: string }
export const MODELS: Record<ModelId, ModelFiles> = {
  // pilot 3 (Pāli only, both fit) + the Khmer starter (fine-tuned from Google's khm, Apache-2.0)
  accurate: { pali: "pali-a-p3", khmer: "khmer-kseed", interim: "Khmer leaf: the starter, until pilot 4's joint model" },
  // ⛔ the Khmer starter is NOT public domain; the CC0 reader has no Khmer model until pilot 4
  public: { pali: "pali-b-p3", khmer: "khmer-kseed", interim: "Khmer leaf: borrows the Apache-2.0 starter, until pilot 4's CC0 joint model" },
};
export const fileFor = (m: ModelId, leaf: Leaf) => MODELS[m][leaf];
