// ⚠️ A COPY of legal.333.eco's release check, the one that decides whether a version is served: `missingFromServed` with its
// helpers (`ENT`, `norm`, `pageText`, and `mdToText` with `stripFrontmatter` from its markdown renderer), unchanged.
// legal.333.eco publishes a version of legal/terms.md only when this function finds every line of it in the page this site
// serves; the same function here fails this repo's build and tests first. When legal.333.eco's check changes, copy it here
// again; never edit only this copy.

// ── its markdown renderer's plain text ──────────────────────────────────────────────────────────────────────────────────
export function stripFrontmatter(md) {
    return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

// Plain text, for length checks and for llms.txt summaries.
export function mdToText(md) {
    return stripFrontmatter(md)
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#>*`_|]/g, " ")
        .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}

// ── the served check ───────────────────────────────────────────────────────────────────────────────────────────────────
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", reg: "®", trade: "™", hellip: "…" };
const norm = (s) => s.replace(/\s+/g, " ").trim();
export function pageText(html) {
    return norm(html
        .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, " ")
        .replace(/<\/?(p|div|h[1-6]|li|ul|ol|tr|td|th|table|thead|tbody|br|section|article|header|footer|main|nav|blockquote)\b[^>]*>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&([a-z]+);/gi, (e, n) => ENT[n.toLowerCase()] ?? e));
}

// ⛔ Only what is served is published: every line of the document's plain text must be found, word for word, in
// the page the service serves. Returns the lines that are missing (empty = served). Control: a one-byte change is refused.
export function missingFromServed(md, html) {
    const page = pageText(html), pieces = [];
    // Each block on its own (mdToText joins a whole document into one line): a table cell by cell, a list item by item.
    // A paragraph may run straight into a list with no blank line, so each LINE is classed: a table row (cell by cell), a list item
    // (alone), or paragraph text (joined until the next blank line, list item or row).
    for (const block of md.split(/\n\s*\n/)) {
        let para = [];
        const flush = () => { if (para.length) pieces.push(para.join(" ")); para = []; };
        for (const l of block.split("\n").filter((x) => x.trim())) {
            if (l.trim().startsWith("|")) { flush(); if (!/^\s*\|[\s|:-]+\|\s*$/.test(l)) pieces.push(...l.trim().replace(/^\||\|$/g, "").split("|")); }
            else if (/^\s*([-*]|\d+\.)\s/.test(l)) { flush(); pieces.push(l.replace(/^\s*([-*]|\d+\.)\s+/, "")); }
            else para.push(l);
        }
        flush();
    }
    // Compared on the characters that carry the words: spacing and emphasis marks (_ * `) are dropped on BOTH sides, because two
    // renderers differ there (one turned `__Host-you` into emphasis) and neither changes what the text says.
    const key = (t) => t.replace(/[\s_*`]+/g, "");
    const pageKey = key(page);
    return pieces.map((x) => norm(mdToText(x.trim()))).filter((l) => l.length > 0).filter((l) => !pageKey.includes(key(l)));
}
