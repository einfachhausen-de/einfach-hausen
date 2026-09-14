#!/usr/bin/env node
// T-0152/T-0153 visual regression for the authenticated app surfaces
// (homeowner /app/*, partner /pro/*, admin /admin*) on mobile 390 + desktop 1320.
// Deterministic fixture DB (scripts/e2e-fixtures.mjs), real Supabase identity
// per run (created + deleted), reduced motion, settled DOM.
// Baselines: tests/visual-baselines/app/. Update: --update-baselines
//
// T-0130 policy:
// - Determinism: seeded fixture DB, reducedMotion, deviceScaleFactor 1,
//   settled load + fixed settle wait. No clock/time-dependent capture.
// - Masking: none needed today - all captured surfaces are free of true
//   nondeterminism (no third-party embeds, no animations after settle). If a
//   surface becomes nondeterministic, prefer masking via clip/locator-specific
//   capture over pixel-budget increases.
// - Threshold: GATE_PIXEL_BUDGET (default 0.08) per capture; threshold 0.1 in
//   pixelmatch (antialiasing tolerance). Never raise the budget to absorb real
//   regressions - regenerate baselines deliberately via --update-baselines.
// - Diff artifacts: on failure the actual capture AND the pixel diff are kept
//   under .sin-gpt-web/evidence/release-gate/app-visual-actual/ for forensics.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// src/lib/*.ts is written for a bundler: relative imports carry no extension
// ("moduleResolution": "bundler" in tsconfig.json). Plain Node resolves
// specifiers literally, so `./contact-directory-schema` inside db.ts is simply
// not found and this script died at startup with ERR_MODULE_NOT_FOUND.
// Rewrite the relative specifiers to `.ts` for the duration of the import and
// put the file back afterwards - the trick admin-auth.ts already needed here.
// The rewrite stays in the script on purpose: touching db.ts would mean
// allowImportingTsExtensions plus a Turbopack resolution change.
const RELATIVE_SPECIFIER = /(?:from|import)\s*['"](\.\.?\/[^'"]+)['"]/g;
const rewrittenSources = new Map();
// The closure matters, not just the entry file: db.ts pulls in
// contact-directory-schema.ts, which itself imports contact-directory-taxonomy
// without an extension. Rewrite the whole reachable set before importing.
function rewriteRelativeImports(filePath) {
  if (rewrittenSources.has(filePath) || !fs.existsSync(filePath)) return;
  const source = fs.readFileSync(filePath, 'utf8');
  rewrittenSources.set(filePath, source);
  const rewritten = source.replace(
    /(from\s*['"])(\.\.?\/[^'"]+)(['"])/g,
    (_m, open, specifier, close) => `${open}${specifier.endsWith('.ts') ? specifier : `${specifier}.ts`}${close}`,
  );
  if (rewritten === source) return;
  fs.writeFileSync(filePath, rewritten);
  const directory = path.dirname(filePath);
  for (const match of source.matchAll(RELATIVE_SPECIFIER)) {
    const specifier = match[1];
    rewriteRelativeImports(path.resolve(directory, specifier.endsWith('.ts') ? specifier : `${specifier}.ts`));
  }
}
function restoreRewrittenImports() {
  for (const [filePath, source] of rewrittenSources) fs.writeFileSync(filePath, source);
  rewrittenSources.clear();
}
async function importTs(relativePath) {
  rewriteRelativeImports(new URL(relativePath, import.meta.url).pathname);
  // Safe to restore immediately: Node caches the module by resolved URL, so
  // admin-auth.ts later resolving './db.ts' hits that instance, not the disk.
  try {
    return await import(relativePath);
  } finally {
    restoreRewrittenImports();
  }
}

const root = process.cwd();
const update = process.argv.includes('--update-baselines');
const budget = Number(process.env.GATE_PIXEL_BUDGET || 0.08);
const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.delqhi.com';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!serviceKey || !anonKey) { console.error('Supabase service and anon keys are required.'); process.exit(2); }

