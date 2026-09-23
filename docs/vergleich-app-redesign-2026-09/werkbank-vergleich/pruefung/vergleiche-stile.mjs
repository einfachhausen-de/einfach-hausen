// Vergleicht zwei Fassungen derselben Seite ueber berechnete Stile.
// Das findet Aenderungen, die im Quelltext-Diff untergehen.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = process.env.EH_REPO ?? '/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen';
const _pw = await import(pathToFileURL(resolve(REPO, 'node_modules/playwright-core/index.js')).href);
const chromium = _pw.chromium ?? _pw.default?.chromium;
const EXEC = process.env.EH_CHROMIUM
  ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;

const A = resolve(process.argv[2]);
const B = resolve(process.argv[3]);
const BREITE = Number(process.argv[4] ?? 1440);

const EIGENSCHAFTEN = [
  'display', 'gridTemplateColumns', 'flexWrap', 'gap', 'padding', 'margin',
  'background-color', 'border-top-width', 'border-top-color', 'border-radius',
  'box-shadow', 'color', 'font-size', 'font-weight', 'letter-spacing',
  'line-height', 'width', 'height', 'min-height', 'overflow-x', 'text-align',
];

const MESSEN = (eigenschaften) => {
  const ergebnis = {};
  const knoten = [...document.querySelectorAll('[class]')];
  for (const el of knoten) {
    const cls = (el.className || '').toString().trim();
    if (!cls || cls.includes(' ')) continue;          // nur eindeutige Einzelklassen
    if (ergebnis[cls]) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const st = getComputedStyle(el);
    const werte = {};
    for (const p of eigenschaften) werte[p] = st.getPropertyValue(p);
    werte['__breite'] = Math.round(r.width);
    werte['__hoehe'] = Math.round(r.height);
    ergebnis[cls] = werte;
  }
  return ergebnis;
};

const browser = await chromium.launch({ executablePath: EXEC });
const lies = async (datei) => {
  const page = await browser.newPage({ viewport: { width: BREITE, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto('file://' + datei);
  await page.waitForTimeout(300);
  const d = await page.evaluate(MESSEN, EIGENSCHAFTEN);
  await page.close();
  return d;
};

const alt = await lies(A);
const neu = await lies(B);
await browser.close();

console.log(`\nFassung A (aelter): ${A}`);
console.log(`Fassung B (aktuell): ${B}`);
console.log(`Breite: ${BREITE}\n`);

const alleKlassen = [...new Set([...Object.keys(alt), ...Object.keys(neu)])].sort();
let treffer = 0;
for (const cls of alleKlassen) {
  const a = alt[cls], b = neu[cls];
  if (!a) { console.log(`+ .${cls}  nur in B`); treffer++; continue; }
  if (!b) { console.log(`- .${cls}  nur in A`); treffer++; continue; }
  const unterschiede = [];
  for (const p of [...EIGENSCHAFTEN, '__breite', '__hoehe']) {
    if (a[p] !== b[p]) unterschiede.push(`      ${p}: A="${a[p]}"  B="${b[p]}"`);
  }
  if (unterschiede.length) {
    treffer++;
    console.log(`* .${cls}`);
    console.log(unterschiede.join('\n'));
  }
}
console.log(`\nKlassen mit Unterschied: ${treffer} von ${alleKlassen.length}`);
