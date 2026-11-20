import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";

/** index.html carries the page's Content-Security-Policy (the privacy property: nothing but this site, plus the beacon's
 *  two hosts). The DEV server injects CSS as <style> elements for hot reload, which `style-src 'self'` refuses, so
 *  `vite` (serve) alone drops the meta. `vite build` and `vite preview` keep it exactly as written. */
function devWithoutCsp(): Plugin {
  return {
    name: "dev-without-csp",
    apply: "serve",
    transformIndexHtml: (html) => html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, ""),
  };
}

export default defineConfig({
  plugins: [tailwindcss(), devWithoutCsp()],
  build: {
    target: "es2022",
    // ⛔ never inline an asset as a data: URI: the CSP allows fonts from 'self' only, so an inlined font would be refused
    assetsInlineLimit: 0,
  },
});
