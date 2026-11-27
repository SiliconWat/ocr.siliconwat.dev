/** Privacy and terms (#terms) has one source, legal/terms.md, which legal.333.eco publishes only when every line of it is found
 *  on the page this site serves (A709). These tests render the page's own template (src/ui/terms.ts) and fail when it drops or
 *  changes any line of the markdown, with the very function legal.333.eco's release uses (scripts/served.mjs, a copy). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error plain .mjs, no types
import { missingFromServed } from "../scripts/served.mjs";
// @ts-expect-error plain .mjs, no types
import { DATE_LINE, generate, parseTerms } from "../scripts/legal.mjs";
import { OcrTerms, LEGAL_URL } from "../src/ui/terms";
import { setLang } from "../src/i18n";
import { flatten, termsPage, TERMS_PAGE_URL } from "../scripts/terms-page";

const md = readFileSync(new URL("../legal/terms.md", import.meta.url), "utf8");
const generated = readFileSync(new URL("../src/ui/legal-terms.ts", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");

/** The page's render in a language (i18n's setLang writes the root's lang; a stand-in root here). */
function rendered(lang: "en" | "km"): string {
  (globalThis as { document?: unknown }).document ??= { documentElement: { lang: "en" } };
  setLang(lang);
  return flatten(OcrTerms.prototype.render.call({}));
}
/** One byte changed in the document's text (an ASCII letter swapped for another), well inside a paragraph. */
const oneByte = (s: string) => {
  const i = s.indexOf("never uploaded") + 7;
  return s.slice(0, i) + (s[i] === "u" ? "v" : "u") + s.slice(i + 1);
};

