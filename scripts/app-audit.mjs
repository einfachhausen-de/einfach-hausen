import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: 'mh_session', value: '663ef280760ff84757bfa0585f047af0da43fa5275867cfd1f9193a943db40f4', domain: 'localhost', path: '/' }]);
const page = await ctx.newPage();
import fs from 'node:fs';
fs.mkdirSync('/tmp/app-audit', { recursive: true });
for (const [name, path] of [['app-home','/app'],['app-hausmeister','/app/hausmeister'],['app-mein-haus','/app/home'],['app-jobs','/app/jobs'],['app-profile','/app/profile'],['app-more','/app/more'],['app-calendar','/app/calendar'],['app-messages','/app/messages'],['pro-home','/pro'],['pro-jobs','/pro/jobs']]) {
  try {
    await page.goto('http://localhost:3110' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/tmp/app-audit/${name}.png`, fullPage: true });
    console.log(name, page.url().replace('http://localhost:3110',''));
  } catch (e) { console.log(name, 'ERR', String(e).slice(0,90)); }
}
await browser.close();
