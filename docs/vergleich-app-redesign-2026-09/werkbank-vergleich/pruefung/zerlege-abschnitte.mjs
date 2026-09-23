// Zerlegt die Vorschau-Seite in ihre Abschnitte und legt je Abschnitt ein Bild ab.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = process.env.EH_REPO ?? '/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen';
const _pw = await import(pathToFileURL(resolve(REPO, 'node_modules/playwright-core/index.js')).href);
const chromium = _pw.chromium ?? _pw.default?.chromium;
const EXEC = process.env.EH_CHROMIUM
  ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;

const file = resolve(process.argv[2]);
const prefix = process.argv[3] ?? 'schnitt';
const breiten = (process.argv[4] ?? '1440').split(',').map(Number);
const outDir = resolve(import.meta.dirname, 'bilder');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: EXEC });
for (const breite of breiten) {
  const page = await browser.newPage({ viewport: { width: breite, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto('file://' + file);
  await page.waitForTimeout(300);
  const anzahl = await page.locator('.doc > *').count();
  console.log(`\n### Breite ${breite} — ${anzahl} Abschnitte`);
  for (let i = 0; i < anzahl; i++) {
    const el = page.locator('.doc > *').nth(i);
    const info = await el.evaluate((n) => ({
      cls: (n.className || '').toString(),
      h: Math.round(n.getBoundingClientRect().height),
      titel: (n.querySelector('h1,h2,h3')?.textContent ?? n.textContent ?? '').trim().slice(0, 42).replace(/\s+/g, ' '),
    }));
    const name = `${prefix}-${breite}-${String(i).padStart(2, '0')}-${(info.cls || 'block').replace(/[^\w-]/g, '')}.png`;
    console.log(`  [${i}] .${info.cls} — ${info.h}px — "${info.titel}"`);
    await el.screenshot({ path: resolve(outDir, name) });
  }
  await page.close();
}
await browser.close();
