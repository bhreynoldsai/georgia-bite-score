// Rasterize public/icon.svg into every PNG size the web app and the iOS
// wrapper need. Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const SRC = fileURLToPath(new URL('../public/icon.svg', import.meta.url));
const OUT = fileURLToPath(new URL('../public/', import.meta.url));

mkdirSync(OUT, { recursive: true });

const targets = [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-1024.png', 1024], // source for @capacitor/assets / App Store icon
];

for (const [name, size] of targets) {
  await sharp(SRC, { density: Math.ceil((size / 512) * 72) * 4 })
    .resize(size, size)
    .png()
    .toFile(OUT + name);
  console.log(`${name} (${size}x${size})`);
}
