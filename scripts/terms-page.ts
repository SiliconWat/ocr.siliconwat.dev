/** The STATIC Privacy and terms page, /terms/ (dist/terms/index.html). The page at #terms draws its words with JavaScript, so a
 *  plain fetch of the site holds none of them; legal.333.eco's release reads the served page with a plain fetch, and publishes a
 *  version of legal/terms.md only when every line of it is found there. This page is that served copy: the very template
 *  #terms renders (src/ui/terms.ts, English), inside the site's frame (header, footer), with no script of the app. */
import type { TemplateResult } from "lit";
import { html } from "lit";
import { OcrTerms } from "../src/ui/terms";
import { siteIcon } from "../src/ui/icons";
import { t, getLang } from "../src/i18n";
import { TERMS, TERMS_TITLE } from "../src/ui/english-only";

export const TERMS_PAGE_URL = "https://ocr.siliconwat.dev/terms/";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s: string) => esc(s).replace(/"/g, "&quot;");
/** A Lit template as the markup it puts in the page: its static parts with every value filled in, text escaped, an attribute's
 *  value quoted. Only plain text and attribute bindings: an event, property or boolean binding (@ . ?) has no static form, so
 *  it is refused rather than written out wrong. */
export function flatten(v: unknown): string {
  if (v == null || v === false || v === "") return "";
  if (Array.isArray(v)) return v.map(flatten).join("");
  if (typeof v === "object" && "strings" in (v as object) && "values" in (v as object)) {
    const tpl = v as { strings: readonly string[]; values: readonly unknown[] };
    return tpl.strings.map((s, i) => {
      if (i >= tpl.values.length) return s;
      if (/[@.?][\w-]+=$/.test(s)) throw new Error(`no static form for the binding before: ${s.slice(-40)}`);
      return /=$/.test(s) ? `${s}"${attr(String(tpl.values[i]))}"` : s + flatten(tpl.values[i]);
    }).join("");
  }
  return esc(String(v));
}

/** The frame: src/ui/app.ts's header and footer, without what needs the app (the language and theme switches, Share). */
function frame(main: TemplateResult): TemplateResult {
  const dim = "text-ink-dim underline underline-offset-2";
  return html`<div class="mx-auto flex min-h-dvh max-w-1280 flex-col px-20 desk:px-64" lang="en">
<header class="flex items-center justify-between gap-10 pt-16 pb-8 desk:pt-22 desk:pb-12">
<a href="/" class="flex min-w-0 items-center gap-8 text-ink no-underline">${siteIcon(26)}<span class="text-field font-strong tracking-wm whitespace-nowrap">ocr.siliconwat.dev</span></a>
</header>
<main class="flex-1"><ocr-terms>${main}</ocr-terms></main>
<footer class="mt-20 flex flex-wrap items-center justify-between gap-10 border-t border-line pt-12 pb-24 text-foot text-ink-dim">
<span><a href="/#about" class=${dim}>${t("aboutLink")}</a> · <a href="/terms/" class=${dim}>${t("termsLink")}</a> · <a href="/#models" class=${dim}>${t("modelsLink")}</a> · ${t("visits")}</span>
</footer>
</div>`;
}

/** dist/terms/index.html from dist/index.html: the same head (its CSP byte for byte, the stylesheet, the icons, boot.js for the
 *  theme, the visit counter), retitled for this page and without the app's module script; the body is the frame and the terms. */
export function termsPage(indexHtml: string): string {
  if (getLang() !== "en") throw new Error("the static terms page is English only: render it with the language set to en");
  const title = `${TERMS_TITLE} · ocr.siliconwat.dev`;
  const desc = TERMS[0][1][0];
  const swap = (s: string, re: RegExp, to: string) => {
    if (!re.test(s)) throw new Error(`dist/index.html: ${re} not found`);
    return s.replace(re, () => to);
  };
  let h = indexHtml;
  h = swap(h, /<html lang="[^"]*">/, '<html lang="en">');
  h = swap(h, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = swap(h, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${TERMS_PAGE_URL}">`);
  h = h.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, "");   // English only: no Khmer twin
  h = swap(h, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${TERMS_PAGE_URL}">`);
  for (const k of ['name="description"', 'property="og:description"', 'name="twitter:description"'])
    h = swap(h, new RegExp(`<meta ${k} content="[^"]*">`), `<meta ${k} content="${attr(desc)}">`);
  for (const k of ['property="og:title"', 'name="twitter:title"'])
    h = swap(h, new RegExp(`<meta ${k} content="[^"]*">`), `<meta ${k} content="${attr(TERMS_TITLE)}">`);
  h = swap(h, /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${attr(title)}">`);
  h = h.replace(/\s*<script type="module"[^>]*><\/script>/g, "").replace(/\s*<link rel="modulepreload"[^>]*>/g, "");
  const body = flatten(frame(OcrTerms.prototype.render.call({}) as TemplateResult));
  return swap(h, /<body>[\s\S]*<\/body>/, `<body>\n${body}\n</body>`);
}
