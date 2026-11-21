/** Privacy and terms (#terms) — legal D9 for this surface (founder 2026-11-20: *"yes"* — drafts on the site under a
 *  not-reviewed-by-a-lawyer notice, English only, as earth.333.eco did; *"use me personally (Thon Ly)"* as the operator).
 *  ⛔ Never in unreviewed Khmer: the page says in Khmer that it stays English. Publishing it does not close D9. */
import { html } from "lit";
import { Light } from "./base";
import { t, getLang } from "../i18n";
import { CONTACT, TERMS, TERMS_DRAFT, TERMS_TITLE } from "./english-only";

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
      ${km ? html`<p class="fine mt-0 mb-12" lang="km">${t("staysEnglish")}</p>` : ""}
      ${TERMS.map(([h, ps]) => html`<div class="card"><h2>${h}</h2>${ps.map((p) => html`<p>${sm(p)}</p>`)}</div>`)}
      <p class="fine">${CONTACT}</p>
    </div>`;
  }
}
customElements.define("ocr-terms", OcrTerms);
