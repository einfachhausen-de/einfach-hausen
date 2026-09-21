import { chromium } from 'playwright-core';
const BASE = 'http://localhost:3110';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
import fs from 'node:fs';
fs.mkdirSync('/tmp/app-audit', { recursive: true });

// Register Test-User (owner)
await page.goto(BASE + '/register?role=homeowner', { waitUntil: 'networkidle' });
const stamp = Date.now();
await page.fill('input[name="firstName"]', 'Ana');
await page.fill('input[name="lastName"]', 'Design');
await page.fill('input[name="email"]', `ana.design.${stamp}@test.local`);
await page.fill('input[name="password"]', 'Test1234!');
await page.fill('input[name="postcode"]', '10115');
await page.click('button:has-text("Konto erstellen")');
await page.waitForTimeout(3000);
console.log('nach register:', page.url());

for (const [name, path] of [['app-home','/app'],['app-hausmeister','/app/hausmeister'],['app-home','/app/home'],['app-jobs','/app/jobs'],['app-profile','/app/profile'],['app-messages','/app/messages'],['app-more','/app/more']]) {
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `/tmp/app-audit/${name}.png`, fullPage: true });
    console.log(name, 'ok');
  } catch (e) { console.log(name, 'ERR', e.message.slice(0,80)); }
}
await browser.close();
