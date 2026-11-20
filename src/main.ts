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
watchUncaught();
