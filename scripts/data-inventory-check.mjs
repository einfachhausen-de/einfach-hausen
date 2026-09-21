// T-0146 data-inventory gate: keeps docs/privacy/DATA_INVENTORY.json in sync
// with the real schema and enforces that no sensitive column appears in a table
// that is not classified as personal. Wired into release-gate Layer 1.
//
// Rules:
//  1. every DB table exists in the inventory (and vice versa; sqlite_sequence
//     and other sqlite internals are ignored),
//  2. every personal table documents purpose + a retention key from _meta,
//  3. columns matching the sensitive patterns inside a NON-personal table fail
//     the gate ("neu eingefuehrte sensible Felder ohne Klassifizierung").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventoryPath = path.join(root, 'docs', 'privacy', 'DATA_INVENTORY.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const failures = [];

const { default: Database } = await import('better-sqlite3');
const dbPath = process.env.DATABASE_PATH || path.join(root, 'data', 'einfach-hausen.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
const schema = {};
for (const t of tables) schema[t] = db.prepare(`PRAGMA table_info(${JSON.stringify(t)})`).all().map(c => c.name);
db.close();

// 1) table sets match
const invTables = new Set(Object.keys(inventory.tables));
for (const t of tables) if (!invTables.has(t)) failures.push(`table not in inventory: ${t}`);
for (const t of invTables) {
  if (!(t in schema)) {
    const sys = inventory.tables[t]?.system || 'core';
    if (sys === 'core') failures.push(`inventory table does not exist in DB: ${t}`);
    // crm-d1 tables live in the separate CRM D1 database — absence in the core DB is expected
  }
}

// 2) personal tables need purpose + known retention key
for (const [t, def] of Object.entries(inventory.tables)) {
  if (!def.personal) continue;
  if (!def.purpose || def.purpose.length < 8) failures.push(`${t}: purpose missing/too short`);
  if (!inventory._meta.retention_legend[def.retention]) failures.push(`${t}: unknown retention key "${def.retention}"`);
}

// 3) sensitive columns in non-personal tables
const SENSITIVE = [
  /email/i, /phone/i, /(^|_)token/i, /password/i, /_hash$/i, /(^|_)address/i,
  /first_name/i, /last_name/i, /business_name/i, /company_name/i, /contact_name/i,
  /tax_id/i, /vat_id/i, /byok_key/i, /(^|_)name$/i,
];
for (const [t, cols] of Object.entries(schema)) {
  const def = inventory.tables[t];
  if (!def || def.personal) continue;
  for (const col of cols) {
    if (SENSITIVE.some((re) => re.test(col))) failures.push(`${t}.${col}: sensitive column in non-personal table — classify or mark the table personal`);
  }
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL  data-inventory — ${f}`);
  process.exit(1);
}
console.log(`PASS  data-inventory — ${tables.length} tables classified, ${Object.entries(inventory.tables).filter(([,d])=>d.personal).length} personal, no unclassified sensitive columns`);
process.exit(0);
