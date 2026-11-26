/** The only three things this page stores, each in this browser alone: the language, the theme and the reader choice.
 *  No image, no text, nothing about a person. Every storage call is wrapped: storage can be blocked (a private window,
 *  cleared site data) and the page must work the same without it.
 *  The FIRST language and theme are decided by public/boot.js before paint (no inline script: the CSP refuses one);
 *  this module takes over from there. */
import type { ModelId } from "../read/index";

export const KEYS = { lang: "ocr-lang", theme: "ocr-theme", model: "ocr-reader" } as const;

export const store = {
  get(k: string): string | null {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k: string, v: string): void {
    try { localStorage.setItem(k, v); } catch { /* blocked: the page still works */ }
  },
  del(k: string): void {
    try { localStorage.removeItem(k); } catch { /* blocked */ }
  },
};

const params = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
/** `?demo` swaps in the stand-in reader (src/read/index.ts) and allows the screen-check jumps (src/ui/demo.ts). */
export const DEMO = params.has("demo");
export const demoParam = (k: string): string | null => (DEMO ? params.get(k) : null);

// ── theme ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type ThemeChoice = "system" | "light" | "dark";
const darkQuery = typeof matchMedia !== "undefined" ? matchMedia("(prefers-color-scheme: dark)") : null;

export function themeChoice(): ThemeChoice {
  const forced = demoParam("theme");
  if (forced === "light" || forced === "dark") return forced;
  const v = store.get(KEYS.theme);
  return v === "light" || v === "dark" ? v : "system";
}
function paint() {
  const c = themeChoice();
  const dark = c === "dark" || (c === "system" && Boolean(darkQuery?.matches));
  document.documentElement.classList.toggle("dark", dark);
}
export function setTheme(c: ThemeChoice) {
  if (c === "system") store.del(KEYS.theme); else store.set(KEYS.theme, c);
  paint();
}
darkQuery?.addEventListener("change", paint);

// ── reader choice ─────────────────────────────────────────────────────────────────────────────────────────────────────
export function modelChoice(): ModelId {
  const m = store.get(KEYS.model); return m === "public" || m === "publicOther" ? m : "accurate";
}
export function setModel(m: ModelId) {
  if (m === "accurate") store.del(KEYS.model); else store.set(KEYS.model, m);
}
