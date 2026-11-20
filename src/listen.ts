/** Listen (F2): the selected passage, spoken by Azure's Khmer voices through our voice service. Contract for the screens.
 *  `available()` is false until the service exists — then the screens show no Listen button at all (a button that cannot
 *  work is never shown). */
export type Voice = "sreymom" | "piseth";
export function available(): boolean { return Boolean(import.meta.env.VITE_TTS_URL); }
export async function speak(_text: string, _voice: Voice, _signal?: AbortSignal): Promise<HTMLAudioElement> {
  throw new Error("the voice service is not set up yet");
}
