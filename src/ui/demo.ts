/** Dev-only screen checks: `?demo&state=<n>` walks the stand-in reader (src/read/fake.ts) to a state and holds it, so each
 *  drawing can be compared with the built page. Loaded only when the URL carries `?demo` (app.ts), never otherwise.
 *    1 · 1b · 1c (adjust the page: needs &photo) · 2 · 3 · 4 · 4r (roman letters) · 4p (a range of PDF pages)
 *    · 4b (three pictures at once, named out of order; with &photo each offers "Adjust this page") · 4e (Edit)
 *    · 5 · 6 · 7 · 8 (a word's entry) · 8n (no entry) · 9 (a passage selected) · 10 (Ask)
 *    add &lang=km · &theme=dark · &voice (Listen's layout) · &photo (the stand-in reads a photo) as needed */
import type { OcrApp } from "./app";
import type { OcrResult } from "./result";
import { getLang } from "../i18n";

const img = (name = "page.jpg") => new File([new Uint8Array([0])], name, { type: "image/jpeg" });
const pdf = () => new File([new Uint8Array([0])], "volume-12.pdf", { type: "application/pdf" });
const settle = (ms = 60) => new Promise((r) => setTimeout(r, ms));

function textNode(app: OcrApp, line: number): Text | null {
  const el = app.querySelector(`ocr-result [data-run="0"] [data-line="${line}"]`);
  if (!el) return null;
  // Lit puts a comment marker before the text, so walk to the first real text node
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => ((n as Text).data.trim() ? 1 : 3) });
  return (w.nextNode() as Text | null) ?? null;
}

export async function jump(app: OcrApp, s: string) {
  switch (s) {
    case "1":
      return;
    case "1b":
      app.pagesPreset = { mode: "range", from: 3, to: 5 };
      await app.onFile(pdf());
      return;
    case "2":
      app.demoFreeze = "ready";
      await app.onFile(img());
      return;
    case "3":
      app.demoFreeze = "reading";
      await app.onFile(img());
      return;
    case "5":
      app.demoStatus = "nothing";
      await app.onFile(img());
      return;
    case "6":
      app.demoStatus = "not-this-print";
      await app.onFile(img());
      return;
    case "7":
      location.hash = "#about";
      return;
    case "4p":
      await app.onFile(pdf());
      await app.readPages({ from: 3, to: 4 });
      return;
    case "1c":
      await app.onFile(img("IMG_0412.jpg"));
      return;
    case "4b":
      // a phone numbers its pictures: read in natural order (IMG_2, IMG_9, IMG_10), whatever order they arrive in
      await app.onFiles([img("IMG_10.jpg"), img("IMG_2.jpg"), img("IMG_9.jpg")]);
      return;
  }
  await app.onFile(img());
  await app.updateComplete;
  await settle();
  const result = app.querySelector<OcrResult>("ocr-result");
  if (!result) return;
  if (s === "4r") {
    result.roman = true;
    return;
  }
  if (s === "4e") {
    result.querySelector<HTMLButtonElement>("[data-edit]")?.click();
    return;
  }
  if (s === "8" || s === "8n") {
    const line = s === "8" ? 2 : 0;
    const word = s === "8" ? "ជេតវនេ" : "តស្ស";
    const text = app.runs[0].lines[line]!.text;
    await app.onWord({ run: 0, line, offset: text.indexOf(word) + 1 });
    return;
  }
  if (s === "9" || s === "10") {
    const a = textNode(app, 1), b = textNode(app, 2);
    if (!a || !b) return;
    const r = document.createRange();
    r.setStart(a, a.data.indexOf("ឯកំ"));
    r.setEnd(b, b.data.length);
    const sel = getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);
    await settle(120);
    if (s === "10") {
      app.openAsk(sel.toString().trim(),
        getLang() === "km" ? "តើវត្តជេតពននៅឯណា ហើយអ្នកណាជាអ្នកថ្វាយ?" : "Where was the Jetavana, and who gave it?");
    }
  }
}
