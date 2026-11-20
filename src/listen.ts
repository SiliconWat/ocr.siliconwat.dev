/** Listen (F2): the selected passage, spoken by Azure's Khmer voices through our voice service, tts.siliconwat.dev.
 *  `available()` is false until the service is live and the build names it (VITE_TTS_URL) — the screens then show no Listen
 *  button at all (a button that cannot work is never shown). Only the selected words are sent, and only on the press.
 *  ⚠️ When it is switched on, the page's CSP adds the service to connect-src and `blob:` to media-src. */
export type Voice = "sreymom" | "piseth";
const URL_ = import.meta.env.VITE_TTS_URL as string | undefined;
export function available(): boolean { return Boolean(URL_); }

export async function speak(text: string, voice: Voice, signal?: AbortSignal): Promise<HTMLAudioElement> {
  if (!URL_) throw new Error("the voice service is not set up yet");
  const r = await fetch(`${URL_.replace(/\/$/, "")}/speak`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voice }), signal,
  });
  if (!r.ok) throw new Error(await r.text().catch(() => "The voice could not read this passage."));
  const audio = new Audio(URL.createObjectURL(await r.blob()));
  audio.addEventListener("ended", () => URL.revokeObjectURL(audio.src), { once: true });
  return audio;
}
