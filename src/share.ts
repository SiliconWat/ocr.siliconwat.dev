/** The service worker (scripts/sw.template.js): registered in production, and the hand-off of a picture SHARED from Android's
 *  share sheet. The worker holds the shared files in this device's storage under /__share/<n>; this takes them, DELETES them,
 *  clears ?share= from the address, and opens them as if chosen. Nothing leaves the device. */
const INBOX = "share-inbox";

export function registerWorker(): void {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
}

export async function takeShared(): Promise<File[]> {
  const n = Number(new URLSearchParams(location.search).get("share") ?? "0");
  if (!n || !("caches" in self)) return [];
  const files: File[] = [];
  try {
    const c = await caches.open(INBOX);
    for (let i = 0; i < n; i++) {
      const r = await c.match(`/__share/${i}`); if (!r) continue;
      files.push(new File([await r.blob()], decodeURIComponent(r.headers.get("x-name") ?? `shared-${i}`), { type: r.headers.get("content-type") ?? "" }));
    }
    await caches.delete(INBOX);
  } catch { /* storage blocked: nothing to take */ }
  history.replaceState(history.state, "", location.pathname);
  return files;
}
