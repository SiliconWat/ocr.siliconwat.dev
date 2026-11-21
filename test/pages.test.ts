/** The two page entries (/ and /km/) and the language each starts in. km/index.html is a second copy of index.html's head,
 *  so its CSP could drift from the one the privacy rests on: these tests fail if it does. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const en = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const km = readFileSync(new URL("../km/index.html", import.meta.url), "utf8");
const boot = readFileSync(new URL("../public/boot.js", import.meta.url), "utf8");

const cspLine = (html: string) => html.split("\n").find((l) => l.includes('http-equiv="Content-Security-Policy"'));
const meta = (html: string, attr: string, key: string) =>
  html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)">`))?.[1];
const alternates = (html: string) =>
  [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => `${m[1]} ${m[2]}`).sort();

test("km/index.html carries index.html's CSP byte for byte", () => {
  assert.ok(cspLine(en), "index.html has a CSP meta");
  assert.equal(cspLine(km), cspLine(en));
});
test("CONTROL: a CSP that differs by one character is caught", () => {
  const changed = km.replace("object-src 'none'", "object-src 'self'");
  assert.notEqual(cspLine(changed), cspLine(en));
});
test("the Khmer entry: lang, Khmer title and description, its own URL, the Khmer picture by an absolute URL", () => {
  assert.match(km, /<html lang="km">/);
  assert.match(km.match(/<title>([^<]*)<\/title>/)![1], /^[ក-៿ ]+ · ocr\.siliconwat\.dev$/);
  for (const [attr, key] of [["name", "description"], ["property", "og:title"], ["property", "og:description"]] as const) {
    assert.match(meta(km, attr, key) ?? "", /[ក-៿]/, `${key} is Khmer`);
    assert.doesNotMatch(meta(km, attr, key) ?? "", /[a-z]{3}/i, `${key} carries no English`);
  }
  assert.equal(meta(km, "property", "og:image"), "https://ocr.siliconwat.dev/og-km.png");
  assert.equal(meta(km, "property", "og:url"), "https://ocr.siliconwat.dev/km/");
  assert.match(km, /<link rel="canonical" href="https:\/\/ocr\.siliconwat\.dev\/km\/">/);
  assert.equal(meta(en, "property", "og:image"), "https://ocr.siliconwat.dev/og.png");
});
test("both entries name each other (hreflang pairs, the same on both)", () => {
  const want = ["en https://ocr.siliconwat.dev/", "km https://ocr.siliconwat.dev/km/", "x-default https://ocr.siliconwat.dev/"];
  assert.deepEqual(alternates(en), want);
  assert.deepEqual(alternates(km), want);
});
test("every script and stylesheet path is absolute, so it resolves under /km/ as under /", () => {
  for (const m of km.matchAll(/(?:src|href)="([^"]+)"/g)) assert.match(m[1], /^(\/|https:\/\/)/, m[1]);
});

/** Runs public/boot.js as the browser would, with a path, a stored choice and a browser language. */
function startLang(path: string, stored: string | null, nav = "en-US", tz = "America/Los_Angeles", search = ""): string {
  const root = { lang: "", classList: { add() {} } };
  runInNewContext(boot, {
    document: { documentElement: root },
    location: { pathname: path, search },
    localStorage: { getItem: (k: string) => (k === "ocr-lang" ? stored : null) },
    navigator: { language: nav },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: tz }) }) },
    URLSearchParams,
    window: { matchMedia: () => ({ matches: false }) },
    matchMedia: () => ({ matches: false }),
  });
  return root.lang;
}
test("a visit to /km/ starts in Khmer", () => {
  assert.equal(startLang("/km/", null), "km");
  assert.equal(startLang("/km", null), "km");
});
test("…unless the person chose a language before", () => {
  assert.equal(startLang("/km/", "en"), "en");
});
test("CONTROL: the English entry, an English browser, nothing stored → English (the check can say no)", () => {
  assert.equal(startLang("/", null), "en");
  assert.equal(startLang("/kmx/", null), "en");
});
test("the English entry still follows a Khmer browser", () => {
  assert.equal(startLang("/", null, "km-KH"), "km");
});
