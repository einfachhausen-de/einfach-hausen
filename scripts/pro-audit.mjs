import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: 'mh_session', value: '77b67b47c2e17b83ab8524cd87d13aae049a8e394f084f931dfac1561eb6cfd2', domain: 'localhost', path: '/' }]);
const page = await ctx.newPage();
for (const [name, path] of [['pro-home','/pro'],['pro-jobs','/pro/jobs'],['pro-leads','/pro/leads'],['pro-messages','/pro/messages'],['pro-plans','/pro/plans'],['pro-calendar','/pro/calendar'],['pro-invoices','/pro/invoices'],['pro-profile','/pro/profile']]) {
  try {
    await page.goto('http://localhost:3110' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/tmp/app-audit/${name}.png`, fullPage: true });
    console.log(name, page.url().split('3110')[1]);
  } catch (e) { console.log(name, 'ERR', String(e).slice(0,90)); }
}
await browser.close();
