// Génère les icônes PNG à partir de docs/icons/icon.svg (optionnel, nécessite Playwright).
//   node scripts/generate-icons.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const svg = readFileSync('docs/icons/icon.svg', 'utf8');
// Version plein cadre (fond carré) pour maskable / Apple
const fullBleed = svg.replace('rx="116"', 'rx="0"');
const maskable = fullBleed
  .replace('<g transform="translate(256 278)">', '<g transform="translate(256 262) scale(.8)">')
  .replace(/<path d="M400 70[^>]+>/, '')
  .replace(/<path d="M408 384[^>]+>/, '');

const jobs = [
  [svg, 192, 'docs/icons/icon-192.png', true],
  [svg, 512, 'docs/icons/icon-512.png', true],
  [maskable, 512, 'docs/icons/icon-maskable-512.png', false],
  [fullBleed, 180, 'docs/icons/apple-touch-icon.png', false],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [markup, size, out, transparent] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:${transparent ? 'transparent' : '#33211A'}">${markup.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: out, omitBackground: transparent });
  console.log(`✓ ${out}`);
}
await browser.close();
