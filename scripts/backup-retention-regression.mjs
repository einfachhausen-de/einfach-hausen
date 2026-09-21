// Backup retention regression. The prune script deletes files, so its keep/remove
// decision is guarded here instead of being trusted: a retention bug either loses
// a recent backup (unrecoverable) or silently stops pruning (disk fills).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'prune-einfach-hausen-backups.sh');
const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-retention-'));
const backupRoot = path.join(workdir, 'backups');
fs.mkdirSync(backupRoot);

const KEEP_ALL_HOURS = 48;
const KEEP_DAILY_DAYS = 14;
const KEEP_WEEKLY_WEEKS = 8;

let checks = 0;
const check = (label, condition) => {
  assert.ok(condition, label);
  checks += 1;
  console.log(`PASS ${label}`);
};

const stamp = (date) =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const makeDir = (name) => {
  const dir = path.join(backupRoot, name);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'einfach-hausen.db'), Buffer.alloc(2048));
  return dir;
};

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

const run = (extraEnv = {}) =>
  execFileSync('bash', [script], {
    encoding: 'utf8',
    env: {
      ...process.env,
      BACKUP_ROOT: backupRoot,
      BACKUP_KEEP_ALL_HOURS: String(KEEP_ALL_HOURS),
      BACKUP_KEEP_DAILY_DAYS: String(KEEP_DAILY_DAYS),
      BACKUP_KEEP_WEEKLY_WEEKS: String(KEEP_WEEKLY_WEEKS),
      ...extraEnv,
    },
  });

// --- fixture: controlled ages, plus duplicates inside the same day and week ------
const recent = makeDir(`einfach-hausen-${stamp(hoursAgo(1))}`);          // keep: inside keep-all
const keepAll = makeDir(`einfach-hausen-${stamp(hoursAgo(30))}`);         // keep: inside keep-all
const sameDay = [3, 5, 8].map((h) => makeDir(`einfach-hausen-${stamp(hoursAgo(24 * 3 + h))}`));
const midDay = makeDir(`einfach-hausen-${stamp(hoursAgo(24 * 5))}`);      // keep: newest of its day
const sameWeek = [40 * 24 + 1, 40 * 24 + 5].map((h) => makeDir(`einfach-hausen-${stamp(hoursAgo(h))}`));
const ancient = makeDir(`einfach-hausen-${stamp(hoursAgo(200 * 24))}`);   // remove: outside all windows
// A day that carries no directory backup, so the tarball is that day's newest
// artifact and must survive on its own merit.
const tarball = path.join(backupRoot, `einfach-hausen-${stamp(hoursAgo(24 * 8))}.tar.gz`);
fs.writeFileSync(tarball, Buffer.alloc(4096));

// decoys that must never be touched
const decoyDir = path.join(backupRoot, 'not-a-backup');
fs.mkdirSync(decoyDir);
const decoyFile = path.join(backupRoot, 'README.txt');
fs.writeFileSync(decoyFile, 'keep me');
const staging = path.join(backupRoot, '.einfach-hausen-20260921T000000Z.abc123');
fs.mkdirSync(staging);

const totalArtifacts = 1 + 1 + 3 + 1 + 2 + 1 + 1; // dirs above + tarball

// --- dry run must not delete anything ------------------------------------------
const dry = run({ BACKUP_PRUNE_DRY_RUN: '1' });
check('dry run reports removals without deleting', /would remove/.test(dry));
check(
  'dry run leaves every artifact on disk',
  fs.readdirSync(backupRoot).length === totalArtifacts + 3,
);

// --- apply ---------------------------------------------------------------------
const applied = run();
check('apply reports a removal count', /retention: removed \d+ of \d+ backup\(s\)/.test(applied));

const survivors = new Set(fs.readdirSync(backupRoot));
const nameOf = (p) => path.basename(p);

check('the newest backup survives', survivors.has(nameOf(recent)));
check('a backup inside the keep-all window survives', survivors.has(nameOf(keepAll)));
check(
  'the newest backup of a day survives while its same-day duplicates are pruned',
  survivors.has(nameOf(sameDay[0])) &&
    !survivors.has(nameOf(sameDay[1])) &&
    !survivors.has(nameOf(sameDay[2])),
);
check('a mid-week day keeps its newest backup', survivors.has(nameOf(midDay)));
check(
  'the newest backup of a week survives while its same-week duplicate is pruned',
  survivors.has(nameOf(sameWeek[0])) && !survivors.has(nameOf(sameWeek[1])),
);
check('a backup outside every window is pruned', !survivors.has(nameOf(ancient)));
check('the nightly tarball participates in retention', survivors.has(nameOf(tarball)));

check(
  'non-backup entries are left alone',
  survivors.has('not-a-backup') && survivors.has('README.txt') &&
    survivors.has('.einfach-hausen-20260921T000000Z.abc123'),
);

// --- idempotence: a second run must be a no-op ---------------------------------
const second = run();
check('a second run removes nothing', /retention: removed 0 of \d+/.test(second));

// --- safety: a shared path must be refused -------------------------------------
let refused = false;
try {
  execFileSync('bash', [script], { encoding: 'utf8', env: { ...process.env, BACKUP_ROOT: '/' } });
} catch {
  refused = true;
}
check('pruning a shared path such as / is refused', refused);

let missing = false;
try {
  execFileSync('bash', [script], {
    encoding: 'utf8',
    env: { ...process.env, BACKUP_ROOT: path.join(workdir, 'does-not-exist') },
  });
} catch {
  missing = true;
}
check('a missing backup root fails loudly instead of passing', missing);

fs.rmSync(workdir, { recursive: true, force: true });
console.log(`\nBackup retention regression passed: ${checks} checks`);
