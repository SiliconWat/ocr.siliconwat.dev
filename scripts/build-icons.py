#!/usr/bin/env python3
"""The favicon set and the web app manifest, from the PLACEHOLDER icon (src/ui/icons.ts) and the colors (src/styles.css).

    python3 scripts/build-icons.py

Writes public/: favicon.svg · favicon-96x96.png · apple-touch-icon.png (180) · icon-192.png · icon-512.png · site.webmanifest.
The PNGs are headless-Chrome screenshots of one tile, so they cannot drift from the SVG. Adapted from the drawings' own
build-icons.py (demo.siliconwat.dev). ⚠️ A placeholder until Silicon Wat's own mark is settled; never the B-Emblem
(HeartBank's mark). When the mark is settled, change ICON_RECT/ICON_LINES in src/ui/icons.ts and rerun this.
"""
import io, json, os, subprocess, sys, tempfile
from brand import CHROME, ROOT, color, icon_glyph, words

OUT = os.path.join(ROOT, "public")
BG, ACCENT = color("l-bg"), color("accent-light")
GLYPH = icon_glyph(ACCENT)

svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="%s"/>%s</svg>'
       % (BG, GLYPH))
io.open(os.path.join(OUT, "favicon.svg"), "w", encoding="utf-8").write(svg + "\n")

if not os.path.exists(CHROME):
    sys.exit("Chrome not found at %s" % CHROME)
for name, px, pad in (("favicon-96x96.png", 96, 0), ("apple-touch-icon.png", 180, .12), ("icon-192.png", 192, .12),
                      ("icon-512.png", 512, .12)):
    tile = ('<!doctype html><html><body style="margin:0;background:%s">'
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s %s %s %s" width="%d" height="%d">%s</svg></body></html>'
            % (BG, -24 * pad, -24 * pad, 24 * (1 + 2 * pad), 24 * (1 + 2 * pad), px, px, GLYPH))
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "t.html")
        io.open(src, "w", encoding="utf-8").write(tile)
        subprocess.run(["nice", "-n", "10", CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                        "--force-device-scale-factor=1", "--user-data-dir=" + os.path.join(tmp, "prof"),
                        "--window-size=%d,%d" % (px, px), "--screenshot=" + os.path.join(OUT, name), "file://" + src],
                       check=True, capture_output=True)
    print("%-22s %6d bytes" % (name, os.path.getsize(os.path.join(OUT, name))))

title, _ = words("title")
lede, _ = words("lede")
manifest = {
    "name": "ocr.siliconwat.dev",
    "short_name": "ocr",
    "description": "%s. %s" % (title, lede),
    "lang": "en",
    "start_url": "/", "scope": "/", "display": "standalone",
    "background_color": BG, "theme_color": ACCENT,
    "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
              {"src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml"}],
}
io.open(os.path.join(OUT, "site.webmanifest"), "w", encoding="utf-8").write(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print("site.webmanifest written")
