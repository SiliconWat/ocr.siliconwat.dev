/** Pāli in Khmer script → roman letters, the CST's convention — a line-for-line port of tipitaka-khmer's
 *  `tools/khmer_pali.py` (A64), which aligned the transcriber's 37 volumes against the CST. Checked against the Python on
 *  every Pāli page of a sample of volumes (`scripts/roman-parity.ts`). A convenience: the page labels it so, and offers
 *  it on Pāli pages only (romanizing Khmer-language text is a different system). */

const CONS: Record<string, string> = {};
"កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយរលវសហឡ".split("").forEach((c, i) => {
  CONS[c] = ["k","kh","g","gh","ṅ","c","ch","j","jh","ñ","ṭ","ṭh","ḍ","ḍh","ṇ","t","th","d","dh","n",
             "p","ph","b","bh","m","y","r","l","v","s","h","ḷ"][i];
});
const INDEP: Record<string, string> = { "អ": "a", "ឥ": "i", "ឦ": "ī", "ឧ": "u", "ឩ": "ū", "ឯ": "e", "ឱ": "o", "ឲ": "o" };
const VSIGN: Record<string, string> = { "ា": "ā", "ិ": "i", "ី": "ī", "ុ": "u", "ូ": "ū", "េ": "e", "ោ": "o", "ឹ": "iṃ", "ឺ": "ī" };
const COENG = "្", NIGG = "ំ", BANTOC = "់";
const SKIP = new Set("៍៎៏័៌៑ៈ​");
const KDIGITS = "០១២៣៤៥៦៧៨៩";

/** Typists sometimes enter the subscript RO before another subscript (ន្រ្ទ for ន្ទ្រ); it is pronounced and spelled last. */
const reorderCoengRo = (s: string) => s.replace(/(្រ)(្[ក-ឡ])/g, "$2$1");
/** A vowel sign or niggahita typed BEFORE a subscript (ទិ្រ for ទ្រិ) renders the same; move the subscript first. */
function reorderSignBeforeCoeng(s: string): string {
  let prev: string | null = null;
  while (prev !== s) { prev = s; s = s.replace(/([ា-ំ])(្[ក-ឡ])/g, "$2$1"); }
  return s;
}
/** Subscript DA and subscript TA print alike, and Pāli has no tṭ or nṭ: after ត or ន the subscript is TA. */
const subscriptTa = (s: string) => s.split("ត្ដ").join("ត្ត").split("ន្ដ").join("ន្ត");

/** The exact port (the parity check compares this one). */
export function transliterate(text: string): string {
  const s = subscriptTa(reorderSignBeforeCoeng(reorderCoengRo(text)));
  const out: string[] = []; let i = 0; const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch in CONS || ch === "អ") {
      const base = CONS[ch] ?? "", nxt = i + 1 < n ? s[i + 1] : "";
      if (ch === "អ" && nxt in VSIGN) { out.push(VSIGN[nxt]); i += 2; continue; }
      if (nxt === COENG) { out.push(base); i += 2; continue; }
      if (nxt && nxt in VSIGN) {
        out.push(base + VSIGN[nxt]); i += 2;
        if (i < n && s[i] === NIGG) { out.push("ṃ"); i += 1; }
        continue;
      }
      if (nxt === BANTOC) { out.push(base); i += 2; continue; }
      out.push(base + "a"); i += 1;
      if (i < n && s[i] === NIGG) { out.push("ṃ"); i += 1; }
      continue;
    }
    if (ch in INDEP) { out.push(INDEP[ch]); i += 1; continue; }
    if (ch in VSIGN) { out.push(VSIGN[ch]); i += 1; continue; }
    if (ch === NIGG) { out.push("ṃ"); i += 1; continue; }
    if (ch === "។") { out.push("."); i += 1; continue; }
    if (SKIP.has(ch)) { i += 1; continue; }
    const d = KDIGITS.indexOf(ch);
    out.push(d >= 0 ? String(d) : ch); i += 1;
  }
  return out.join("").split("bv").join("bb");   // Khmer writes Pāli bb as ព្វ (sabba = សព្វ)
}

/** What the page shows: the same, with no space before a full stop ("sammāsambuddhassa.", as the CST prints it). */
export const toRoman = (text: string) => transliterate(text).replace(/ +\./g, ".");
