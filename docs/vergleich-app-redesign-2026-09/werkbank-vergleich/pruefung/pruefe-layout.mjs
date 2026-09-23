// Misst die Vorschau-Seite im echten Browser, statt Fehler zu erraten.
// Aufruf: node pruefe-layout.mjs <html-datei> <ausgabe-praefix>
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// ESM kennt NODE_PATH nicht - deshalb absolut einbinden.
const REPO = process.env.EH_REPO ?? '/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen';
const _pw = await import(pathToFileURL(resolve(REPO, 'node_modules/playwright-core/index.js')).href);
const chromium = _pw.chromium ?? _pw.default?.chromium;

const EXEC = process.env.EH_CHROMIUM
  ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;

const file = resolve(process.argv[2]);
const prefix = process.argv[3] ?? 'lauf';
const outDir = resolve(import.meta.dirname, 'bilder');
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'schmal-1120', width: 1120, height: 900 },
  { name: 'panel-1024', width: 1024, height: 800 },
  { name: 'eng-900', width: 900, height: 800 },
  { name: 'handy', width: 390, height: 844 },
];

const MESSUNG = () => {
  const fehler = [];
  const doc = document.documentElement;

  // 1) Waagerechter Ueberlauf: die haeufigste Ursache fuer "zerstoert".
  if (doc.scrollWidth > window.innerWidth + 1) {
    fehler.push({ art: 'ueberlauf-seite', masse: `${doc.scrollWidth} > ${window.innerWidth}` });
  }

  // 2) Einzelne Elemente, die aus dem Fenster ragen.
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > window.innerWidth + 1 || r.left < -1) {
      const k = el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName;
      fehler.push({
        art: 'ueberlauf-element',
        element: k,
        masse: `links ${Math.round(r.left)} rechts ${Math.round(r.right)} bei ${window.innerWidth}`,
      });
    }
  }

  // 3) Abgeschnittener Text (Inhalt breiter als sein Kasten, ohne Ueberlauf-Regel).
  for (const el of document.querySelectorAll('body *')) {
    const st = getComputedStyle(el);
    if (st.overflowX === 'auto' || st.overflowX === 'scroll' || st.textOverflow === 'ellipsis') continue;
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && el.children.length === 0) {
      fehler.push({ art: 'text-abgeschnitten', text: (el.textContent ?? '').trim().slice(0, 40), masse: `${el.scrollWidth} > ${el.clientWidth}` });
    }
  }

  // 4) Ueberlappungen zwischen Geschwistern im selben Fluss (ausserhalb von Flex/Grid erlaubt).
  const kandidaten = [...document.querySelectorAll('header, nav, aside, main, section, article, table')];
  for (let i = 0; i < kandidaten.length; i++) {
    for (let j = i + 1; j < kandidaten.length; j++) {
      const a = kandidaten[i], b = kandidaten[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      if (ra.width === 0 || rb.width === 0) continue;
      const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (x > 4 && y > 4) {
        fehler.push({ art: 'ueberlappung', a: a.className.split(' ')[0] || a.tagName, b: b.className.split(' ')[0] || b.tagName, masse: `${Math.round(x)}x${Math.round(y)} px` });
      }
    }
  }

  // 5) Sichtbare Elemente ohne Hoehe (Kollaps).
  for (const el of document.querySelectorAll('body *')) {
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.position === 'absolute' || st.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.height === 0 && r.width > 0 && el.children.length > 0) {
      fehler.push({ art: 'kollabiert', element: (el.className || el.tagName).toString().split(' ')[0] });
    }
  }

  // 6) Kontrast von Text gegen seinen Hintergrund (WCAG AA = 4.5 fuer Fliesstext).
  const zuRGB = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const hintergrund = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = zuRGB(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c;
      n = n.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length > 0) continue;
    const t = (el.textContent ?? '').trim(); if (!t) continue;
    const st = getComputedStyle(el);
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    const vg = zuRGB(st.color); const bg = hintergrund(el);
    if (!vg) continue;
    const l1 = lum(vg), l2 = lum(bg);
    const q = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const gross = parseFloat(st.fontSize) >= 24 || (parseFloat(st.fontSize) >= 18.66 && parseInt(st.fontWeight) >= 700);
    const soll = gross ? 3 : 4.5;
    if (q < soll) {
      fehler.push({ art: 'kontrast', text: t.slice(0, 40), masse: `${q.toFixed(2)} < ${soll}` });
    }
  }
  return fehler;
};

const browser = await chromium.launch({ executablePath: EXEC });
const ergebnis = {};

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  await page.goto('file://' + file);
  await page.waitForTimeout(350);
  const fehler = await page.evaluate(MESSUNG);
  await page.screenshot({ path: resolve(outDir, `${prefix}-${vp.name}.png`), fullPage: true });
  ergebnis[vp.name] = fehler;
  await page.close();
}

await browser.close();

// Bericht
let gesamt = 0;
for (const [vp, fehler] of Object.entries(ergebnis)) {
  const nach = {};
  for (const f of fehler) (nach[f.art] ??= []).push(f);
  console.log(`\n### ${vp}`);
  if (!fehler.length) { console.log('  keine Auffaelligkeit'); continue; }
  for (const [art, liste] of Object.entries(nach)) {
    const eindeutig = new Map();
    for (const f of liste) {
      const k = JSON.stringify([f.element, f.text, f.a, f.b, f.masse]);
      eindeutig.set(k, f);
    }
    console.log(`  ${art}: ${eindeutig.size}`);
    for (const f of [...eindeutig.values()].slice(0, 12)) {
      const teile = [f.element ?? f.text ?? '', f.a && f.b ? `${f.a} <-> ${f.b}` : '', f.masse ?? ''].filter(Boolean);
      console.log(`     - ${teile.join(' | ')}`);
    }
    gesamt += eindeutig.size;
  }
}
console.log(`\nGESAMT: ${gesamt}`);
