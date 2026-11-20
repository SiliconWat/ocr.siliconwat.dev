import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { lookup, entryById, setLoader, wordAt } from "../src/dict/index";

setLoader((p) => readFile(new URL(`../public/${p}`, import.meta.url), "utf8"));
const line = "វិហរតិ ជេតវនេ អនាថបិណ្ឌិកស្ស អារាមេ ។";

test("the drawing's case: ជេតវនេ is ជេតវន without its Pāli ending", async () => {
  const e = await lookup(line, line.indexOf("ជេតវនេ") + 2);
  assert.equal(e?.head, "ជេតវន"); assert.equal(e?.via, "ending"); assert.equal(e?.tapped, "ជេតវនេ");
  assert.ok(e!.parts.some((p) => p.ref), "definition words link to their own entries");
});
test("an exact headword", async () => {
  const e = await lookup("ធម៌ ទាំងឡាយ", 1); assert.equal(e?.head, "ធម៌"); assert.equal(e?.via, "exact");
});
test("a linked word opens its own entry", async () => {
  const e = await entryById(3464); assert.equal(e?.head, "ជេតវន");
});
test("CONTROL: a made-up word has no entry (never a guess)", async () => {
  assert.equal(await lookup("ឃឃឃឃឃ", 2), null);
});
test("Khmer text without spaces: the segmenter's word, exact", async () => {
  const e = await lookup("ព្រះពុទ្ធជាម្ចាស់", 10); assert.equal(e?.head, "ជា"); assert.equal(e?.tapped, "ជា");
});
test("a tap on a space or the sentence mark finds no word", async () => {
  assert.equal(wordAt(line, line.indexOf("។") + 1), null);
  assert.deepEqual(wordAt(line, line.indexOf(" ") ), [0, 6]);   // caret just after a word counts as on it
});
