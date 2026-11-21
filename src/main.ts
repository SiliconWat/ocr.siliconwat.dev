/** ocr.siliconwat.dev — the screens. Fonts are self-hosted (the CSP allows fonts from this site only), and each font file
 *  carries a unicode-range, so a browser fetches only the scripts a page actually shows. */
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/noto-sans-khmer/400.css";
import "@fontsource/noto-sans-khmer/500.css";
import "@fontsource/noto-sans-khmer/600.css";
import "@fontsource/noto-serif-khmer/400.css";
import "@fontsource/noto-serif-khmer/500.css";
import "./styles.css";
import "./ui/app";
import { watchUncaught } from "./report";
import { registerWorker, takeShared } from "./share";
watchUncaught();
registerWorker();
// a picture shared from Android's share sheet: open it as if chosen
takeShared().then(async (files) => {
  if (!files.length) return;
  await customElements.whenDefined("ocr-app");
  (document.querySelector("ocr-app") as unknown as { onFiles(f: File[]): Promise<void> } | null)?.onFiles(files);
});
