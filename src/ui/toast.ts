/** The one toast for the whole site, plus the two small acts that report through it (copy, download).
 *  It says what just happened and then goes by itself (about 4 s; a problem about 7 s), and its words are cleared:
 *  ⛔ never a sentence left in the page reporting what just happened. role="status", polite, present from the start so a
 *  screen reader hears each message. */
let el: HTMLDivElement | null = null;
let timer = 0;

export function mountToast() {
  if (el) return;
  el = document.createElement("div");
  el.id = "toast";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-atomic", "true");
  el.className =
    "pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[calc(100%-40px)] rounded-btn bg-ink px-16 py-11 " +
    "text-center text-tool font-mid text-bg shadow-bar opacity-0 transition-opacity duration-200 motion-reduce:transition-none";
  document.body.append(el);
}

export function toast(text: string, problem = false) {
  mountToast();
  const t = el!;
  window.clearTimeout(timer);
  t.textContent = text;
  t.classList.replace("opacity-0", "opacity-100");
  timer = window.setTimeout(() => {
    t.classList.replace("opacity-100", "opacity-0");
    timer = window.setTimeout(() => { t.textContent = ""; }, 250);
  }, problem ? 7000 : 4000);
}

/** Copies text; true if it worked. The fallback covers a browser without the async clipboard (or one that refuses it). */
export async function copyText(s: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(s);
    return true;
  } catch { /* fall through */ }
  const ta = document.createElement("textarea");
  ta.value = s;
  ta.setAttribute("readonly", "");
  ta.className = "pointer-events-none fixed top-0 left-0 opacity-0";
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  ta.remove();
  return ok;
}

/** Hands the person a .txt file made here. The link is never put in the page (so nothing counts it as a click). */
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
