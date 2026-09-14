#!/usr/bin/env node
// T-0160 Website acceptance matrix: the 12 public website core routes across
// chromium/firefox/webkit with deterministic acceptance assertions (render,
// no overflow, zero runtime errors, 200s). T-0147: adds the register ->
// authenticated-onboarding journey per engine (unique ephemeral identity per
// run, created through the real /register form, cleaned up afterwards), so
// the public registration path is proven cross-browser, not just rendered.
import { chromium, firefox, webkit } from 'playwright-core';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

const root = process.cwd();
const routes = ['/', '/so-funktionierts', '/eigenheimbesitzer', '/leistungen', '/hausakte', '/partner', '/preise', '/ueber-uns', '/hilfe', '/kontakt', '/sicherheit', '/login'];
const engines = (process.env.MATRIX_ENGINES || 'chromium,firefox,webkit').split(',');
const viewport = { width: 390, height: 844 };
const runRegisterJourney = process.env.MATRIX_REGISTER !== '0';
const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.delqhi.com';
const svc = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const runId = randomUUID().replaceAll('-', '').slice(0, 10);

function browserExecutable(engine) {
  let bundled = '';
  try { bundled = (engine === 'firefox' ? firefox : engine === 'webkit' ? webkit : chromium).executablePath(); } catch {}
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    typeof bundled === 'string' && fs.existsSync(bundled) ? bundled : '',
    '/home/ubuntu/.cache/ms-playwright/chromium-1228/chrome-linux/chrome',
    '/home/ubuntu/.cache/ms-playwright/chromium-1223/chrome-linux/chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error(`No ${engine} browser executable found`);
  return found;
}

const freePort = () => new Promise((resolve, reject) => {
  const socket = net.createServer();
  socket.unref();
  socket.on('error', reject);
  socket.listen(0, '127.0.0.1', () => { const address = socket.address(); socket.close(() => resolve(typeof address === 'object' && address ? address.port : 0)); });
});

