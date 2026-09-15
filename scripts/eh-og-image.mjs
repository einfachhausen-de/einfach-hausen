/**
 * Social-Preview-Bilder (og:image) erzeugen — 1200x630, PNG.
 *
 * Warum ein Generator und nicht `opengraph-image.tsx`:
 * Satori/ImageResponse braucht Inline-Styles mit Literalfarben. Der Design-Check
 * (scripts/eh-design-check.mjs) verbietet `#hex`, `rgb()` und `style={...}` unter
 * `src/` und vergleicht gegen design/design-debt.json. Ein Generator in `scripts/`
 * umgeht das nicht, sondern haelt die Regel ein: er liest die Farben aus
 * packages/eh-design/src/tokens.json — derselben Quelle wie tokens.css.
 *
 * Ergebnis sind committete PNGs unter public/og/. Das Skript laeuft deshalb NICHT in
 * der CI, sondern nur wenn sich Text oder Tokens aendern.
 *
 *   node scripts/eh-og-image.mjs            # alle Bilder
 *   node scripts/eh-og-image.mjs leistungen # nur eines
 *
 * Chrome: EH_CHROMIUM_PATH, sonst macOS-Chrome, sonst der Linux-Pfad der VM.
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'packages/eh-design/src/tokens.json'), 'utf8'));
const c = tokens.color;
const fontB64 = readFileSync(resolve(root, 'src/fonts/InterVariable.woff2')).toString('base64');

const WIDTH = 1200;
const HEIGHT = 630;

/** Kopfzeile je Bild. Reihenfolge = Prioritaet. */
const CARDS = [
  { slug: 'default', eyebrow: 'Einfach Hausen', headline: 'Alles rund ums Eigenheim.', subline: 'Fragen klären, Menschen finden, Aufträge organisieren.' },
  { slug: 'leistungen', eyebrow: 'Leistungen', headline: 'Alles, was ein Haus braucht.', subline: 'Reparatur, Heizung, Dach, Garten, Sanierung, Wartung.' },
  { slug: 'lexikon', eyebrow: 'Lexikon', headline: 'Fachbegriffe, verständlich erklärt.', subline: 'Wärmepumpe, Energieausweis, Rückstauklappe, Schimmel.' },
  { slug: 'blog', eyebrow: 'Ratgeber', headline: 'Ratgeber rund ums Eigenheim.', subline: 'Problem, Optionen, Kostenrahmen, Entscheidung.' },
  { slug: 'partner', eyebrow: 'Für Betriebe', headline: 'Passende Anfragen. 0 % Provision.', subline: 'Regionales Qualitätsnetzwerk statt Lead-Marktplatz.' },
  { slug: 'hilfe', eyebrow: 'Hilfe', headline: 'Antworten, ehrlich und kurz.', subline: 'Ablauf, Kosten, Ansprechpartner, Hausakte.' },
  { slug: 'preise', eyebrow: 'Preise', headline: 'Preise ohne Kleingedrucktes.', subline: 'Hauskonto ab 0 € im Monat, monatlich kündbar.' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function html({ eyebrow, headline, subline }) {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<style>
  @font-face{font-family:'InterVar';src:url(data:font/woff2;base64,${fontB64}) format('woff2');font-weight:100 900;font-style:normal}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${WIDTH}px;height:${HEIGHT}px}
  body{
    font-family:'InterVar',ui-sans-serif,system-ui,sans-serif;
    background:${c.paper};color:${c.petrol};
    display:flex;flex-direction:column;justify-content:space-between;
    padding:72px 80px 64px;
  }
  .top{display:flex;align-items:center;justify-content:space-between}
  .eyebrow{display:flex;align-items:center;gap:14px;font-size:24px;font-weight:500;letter-spacing:.02em;color:${c.terra}}
  .eyebrow i{display:block;width:34px;height:3px;background:${c.terra}}
  .mark{width:78px;height:78px}
  h1{font-size:78px;line-height:1.06;letter-spacing:-.028em;font-weight:600;color:${c.petrol};max-width:1000px}
  .sub{font-size:31px;line-height:1.35;color:${c.secondary};max-width:900px;margin-top:26px}
  .foot{display:flex;align-items:center;justify-content:space-between;border-top:2px solid ${c.line};padding-top:26px}
  .url{font-size:27px;font-weight:500;color:${c.petrol}}
  .claim{font-size:23px;color:${c.secondary}}
</style></head>
<body>
  <div class="top">
    <div class="eyebrow"><i></i>${esc(eyebrow)}</div>
    <svg class="mark" viewBox="0 0 120 120" aria-hidden="true">
      <path d="M21 55.5 60 22l39 33.5v43H74V72H46v26.5H21z" fill="none"
            stroke="${c.petrol}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>
  </div>
  <div>
    <h1>${esc(headline)}</h1>
    <p class="sub">${esc(subline)}</p>
  </div>
  <div class="foot">
    <span class="url">einfachhausen.de</span>
    <span class="claim">Dein Haus. Einfach geregelt.</span>
  </div>
</body></html>`;
}

const candidates = [
  process.env.EH_CHROMIUM_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/home/ubuntu/.local/share/eh-brand-browser/chromium-1234/chrome-linux/chrome',
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) {
  console.error('Kein Chrome gefunden. EH_CHROMIUM_PATH setzen.');
  process.exit(1);
}

const only = process.argv[2];
const cards = only ? CARDS.filter((k) => k.slug === only) : CARDS;
if (!cards.length) {
  console.error(`Unbekanntes Motiv "${only}". Bekannt: ${CARDS.map((k) => k.slug).join(', ')}`);
  process.exit(1);
}

const outDir = resolve(root, 'public/og');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const written = [];
  for (const card of cards) {
    await page.setContent(html(card), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const path = resolve(outDir, `${card.slug}.png`);
    await page.screenshot({ path, type: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    const bytes = readFileSync(path).length;
    // Ein leeres/abgeschnittenes Bild ist der wahrscheinlichste stille Fehler.
    if (bytes < 5000) throw new Error(`${card.slug}.png ist verdaechtig klein (${bytes} B) — Schrift geladen?`);
    written.push({ slug: card.slug, bytes });
    console.log(`${card.slug.padEnd(12)} ${String(bytes).padStart(7)} B`);
  }
  writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify({ width: WIDTH, height: HEIGHT, images: written }, null, 2) + '\n');
  console.log(`\nEH_OG_IMAGES_OK — ${written.length} Bild(er) in public/og/`);
} finally {
  await browser.close();
}
