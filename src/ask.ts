/** Where "Ask about this" can take a passage (state 10). Nothing leaves the page until the person presses Ask, and then
 *  only to the place they chose: a link opens in a new tab with the passage and question filled in, or — with no link —
 *  the two are copied, ready to paste anywhere.
 *
 *  ⏳ OPEN FOUNDER DECISION — which assistants to offer. The drawings show three more choices above "Just copy it":
 *     · "Buddha AI · siliconwat.com" (From Silicon Wat℠), marked "[ checked in the build ]": it cannot take a passage by
 *       link today, so it is NOT offered;
 *     · two "[ Assistant name ]" rows (Opens in a new tab): which general assistants to name is undecided.
 *  ⛔ Invent none. To add one when it is settled:
 *       { id: "…", name: "…", note: "opensNewTab", link: (prompt) => "https://…?q=" + encodeURIComponent(prompt) }
 *  (an `i18n` key for its name, or a proper name that stays the same in both languages). A link must take the prompt in its
 *  URL — nothing is sent from this page. */
import type { Key } from "./i18n";

export interface Destination {
  id: string;
  /** an i18n key, or a proper name shown as is in both languages */
  name: Key | { proper: string };
  note: Key;
  /** the address that opens it with the prompt filled in; null = copy the prompt instead */
  link: ((prompt: string) => string) | null;
}

export const DESTINATIONS: Destination[] = [
  { id: "copy", name: "justCopy", note: "justCopySub", link: null },
];

/** The passage and the question, as one prompt. */
export function prompt(passage: string, question: string): string {
  const q = question.trim();
  return q ? `“${passage.trim()}”\n\n${q}` : `“${passage.trim()}”`;
}
