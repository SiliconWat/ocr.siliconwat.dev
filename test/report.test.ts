import { test } from "node:test";
import assert from "node:assert/strict";
import { errorBody, scrub } from "../src/report";

const env = { host: "ocr.siliconwat.dev", webdriver: false, timezone: "Asia/Phnom_Penh", device: "d1", admin: false, commit: "abc1234" };
const PASSAGE = "ឯកំ សមយំ ភគវា សាវត្ថិយំ វិហរតិ ជេតវនេ អនាថបិណ្ឌិកស្ស អារាមេ ។";

test("a message made of the passage itself sends none of it (the text never leaves)", () => {
  const body = JSON.stringify(errorBody("read", new Error(`could not read: ${PASSAGE}`), env));
  assert.doesNotMatch(body, /[ក-៿]/, "no Khmer-script character in the bytes sent");
  assert.match(body, /could not read/);
});
test("CONTROL: without the scrub, the passage would ride along", () => {
  assert.match(JSON.stringify({ message: `could not read: ${PASSAGE}`.slice(0, 200) }), /[ក-៿]/);
});
test("only where, name, message and commit are sent as data", () => {
  const b = errorBody("listen", Object.assign(new Error("x"), { stack: "secret", passage: PASSAGE }), env);
  assert.deepEqual(Object.keys(b.data).sort(), ["commit", "message", "name", "where"]);
  assert.doesNotMatch(JSON.stringify(b), /secret|[ក-៿]/);
});
test("a long message is cut to 200 characters", () => {
  assert.equal(scrub("a".repeat(500)).length, 200);
});