const ownerRoutes = ['/app', '/app/home', '/app/contracts', '/app/jobs', '/app/messages', '/app/documents', '/app/partners', '/app/profile'];
// /pro/jobs is intentionally absent: it is a detail-only route (/pro/jobs/[id])
// with no list page and no nav entry; the provider nav links /pro/orders.
// Capturing /pro/jobs bare races the prod middleware login redirect vs the 404
// and poisoned the old baseline with a 404 screenshot (removed 2026-09-01).
const providerRoutes = ['/pro', '/pro/orders', '/pro/messages', '/pro/team', '/pro/profile'];
const viewports = [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1320, height: 900 }];
const baselineDir = path.join(root, 'tests', 'visual-baselines', 'app');
const actualDir = path.join(root, '.sin-gpt-web', 'evidence', 'release-gate', 'app-visual-actual');

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
  if (!found) throw new Error('No Chromium executable for app visual regression');
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

async function createIdentity(email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { app_visual: true } }),
  });
  const data = await response.json();
  if (!data.id) throw new Error(`identity create failed: ${JSON.stringify(data).slice(0, 200)}`);
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) throw new Error(`identity sign-in failed: ${signed.error?.message || email}`);
  let cookies = [];
  const serverClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookies,
      setAll: (items) => { cookies = items.map(({ name, value }) => ({ name, value })); },
    },
  });
  const session = signed.data.session;
  const set = await serverClient.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  if (set.error || !cookies.length) throw new Error(`SSR cookie session failed: ${set.error?.message || email}`);
  return { id: data.id, email, cookies };
}