test("legal/terms.md has the shape legal.333.eco's release accepts: '# Title', a blank line, the date line", () => {
  const lines = md.split("\n");
  assert.match(lines[0], /^# .+$/);
  assert.equal(lines[1], "");
  assert.match(lines[2], DATE_LINE);
  assert.ok(md.endsWith("\n") && !md.includes("\r"));
});
test("src/ui/legal-terms.ts is generated from legal/terms.md as it stands (never stale)", () => {
  assert.equal(generated, generate(md), "run: node scripts/gen-legal.mjs");
});
for (const lang of ["en", "km"] as const) {
  test(`the rendered page (${lang}) carries every line of legal/terms.md, word for word`, () => {
    assert.deepEqual(missingFromServed(md, rendered(lang)), []);
  });
}
test("CONTROL: a one-byte change to the markdown is caught by both checks", () => {
  const changed = oneByte(md);
  assert.equal(Buffer.byteLength(changed), Buffer.byteLength(md));
  assert.notEqual(changed, md);
  assert.equal(missingFromServed(changed, rendered("en")).length, 1, "the render no longer carries the changed line");
  assert.notEqual(generate(changed), generated, "the generated module would be stale");
});
test("CONTROL: a render that drops a line is caught", () => {
  const html = rendered("en");
  const dropped = html.replace(/<p>Errors: [^<]*<\/p>/, "");
  assert.notEqual(dropped, html);
  assert.equal(missingFromServed(md, dropped).length, 1);
});
/** The shared clauses (founder 2026-11-26, "approve all": legal.333.eco §clause-rulings), word for word. The banner and the AI
 *  line are the page's frame, never the document; the Changes promise is the document's own. The wordings are read from
 *  legal/clauses.json, vendored from legal.333.eco (founder 2026-11-26, "Build it now"), never typed here: a page that drifts
 *  from the one ruled wording fails these tests, and `npm test` first runs scripts/check-clauses.mjs, which fails on any hand
 *  edit of the vendored file. */
const CLAUSES: Record<string, { text: string }> = JSON.parse(readFileSync(new URL("../legal/clauses.json", import.meta.url), "utf8")).wordings;
const ruled = (id: string) => { const w = CLAUSES[id]; assert.ok(w, `legal/clauses.json has no ${id}`); return w.text; };
const BANNER = ruled("draft-banner/en");
const AI_LINE = ruled("ai-disclosure/en");
const BANNER_KM = ruled("draft-banner/km");
const AI_LINE_KM = ruled("ai-disclosure/km");
// Reworded the same day (founder 2026-11-26, "Reword it everywhere"): "a new version" is barred as a novelty claim.
const CHANGES = ruled("changes/en");
/** The page's words as a reader sees them: tags dropped, spacing folded. */
const words = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
const noteOk = (html: string) =>
  new RegExp(`<div class="note">Draft of \\d{1,2} [A-Z][a-z]+ \\d{4}\\. ${BANNER.replace(/[.]/g, "\\.")}</div>`).test(html);
test("the ruled draft banner sits with the date line in the frame's note", () => {
  assert.ok(noteOk(rendered("en")), "the note: the date line, then the ruled banner");
  assert.ok(noteOk(rendered("km")), "the note in Khmer mode too (the document stays English)");
});
test("CONTROL: the old notice fails the banner check", () => {
  const old = rendered("en").replace(BANNER, "Not yet reviewed by a lawyer.");
  assert.notEqual(old, rendered("en"));
  assert.ok(!noteOk(old));
});
test("the AI line beside the banner, in English; in Khmer mode the Khmer banner and AI line too", () => {
  const en = words(rendered("en")), km = words(rendered("km"));
  assert.ok(en.includes(AI_LINE) && km.includes(AI_LINE), "the English AI line in both languages");
  assert.ok(en.indexOf(AI_LINE) > en.indexOf(BANNER) && en.indexOf(AI_LINE) < en.indexOf("Who runs this page"), "beside the banner, before the text");
  assert.ok(km.includes(BANNER_KM) && km.includes(AI_LINE_KM), "the Khmer banner and AI line in Khmer mode");
  assert.ok(!en.includes(BANNER_KM) && !en.includes(AI_LINE_KM), "no Khmer banner on the English page");
  assert.ok(!md.includes("Miss Aquarius"), "the AI line is the frame's, never the document's");
});
test("CONTROL: a page without the AI line fails the check", () => {
  assert.ok(!words(rendered("en").replace("Drafted with", "Written by")).includes(AI_LINE));
});
test("the Changes section carries the ruled promise, word for word", () => {
  assert.match(md, new RegExp(`\\n## Changes\\n\\n${CHANGES.replace(/[.]/g, "\\.")}\\n`));
  assert.doesNotMatch(md, /We will post changes here/);
  assert.doesNotMatch(md, /a new version/i, "the withdrawn wording (2026-11-26)");
});
test("the line to every version on legal.333.eco: outside the document, in the page's language", () => {
  assert.equal(LEGAL_URL, "https://legal.333.eco/ocr.siliconwat.dev/terms/");
  const en = rendered("en"), km = rendered("km");
  for (const html of [en, km]) assert.equal(html.split(`href="${LEGAL_URL}"`).length - 1, 1);
  assert.match(en, /lang="en">Every version of this document, timestamped: <a [^>]*>legal\.333\.eco<\/a><\/p>/);
  assert.match(km, /lang="km">គ្រប់កំណែនៃឯកសារនេះ បោះត្រាពេលវេលា៖ <a [^>]*>legal\.333\.eco<\/a><\/p>/);
  // The ruled Changes promise (2026-11-26) names legal.333.eco inside the document; the frame's line and its link stay outside.
  assert.ok(!md.includes(LEGAL_URL) && !md.includes("Every version"), "the line is the frame's, never the document's");
});
test("the renderer refuses what it cannot draw, never drops it", () => {
  const at = md.indexOf("## Fair use");
  for (const insert of ["- a list item\n\n", "| a | b |\n|---|---|\n| 1 | 2 |\n\n", "Some **bold** text.\n\n", "A `code` span.\n\n",
    "A [link](https://example.com).\n\n", "### A third-level heading\n\n"]) {
    assert.throws(() => parseTerms(md.slice(0, at) + insert + md.slice(at)), /cannot render/, insert);
  }
  assert.throws(() => parseTerms(md.replace("Draft of", "Drafted")), /third line/);
  assert.throws(() => parseTerms(md.replace(/\nContact: .*\n$/, "\n")), /contact line/);
});

/** The static page /terms/ (scripts/terms-page.ts): what a plain fetch of the site finds, which legal.333.eco's release reads. */
const staticPage = () => { setLang("en"); return termsPage(indexHtml); };
test("the static page /terms/ carries every line of legal/terms.md, in its HTML (no script needed)", () => {
  const page = staticPage();
  assert.deepEqual(missingFromServed(md, page), []);
  assert.doesNotMatch(page, /<script type="module"/, "no app script: the words are in the HTML itself");
});
test("CONTROL: the static page check catches a one-byte change to the markdown", () => {
  assert.equal(missingFromServed(oneByte(md), staticPage()).length, 1);
});
test("the static page: the site's head and CSP, its own address, the note and the legal.333.eco line, English only", () => {
  const page = staticPage(), csp = (h: string) => h.split("\n").find((l) => l.includes('http-equiv="Content-Security-Policy"'));
  assert.ok(csp(page) && csp(page) === csp(indexHtml), "the CSP byte for byte");
  assert.match(page, /<html lang="en">/);
  assert.match(page, /<title>Privacy and terms · ocr\.siliconwat\.dev<\/title>/);
  assert.ok(page.includes(`<link rel="canonical" href="${TERMS_PAGE_URL}">`) && page.includes(`<meta property="og:url" content="${TERMS_PAGE_URL}">`));
  assert.doesNotMatch(page, /hreflang/);
  assert.ok(noteOk(page), "the note: the date line, then the ruled banner");
  assert.ok(words(page).includes(AI_LINE), "the AI line beside it");
  assert.equal(page.split(`href="${LEGAL_URL}"`).length - 1, 1);
  assert.doesNotMatch(page, /[ក-៿]/, "no Khmer on the English-only page");
  assert.match(page, /<path d="M8\.5 8h7M8\.5 12h7M8\.5 16h4\.5"/, "attribute values are quoted");
  assert.ok(page.includes('<script src="/boot.js"></script>') && page.includes('<script src="/analytics.js" defer></script>'));
});
test("flatten refuses a binding it cannot write statically", () => {
  const fake = { strings: ['<button @click=', '>x</button>'], values: [() => 0] };
  assert.throws(() => flatten(fake), /no static form/);
});
