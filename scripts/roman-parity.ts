/** toRoman (src/read/roman.ts) must equal the Python transliterator on every sample: tsx scripts/roman-parity.ts <samples.json>
 *  where samples.json = [[khmerText, pythonRoman], …] (written by the private repo; no text is kept here). */
import { readFileSync } from "node:fs";
import { toRoman } from "../src/read/roman";
const rows: [string, string][] = JSON.parse(readFileSync(process.argv[2], "utf8"));
let bad = 0;
for (const [k, py] of rows) if (toRoman(k) !== py) { if (bad++ < 3) console.log("DIFF", JSON.stringify(k.slice(0, 80)), "\n js:", toRoman(k).slice(0, 120), "\n py:", py.slice(0, 120)); }
console.log(`roman: ${rows.length - bad}/${rows.length} identical to the Python`);
