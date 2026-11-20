/** "What broke?" (/build phase 5): the reader's own failures, sent through the estate's track door (thonly.org/api/track,
 *  the same door the beacon uses; it labels the site from the browser's Origin and pushes every error to the founder).
 *
 *  ⛔⛔ THE TRACKER IS PART OF THE STORE. This page's promise is that the IMAGE and the TEXT never leave the device (Listen and
 *  Ask send only what the person chose, on their press). An error report must not become a third way out, so it is held by
 *  the body itself, not by care: every message is SCRUBBED of Khmer script (the text this page reads is Khmer script; nothing
 *  of it can ride along) and cut to 200 characters; only `where`, the error's name, the scrubbed message and the build's commit
 *  are sent. Proven on the bytes in test/report.test.ts (a message made of the passage itself sends none of it).
 *  No-op on local hosts, like the beacon; at most 5 reports per visit, each distinct message once. */
declare const __COMMIT__: string;

export type Where = "open" | "read" | "listen" | "uncaught";
const KHMER = /[ក-៿᧠-᧿​]+/g;
export const scrub = (s: string) => s.replace(KHMER, "…").replace(/\s+/g, " ").trim().slice(0, 200);

export interface Env { host: string; webdriver: boolean; timezone: string; device: string | null; admin: boolean; commit: string }
export function errorBody(where: Where, e: unknown, env: Env) {
  const err = e as { name?: unknown; message?: unknown } | null;
  return {
    event: "error",
    data: {
      where,
      name: scrub(String(err?.name ?? typeof e)).slice(0, 60),
      message: scrub(String(err?.message ?? e ?? "")),
      commit: env.commit,
    },
    deviceId: env.device ?? "anon",
    location: env.timezone,
    wd: env.webdriver,
    admin: env.admin,
  };
}

const LOCAL = (h: string) => h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]" || h === "" || h.endsWith(".local");
let sent = 0;
const seen = new Set<string>();

function env(): Env {
  let device: string | null = null, admin = /(?:^|;\s*)ma-admin=1(?:;|$)/.test(document.cookie);
  try { device = localStorage.getItem("ma-device"); if (localStorage.getItem("ma-admin") === "1") admin = true; } catch { /* storage blocked */ }
  let timezone = "";
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""; } catch { /* */ }
  return { host: location.hostname, webdriver: navigator.webdriver === true, timezone, device, admin, commit: typeof __COMMIT__ === "string" ? __COMMIT__ : "unknown" };
}

export function reportError(where: Where, e: unknown): void {
  try {
    if ((e as DOMException)?.name === "AbortError") return;   // the person pressed Stop: not a failure
    const en = env();
    if (LOCAL(en.host) || sent >= 5) return;
    const body = errorBody(where, e, en);
    const key = where + body.data.name + body.data.message;
    if (seen.has(key)) return;
    seen.add(key); sent++;
    void fetch("https://thonly.org/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
  } catch { /* a report must never break the page */ }
}

/** Anything thrown that no screen caught. */
export function watchUncaught(): void {
  addEventListener("error", (ev) => reportError("uncaught", (ev as ErrorEvent).error ?? (ev as ErrorEvent).message));
  addEventListener("unhandledrejection", (ev) => reportError("uncaught", (ev as PromiseRejectionEvent).reason));
}
