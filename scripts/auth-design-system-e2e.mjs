#!/usr/bin/env node
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

const root = process.cwd();
// Browser discovery must not be macOS-only. This list used to hold two macOS app
// bundles only, so the suite threw "No Chromium browser found" on the canonical
// OCI VM and could never run there. Same order as
// scripts/public-navigation-e2e.mjs: the Playwright-resolved browser first, then
// explicit overrides, then the usual Linux locations.
const executablePath = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  typeof chromium.executablePath === 'function' ? chromium.executablePath() : '',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/opt/google/chrome/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
].filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!executablePath) throw new Error('No Chromium browser found; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH or CHROME_PATH');
if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) throw new Error('No production build found — run npm run build first');

const routes = [
  { name: 'login-owner', path: '/login', submit: '#btn-submit-login', register: false },
  { name: 'login-provider', path: '/login?role=provider', submit: '#btn-submit-login', register: false },
  { name: 'register-owner', path: '/register?role=homeowner', submit: '#btn-submit-register', register: true },
  { name: 'register-provider', path: '/register?role=provider', submit: '#btn-submit-register', register: true },
  { name: 'legacy-owner', path: '/register-owner', submit: '#btn-submit-register', register: true },
  { name: 'legacy-provider', path: '/register-pro', submit: '#btn-submit-register', register: true },
];
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 736, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
];
const freePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.unref();
  server.on('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    server.close(() => resolve(address.port));
  });
});
async function waitForServer(url, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready: ${url}`);
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const dbPath = path.join(os.tmpdir(), `eh-auth-design-${randomUUID()}.db`);
const nextBin = path.join(root, 'node_modules/next/dist/bin/next');
const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: root,
  env: { ...process.env, DATABASE_PATH: dbPath, NEXT_PUBLIC_APP_URL: base, AUTH_MODE: 'supabase', E2E_INSECURE_COOKIES: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let browser;
const results = [];
try {
  await waitForServer(`${base}/login`);
  browser = await chromium.launch({ headless: true, executablePath });
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: 'de-DE',
    });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${base}${route.path}`, { waitUntil: 'networkidle' });
      const submit = page.locator(route.submit);
      await submit.waitFor({ state: 'visible', timeout: 10000 });
      const data = await page.evaluate((submitSelector) => {
        const button = document.querySelector(submitSelector);
        const input = document.querySelector('input');
        const logo = document.querySelector('img[alt="einfachhausen"]');
        const panel = button?.closest('section');
        const buttonStyle = button ? getComputedStyle(button) : null;
        const inputStyle = input ? getComputedStyle(input) : null;
        const panelStyle = panel ? getComputedStyle(panel) : null;
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          h1Count: document.querySelectorAll('h1').length,
          logoSrc: logo?.getAttribute('src') || '',
          buttonHeight: button?.getBoundingClientRect().height || 0,
          buttonBg: buttonStyle?.backgroundColor || '',
          buttonRadius: Number.parseFloat(buttonStyle?.borderRadius || '999'),
          inputFont: Number.parseFloat(inputStyle?.fontSize || '0'),
          inputHeight: input?.getBoundingClientRect().height || 0,
          inputRadius: Number.parseFloat(inputStyle?.borderRadius || '999'),
          panelRadius: Number.parseFloat(panelStyle?.borderRadius || '0'),
        };
      }, route.submit);
      if (data.overflow > 1) throw new Error(`${viewport.name}/${route.name}: horizontal overflow ${data.overflow}px`);
      if (data.h1Count !== 1) throw new Error(`${viewport.name}/${route.name}: expected exactly one h1, got ${data.h1Count}`);
      if (!data.logoSrc.includes('/brand/logo-full.png') && !data.logoSrc.includes('/brand/LOGO_white.png')) throw new Error(`${viewport.name}/${route.name}: original EHLogo asset missing (${data.logoSrc})`);
      if (data.buttonHeight < 44) throw new Error(`${viewport.name}/${route.name}: submit target too short (${data.buttonHeight}px)`);
      if (data.buttonBg !== 'rgb(16, 82, 88)') throw new Error(`${viewport.name}/${route.name}: primary action is not canonical petrol (${data.buttonBg})`);
      if (data.buttonRadius > 8) throw new Error(`${viewport.name}/${route.name}: button radius exceeds design system (${data.buttonRadius}px)`);
      if (data.inputFont < 16) throw new Error(`${viewport.name}/${route.name}: input text below 16px (${data.inputFont}px)`);
      if (data.inputHeight < 48) throw new Error(`${viewport.name}/${route.name}: input target too short (${data.inputHeight}px)`);
      if (data.inputRadius > 8) throw new Error(`${viewport.name}/${route.name}: input radius exceeds design system (${data.inputRadius}px)`);
      if (data.panelRadius > 8) throw new Error(`${viewport.name}/${route.name}: panel radius exceeds design system (${data.panelRadius}px)`);

      const firstInput = page.locator('input').first();
      await firstInput.focus();
      const focus = await firstInput.evaluate((element) => {
        const style = getComputedStyle(element);
        return { width: Number.parseFloat(style.outlineWidth), offset: Number.parseFloat(style.outlineOffset) };
      });
      if (focus.width < 3 || focus.offset < 3) throw new Error(`${viewport.name}/${route.name}: canonical focus ring missing (${focus.width}/${focus.offset})`);

      if (route.register && viewport.width <= 736) {
        await page.waitForFunction(() => {
          const first = document.querySelector('#reg-first-name')?.getBoundingClientRect();
          const last = document.querySelector('#reg-last-name')?.getBoundingClientRect();
          return Boolean(first && last && last.top > first.bottom + 8);
        }, null, { timeout: 2000 });
        const stacked = await page.evaluate(() => {
          const first = document.querySelector('#reg-first-name')?.getBoundingClientRect();
          const last = document.querySelector('#reg-last-name')?.getBoundingClientRect();
          return Boolean(first && last && last.top > first.bottom + 8);
        });
        if (!stacked) throw new Error(`${viewport.name}/${route.name}: field grid did not stack`);
      }
      results.push({ viewport: viewport.name, route: route.name, ...data });
    }
    await context.close();
  }

  const interactionContext = await browser.newContext({ viewport: { width: 736, height: 1024 }, locale: 'de-DE' });
  const interactionPage = await interactionContext.newPage();
  await interactionPage.goto(`${base}/register?role=homeowner`, { waitUntil: 'networkidle' });
  await interactionPage.locator('#role-toggle-partner').click();
  await interactionPage.getByText('Als Handwerksbetrieb registrieren', { exact: true }).waitFor();
  if (!(await interactionPage.locator('#reg-business').isVisible())) throw new Error('role switch does not expose provider registration fields');

  await interactionPage.goto(`${base}/login`, { waitUntil: 'networkidle' });
  await interactionPage.locator('#btn-forgot-password').click();
  if (!(await interactionPage.locator('dialog[open]').isVisible())) throw new Error('forgot-password dialog does not open');
  await interactionPage.getByRole('button', { name: 'Dialog schließen' }).click();
  await interactionPage.locator('#link-datenschutz').click();
  if (!(await interactionPage.locator('dialog[open]').isVisible())) throw new Error('legal dialog does not open');
  await interactionPage.keyboard.press('Escape');
  if (await interactionPage.locator('dialog[open]').count()) throw new Error('legal dialog does not close with Escape');

  for (const route of [routes[0], routes[3]]) {
    await interactionPage.goto(`${base}${route.path}`, { waitUntil: 'networkidle' });
    await interactionPage.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const zoomData = await interactionPage.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      clipped: [...document.querySelectorAll('button')].some((button) => button.scrollWidth > button.clientWidth + 2 || button.scrollHeight > button.clientHeight + 2),
    }));
    if (zoomData.overflow > 1) throw new Error(`200%-text/${route.name}: horizontal overflow ${zoomData.overflow}px`);
    if (zoomData.clipped) throw new Error(`200%-text/${route.name}: button content is clipped`);
  }
  await interactionContext.close();

  console.log(JSON.stringify({ ok: true, checks: results.length, results }, null, 2));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server.exitCode === null) server.kill('SIGTERM');
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.rmSync(dbPath + suffix, { force: true }); } catch {}
  }
}
