/** Samdech Chuon Nath's Khmer dictionary, one tap (F1; A64). Data: public/dict/ (scripts/build-dict.mjs, from the estate's
 *  published copy at khmer.siliconwat.dev). A letter's file is fetched on the first tap of a word that starts with it, from
 *  this site (the page's CSP allows nothing else). Matching, in order, and nothing more:
 *    1. the tapped word exactly (also with the two typing normalizations the transcription uses);
 *    2. the same word with a Pāli ending removed, from the short list below (the sheet says so: via "ending");
 *    3. on Khmer text, which has no spaces between words: the word the browser's own Khmer segmenter finds at the tap.
 *  Otherwise null, and the page says there is no entry. ⛔ Never a guess presented as a definition. */

export interface Entry {
  head: string;                         // the headword found
  tapped: string;                       // what the person tapped
  via: "exact" | "ending";              // "ending": the same word with a Pāli ending removed (the page says so)
  parts: { text: string; ref?: number }[];   // the definition; a part with `ref` names another entry (tap to open it)
}

type Raw = [number, (string | [number, string])[]][];
const files = new Map<string, Promise<Record<string, Raw>>>();
let ids: Promise<string> | null = null;
const base = () => (typeof import.meta.env !== "undefined" ? import.meta.env.BASE_URL : "/");
let load = async (path: string) => { const r = await fetch(base() + path); if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.text(); };
/** Tests replace the loader (they read public/ from disk). */
export function setLoader(f: (path: string) => Promise<string>) { load = f; files.clear(); ids = null; }

function file(ch: string) {
  const key = ch.codePointAt(0)!.toString(16);
  if (!files.has(key)) files.set(key, load(`dict/${key}.json`).then(JSON.parse).catch(() => ({})));
  return files.get(key)!;
}
async function find(head: string): Promise<Raw | null> {
  if (!head) return null;
  return (await file(head[0]))[head] ?? null;
}
function toEntry(head: string, tapped: string, via: Entry["via"], raw: Raw): Entry {
  const parts: Entry["parts"] = [];
  raw.forEach(([, ps], i) => {
    if (i) parts.push({ text: "\n" });
    for (const p of ps) parts.push(typeof p === "string" ? { text: p } : { text: p[1], ref: p[0] });
  });
  return { head, tapped, via, parts };
}

const BREAK = /[\s។៕៖,.;:!?“”"'()[\]{}«»\-–—…0-9០-៩​]/;
/** The space- or punctuation-delimited word around `offset` (a caret just after a word counts as on it). */
export function wordAt(text: string, offset: number): [number, number] | null {
  let i = Math.min(Math.max(offset, 0), text.length);
  if ((i >= text.length || BREAK.test(text[i])) && i > 0 && !BREAK.test(text[i - 1])) i -= 1;
  if (i >= text.length || BREAK.test(text[i])) return null;
  let a = i, b = i + 1;
  while (a > 0 && !BREAK.test(text[a - 1])) a--;
  while (b < text.length && !BREAK.test(text[b])) b++;
  return [a, b];
}

/** Typing variants the transcription normalizes (tools/khmer_pali.py): subscript RO typed first; subscript DA for TA. */
function variants(w: string): string[] {
  const v = new Set([w]);
  v.add(w.replace(/(្រ)(្[ក-ឡ])/g, "$2$1"));
  v.add(w.split("្ដ").join("្ត")); v.add(w.split("្ត").join("្ដ"));
  return [...v];
}

// Pāli endings in Khmer script, longest first (case endings of a-, ā-, i-, u-stems). After one is removed the stem may
// end in its own vowel, so each remainder is also tried with ា ិ ី ុ ូ.
const ENDINGS = ["ានំ", "េហិ", "េភិ", "េសុ", "ស្មា", "ម្ហា", "ស្មឹ", "ម្ហិ", "ាយំ", "ាយោ", "ីនំ", "ូនំ", "ីហិ", "ូហិ", "ីសុ", "ូសុ",
  "ស្ស", "ាយ", "ានិ", "េន", "ិនា", "ិនោ", "ុនា", "ុនោ", "ឹ", "ុំ", "ោ", "េ", "ា", "ំ", "ី", "ូ", "ិ", "ុ"];
const STEM_VOWELS = ["", "ា", "ិ", "ី", "ុ", "ូ"];
const isBase = (c: string) => /[ក-ឳ]/.test(c);

export async function lookup(text: string, offset: number): Promise<Entry | null> {
  const span = wordAt(text, offset); if (!span) return null;
  const tapped = text.slice(span[0], span[1]);
  for (const w of variants(tapped)) { const r = await find(w); if (r) return toEntry(w, tapped, "exact", r); }
  for (const end of ENDINGS) {
    if (!tapped.endsWith(end)) continue;
    const stem = tapped.slice(0, -end.length);
    if (stem.length < 2 || stem.endsWith("្") || !isBase(stem[0])) continue;
    for (const v of STEM_VOWELS) {
      if (v && !/[ក-ឡ]$/.test(stem)) continue;   // add a stem vowel only after a consonant
      const r = await find(stem + v); if (r) return toEntry(stem + v, tapped, "ending", r);
    }
  }
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("km", { granularity: "word" });
    const local = offset - span[0];
    for (const s of seg.segment(tapped)) {
      // ⛔ a lone letter is not a word here: on nonsense the segmenter falls back to single letters, and each letter has
      // its own entry (the letter itself), which would be a guess wearing a definition (caught by the test's control)
      if (local >= s.index && local < s.index + s.segment.length && s.segment !== tapped && s.segment.length >= 2 && s.isWordLike) {
        const r = await find(s.segment); if (r) return toEntry(s.segment, s.segment, "exact", r);
        break;
      }
    }
  }
  return null;
}

export async function entryById(id: number): Promise<Entry | null> {
  ids ??= load("dict/ids.txt");
  const ch = (await ids)[id]; if (!ch || ch === " ") return null;
  const all = await file(ch);
  for (const [head, raw] of Object.entries(all)) {
    const hit = raw.filter(([i]) => i === id);
    if (hit.length) return toEntry(head, head, "exact", hit);
  }
  return null;
}
