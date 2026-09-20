#!/usr/bin/env node
/**
 * Write placeholder PWA icons (192/512 + apple-touch-icon) to public/.
 * Pure Node (zlib + a tiny PNG encoder) — no image libs needed.
 * Brand: solid navy with a white rounded "fin" accent.
 * Run before `vite build`:  node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
mkdirSync(publicDir, { recursive: true });

const NAVY = [0, 18, 51];       // #001233
const TEAL = [76, 201, 164];    // #4cc9a4
const WHITE = [255, 255, 255];

// tiny PNG encoder (8-bit RGBA, non-interlaced)
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function makePNG(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/** Simple brand mark: navy field + teal rising bar (a "fin"). */
function render(size) {
  const buf = Buffer.alloc(size * size * 4);
  const s = size;
  const cx = s / 2;

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      // inside a rounded-rect area -> navy
      const m = Math.min(s, s) / 2;
      const inRounded =
        x >= 0 && x < s && y >= 0 && y < s &&
        !((x < m * 0.18 && y < m * 0.18 && Math.hypot(x - m * 0.18, y - m * 0.18) > m * 0.18) ||
          (x > s - m * 0.18 && y < m * 0.18 && Math.hypot(x - (s - m * 0.18), y - m * 0.18) > m * 0.18) ||
          (x < m * 0.18 && y > s - m * 0.18 && Math.hypot(x - m * 0.18, y - (s - m * 0.18)) > m * 0.18) ||
          (x > s - m * 0.18 && y > s - m * 0.18 && Math.hypot(x - (s - m * 0.18), y - (s - m * 0.18)) > m * 0.18));
      const px = x / s;
      const py = y / s;

      let rgb = [0, 0, 0]; let a = 0;
      if (inRounded) {
        rgb = NAVY; a = 255;
        // teal "fin": rising bar from bottom-left
        const finTop = 0.62 - 0.42 * (0.5 - (py - 0.38));
        if (px > 0.22 && px < 0.46 && py > 0.34 && py < 0.86 && py > 0.66 - 0.55 * (px - 0.22)) {
          rgb = TEAL; a = 255;
        }
        // white tick mark
        if (px > 0.56 && px < 0.72 && py > 0.34 && py < 0.5) { rgb = WHITE; a = 255; }
      }
      const i = (y * s + x) * 4;
      buf[i] = rgb[0]; buf[i + 1] = rgb[1]; buf[i + 2] = rgb[2]; buf[i + 3] = a;
    }
  }
  return makePNG(size, buf);
}

const icons = [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180]
];
for (const [name, size] of icons) {
  writeFileSync(join(publicDir, name), render(size));
  console.log(`✓ ${name} (${size}x${size})`);
}
console.log('Icons written to public/.');