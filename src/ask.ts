/** Where "Ask about this" can take a passage (state 10). Founder 2026-11-20: *"approve"* (list the assistants, Buddha AI
 *  first). ⚠️ Buddha AI is NOT offered: siliconwat.com describes it but has no chat yet (checked 2026-11-20), so there is
 *  nothing to take a passage to. It goes first in this list the day it exists.
 *
 *  The assistants and their order are bedok.siliconwat.org's own (src/components/sw-main/sw-reader: Gemini, Grok, DeepSeek,
 *  Meta AI, ChatGPT), named as their makers write them, and so is the way it works there: the passage and the question are
 *  COPIED, and the assistant opens in a new tab for the person to paste into. bedok's comments say why a prompt in the link
 *  was dropped (a length limit). So nothing leaves this device until the person pastes it themselves. */
import type { Key } from "./i18n";

export interface Destination {
  id: string;
  /** an i18n key, or a proper name shown as is in both languages */
  name: Key | { proper: string };
  note: Key;
  /** the assistant's own address, opened after the prompt is copied; null = copy only */
  open: string | null;
}

export const DESTINATIONS: Destination[] = [
  { id: "gemini", name: { proper: "Gemini" }, note: "opensNewTab", open: "https://gemini.google.com/" },
  { id: "grok", name: { proper: "Grok" }, note: "opensNewTab", open: "https://grok.com/" },
  { id: "deepseek", name: { proper: "DeepSeek" }, note: "opensNewTab", open: "https://chat.deepseek.com/" },
  { id: "meta", name: { proper: "Meta AI" }, note: "opensNewTab", open: "https://www.meta.ai/" },
  { id: "chatgpt", name: { proper: "ChatGPT" }, note: "opensNewTab", open: "https://chatgpt.com/" },
  { id: "copy", name: "justCopy", note: "justCopySub", open: null },
];

/** The passage and the question, as one prompt. */
export function prompt(passage: string, question: string): string {
  const q = question.trim();
  return q ? `“${passage.trim()}”\n\n${q}` : `“${passage.trim()}”`;
}
