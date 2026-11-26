/** Which model file each reader uses, per leaf. Files live in public/models/ (copied in by scripts/models.mjs; released on
 *  Hugging Face at launch, A64). ⚠️ The browser caches a model under its FILE NAME alone (tesseract.js's cache key), so a
 *  new model is ALWAYS a new name — never overwrite a served file, or returning visitors keep reading with the old one.
 *  ⛔ `interim: true` = not the release (pilot 4's joint models replace these); scripts/check-models.mjs refuses a
 *  production build while any entry is interim. */
import type { ModelId, Leaf } from "./types";

export interface ModelFiles { pali: string; khmer: string; interim?: string }
export const MODELS: Record<ModelId, ModelFiles> = {
  // OCR pilot 5 (2026-11-24, pre-registered SW/tipitaka-khmer pilot/ocr5-2026-11-23, a004be3; released by its rule, founder
  // 2026-11-24 "approve"): A5 = pilot 4's A fine-tuned again with lines drawn in three other Khmer typefaces (Apache-2.0).
  // Compact, median CER: edition Pāli 1.4% · Khmer 1.0% · the Taiwan re-setting 1.1% · 1.3% · Pāli commentaries 2.3% · a 2009 Khmer
  // printing 1.2%. (Pilot 4's A, joint-a-p4, read the same pages at 1.7 · 1.1 · 2.5 · 2.3 · 4.4 · 1.5.)
  // ⚠️ public/models/joint-a-p4.traineddata stays SERVED for one release (2026-11-25): a returning visitor's cached app shell
  // still asks for it until its service worker updates. Remove it with the next model release.
  accurate: { pali: "joint-a-p5", khmer: "joint-a-p5" },
  // B, trained from scratch on the transcriber's own text (CC0), still pilot 4's (pilot 5's B5 missed two bars and was not
  // released): edition 2.1% · 2.2%, the Taiwan re-setting 7.4% · 10.1%, commentaries 9.3%, the 2009 printing 5.9%.
  public: { pali: "joint-b-p4", khmer: "joint-b-p4" },
};
export const fileFor = (m: ModelId, leaf: Leaf) => MODELS[m][leaf];
