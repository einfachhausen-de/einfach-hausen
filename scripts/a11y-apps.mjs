#!/usr/bin/env node
// T-0115 accessibility acceptance for the authenticated app surfaces:
// axe-core over homeowner + partner pages (mobile 390), fail on serious/critical.
// Uses the same deterministic fixture + ephemeral identity harness as T-0156.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { importTs } from './lib/import-ts.mjs';
import { createIdentity as createTestIdentity } from './lib/identity.mjs';

const root = process.cwd();
const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.delqhi.com';
const svc = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (!svc) { console.error('SUPABASE_SERVICE_KEY required'); process.exit(2); }

const OWNER_ROUTES = ['/app', '/app/home', '/app/contracts', '/app/jobs', '/app/messages', '/app/documents', '/app/partners', '/app/profile', '/notifications'];
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

const dbPath = '/tmp/eh-a11y.db';
for (const suffix of ['', '-wal', '-shm']) { try { fs.rmSync(dbPath + suffix, { force: true }); } catch {} }
process.env.DATABASE_PATH = dbPath;
const { createE2EFixture } = await import('./e2e-fixtures.mjs');
// Plain Node cannot resolve db.ts's extensionless relative imports; the helper
// rewrites them for the duration of the import and restores them afterwards.
const { db } = await importTs('../src/lib/db.ts', import.meta.url);
const fixture = createE2EFixture(db, { namespace: 'a11y' });
const ownerRow = db.prepare('SELECT id,email FROM users WHERE id=?').get(fixture.homeownerId);
const providerRow = db.prepare('SELECT id,email FROM users WHERE id=?').get(fixture.providerId);

const password = `A11y!${randomUUID().replaceAll('-', '').slice(0, 14)}`;
// Shared helper: an identity left behind by a cancelled run would otherwise
// break every later run with "email_exists".
async function createIdentity(email) {
  return createTestIdentity({ supabaseUrl, serviceKey: svc }, email, password, { a11y: true });
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
  env: { ...process.env, DATABASE_PATH: dbPath, ADMIN_PASSWORD: `A11yAdmin!${randomUUID()}`, SESSION_COOKIE_NAME: 'a11y_session', NEXT_PUBLIC_APP_URL: base, AUTH_MODE: 'supabase', E2E_INSECURE_COOKIES: '1', SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: svc },
  stdio: 'ignore',
});
let browser;
const violations = [];
try {
  await waitForServer(`${base}/`);
  browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });

  async function scan(role, session, routes) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', session.email);
    await page.fill('input[type="password"]', password);
    await Promise.all([page.waitForURL(new RegExp(session.landing), { timeout: 60000 }).catch(() => {}), page.click('button[type="submit"]')]);
    await page.waitForTimeout(3000);
    for (const route of routes) {
      try { await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 60000 }); }
      catch { try { await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 60000 }); } catch (e) { violations.push(`${role}${route}: goto ${String(e).slice(0, 80)}`); continue; } }
      await page.waitForTimeout(900);
      await page.addScriptTag({ path: path.join(root, 'node_modules', 'axe-core', 'axe.min.js') });
      const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
      for (const violation of result.violations) {
        violations.push(`${role}${route}: ${violation.id} (${violation.impact || 'unknown'}) x${violation.nodes.length}`);
      }
    }
    await context.close();
  }

  await scan('homeowner', { email: ownerRow.email, landing: '/app' }, OWNER_ROUTES);
  await scan('partner', { email: providerRow.email, landing: '/pro' }, PROVIDER_ROUTES);
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGTERM');
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(ownerId)}`, { method: 'DELETE', headers: { apikey: svc, Authorization: `Bearer ${svc}` } }).catch(() => {});
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(providerId)}`, { method: 'DELETE', headers: { apikey: svc, Authorization: `Bearer ${svc}` } }).catch(() => {});
  for (const suffix of ['', '-wal', '-shm']) { try { fs.rmSync(dbPath + suffix, { force: true }); } catch {} }
}
const blocking = violations.filter((v) => /serious|critical/.test(v));
console.log(`a11y app scan: ${violations.length} findings, ${blocking.length} blocking`);
for (const violation of violations.slice(0, 20)) console.log(`  ${violation}`);
const evidenceDir = path.join(root, '.sin-gpt-web', 'evidence', 'T-0115');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(path.join(evidenceDir, 'a11y-apps.json'), JSON.stringify({ violations, blocking, at: new Date().toISOString() }, null, 2));
process.exit(blocking.length ? 1 : 0);
