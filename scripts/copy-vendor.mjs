// Copie les dépendances front (police + html2canvas) dans docs/ pour un
// fonctionnement 100 % hors-ligne, sans CDN.
import { copyFileSync, mkdirSync } from 'node:fs';

const copies = [
  ['node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2', 'docs/fonts/nunito.woff2'],
  ['node_modules/@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2', 'docs/fonts/fredoka.woff2'],
  ['node_modules/html2canvas/dist/html2canvas.min.js', 'docs/vendor/html2canvas.min.js'],
];

for (const [from, to] of copies) {
  mkdirSync(to.substring(0, to.lastIndexOf('/')), { recursive: true });
  copyFileSync(from, to);
  console.log(`✓ ${to}`);
}
