import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** The build's commit, in every error report (src/report.ts), so a failure can be tied to the build that had it. */
const COMMIT = (() => { try { return execSync("git rev-parse --short=12 HEAD").toString().trim(); } catch { return "unknown"; } })();

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
  define: { __COMMIT__: JSON.stringify(COMMIT) },
  build: {
    target: "es2022",
    // two entries, one site: / (English) and /km/ (the Khmer share link: its title, description and picture are Khmer).
    // km/index.html carries index.html's CSP byte for byte (test/pages.test.ts holds them equal); its asset paths are
    // absolute, so they resolve from /km/ as from /.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        km: fileURLToPath(new URL("./km/index.html", import.meta.url)),
      },
    },
    // ⛔ never inline an asset as a data: URI: the CSP allows fonts from 'self' only, so an inlined font would be refused
    assetsInlineLimit: 0,
  },
});