async function deleteIdentity(identity) {
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(identity.id)}`, {
    method: 'DELETE', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
}

if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  console.error('No production build — run npm run build (release-gate builds it).');
  process.exit(2);
}

// Deterministic fixture DB with homeowner/provider/property/job data.
const dbPath = '/tmp/eh-app-visual.db';
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(dbPath + suffix, { force: true });
const savedDatabasePath = process.env.DATABASE_PATH;
process.env.DATABASE_PATH = dbPath;
const { createE2EFixture } = await import('./e2e-fixtures.mjs');
const { db } = await importTs('../src/lib/db.ts');
const fixture = createE2EFixture(db, { namespace: 'appvisual' });
const owner = db.prepare('SELECT id,email FROM users WHERE id=?').get(fixture.homeownerId);
const provider = db.prepare('SELECT id,email FROM users WHERE id=?').get(fixture.providerId);

const password = `AppVisual!${randomUUID().replaceAll('-', '').slice(0, 16)}`;
const ownerIdentity = await createIdentity(owner.email, password);
const providerIdentity = await createIdentity(provider.email, password);
db.prepare('UPDATE users SET auth_subject=? WHERE id=?').run(ownerIdentity.id, owner.id);
db.prepare('UPDATE users SET auth_subject=? WHERE id=?').run(providerIdentity.id, provider.id);

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const nextBin = path.join(root, 'node_modules/next/dist/bin/next');
const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: root,
  env: { ...process.env, DATABASE_PATH: '/tmp/eh-app-visual.db', ADMIN_PASSWORD: `AppVisAdmin!${randomUUID()}`, SESSION_COOKIE_NAME: 'appvis_session', NEXT_PUBLIC_APP_URL: base, AUTH_MODE: 'supabase', E2E_INSECURE_COOKIES: '1', SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey },
  stdio: 'ignore',
});
let browser;
const failures = [];
const summary = [];
try {
  await waitForServer(`${base}/`);
  fs.mkdirSync(baselineDir, { recursive: true });
  fs.mkdirSync(actualDir, { recursive: true });
  browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });

  async function capture(role, identity, routes, adminCookie = null) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await context.addCookies(identity.cookies.map(({ name, value }) => ({ name, value, url: base })));
    if (adminCookie) await context.addCookies([adminCookie]);
    const page = await context.newPage();
    const landing = role === 'owner' ? '/app' : '/pro';
    await page.goto(`${base}${landing}`, { waitUntil: 'load', timeout: 60000 });
    if (!new URL(page.url()).pathname.startsWith(landing)) {
      throw new Error(`${role} authenticated landing failed closed: ${page.url()}`);
    }

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of routes) {
        const name = `${role}_${route.replaceAll('/', '_').replace(/^_/, '')}__${viewport.name}`;
        const actualPath = path.join(actualDir, `${name}.png`);
        const baselinePath = path.join(baselineDir, `${name}.png`);
        try {
          await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 60000 });
        } catch (error) {
          if (!/interrupted by another navigation|NS_BINDING_ABORTED|Timeout/.test(String(error))) { failures.push(`${name}: goto ${String(error).slice(0, 100)}`); continue; }
          try { await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 60000 }); } catch (retryError) { failures.push(`${name}: goto retry ${String(retryError).slice(0, 100)}`); continue; }
        }
        await page.waitForTimeout(1200);
        await page.screenshot({ path: actualPath, fullPage: false });
        if (!fs.existsSync(baselinePath) || update) {
          fs.copyFileSync(actualPath, baselinePath);
          console.log(`baseline ${update ? 'updated' : 'created'}: ${name}`);
          continue;
        }
        const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
        const actual = PNG.sync.read(fs.readFileSync(actualPath));
        if (baseline.width !== actual.width || baseline.height !== actual.height) { failures.push(`${name}: size drift`); continue; }
        const diff = new PNG({ width: baseline.width, height: baseline.height });
        const changed = pixelmatch(baseline.data, actual.data, diff.data, baseline.width, baseline.height, { threshold: 0.1 });
        const ratio = changed / (baseline.width * baseline.height);
        if (ratio > budget) {
          // Durable forensics: keep the diff and the actual capture.
          fs.writeFileSync(path.join(actualDir, `${name}__diff.png`), PNG.sync.write(diff));
          failures.push(`${name}: ${(ratio * 100).toFixed(2)}% (budget ${budget * 100}%) diff=${path.join(actualDir, `${name}__diff.png`)}`);
        }
      }
    }
    await context.close();
    summary.push(`${role}: ${routes.length * viewports.length} captures`);
  }

  await capture('owner', ownerIdentity, ownerRoutes);
  await capture('provider', providerIdentity, providerRoutes);

  // T-0130: admin surface baselines. The admin session is seeded directly via
  // issueAdminSessionToken on the fixture DB (deterministic, no password in
  // evidence) and the cookie name matches the server's SESSION_COOKIE_NAME.
  // admin-auth.ts uses an extensionless './db' import - same rewrite as db.ts.
  // db.ts is already in the module cache from the import above, so admin-auth
  // resolves to that instance even though the file on disk is restored by then.
  const adminAuth = await importTs('../src/lib/admin-auth.ts');
  const adminToken = adminAuth.issueAdminSessionToken();
  // admin-auth appends an _admin suffix to the SESSION_COOKIE_NAME override.
  const adminCookieName = `${process.env.SESSION_COOKIE_NAME}_admin`;
  await capture('admin', ownerIdentity, ['/admin', '/admin/ops'], { name: adminCookieName, value: adminToken.token, url: base });
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGTERM');
  await deleteIdentity(ownerIdentity).catch(() => {});
  await deleteIdentity(providerIdentity).catch(() => {});
  process.env.DATABASE_PATH = savedDatabasePath;
  for (const suffix of ['', '-wal', '-shm']) { try { fs.rmSync(dbPath + suffix, { force: true }); } catch {} }
}
console.log(summary.join(' | '));
if (failures.length) { console.log(`FAILURES (${failures.length}):`); for (const failure of failures.slice(0, 12)) console.log(`  ${failure}`); process.exit(1); }
console.log('APP VISUAL PASS');
