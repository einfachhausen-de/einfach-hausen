// EH Gina directory screenshot matrix (isolated temp project + temp DB, prod server).
// Captures categories/subcategories/contacts/detail/new/assign/manage/error
// at 390x844, 736x1024, 1536x960. Fails on missing text, h1!=1, overflow.
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(repo, 'package.json'));
const Database = require('better-sqlite3').default ?? require('better-sqlite3');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-dir-shots-'));
const projectRoot = path.join(tempRoot, 'project');
const databasePath = path.join(tempRoot, 'app.sqlite3');
const shotsDir = path.join(repo, 'docs', 'brand', 'contact-directory', 'shots');
fs.mkdirSync(shotsDir, { recursive: true });
const password = `ShotE2E!${randomBytes(12).toString('base64url')}`;
const stamp = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const ownerEmail = `shot-${stamp}@example.test`;
const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.delqhi.com';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseAnonKey || !supabaseServiceKey) throw new Error('SUPABASE keys missing');
let server; let browser;
const serverLog = [];
process.on('exit', () => { try { server?.kill('SIGKILL'); } catch {} });
function freePort() { return new Promise((res, rej) => { const s = net.createServer(); s.unref(); s.on('error', rej); s.listen(0, '127.0.0.1', () => { const a = s.address(); const p = typeof a === 'object' && a ? a.port : 0; s.close(() => res(p)); }); }); }
async function waitForServer(url, ms = 90000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const r = await fetch(url, { redirect: 'manual' }); if (r.status < 500) return; } catch {} await new Promise(r => setTimeout(r, 250)); } throw new Error('server not ready'); }
async function waitText(page, text) {
  const exp = text.replace(/\s+/g, '').toLowerCase();
  await page.waitForFunction(v => document.body.innerText.replace(/\s+/g, '').toLowerCase().includes(v), exp, { timeout: 60000 });
}
async function shot(page, name, vp, checks = {}) {
  await page.waitForFunction(() => !document.querySelector('body > div[id^="S:"]'), { timeout: 20000 }).catch(() => {});
  const file = path.join(shotsDir, `${name}-${vp.w}x${vp.h}.png`);
  await page.screenshot({ path: file });
  const h1 = await page.locator('h1').count();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  const stat = fs.statSync(file);
  const rec = { name, viewport: `${vp.w}x${vp.h}`, url: page.url(), file: path.basename(file), bytes: stat.size, h1, overflow };
  if (checks.h1 !== undefined && h1 !== checks.h1) {
    const texts = await page.locator('h1').allInnerTexts().catch(() => []);
    const sCount = await page.locator('body > div[id^="S:"]').count().catch(() => -1);
    throw new Error(`${name}@${vp.w}: h1=${h1} expected ${checks.h1} texts=${JSON.stringify(texts)} streaming=${sCount}`);
  }
  if (overflow) throw new Error(`${name}: horizontal overflow`);
  return rec;
}
const results = [];
// project copy
// "packages" carries the design system: src/design-system/index.ts re-exports
// ../../packages/eh-design/src, so a copy without it cannot compile a page.
for (const d of ['src', 'public', 'packages']) fs.cpSync(path.join(repo, d), path.join(projectRoot, d), { recursive: true });
for (const f of ['package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs', 'next-env.d.ts']) { const s = path.join(repo, f); if (fs.existsSync(s)) fs.copyFileSync(s, path.join(projectRoot, f)); }
fs.symlinkSync(path.join(repo, 'node_modules'), path.join(projectRoot, 'node_modules'), 'dir');
fs.cpSync(path.join(repo, '.next'), path.join(projectRoot, '.next'), { recursive: true, filter: (s) => !s.includes(`${path.sep}.next${path.sep}cache`) });
fs.mkdirSync(path.join(projectRoot, 'data', 'private'), { recursive: true });
fs.mkdirSync(path.join(projectRoot, 'public', 'uploads'), { recursive: true });
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const nextBin = path.join(repo, 'node_modules', 'next', 'dist', 'bin', 'next');
const env = { ...process.env, DATABASE_PATH: databasePath, AUTH_MODE: 'supabase', E2E_INSECURE_COOKIES: '1', NEXT_PUBLIC_APP_URL: base, SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: supabaseAnonKey, SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey, SUPABASE_SERVICE_KEY: supabaseServiceKey, NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey };
server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: projectRoot, env, stdio: ['ignore', 'pipe', 'pipe'] });
for (const st of [server.stdout, server.stderr]) st.on('data', c => { serverLog.push(c.toString()); if (serverLog.length > 200) serverLog.shift(); });
await waitForServer(`${base}/`, 120000);
const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
browser = await chromium.launch({ headless: true, executablePath: execPath || undefined });
const db = () => new Database(databasePath);
// register owner at desktop viewport
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 960 } });
  const p = await ctx.newPage();
  await p.goto(`${base}/register?role=homeowner`);
  await p.getByRole('button', { name: 'Kostenlos registrieren' }).first().click();
  for (const [n, v] of [['firstName', 'Shot'], ['lastName', 'Owner'], ['email', ownerEmail], ['password', password], ['postcode', '46325']]) {
    const f = p.locator(`input[name="${n}"]:visible`); await f.waitFor(); await f.fill(v);
  }
  await Promise.all([p.waitForURL('**/app/onboarding'), p.getByRole('button', { name: 'Kostenlos registrieren' }).last().click()]);
  await ctx.close();
}
{
  const d = db();
  const u = d.prepare('SELECT id FROM users WHERE email=?').get(ownerEmail);
  if (!u) throw new Error('owner not in db');
  d.prepare("UPDATE homeowner_profiles SET onboarding_step='done', address='Gartenweg 12' WHERE user_id=?").run(u.id);
  d.close();
}
async function login(vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const p = await ctx.newPage();
  await p.goto(`${base}/login`);
  await p.getByRole('heading', { name: /Willkommen zurück/ }).waitFor();
  await p.locator('input[inputmode="email"]:visible').fill(ownerEmail);
  await p.locator('input[type="password"]:visible').fill(password);
  await p.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Anmelden') && b.getClientRects().length > 0); return b && !b.disabled; }, { timeout: 15000 });
  await Promise.all([p.waitForURL('**/app**', { timeout: 60000 }), p.locator('#btn-submit-login:visible').click()]);
  return { ctx, p };
}
// full flow at 1536
{
  const { ctx, p } = await login({ w: 1536, h: 960 });
  await p.goto(`${base}/app/messages`);
  await waitText(p, 'Wähle einen Bereich. Danach das passende Gewerk.');
  await p.waitForFunction(() => document.querySelectorAll('a[data-main-category]').length === 17, { timeout: 30000 });
  const cats = await p.locator('a[data-main-category]').count();
  if (cats !== 17) throw new Error(`categories=${cats} expected 17`);
  const entryLinks = await p.locator('a[href*="entry="]').count();
  if (entryLinks !== 0) throw new Error('contacts leak on first level');
  results.push(await shot(p, 'dir-categories', { w: 1536, h: 960 }, { h1: 1 }));
  await p.goto(`${base}/app/messages?main=garten`);
  await waitText(p, 'Für welche Leistung');
  await p.waitForFunction(() => document.querySelectorAll('a[data-subcategory]').length === 5, { timeout: 30000 });
  const subs = await p.locator('a[data-subcategory]').count();
  if (subs !== 5) throw new Error(`subs=${subs} expected 5`);
  results.push(await shot(p, 'dir-subcategories', { w: 1536, h: 960 }, { h1: 1 }));
  await p.goto(`${base}/app/messages?main=garten&sub=garten-gaertner-gartenpflege&mode=new`);
  await waitText(p, 'Einmal speichern');
  await p.getByLabel('Name oder Betriebsname').fill('Mustermann Gartenbau');
  await p.getByText('Weitere Leistungen zuordnen (optional)').click();
  await p.getByRole('checkbox', { name: 'Baumpfleger / Baumfäller' }).check();
  await Promise.all([p.waitForURL('**/app/messages?entry=*', { timeout: 60000 }), p.getByRole('button', { name: 'Kontakt speichern' }).click()]);
  await waitText(p, 'Gespeichert');
  await waitText(p, 'Mustermann Gartenbau');
  results.push(await shot(p, 'dir-detail', { w: 1536, h: 960 }, { h1: 1 }));
  await p.goto(`${base}/app/messages?main=garten&sub=garten-gaertner-gartenpflege`);
  await waitText(p, 'Deine gespeicherten Kontakte');
  await waitText(p, 'Mustermann Gartenbau');
  results.push(await shot(p, 'dir-contacts', { w: 1536, h: 960 }, { h1: 1 }));
  await p.goto(`${base}/app/messages?mode=manage`);
  await waitText(p, 'Alle Kontakte an einem Ort');
  await waitText(p, 'Mustermann Gartenbau');
  results.push(await shot(p, 'dir-manage', { w: 1536, h: 960 }, { h1: 1 }));
  await p.getByRole('link', { name: 'Mustermann Gartenbau' }).first().click();
  await waitText(p, 'Leistungen');
  await p.getByRole('link', { name: 'Zuordnung bearbeiten' }).click();
  await waitText(p, 'Leistungen zuordnen');
  await p.getByRole('checkbox', { name: 'Brunnenbauer' }).check();
  await Promise.all([p.waitForURL('**/app/messages?entry=*', { timeout: 60000 }), p.getByRole('button', { name: 'Änderungen speichern' }).click()]);
  await waitText(p, 'Gespeichert');
  await waitText(p, 'Brunnenbauer');
  results.push(await shot(p, 'dir-assign', { w: 1536, h: 960 }, { h1: 1 }));
  await p.goto(`${base}/app/messages?main=nosuch`);
  await waitText(p, 'Das gibt es hier nicht.');
  const errBody = await p.locator('body').innerText().catch(() => '');
  if (!/gibt es hier nicht/i.test(errBody)) throw new Error('bad main shows no not-found page');
  results.push(await shot(p, 'dir-error', { w: 1536, h: 960 }));
  await ctx.close();
}
// 390 + 736: login, root + detail
for (const vp of [{ w: 390, h: 844 }, { w: 736, h: 1024 }]) {
  const { ctx, p } = await login(vp);
  await p.goto(`${base}/app/messages`);
  await waitText(p, 'Wähle einen Bereich');
  results.push(await shot(p, 'dir-categories', vp, { h1: 1 }));
  await p.goto(`${base}/app/messages?mode=manage`);
  await waitText(p, 'Mustermann Gartenbau');
  await p.getByRole('link', { name: 'Mustermann Gartenbau' }).first().click();
  await waitText(p, 'Leistungen');
  results.push(await shot(p, 'dir-detail', vp, { h1: 1 }));
  await ctx.close();
}
// cleanup supabase identity
try {
  // GoTrue's admin list-users endpoint reads only filter/page/per_page - there
  // is no `email` query parameter, so `?email=` is ignored and returns the first
  // page of ALL users. Deleting that page would remove unrelated identities
  // (including the shared demo accounts). Page through and match the exact
  // address client-side instead.
  const wanted = String(ownerEmail).toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } });
    if (!res.ok) break;
    const payload = await res.json().catch(() => ({}));
    const users = Array.isArray(payload.users) ? payload.users : [];
    for (const u of users) {
      if (String(u.email || '').toLowerCase() !== wanted) continue;
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(u.id)}`, { method: 'DELETE', headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } });
    }
    if (users.length < 1000) break;
  }
} catch {}
await browser.close();
server.kill('SIGKILL');
fs.writeFileSync(path.join(shotsDir, 'report.json'), JSON.stringify({ ok: true, shots: results }, null, 2));
console.log(JSON.stringify({ ok: true, shots: results.length }));
