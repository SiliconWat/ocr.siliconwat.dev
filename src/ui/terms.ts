/** Privacy and terms (#terms) — legal D9 for this surface (founder 2026-11-20: *"yes"* — drafts on the site under a
 *  not-reviewed-by-a-lawyer notice, English only, as earth.333.eco did; *"use me personally (Thon Ly)"* as the operator).
 *  ⛔ Never in unreviewed Khmer: the page says in Khmer that it stays English. Publishing it does not close D9.
 *  ⭐ The document's words come from legal/terms.md alone (A709 M2, 2026-11-25), through src/ui/legal-terms.ts; the frame (the
 *  notice, the AI line, the Khmer lines, the cards, the link to every version on legal.333.eco) is this file's. test/legal.test.ts fails
 *  when this render drops or changes any line of the markdown. */
import { html } from "lit";
import { Light } from "./base";
import { t, getLang } from "../i18n";
import { CONTACT, DRAFTED_WITH, TERMS, TERMS_DRAFT, TERMS_TITLE } from "./english-only";

/** Every version of this document, timestamped (legal.333.eco, A709). */
export const LEGAL_URL = "https://legal.333.eco/ocr.siliconwat.dev/terms/";

const sm = (s: string) => {
  const parts = s.split("℠");
  return parts.map((p, i) => (i < parts.length - 1 ? html`${p}<span class="sm">℠</span>` : p));
};

export class OcrTerms extends Light {
  render() {
    const km = getLang() === "km";
    return html`<div class="mx-auto max-w-640" lang="en">
      <h1 class="h1" tabindex="-1">${TERMS_TITLE}</h1>
      <div class="note">${TERMS_DRAFT}</div>
      <p class="fine mt-0 mb-12">${sm(DRAFTED_WITH)}</p>
      ${km ? html`<p class="fine mt-0 mb-12" lang="km">${t("draftBanner")} ${sm(t("draftedWith"))}</p>` : ""}
      ${km ? html`<p class="fine mt-0 mb-12" lang="km">${t("staysEnglish")}</p>` : ""}
      ${TERMS.map(([h, ps]) => html`<div class="card"><h2>${h}</h2>${ps.map((p) => html`<p>${sm(p)}</p>`)}</div>`)}
      <p class="fine">${CONTACT}</p>
      <p class="fine" lang=${km ? "km" : "en"}>${t("legalVersions")} <a href=${LEGAL_URL} target="_blank" rel="noopener" class="underline underline-offset-2" lang="en">legal.333.eco</a></p>
    </div>`;
  }
}
customElements.define("ocr-terms", OcrTerms);
