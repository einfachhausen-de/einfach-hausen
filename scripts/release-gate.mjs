#!/usr/bin/env node
// T-0157 unified release gate. One mandatory pre-release command that runs the
// four layers the CI workflow cannot currently execute on GitHub (private-repo
// Actions are startup_failure): static gates, production build, axe a11y on the
// built app, visual baseline regression, and response-size performance budgets.
// Exit code 0 = release allowed; anything else blocks the release.
// Usage: node scripts/release-gate.mjs [--fast] (fast skips build reuse checks)

import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const root = process.cwd();
// Hermetic runtime: every npm-spawned child (shebang #!/usr/bin/env node)
// must resolve the SAME interpreter as this gate. OCI carries a Node 20
// /usr/bin/node next to the validated Node 22 dir; without the prepend,
// children silently run on v20 (e.g. security-regression import crash).
if (Number(process.versions.node.split('.')[0]) !== 22) {
  console.error(`release-gate requires Node 22, running on ${process.version} (${process.execPath})`);
  process.exit(2);
}
const RUNTIME_BIN_DIR = path.dirname(process.execPath);
const fast = process.argv.includes('--fast');
// Stage selection: --only=static|a11y|visual|perf (comma list). Default: all.
const onlyArg = (process.argv.find((arg) => arg.startsWith('--only=')) || '').replace('--only=', '');
const only = onlyArg ? new Set(onlyArg.split(',')) : null;
const wants = (stage) => !only || only.has(stage);
const results = [];
const log = (m) => console.log(m);

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function run(cmd, args, env = {}, label = cmd) {
  log(`  > ${label} ${args.join(' ')}`);
  try {
    const childEnv = { ...process.env, ...env };
    childEnv.PATH = `${RUNTIME_BIN_DIR}${path.delimiter}${childEnv.PATH || ''}`;
    execFileSync(cmd, args, { cwd: root, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 });
    return { ok: true };
  } catch (error) {
    return { ok: false, output: String(error.stdout || '') + String(error.stderr || '') };
  }
}

async function freePort() {
  return await new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.unref();
    socket.on('error', reject);
    socket.listen(0, '127.0.0.1', () => {
      const address = socket.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      socket.close(() => resolve(port));
    });
  });
}

function browserExecutable() {
  let bundled = '';
  try { bundled = chromium.executablePath(); } catch {}
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    typeof bundled === 'string' && fs.existsSync(bundled) ? bundled : '',
    '/home/ubuntu/.cache/ms-playwright/chromium-1228/chrome-linux/chrome',
    '/home/ubuntu/.cache/ms-playwright/chromium-1223/chrome-linux/chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('No Chromium browser found for release gate; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH');
  return found;
}

