/** State 7 — About and credits (#about). The privacy, license and credits text stays ENGLISH in Khmer mode until a native
 *  reader approves a translation (the license and credits never ship in unreviewed Khmer); the drawing's one Khmer line
 *  says so. Silicon Wat ℠ surface: no heart, no B-Emblem. */
import { html } from "lit";
import { Light } from "./base";
import { t, getLang } from "../i18n";
import { siteIcon, spot } from "./icons";
import { CREDITS, LICENSES, PRIVACY, RELEASES } from "./english-only";

/** ℠ set small, as the drawings set it */
const sm = (s: string) => {
  const parts = s.split("℠");
  return parts.map((p, i) => (i < parts.length - 1 ? html`${p}<span class="sm">℠</span>` : p));
};

export class OcrAbout extends Light {
  /** The footer's "Models and data" (#models) opens About at the readers' links. */
  firstUpdated() {
    if (location.hash === "#models") this.querySelector("#models")?.scrollIntoView({ block: "start" });
  }

  render() {
    const km = getLang() === "km";
    return html`<div class="mx-auto max-w-640">
      <h1 class="h1" tabindex="-1">${t("aboutTitle")}</h1>
      <div class="mt-10 mb-14 flex items-center gap-12">${siteIcon(40)}</div>
      <div class="card">${spot("page")}<h2>${t("whatReads")}</h2><p>${t("whatReadsLong")}</p></div>
      <div class="card">${spot("measure")}<h2>${t("howWell")}</h2><p>${t("howWell1")}</p><p>${t("howWell2")}</p></div>
      <div class="note">${t("checkWhat")}</div>
      ${km ? html`<p class="fine mt-0 mb-12">${t("staysEnglish")}</p>` : ""}
      <div class="card">${spot("device")}<h2>${t("privacyHead")}</h2><p lang="en">${PRIVACY}</p></div>
      <div class="card" id="models">${spot("file")}<h2>${t("twoReaders")}</h2><p lang="en">${LICENSES}</p>
        <ul class="m-0 list-none p-0 text-tool" lang="en">${RELEASES.map(([k, u]) => html`<li class="border-t border-line py-8 first:border-t-0">
          <a href=${u} target="_blank" rel="noopener" class="underline underline-offset-2">${k}</a> <span class="text-ink-dim">· Hugging Face</span></li>`)}</ul></div>
      <p class="sh">${t("credits")}</p>
      <div class="card" lang="en">
        <ul class="m-0 list-none p-0 text-tool">
          ${CREDITS.map(([k, v]) => html`<li class="border-t border-line py-8 first:border-t-0">
            <b class="block text-caption font-mid text-ink-dim">${k}</b>${sm(v)}</li>`)}
        </ul>
      </div>
      <div class="card text-center">
        <div class="font-print text-pali" lang="pi-Khmr">សព្វទានំ ធម្មទានំ ជិនាតិ</div>
        <p>${t("dhp")}</p>
      </div>
    </div>`;
  }
}
customElements.define("ocr-about", OcrAbout);
