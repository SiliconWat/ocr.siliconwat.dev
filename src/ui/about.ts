/** State 7 — About and credits (#about). The privacy, license and credits text stays ENGLISH in Khmer mode until a native
 *  reader approves a translation (the license and credits never ship in unreviewed Khmer); the drawing's one Khmer line
 *  says so. Silicon Wat℠ surface: no heart, no B-Emblem. */
import { html } from "lit";
import { Light } from "./base";
import { t, getLang } from "../i18n";
import { siteIcon, spot } from "./icons";

/** English only, verbatim from the drawings (S7). */
const PRIVACY =
  "Your images and text are read on this device and never uploaded: the page is built so that it cannot send them. " +
  "Two things leave only when you press: a passage you choose to hear (to our voice service and Azure) and a passage " +
  "you ask about (to the assistant you chose). Visits are counted without cookies, and the count never sees an image or a word.";
const LICENSES =
  "Most accurate: Apache-2.0. Public domain: CC0. The license matters only if you share a model file itself. " +
  "The page images used in training are not released; the transcriber's typed text is published as a dataset (CC0), crediting the Buddhist Institute.";
const CREDITS: [string, string][] = [
  ["Transcription", "Se Mong Ly (សេ ម៉ុងលី)"],
  ["Text", "the Buddhist Institute edition of the Tipiṭaka (Phnom Penh, 1927–69)"],
  ["Scans", "Upāsikā Kang Huychan and family · Lok Kru Aggapaṇḍita But Savong · Srong Chanda · 5000-years.org, given as dhamma dāna"],
  ["Made by", "Silicon Wat℠, with Miss Aquarius℠ (AI collaboration, disclosed)"],
];

/** ℠ set small, as the drawings set it */
const sm = (s: string) => {
  const parts = s.split("℠");
  return parts.map((p, i) => (i < parts.length - 1 ? html`${p}<span class="sm">℠</span>` : p));
};

export class OcrAbout extends Light {
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
      <div class="card">${spot("file")}<h2>${t("twoReaders")}</h2><p lang="en">${LICENSES}</p></div>
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