async function waitForServer(url, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready: ${url}`);
}

// ---- Layer 1: static gates -------------------------------------------------
function staticGates() {
  if (!wants('static')) return true;
  log('\n== Layer 1: static gates ==');
  const lint = run('npm', ['run', 'lint']);
  record('lint', lint.ok, lint.ok ? '' : (lint.output || '').slice(-400));
  // `.next/types` is a generated artifact of `next build` and part of the
  // tsconfig include set. A copy left over from the previous release still
  // references routes that were deleted since, so `tsc --noEmit` failed on
  // stale generated files and aborted the deployment before this run's own
  // build step could regenerate them. Drop the generated types first; the
  // production build below recreates them. No check is relaxed.
  fs.rmSync(path.join(root, '.next', 'types'), { recursive: true, force: true });
  // tsc via direct .bin path: bare `npx` depends on the caller's PATH
  // (macOS zsh hard-PATH has no npx -> ENOENT with empty output, T-0131).
  const types = run(path.join(root, 'node_modules', '.bin', 'tsc'), ['--noEmit']);
  record('types (tsc --noEmit)', types.ok, types.ok ? '' : (types.output || '').slice(-400));
  const security = run('npm', ['run', 'test:security']);
  record('security regressions', security.ok, security.ok ? '' : (security.output || '').slice(-400));
  const fixtures = run('npm', ['run', 'test:fixtures']);
  record('fixture factory', fixtures.ok, fixtures.ok ? '' : (fixtures.output || '').slice(-400));
  const flags = run('node', ['scripts/feature-flag-lifecycle.mjs']);
  record('feature-flag lifecycle (T-0139)', flags.ok, flags.ok ? '' : (flags.output || '').slice(-400));
  const invEnv = { DATABASE_PATH: process.env.GATE_DATABASE_PATH || process.env.DATABASE_PATH || '' };
  const inventory = run('node', ['scripts/data-inventory-check.mjs'], invEnv);
  record('data-inventory (T-0146)', inventory.ok, inventory.ok ? '' : (inventory.output || '').slice(-400));
  return lint.ok && types.ok && security.ok && fixtures.ok && flags.ok && inventory.ok;
}

// ---- Production build (shared by layers 2-4) --------------------------------
function productionBuild() {
  if (!wants('build')) return fs.existsSync(path.join(root, '.next', 'BUILD_ID'));
  log('\n== Production build ==');
  const buildDb = path.join(os.tmpdir(), `eh-gate-build-${randomUUID()}.db`);
  const buildEnv = readBuildEnv();
  const result = run('npm', ['run', 'build'], { ...buildEnv, DATABASE_PATH: buildDb }, '');
  try { for (const suffix of ['', '-wal', '-shm']) fs.rmSync(buildDb + suffix, { force: true }); } catch {}
  record('production build', result.ok, result.ok ? '' : (result.output || '').slice(-600));
  return result.ok;
}

// ---- Layer 2-4: live app against the production build ------------------------
function readBuildEnv() {
  const values = {};
  for (const file of ['/etc/einfach-hausen-build.env', path.join(root, '.env.build.local')]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) values[match[1]] = match[2];
    }
  }
  return values;
}

async function liveGates() {
  const runA11y = wants('a11y');
  const runVisual = wants('visual');
  const runPerf = wants('perf');
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const dbPath = path.join(os.tmpdir(), `eh-gate-${randomUUID()}.db`);
  const adminPassword = `GateAdmin!${randomBytes(12).toString('base64url')}`;
  const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.delqhi.com';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const runtimeEnv = {
    ...process.env,
    ...readBuildEnv(),
    DATABASE_PATH: dbPath,
    ADMIN_PASSWORD: adminPassword,
    SESSION_COOKIE_NAME: 'gate_session',
    NEXT_PUBLIC_APP_URL: base,
    AUTH_MODE: 'supabase',
    E2E_INSECURE_COOKIES: '1',
    SUPABASE_URL: supabaseUrl,
    ...(anonKey ? { SUPABASE_ANON_KEY: anonKey, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey } : {}),
  };
  const nextBin = path.join(root, 'node_modules/next/dist/bin/next');
  const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: root, env: runtimeEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  const serverLog = [];
  for (const stream of [server.stdout, server.stderr]) stream.on('data', (chunk) => { serverLog.push(chunk.toString()); if (serverLog.length > 200) serverLog.shift(); });
  let browser;
  try {
    await waitForServer(`${base}/`, 90000);

    const lexikonHttp = run(process.execPath, [path.join(root, 'scripts/lexikon-http-semantics.mjs')], { BASE_URL: base }, 'lexikon HTTP semantics');
    record('lexikon HTTP semantics', lexikonHttp.ok, lexikonHttp.ok ? 'known routes 200; unknown term/category routes 404' : (lexikonHttp.output || 'contract failed').trim().slice(0, 500));

    const lexikonVisual = run(process.execPath, [path.join(root, 'scripts/lexikon-index-visual-contract.mjs')], { BASE_URL: base }, 'lexikon index visual contract');
    record('lexikon index visual contract', lexikonVisual.ok, lexikonVisual.ok ? 'compact hero, tight handoff, categories visible, no horizontal overflow' : (lexikonVisual.output || 'contract failed').trim().slice(0, 500));

    // Public routes exercised by the gate (mobile-first landing + core pages).
    const publicRoutes = ['/', '/so-funktionierts', '/leistungen', '/preise', '/partner', '/hilfe', '/kontakt', '/lexikon', '/login', '/welcome'];
    browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });

    // ---- Layer 2: axe a11y ----
    if (runA11y) log('\n== Layer 2: accessibility (axe-core) ==');
    const ctx = runA11y ? await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }) : null;
    const page = ctx ? await ctx.newPage() : null;
    let totalViolations = 0;
    const worst = [];
    if (runA11y) {
      for (const route of publicRoutes) {
        await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.addScriptTag({ path: path.join(root, 'node_modules', 'axe-core', 'axe.min.js') });
        const axeResult = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
        totalViolations += axeResult.violations.length;
        for (const violation of axeResult.violations) {
          worst.push(`${route}: ${violation.id} (${violation.impact || 'unknown'}) x${violation.nodes.length}`);
        }
      }
      const critical = worst.filter((entry) => /critical|serious/.test(entry));
      record(`axe a11y (${publicRoutes.length} public routes, mobile)`, critical.length === 0,
        critical.length === 0 ? `${totalViolations} non-blocking findings` : critical.slice(0, 6).join('; '));
    }
    if (ctx) await ctx.close();

    // ---- Layer 3: visual canonicals (T-0130) ----
    // Shared matrix + determinism contract with scripts/visual-regression.mjs
    // (scripts/lib/visual-canonicals.mjs). The gate runs the historical 9 core
    // routes plus the 404 state on mobile AND desktop (DESIGN.md §14: 390 and
    // 1320 must be release-proven); the standalone run covers tablet and all
    // 16 public routes. Missing baselines are created, never failed.
    if (runVisual) {
      log('\n== Layer 3: visual canonicals ==');
      const { GATE_ROUTES, STATE_ROUTES, DEFAULT_PIXEL_BUDGET, runVisualCanonicals } = await import('./lib/visual-canonicals.mjs');
      const baselineDir = path.join(root, 'tests', 'visual-baselines');
      const evidenceDir = path.join(root, '.sin-gpt-web', 'evidence', 'release-gate');
      const visual = await runVisualCanonicals({
        browser,
        base,
        routes: GATE_ROUTES,
        states: STATE_ROUTES,
        viewports: ['mobile', 'desktop'],
        baselineDir,
        actualDir: path.join(evidenceDir, 'visual-actual'),
        diffDir: path.join(evidenceDir, 'visual-diff'),
        budget: Number(process.env.GATE_PIXEL_BUDGET || DEFAULT_PIXEL_BUDGET),
        update: process.env.GATE_UPDATE_BASELINES === '1',
        log,
      });
      record(`visual canonicals (${visual.results.length} shots, mobile+desktop, pixel budget)`, visual.failures.length === 0,
        visual.failures.length === 0 ? 'all canonicals within budget or baselined' : visual.failures.slice(0, 6).join('; '));
    }

    // ---- Layer 4: performance budgets ----
    if (runPerf) log('\n== Layer 4: performance budgets ==');
    const perfCtx = runPerf ? await browser.newContext({ viewport: { width: 390, height: 844 } }) : null;
    const perfPage = perfCtx ? await perfCtx.newPage() : null;
    const responses = [];
    if (runPerf) perfPage.on('response', (response) => {
      const url = response.url();
      if (url.startsWith(base)) responses.push({ url, size: Number(response.headers()['content-length'] || 0), status: response.status() });
    });
    if (!runPerf) { return; }
    // CLS via LayoutShift observer, installed before navigation (CWV lab proxy;
    // field telemetry is T-0117 scope).
    await perfPage.addInitScript(() => {
      window.__gateCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__gateCls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const navStart = Date.now();
    await perfPage.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 });
    const loadMs = Date.now() - navStart;
    const cls = await perfPage.evaluate(() => window.__gateCls).catch(() => -1);
    record('home CLS (<= 0.1)', cls >= 0 && cls <= 0.1, `CLS=${Number(cls).toFixed(4)}`);
    const transferBytes = responses.reduce((sum, response) => sum + (response.size || 0), 0);
    const contentLengthMissing = responses.filter((response) => response.size === 0 && response.status === 200).length;
    // Fallback: measure body sizes when content-length is missing (gzip/streaming).
    if (contentLengthMissing > 0) {
      const measured = await perfPage.evaluate(async (origin) => {
        const entries = performance.getEntriesByType('resource').filter((entry) => entry.name.startsWith(origin));
        return { transferSize: entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0), count: entries.length };
      }, base);
      const docSize = measured.transferSize + transferBytes;
      record('home transfer budget (<= 1.5 MB first view)', docSize <= 1_500_000, `${(docSize / 1024).toFixed(0)} KB across ${measured.count + responses.length} responses${contentLengthMissing ? ` (${contentLengthMissing} without content-length, measured via resource timing)` : ''}`);
      record('home load time (<= 8s cold, local)', loadMs <= 8000, `${loadMs} ms`);
    } else {
      record('home transfer budget (<= 1.5 MB first view)', transferBytes <= 1_500_000, `${(transferBytes / 1024).toFixed(0)} KB`);
      record('home load time (<= 8s cold, local)', loadMs <= 8000, `${loadMs} ms`);
    }
    const failed = responses.filter((response) => response.status >= 400);
    record('no failed first-view requests', failed.length === 0, failed.length ? failed.slice(0, 4).map((response) => `${response.status} ${response.url.replace(base, '')}`).join('; ') : 'all 2xx/3xx');
    if (perfCtx) await perfCtx.close();
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill('SIGTERM');
    try { for (const suffix of ['', '-wal', '-shm']) fs.rmSync(dbPath + suffix, { force: true }); } catch {}
  }
}

staticGates();
if (fast) {
  log('\n(--fast: build + live layers skipped)');
  const failed = results.filter((result) => !result.ok);
  log(`\nRelease gate: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}
if (!productionBuild()) { process.exit(1); }
await liveGates();
const failed = results.filter((result) => !result.ok);
log(`\nRelease gate: ${results.length - failed.length}/${results.length} passed`);
for (const failure of failed) log(`  FAILED: ${failure.name} — ${failure.detail.slice(0, 200)}`);
process.exit(failed.length ? 1 : 0);
