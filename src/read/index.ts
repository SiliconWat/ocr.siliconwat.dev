/** What the screens import. The real reader is used unless the URL carries `?demo` (the stand-in, for screen checks). */
import type { Reader } from "./types";
import { fakeReader } from "./fake";
export type * from "./types";
export { toRoman } from "./roman";

const demo = typeof location !== "undefined" && new URLSearchParams(location.search).has("demo");
let real: Reader | null = null;
export async function getReader(): Promise<Reader> {
  if (demo) return fakeReader;
  if (!real) real = (await import("./reader")).reader;
  return real;
}
