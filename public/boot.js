// Runs before the page paints (a plain script in <head>, because the CSP refuses an inline one). Two jobs, nothing stored:
//   1. the language: the stored choice → the Khmer entry (/km/, the Khmer share link) → the browser's language → the
//      timezone, as a last tiebreak only (a Khmer reader in Long Beach has a Pacific timezone, so it only tips an English
//      or unknown browser);
//   2. the theme: the stored choice → the system's light or dark.
// src/ui/prefs.ts and src/i18n.ts take over from here (they read the result off <html>). Keys match prefs.ts KEYS.
(function () {
    var root = document.documentElement;
    function get(k) {
        try { return localStorage.getItem(k); } catch (e) { return null; }
    }
    var q = new URLSearchParams(location.search);
    var demo = q.has("demo");

    var lang = demo && (q.get("lang") === "km" || q.get("lang") === "en") ? q.get("lang") : get("ocr-lang");
    if (lang !== "km" && lang !== "en" && /^\/km(\/|$)/.test(location.pathname)) lang = "km";
    if (lang !== "km" && lang !== "en") {
        var nav = (navigator.language || "").toLowerCase();
        var tz = "";
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
        lang = nav.indexOf("km") === 0 || ((nav === "" || nav.indexOf("en") === 0) && tz === "Asia/Phnom_Penh") ? "km" : "en";
    }
    root.lang = lang;

    var theme = demo && (q.get("theme") === "light" || q.get("theme") === "dark") ? q.get("theme") : get("ocr-theme");
    var dark = theme === "dark" || (theme !== "light" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) root.classList.add("dark");
})();
