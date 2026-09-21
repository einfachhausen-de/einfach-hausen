// Derives the App Store icon from the canonical brand SVG.
//
// Why a script and not a hand-made file: the store icon must be provably a
// *derivation* of `public/brand/einfachhausen-app-icon.svg`, never a second piece
// of artwork. Regenerating it from that one source keeps the provenance checkable
// for the design authority and for App Store review.
//
// The only differences from the canonical SVG are the ones the platform mandates:
//   1. 1024x1024 instead of 512x512 (Apple's required size),
//   2. square instead of the canonical `rx="112"` rounding, because iOS applies its
//      own mask — a pre-rounded icon would show dark corners behind it,
//   3. no alpha channel, because App Store Connect rejects transparent icons.
// The house mark, its stroke width, and both brand colours are unchanged.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceSvg = path.join(root, 'public', 'brand', 'einfachhausen-app-icon.svg');
const target = path.join(root, 'public', 'icons', 'app-store-1024.png');
const SIZE = 1024;

const svg = fs.readFileSync(sourceSvg, 'utf8');
// Fail loudly if the canonical source changes shape, so this derivation cannot
// silently keep emitting an icon that no longer matches the brand mark.
for (const expected of ['#064b38', '#a8d779', 'M118 241 256 122l138 119v151h-88v-94H206v94h-88z']) {
  if (!svg.includes(expected)) {
    throw new Error(`Canonical icon SVG no longer contains ${expected}; review this derivation.`);
  }
}

const square = svg.replace(/(<rect width="512" height="512") rx="112"/, '$1 rx="0"');
if (square === svg) throw new Error('Could not remove the corner rounding from the canonical SVG.');

const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;padding:0;width:${SIZE}px;height:${SIZE}px;background:#064b38;overflow:hidden}
svg{display:block;width:${SIZE}px;height:${SIZE}px}
</style>${square}`;

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
const shot = path.join(os.tmpdir(), `eh-app-store-${process.pid}.png`);
await page.screenshot({ path: shot });
await browser.close();

// Flatten to opaque RGB. Playwright always writes RGBA, and App Store Connect
// rejects an icon that carries an alpha channel even when it is fully opaque.
const { execFileSync } = await import('node:child_process');
const py = `
from PIL import Image
img = Image.open(${JSON.stringify(shot)}).convert('RGBA')
if img.size != (${SIZE}, ${SIZE}):
    raise SystemExit('unexpected size %s' % (img.size,))
bg = Image.new('RGB', img.size, (6, 75, 56))
bg.paste(img, mask=img.split()[3])
bg.save(${JSON.stringify(target)}, 'PNG')
`;
execFileSync('python3', ['-c', py]);
fs.rmSync(shot, { force: true });

const bytes = fs.statSync(target).size;
console.log(`wrote ${path.relative(root, target)} (${SIZE}x${SIZE}, ${(bytes / 1024).toFixed(1)} KB, RGB)`);
