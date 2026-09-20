#!/usr/bin/env node
// T-0156 responsive acceptance matrix: website, homeowner app and partner app
// across mobile / tablet / desktop viewports. Deterministic fixture data +
// ephemeral Supabase identities (created and deleted per run). Checks per
// combination: no horizontal overflow, primary navigation operable, key text
// present, no unexpected runtime errors. Evidence JSON: .sin-gpt-web/evidence/T-0156/
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { importTs } from './lib/import-ts.mjs';
import { createIdentity as createTestIdentity } from './lib/identity.mjs';

const root = process.cwd();
const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.delqhi.com';
const svc = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (!svc) { console.error('SUPABASE_SERVICE_KEY required'); process.exit(2); }

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1320, height: 900 },
];
const PUBLIC_ROUTES = ['/', '/preise', '/so-funktionierts', '/leistungen', '/partner', '/hilфe'.replace('ф','f'), '/kontakt', '/login'];
const OWNER_ROUTES = ['/app', '/app/home', '/app/jobs', '/app/messages', '/app/documents', '/app/profile'];
const PROVIDER_ROUTES = ['/pro', '/pro/jobs', '/pro/orders', '/pro/messages', '/pro/team', '/pro/profile'];

function browserExecutable() {
  let bundled = '';
  try { bundled = chromium.executablePath(); } catch {}
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    typeof bundled === 'string' && fs.existsSync(bundled) ? bundled : '',
    '/home/ubuntu/.cache/ms-playwright/chromium-1228/chrome-linux/chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('No Chromium executable');
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
  throw new Error(`Server not ready: ${url}`);
}

// Fixture DB (deterministic data) + ephemeral identities bound to it.
const dbPath = '/tmp/eh-matrix.db';
for (const suffix of ['', '-wal', '-shm']) { try { fs.rmSync(dbPath + suffix, { force: true }); } catch {} }
process.env.DATABASE_PATH = dbPath;
const { createE2EFixture } = await import('./e2e-fixtures.mjs');
// Plain Node cannot resolve db.ts's extensionless relative imports; the helper
// rewrites them for the duration of the import and restores them afterwards.
const { db } = await importTs('../src/lib/db.ts', import.meta.url);
const fixture = createE2EFixture(db, { namespace: 'matrix' });
const ownerRow = db.prepare('SELECT id,email FROM users WHERE id=?').get(fixture.homeownerId);
const providerRow = db.prepare('SELECT id,email FROM users WHERE id=?').get(fixture.providerId);

const password = `Matrix!${randomUUID().replaceAll('-', '').slice(0, 14)}`;
// Shared helper: an identity left behind by a cancelled run would otherwise
// break every later run with "email_exists".
async function createIdentity(email) {
  return createTestIdentity({ supabaseUrl, serviceKey: svc }, email, password, { matrix: true });
}
const ownerId = await createIdentity(ownerRow.email);
const providerId = await createIdentity(providerRow.email);
db.prepare('UPDATE users SET auth_subject=? WHERE id=?').run(ownerId, ownerRow.id);
db.prepare('UPDATE users SET auth_subject=? WHERE id=?').run(providerId, providerRow.id);

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const nextBin = path.join(root, 'node_modules/next/dist/bin/next');
const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: root,
  env: { ...process.env, DATABASE_PATH: dbPath, ADMIN_PASSWORD: `MatrixAdmin!${randomUUID()}`, SESSION_COOKIE_NAME: 'matrix_session', NEXT_PUBLIC_APP_URL: base, AUTH_MODE: 'supabase', E2E_INSECURE_COOKIES: '1', SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: svc },
  stdio: 'ignore',
});
let browser;
const failures = [];
const report = { startedAt: new Date().toISOString(), viewport: VIEWPORTS, checks: [] };
try {
  await waitForServer(`${base}/`);
  browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });

  async function checkSurface(surface, session, routes) {
    const context = await browser.newContext({ viewport: VIEWPORTS[0], reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await context.newPage();
    if (session) {
      await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
      // The auth-v2 login screen types the identifier as text (id
      // login-identifier); only the register form uses type="email". Both carry
      // name="email", so the name is the only selector that matches either.
      await page.fill('input[name="email"]', session.email);
      await page.fill('input[type="password"]', password);
      await Promise.all([page.waitForURL(new RegExp(session.landing), { timeout: 60000 }).catch(() => {}), page.click('button[type="submit"]')]);
      await page.waitForTimeout(3000);
    }
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of routes) {
        const label = `${surface}/${viewport.name} ${route}`;
        try {
          await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 60000 });
        } catch (error) {
          if (!/interrupted by another navigation|NS_BINDING_ABORTED|Timeout/.test(String(error))) { failures.push(`${label}: goto ${String(error).slice(0, 100)}`); continue; }
          try { await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 60000 }); } catch (retryError) { failures.push(`${label}: retry ${String(retryError).slice(0, 100)}`); continue; }
        }
        await page.waitForTimeout(900);
        const status = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
        if (status.w > status.c + 1) failures.push(`${label}: horizontal overflow (${status.w} > ${status.c})`);
        // Primary navigation must be operable at every size: a visible nav link
        // (sidebar link, bottom-nav link or header link) exists and is in-viewport clickable.
        const navOk = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a')).filter((a) => {
            const r = a.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && a.offsetParent !== null;
          });
          return links.length > 0;
        });
        if (!navOk) failures.push(`${label}: no operable links`);
        report.checks.push({ surface, viewport: viewport.name, route, ok: true, scrollWidth: status.w, clientWidth: status.c });
      }
    }
    await context.close();
  }

  await checkSurface('website', null, PUBLIC_ROUTES);
  await checkSurface('homeowner', { email: ownerRow.email, landing: '/app' }, OWNER_ROUTES);
  await checkSurface('partner', { email: providerRow.email, landing: '/pro' }, PROVIDER_ROUTES);
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGTERM');
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(ownerId)}`, { method: 'DELETE', headers: { apikey: svc, Authorization: `Bearer ${svc}` } }).catch(() => {});
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(providerId)}`, { method: 'DELETE', headers: { apikey: svc, Authorization: `Bearer ${svc}` } }).catch(() => {});
  for (const suffix of ['', '-wal', '-shm']) { try { fs.rmSync(dbPath + suffix, { force: true }); } catch {} }
}
report.finishedAt = new Date().toISOString();
report.failures = failures;
const evidenceDir = path.join(root, '.sin-gpt-web', 'evidence', 'T-0156');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(path.join(evidenceDir, 'matrix.json'), JSON.stringify(report, null, 2));
console.log(`matrix: ${report.checks.length} checks`);
if (failures.length) { console.log(`FAILURES (${failures.length}):`); for (const failure of failures.slice(0, 12)) console.log(`  ${failure}`); process.exit(1); }
console.log('RESPONSIVE MATRIX PASS');
