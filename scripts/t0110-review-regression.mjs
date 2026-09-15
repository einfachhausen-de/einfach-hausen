import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0110-src-'));
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0110-db-'));
process.env.DATABASE_PATH = path.join(dbDir, 'regression.db');
process.chdir(dbDir);
fs.symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
for (const rel of tsClosure(root, ['src/lib/db.ts', 'src/lib/review-eligibility.ts'])) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const stripped = stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`);
  const dest = path.join(scratch, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stripped);
}

let passed = 0;
const failures = [];
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  ok  ${name}`); }
  else { failures.push(`${name}${detail ? ` :: ${detail}` : ''}`); console.error(`FAIL  ${name}${detail ? ` :: ${detail}` : ''}`); }
}

try {
  const { db } = await import(pathToFileURL(path.join(scratch, 'src/lib/db.mjs')).href);
  const elig = await import(pathToFileURL(path.join(scratch, 'src/lib/review-eligibility.mjs')).href);
  const dbh = { prepare: (sql) => db.prepare(sql) };

  db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('h@e.test','x','homeowner','H','O')").run();
  db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('p@e.test','x','provider','P','R')").run();
  const h = Number(db.prepare("SELECT id FROM users WHERE email='h@e.test'").get().id);
  const p = Number(db.prepare("SELECT id FROM users WHERE email='p@e.test'").get().id);
  db.prepare("INSERT INTO jobs(homeowner_id,title,description,category,postcode,status) VALUES(?,?,?,?,?,'completed')").run(h, 'T', 'd', 'handwerk', '12000');
  const jobId = Number(db.prepare("SELECT id FROM jobs WHERE homeowner_id=?").get(h).id);
  const qres = db.prepare("INSERT INTO quotes(job_id,provider_id,amount,message,status) VALUES(?,?,?,?,'accepted')").run(jobId, p, 100, 'ok');
  const quoteId = Number(qres.lastInsertRowid);
  db.prepare("UPDATE jobs SET accepted_quote_id=? WHERE id=?").run(quoteId, jobId);

  check('eligible completed job is allowed', elig.resolveReviewContext(dbh, jobId, 'homeowner', h).allowed === true);
  db.prepare("UPDATE jobs SET status='quoted' WHERE id=?").run(jobId);
  const incomple = elig.resolveReviewContext(dbh, jobId, 'homeowner', h);
  check('incomplete job rejected', incomple.allowed === false && incomple.reason === 'Nur erledigte Aufträge können bewertet werden');
  db.prepare("UPDATE jobs SET status='completed' WHERE id=?").run(jobId);
  check('provider cannot review', elig.resolveReviewContext(dbh, jobId, 'provider', p).allowed === false && elig.resolveReviewContext(dbh, jobId, 'provider', p).reason === 'Nur der Eigentümer kann bewerten');
  check('non-owner homeowner blocked', elig.resolveReviewContext(dbh, jobId, 'homeowner', p).allowed === false);
  // self review: job owner is also the provider performing the work
  db.prepare("UPDATE quotes SET provider_id=? WHERE id=?").run(h, quoteId);
  const sr = elig.resolveReviewContext(dbh, jobId, 'homeowner', h);
  check('self-review blocked', sr.allowed === false && sr.reason === 'Eigentümer darf sich nicht selbst bewerten');
  // restore real provider
  db.prepare("UPDATE quotes SET provider_id=? WHERE id=?").run(p, quoteId);
  check('restored eligibility after self-review fix', elig.resolveReviewContext(dbh, jobId, 'homeowner', h).allowed === true);
} catch (error) {
  failures.push(`module load failed :: ${error.message}`);
  console.error(error);
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
