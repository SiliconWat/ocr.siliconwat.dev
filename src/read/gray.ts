/** An 8-bit grayscale image: one byte per pixel, row by row. The whole pipeline works on this, so the browser and the
 *  Node test harness read identical pixels (no canvas resampling or color management between the port and its test). */
export interface Gray { w: number; h: number; data: Uint8Array }

/** RGBA (canvas ImageData) → gray with Pillow's own formula, `convert("L")`, so a color photo grays exactly as pilot 3's did. */
export function fromRGBA(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number): Gray {
  const data = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < data.length; i++, j += 4) {
    data[i] = (rgba[j] * 19595 + rgba[j + 1] * 38470 + rgba[j + 2] * 7471 + 0x8000) >> 16;
  }
  return { w, h, data };
}

/** Area-average resize (each output pixel = the mean of the source area it covers). Used to make the half-size copy the
 *  line finder runs on (pilot 3 found lines on a 150-dpi image and cropped from a 300-dpi one) and to bring an image of
 *  any size to the scale the reader was measured at. */
export function resize(src: Gray, w: number, h: number): Gray {
  if (w === src.w && h === src.h) return src;
  const out = new Uint8Array(w * h), sx = src.w / w, sy = src.h / h;
  for (let y = 0; y < h; y++) {
    const y0 = y * sy, y1 = y0 + sy;
    for (let x = 0; x < w; x++) {
      const x0 = x * sx, x1 = x0 + sx;
      let sum = 0, area = 0;
      for (let yy = Math.floor(y0); yy < Math.min(Math.ceil(y1), src.h); yy++) {
        const fy = Math.min(y1, yy + 1) - Math.max(y0, yy);
        if (fy <= 0) continue;
        const row = yy * src.w;
        for (let xx = Math.floor(x0); xx < Math.min(Math.ceil(x1), src.w); xx++) {
          const f = (Math.min(x1, xx + 1) - Math.max(x0, xx)) * fy;
          if (f <= 0) continue;
          sum += src.data[row + xx] * f; area += f;
        }
      }
      out[y * w + x] = area ? Math.round(sum / area) : 255;
    }
  }
  return { w, h, data: out };
}

/** Binary PGM (P5) bytes, which Tesseract's image reader takes as is: the crop reaches the model with no re-encoding. */
export function toPGM(g: Gray): Uint8Array {
  const head = new TextEncoder().encode(`P5\n${g.w} ${g.h}\n255\n`);
  const out = new Uint8Array(head.length + g.data.length);
  out.set(head); out.set(g.data, head.length);
  return out;
}

export function fromPGM(bytes: Uint8Array): Gray {
  let i = 0; const tok: string[] = [];
  while (tok.length < 4) {
    while (bytes[i] === 0x20 || bytes[i] === 0x0a || bytes[i] === 0x0d || bytes[i] === 0x09) i++;
    if (bytes[i] === 0x23) { while (bytes[i] !== 0x0a) i++; continue; }
    let s = ""; while (bytes[i] > 0x20) s += String.fromCharCode(bytes[i++]);
    tok.push(s);
  }
  if (tok[0] !== "P5" || tok[3] !== "255") throw new Error("only 8-bit binary PGM");
  const w = +tok[1], h = +tok[2];
  return { w, h, data: bytes.slice(i + 1, i + 1 + w * h) };
}
