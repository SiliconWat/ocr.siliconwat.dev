/** Which model file each reader uses, per leaf. Files live in public/models/ (copied in by scripts/models.mjs; released on
 *  Hugging Face at launch, A64). ⚠️ The browser caches a model under its FILE NAME alone (tesseract.js's cache key), so a
 *  new model is ALWAYS a new name — never overwrite a served file, or returning visitors keep reading with the old one.
 *  ⛔ `interim: true` = not the release (pilot 4's joint models replace these); scripts/check-models.mjs refuses a
 *  production build while any entry is interim. */
import type { ModelId, Leaf } from "./types";

export interface ModelFiles { pali: string; khmer: string; interim?: string }
export const MODELS: Record<ModelId, ModelFiles> = {
  // OCR pilot 4 (2026-11-20, pre-registered 9ecc472; all four fit): ONE compact model per reader reads BOTH leaves.
  // A, fine-tuned from Google's khm (Apache-2.0): Pāli 1.7% · Khmer 1.1% (median CER, Python pipeline). Recommended by the rule.
  accurate: { pali: "joint-a-p4", khmer: "joint-a-p4" },
  // B, trained from scratch on the transcriber's own text (CC0): Pāli 2.0% · Khmer 2.2%.
  public: { pali: "joint-b-p4", khmer: "joint-b-p4" },
};
export const fileFor = (m: ModelId, leaf: Leaf) => MODELS[m][leaf];
