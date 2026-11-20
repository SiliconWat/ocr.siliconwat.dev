"""One reader of this site's own numbers for the generators (build-icons.py, build-og.py), so nothing is typed twice:
colors from src/styles.css (@theme), the placeholder icon from src/ui/icons.ts, words from src/i18n.ts."""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_CSS = io.open(os.path.join(ROOT, "src", "styles.css"), encoding="utf-8").read()
_ICONS = io.open(os.path.join(ROOT, "src", "ui", "icons.ts"), encoding="utf-8").read()
_I18N = io.open(os.path.join(ROOT, "src", "i18n.ts"), encoding="utf-8").read()
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def color(name):
    m = re.search(r"--color-%s:\s*([^;]+);" % re.escape(name), _CSS)
    if not m:
        raise SystemExit("brand: src/styles.css has no --color-%s" % name)
    return m.group(1).strip()


def icon_glyph(c):
    """The PLACEHOLDER icon (not a mark): a page with three printed lines, in a 24-unit box."""
    r = re.search(r"ICON_RECT = \{ x: ([\d.]+), y: ([\d.]+), width: ([\d.]+), height: ([\d.]+), rx: ([\d.]+) \}", _ICONS)
    d = re.search(r'ICON_LINES = "([^"]+)"', _ICONS)
    if not r or not d:
        raise SystemExit("brand: src/ui/icons.ts lost ICON_RECT / ICON_LINES")
    x, y, w, h, rx = r.groups()
    return ('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="none" stroke="%s" stroke-width="1.8"/>'
            '<path d="%s" stroke="%s" stroke-width="1.8" stroke-linecap="round"/>' % (x, y, w, h, rx, c, d.group(1), c))


def words(key):
    """(English, Khmer) for an i18n key."""
    m = re.search(r'\b%s: \[\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\]' % re.escape(key), _I18N)
    if not m:
        raise SystemExit("brand: src/i18n.ts has no two-language entry %r" % key)
    return m.group(1), m.group(2)


def font(pkg, file):
    return os.path.join(ROOT, "node_modules", "@fontsource", pkg, "files", file)
