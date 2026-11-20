#!/usr/bin/env python3
"""The link-preview cards, 1200x630: og.png (English) and og-km.png (Khmer).

    python3 scripts/build-og.py

Rendered by headless Chrome from this site's own colors (src/styles.css), words (src/i18n.ts: the page's title and lede,
exactly as drawn) and SELF-HOSTED fonts (node_modules/@fontsource, embedded, so no network is touched). Adapted from the
drawings' build-og.py (demo.siliconwat.dev), which used Google Fonts and a serif title; this one uses the page's own faces.
"""
import base64, io, os, subprocess, sys, tempfile
from brand import CHROME, ROOT, color, font, words

FACES = [("IBM Plex Sans", 400, "ibm-plex-sans", "ibm-plex-sans-latin-400-normal.woff2"),
         ("IBM Plex Sans", 400, "ibm-plex-sans", "ibm-plex-sans-latin-ext-400-normal.woff2"),
         ("IBM Plex Sans", 600, "ibm-plex-sans", "ibm-plex-sans-latin-600-normal.woff2"),
         ("IBM Plex Sans", 600, "ibm-plex-sans", "ibm-plex-sans-latin-ext-600-normal.woff2"),
         ("IBM Plex Mono", 400, "ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff2"),
         ("Noto Sans Khmer", 400, "noto-sans-khmer", "noto-sans-khmer-khmer-400-normal.woff2"),
         ("Noto Sans Khmer", 600, "noto-sans-khmer", "noto-sans-khmer-khmer-600-normal.woff2"),
         ("Noto Serif Khmer", 400, "noto-serif-khmer", "noto-serif-khmer-khmer-400-normal.woff2")]


def faces():
    out = []
    for fam, w, pkg, f in FACES:
        b64 = base64.b64encode(io.open(font(pkg, f), "rb").read()).decode()
        out.append("@font-face{font-family:'%s';font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, w, b64))
    return "".join(out)


SHELL = """<!doctype html><html lang="{LANG}"><head><meta charset="utf-8"><style>{FACES}
  *{box-sizing:border-box;margin:0}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{background:{BG};color:{INK};font-family:"IBM Plex Sans","Noto Sans Khmer",sans-serif;
       display:flex;flex-direction:column;justify-content:center;padding:0 92px 40px;position:relative;-webkit-font-smoothing:antialiased}
  body::before{content:"";position:absolute;left:-160px;bottom:-260px;width:760px;height:760px;border-radius:50%;
       background:radial-gradient(circle,color-mix(in oklab,{ACCENT} 22%,transparent),transparent 62%)}
  .inner{position:relative}
  .pali{font-family:"Noto Serif Khmer",serif;font-size:40px;line-height:1.6;color:{ACCENT};margin-bottom:14px}
  h1{font-weight:600;font-size:{H1}px;letter-spacing:{TRACK};line-height:{LH};margin-bottom:24px}
  p{font-size:{P}px;line-height:{PLH};color:{DIM};max-width:{MAX}}
  .foot{position:absolute;left:92px;bottom:56px;display:flex;align-items:center;gap:14px;
        font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:22px;color:{ACCENT}}
  .rule{width:52px;height:2px;background:{ACCENT};opacity:.5}
</style></head><body>
<div class="inner"><div class="pali">ឯវំ មេ សុតំ ។</div><h1>{TITLE}</h1><p>{LEDE}</p></div>
<div class="foot"><span class="rule"></span>ocr.siliconwat.dev</div>
</body></html>"""


def main():
    if not os.path.exists(CHROME):
        sys.exit("Chrome not found at %s" % CHROME)
    t_en, t_km = words("title")
    l_en, l_km = words("lede")
    common = {"{FACES}": faces(), "{BG}": color("d-bg"), "{INK}": color("d-ink"), "{DIM}": color("d-ink-dim"),
              "{ACCENT}": color("accent-dark")}
    cards = {
        "og.png": {"{LANG}": "en", "{TITLE}": t_en, "{LEDE}": l_en, "{H1}": "72", "{TRACK}": "-.022em", "{LH}": "1.08",
                   "{P}": "29", "{PLH}": "1.5", "{MAX}": "880px"},
        "og-km.png": {"{LANG}": "km", "{TITLE}": t_km, "{LEDE}": l_km, "{H1}": "60", "{TRACK}": "0", "{LH}": "1.45",
                      "{P}": "26", "{PLH}": "1.7", "{MAX}": "940px"},
    }
    for name, vals in cards.items():
        html = SHELL
        for k, v in {**common, **vals}.items():
            html = html.replace(k, v)
        with tempfile.TemporaryDirectory() as tmp:
            src = os.path.join(tmp, "card.html")
            io.open(src, "w", encoding="utf-8").write(html)
            out = os.path.join(ROOT, "public", name)
            subprocess.run(["nice", "-n", "10", CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                            "--force-device-scale-factor=1", "--window-size=1200,630", "--virtual-time-budget=3000",
                            "--user-data-dir=" + os.path.join(tmp, "prof"), "--screenshot=" + out, "file://" + src],
                           check=True, capture_output=True)
            print("%-12s %7d bytes" % (name, os.path.getsize(out)))


if __name__ == "__main__":
    main()
