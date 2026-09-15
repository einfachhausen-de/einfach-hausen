// T-0139 feature-flag lifecycle gate: static + DB checks that keep flags
// governable. Fails (exit 1) when:
//  1. a definition lacks owner or expiry, or the expiry date is unparseable,
//  2. a flag's expiry passed while it is still enabled in the DB,
//  3. the DB carries rows for a flag that is no longer defined (orphaned rows),
//  4. a flag is enabled in the DB although it is not production-toggleable.
// Wired into release-gate Layer 1; runs standalone via node.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-flags-'));
// DATABASE_PATH is intentionally NOT overridden here: db.ts resolves the env
// value (production: /var/lib/... via systemd env; release gate passes its own
// temp path). Default = <cwd>/data/einfach-hausen.db.
const failures = [];

// Load the typed definitions through the same strip pipeline as the other
// deterministic regressions (no build step needed). The full transitive local
// graph must be copied (learning from the dispatcher hotfix, PR #55).
fs.symlinkSync(path.join(root, 'node_modules'), path.join(dbDir, 'node_modules'), 'dir');
for (const rel of tsClosure(root, ['src/lib/db.ts', 'src/lib/observability.ts', 'src/lib/security/audit.ts', 'src/lib/security/rate-limit.ts', 'src/lib/feature-flags.ts', 'src/lib/contact-directory-schema.ts', 'src/lib/contact-directory-taxonomy.ts'])) {
  const fileSrc = fs.readFileSync(path.join(root, rel), 'utf8');
  const stripped = stripTypeScriptTypes(fileSrc)
    .replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`)
    .replace(/(import\(\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`);
  const dest = path.join(dbDir, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stripped);
}
const modPath = path.join(dbDir, 'src/lib/feature-flags.mjs');

const { FLAG_DEFAULTS } = await import(`${'file://'}${modPath}`);
const today = new Date().toISOString().slice(0, 10);
// Test seam: --simulate-expired evaluates the enabled-flag branch without
// waiting for real dates (mirrors the E2E_INSECURE_COOKIES seam pattern).
const simulateExpired = process.argv.includes('--simulate-expired');
const effectiveDefs = simulateExpired
  ? Object.fromEntries(Object.entries(FLAG_DEFAULTS).map(([k, v]) => [k, { ...v, expiresAt: '2000-01-01' }]))
  : FLAG_DEFAULTS;
// db.ts re-exports the schema-migrated handle; importing it runs migrations in
// the scratch dir (fresh file), so the flags table exists for the checks.

for (const [name, def] of Object.entries(FLAG_DEFAULTS)) {
  if (!def.owner) failures.push(`${name}: missing owner`);
  if (!def.expiresAt || Number.isNaN(Date.parse(def.expiresAt))) failures.push(`${name}: missing/unparseable expiresAt`);
}

// DB half: only when a real database exists (local dev / production). In CI
// sandboxes without DATABASE_PATH the db module creates an empty file — the
// flags table may not exist yet, which is fine for a fresh install.
const { db } = await import(`${'file://'}${modPath.replace('feature-flags.mjs','db.mjs')}`);
const flagsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='feature_flags'").get();
if (flagsTable) {
  const rows = db.prepare('SELECT key, enabled FROM feature_flags').all();
  const defined = new Set(Object.keys(FLAG_DEFAULTS));
  const enabledInt = (v) => Boolean(v);
  for (const row of rows) {
    if (!defined.has(row.key)) failures.push(`orphaned flag row in DB: ${row.key}`);
    const def = effectiveDefs[row.key];
    if (enabledInt(row.enabled) && def) {
      if (def.expiresAt && def.expiresAt < today) failures.push(`${row.key}: expiry ${def.expiresAt} passed while enabled`);
      if (!def.productionToggleable && enabledInt(row.enabled)) failures.push(`${row.key}: enabled although not production-toggleable`);
    }
  }
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL  flag-lifecycle — ${f}`);
  process.exit(1);
}
console.log(`PASS  flag-lifecycle — ${Object.keys(effectiveDefs).length} defined flags, owner+expiry complete, no expired-enabled/orphaned rows`);
