
import { chromium } from 'playwright-core';
const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const base = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ executablePath: CHROME });
const routes = (process.argv[2] || '').split(',').filter(Boolean);
let bad = 0;
for (const user of ['kunde','handwerker']) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
  await page.click(user==='kunde' ? '#btn-demo-kunde' : '#btn-demo-handwerker');
  await page.waitForURL(u => !u.pathname.startsWith('/login'));
  await page.waitForTimeout(1200);
  for (const rt of routes) {
    const scope = user==='kunde' ? rt.startsWith('/app')||rt==='/notifications' : rt.startsWith('/pro');
    if (!scope) continue;
    let status = 0;
    try { const res = await page.goto(`${base}${rt}`, { waitUntil: 'domcontentloaded' }); status = res ? res.status() : 0; }
    catch (e) { console.log('nav-err', user, rt, String(e.message).split('\n')[0]); continue; }
    await page.waitForTimeout(900);
    const mainH = await page.evaluate(() => (document.querySelector('main')?.getBoundingClientRect().height) || 0);
    const sideVisible = await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Unternavigation"]'); if(!a) return false; const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    if (status >= 400 || mainH < 100) { console.log('SUSPECT', user, rt, status, 'mainH=', Math.round(mainH)); bad++; }
    else console.log('OK', user, rt, 'mainH=' + Math.round(mainH), 'werkbank-side=' + sideVisible);
  }
  console.log(user, 'pageerrors:', errs.filter(e=>!e.includes('Transition')).length);
  await page.close();
}
console.log('SUSPECTS:', bad);
await browser.close();