async function waitForServer(url, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const response = await fetch(url, { redirect: 'manual' }); if (response.status < 500) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready: ${url}`);
}

if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  console.error('No production build — run npm run build (release-gate builds it).');
  process.exit(2);
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const dbPath = path.join(os.tmpdir(), `eh-matrix-${randomUUID()}.db`);
const nextBin = path.join(root, 'node_modules/next/dist/bin/next');
const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: root,
  env: { ...process.env, DATABASE_PATH: dbPath, ADMIN_PASSWORD: `MatrixAdmin!${randomUUID()}`, SESSION_COOKIE_NAME: 'matrix_session', NEXT_PUBLIC_APP_URL: base, AUTH_MODE: 'supabase', E2E_INSECURE_COOKIES: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const failures = [];
const results = [];
try {
  await waitForServer(`${base}/`);
  for (const engine of engines) {
    const launcher = engine === 'firefox' ? firefox : engine === 'webkit' ? webkit : chromium;
    const browser = await launcher.launch({ headless: true, executablePath: browserExecutable(engine) });
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const engineErrors = [];
    page.on('pageerror', (error) => {
      // Documented navigation-transients (see scripts/e2e.mjs): Firefox aborts
      // React Flight streams during fast navigations; WebKit surfaces aborted
      // RSC prefetches as access-control errors under load. Next.js falls back
      // to a full browser navigation in both cases (graceful degradation), so
      // route-level assertions below decide truth — only unexpected engine
      // errors block the matrix.
      if (engine === 'firefox' && (error.message === 'Error in input stream' || /^Failed to fetch RSC payload/.test(error.message))) return;
      if (engine === 'webkit' && /_rsc=.*due to access control checks/.test(error.message)) return;
      engineErrors.push(`pageerror: ${error.message.slice(0, 140)}`);
    });
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (engine === 'firefox' && (/^Failed to fetch RSC payload .* Falling back to browser navigation/.test(text) || text === 'JSHandle@object')) return;
      if (/ERR_INTERNET_DISCONNECTED|Failed to load resource.*503/i.test(text)) return;
      engineErrors.push(`console: ${text.slice(0, 140)}`);
    });
    let engineFail = 0;
    for (const route of routes) {
      let status = 0;
      try {
        const response = await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 60000 });
        status = response ? response.status() : 0;
      } catch (error) {
        if (!/NS_BINDING_ABORTED|Timeout .*exceeded/.test(String(error))) { failures.push(`${engine} ${route}: ${String(error).slice(0, 120)}`); engineFail++; continue; }
        try { const retry = await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 60000 }); status = retry ? retry.status() : 0; }
        catch (retryError) { failures.push(`${engine} ${route}: retry ${String(retryError).slice(0, 120)}`); engineFail++; continue; }
      }
      if (status !== 200) { failures.push(`${engine} ${route}: HTTP ${status}`); engineFail++; continue; }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth).catch(() => false);
      if (overflow) { failures.push(`${engine} ${route}: horizontal overflow`); engineFail++; continue; }
      const h1 = await page.locator('h1').count().catch(() => 0);
      if (h1 < 1) { failures.push(`${engine} ${route}: no h1`); engineFail++; continue; }
    }
    if (engineErrors.length) { failures.push(`${engine}: ${engineErrors.length} runtime errors (first: ${engineErrors[0]})`); }
    results.push(`${engine}: ${routes.length - engineFail}/${routes.length} routes ok, ${engineErrors.length} runtime errors`);
    await context.close();

    // T-0147 register journey: real /register form -> authenticated /app/onboarding.
    if (runRegisterJourney) {
      if (!svc) { failures.push(`${engine} register: SUPABASE_SERVICE_KEY missing`); }
      else {
        const email = `matrix-register-${runId}-${engine}@e2e.einfachhausen.de`;
        const password = `MatrixReg!${randomUUID().replaceAll('-', '').slice(0, 14)}`;
        let identityId = '';
        try {
          const regContext = await browser.newContext({ viewport });
          const regPage = await regContext.newPage();
          await regPage.goto(`${base}/register`, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await regPage.fill('input[name="firstName"]', 'Matrix');
          await regPage.fill('input[name="lastName"]', 'Register');
          await regPage.fill('input[name="email"]', email);
          await regPage.fill('input[name="password"]', password);
          await regPage.fill('input[name="postcode"]', '10115');
          await regPage.fill('input[name="address"]', 'Matrixweg 1');
          await Promise.all([
            regPage.waitForURL(/\/app\/onboarding/, { timeout: 60000 }),
            regPage.click('button[type="submit"]'),
          ]);
          results.push(`${engine}: register journey ok -> ${new URL(regPage.url()).pathname}`);
          await regContext.close();
        } catch (error) {
          failures.push(`${engine} register journey: ${String(error).slice(0, 140)}`);
        }
        // Cleanup ephemeral identity (best effort; response gives the id on create —
        // we resolve by email via admin list to stay independent of form internals).
        // GoTrue's admin list-users reads only filter/page/per_page, so `?email=` is
        // ignored; page through and match the exact address client-side, otherwise a
        // user beyond the first page would never be cleaned up.
        try {
          const wanted = String(email).toLowerCase();
          for (let page = 1; page <= 20 && !identityId; page += 1) {
            const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
            if (!listResponse.ok) break;
            const listData = await listResponse.json().catch(() => ({}));
            const users = Array.isArray(listData?.users) ? listData.users : [];
            identityId = users.find((u) => String(u.email || '').toLowerCase() === wanted)?.id || '';
            if (users.length < 1000) break;
          }
          if (identityId) await fetch(`${supabaseUrl}/auth/v1/admin/users/${identityId}`, { method: 'DELETE', headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
        } catch {}
      }
    }

    await browser.close();
  }
} finally {
  server.kill('SIGTERM');
  for (const suffix of ['', '-wal', '-shm']) { try { fs.rmSync(dbPath + suffix, { force: true }); } catch {} }
}
console.log('Acceptance matrix (public website, 390x844):');
for (const line of results) console.log(`  ${line}`);
if (failures.length) { console.log(`FAILURES (${failures.length}):`); for (const failure of failures.slice(0, 10)) console.log(`  ${failure}`); process.exit(1); }
console.log('MATRIX PASS');
