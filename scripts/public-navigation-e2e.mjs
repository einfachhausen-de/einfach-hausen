#!/usr/bin/env node
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

const root = process.cwd();
// Browser discovery must not be macOS-only. This script used to check three fixed
// paths and throw otherwise, so it could never run on the canonical OCI VM even
// though Chromium is installed there under PLAYWRIGHT_BROWSERS_PATH. It now resolves
// the Playwright-registered browser first (like scripts/e2e.mjs does) and keeps the
// explicit overrides and Linux paths as fallbacks.
function browserExecutable() {
  const bundled = typeof chromium.executablePath === 'function' ? chromium.executablePath() : '';
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    bundled,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('No Chromium browser found');
  return found;
}
const freePort = () => new Promise((resolve, reject) => {
  const server = net.createServer(); server.unref(); server.on('error', reject);
  server.listen(0, '127.0.0.1', () => { const address = server.address(); server.close(() => resolve(address.port)); });
});
async function waitForServer(url, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const response = await fetch(url); if (response.status < 500) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready: ${url}`);
}
if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  throw new Error('No production build found — run npm run build first');
}
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const dbPath = path.join(os.tmpdir(), `eh-public-nav-${randomUUID()}.db`);
const nextBin = path.join(root, 'node_modules/next/dist/bin/next');
const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: root,
  env: { ...process.env, DATABASE_PATH: dbPath, ADMIN_PASSWORD: `NavAdmin!${randomUUID()}`, SESSION_COOKIE_NAME: 'nav_session', NEXT_PUBLIC_APP_URL: base, AUTH_MODE: 'supabase', E2E_INSECURE_COOKIES: '1' },
  stdio: 'ignore',
});
let browser;
try {
  await waitForServer(`${base}/`);
  browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  const desktop = await browser.newContext({ viewport: { width: 1320, height: 900 }, locale: 'de-DE' });
  const page = await desktop.newPage();
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const services = page.locator('nav[aria-label="Hauptnavigation"] details').filter({ has: page.locator('summary', { hasText: 'Leistungen' }) });
  await services.locator('summary').click();
  if (!(await services.getAttribute('open')) && !(await services.evaluate((el) => el.hasAttribute('open')))) throw new Error('desktop Leistungen megamenu did not open');
  const menuHeading = services.getByRole('heading', { level: 2, name: 'Was steht bei dir an?' });
  if (await menuHeading.count() !== 1) throw new Error('desktop megamenu is missing the homeowner-first orientation heading');
  const menuCta = services.getByRole('link', { name: 'Anliegen beschreiben' });
  if (await menuCta.getAttribute('href') !== '/#anliegen') throw new Error('desktop megamenu owner CTA does not route to the intake');
  for (const href of ['/beratung', '/notfall', '/so-funktionierts#ansprechpartner']) {
    if (await services.locator(`a[href="${href}"]`).count() !== 1) throw new Error(`desktop megamenu missing quick path ${href}`);
  }
  const serviceLinks = services.locator('a[href^="/leistungen/"]');
  if (await serviceLinks.count() < 12) throw new Error('desktop megamenu exposes fewer than 12 service routes');
  await serviceLinks.first().focus();
  if (!(await serviceLinks.first().evaluate((el) => document.activeElement === el))) throw new Error('service link cannot receive keyboard focus');
  await page.goto(`${base}/leistungen/garten-aussenbereich`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: /Garten & Außenbereich/ }).waitFor();
  await page.goto(`${base}/beratung`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: /Erst einen Fachmann fragen/ }).waitFor();
  await desktop.close();

  const wide = await browser.newContext({ viewport: { width: 1945, height: 1057 }, locale: 'de-DE' });
  const wideLogin = await wide.newPage();
  await wideLogin.goto(`${base}/login`, { waitUntil: 'networkidle' });
  const wideGeometry = await wideLogin.evaluate(() => {
    const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect();
    const card = rect('.arena-card');
    const hero = rect('.arena-hero');
    const form = rect('#login-card-container');
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      cardWidth: card?.width || 0,
      cardLeft: card?.x || 0,
      heroLeft: hero?.x || 0,
      heroWidth: hero?.width || 0,
      formWidth: form?.width || 0,
    };
  });
  // The accepted wide auth screen is ONE centred composition: a ~1000px card
  // holding the form column and the trust panel. It replaced a full-bleed
  // two-column grid, which is what the earlier thresholds described - they asked
  // the trust panel for >=820px, i.e. for a layout that no longer exists, while
  // their sibling measured `.arena-auth`, which is only ever as wide as the
  // viewport. These assertions describe the card the design actually is, and add
  // the centring and the overflow that were never checked at this width.
  if (wideGeometry.cardWidth < 900) throw new Error(`wide auth card too narrow: ${wideGeometry.cardWidth}px`);
  if (wideGeometry.heroWidth < 400) throw new Error(`wide auth trust panel too narrow: ${wideGeometry.heroWidth}px`);
  if (wideGeometry.formWidth < 380) throw new Error(`wide auth login column too narrow: ${wideGeometry.formWidth}px`);
  const leftGap = wideGeometry.cardLeft;
  const rightGap = wideGeometry.viewportWidth - (wideGeometry.cardLeft + wideGeometry.cardWidth);
  if (Math.abs(leftGap - rightGap) > 2) throw new Error(`wide auth card is not centred: ${Math.round(leftGap)}px left vs ${Math.round(rightGap)}px right`);
  if (wideGeometry.heroLeft < wideGeometry.cardLeft || wideGeometry.heroLeft + wideGeometry.heroWidth > wideGeometry.cardLeft + wideGeometry.cardWidth + 1) {
    throw new Error('wide auth trust panel is not part of the auth card');
  }
  if (wideGeometry.documentWidth > wideGeometry.viewportWidth + 1) throw new Error(`wide auth screen overflows horizontally by ${wideGeometry.documentWidth - wideGeometry.viewportWidth}px`);
  await wide.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const phone = await mobile.newPage();
  await phone.goto(`${base}/`, { waitUntil: 'networkidle' });
  await phone.locator('summary[aria-label="Menü öffnen"]').click();
  const mobileServices = phone.locator('details').filter({ has: phone.locator('summary', { hasText: 'Leistungen' }) }).last();
  await mobileServices.locator('summary').click();
  await mobileServices.locator('a[href="/leistungen/heizung"]').waitFor();
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`mobile navigation overflows horizontally by ${overflow}px`);
  await mobileServices.locator('a[href="/leistungen/heizung"]').click();
  await phone.waitForURL('**/leistungen/heizung');
  await phone.getByRole('heading', { level: 1, name: /Heizung, Klima & Energie/ }).waitFor();
  await mobile.close();
  console.log(JSON.stringify({ ok: true, checks: ['desktop-megamenu', 'keyboard-focus', 'mobile-disclosure', 'service-deeplink', 'product-story-route', 'no-mobile-overflow', 'wide-auth-layout'] }, null, 2));
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGTERM');
  for (const suffix of ['', '-wal', '-shm']) { try { fs.rmSync(dbPath + suffix, { force: true }); } catch {} }
}
