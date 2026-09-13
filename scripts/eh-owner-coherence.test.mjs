// EH owner coherence 2026-09-13 — non-visual contract tests (implementer-authored).
// Covers: owner-format UTC/zone/date-only/invalid/DST, maintenance labels with
// fixed clock, jobs search+view preservation + filter grouping, current-vs-past
// appointment separation, contact categories/query+area/thread preservation,
// four-page H1/toolbar/44px structure. Fixtures/test DB only.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import {
  ownerInstant,
  ownerDate,
  ownerMaintenanceState,
} from "../src/lib/owner-format.ts";
import {
  normalizeContactCategory,
  groupContactsByCategory,
  STANDARD_CONTACT_CATEGORIES,
} from "../src/lib/contact-categories.ts";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(repo, p), "utf8");

// --- ownerInstant: SQLite timestamps are UTC --------------------------------
test("ownerInstant parses SQLite timestamps as UTC", () => {
  const d = ownerInstant("2026-03-15 10:00:00");
  assert(d instanceof Date);
  assert.equal(d.getTime(), Date.UTC(2026, 2, 15, 10, 0, 0));
});

test("ownerInstant accepts T separator and Z suffix as the same instant", () => {
  const a = ownerInstant("2026-03-15 10:00:00");
  const b = ownerInstant("2026-03-15T10:00:00");
  const c = ownerInstant("2026-03-15T10:00:00Z");
  assert.equal(b.getTime(), a.getTime());
  assert.equal(c.getTime(), a.getTime());
});

test("ownerInstant respects an explicit zone offset", () => {
  const d = ownerInstant("2026-03-15T12:00:00+02:00");
  assert.equal(d.getTime(), Date.UTC(2026, 2, 15, 10, 0, 0));
});

test("ownerInstant rejects date-only, empty and invalid input", () => {
  assert.equal(ownerInstant("2026-03-15"), null);
  assert.equal(ownerInstant(""), null);
  assert.equal(ownerInstant(null), null);
  assert.equal(ownerInstant(undefined), null);
  assert.equal(ownerInstant("kein-datum"), null);
  assert.equal(ownerInstant("2026-13-99 99:99:99"), null);
});

// --- ownerDate: Berlin display, date-only stays a date -----------------------
test("ownerDate renders UTC instants in Europe/Berlin (DST summer)", () => {
  // 12:00 UTC on 2026-07-01 is 14:00 CEST.
  const label = ownerDate("2026-07-01 12:00:00");
  assert.match(label, /14:00/);
  assert.match(label, /01\.07\.2026/);
});

test("ownerDate renders UTC instants in Europe/Berlin (winter)", () => {
  // 12:00 UTC on 2026-01-15 is 13:00 CET.
  const label = ownerDate("2026-01-15 12:00:00");
  assert.match(label, /13:00/);
  assert.match(label, /15\.01\.2026/);
});

test("ownerDate keeps date-only values free of clock time", () => {
  const label = ownerDate("2026-09-13");
  assert.match(label, /13\.09\.2026/);
  assert.doesNotMatch(label, /:/);
});

test("ownerDate falls back for missing/invalid values", () => {
  assert.equal(ownerDate(null), "Datum noch offen");
  assert.equal(ownerDate(""), "Datum noch offen");
  assert.equal(ownerDate("kein-datum"), "Datum noch offen");
});

// --- ownerMaintenanceState with a fixed clock --------------------------------
const FIXED_NOW = new Date("2026-09-13T10:00:00Z"); // Berlin: 12:00, 2026-09-13

test("maintenance due labels use the Berlin calendar day", () => {
  assert.equal(ownerMaintenanceState("2026-09-12", FIXED_NOW), "Wartung überfällig");
  assert.equal(ownerMaintenanceState("2026-09-13", FIXED_NOW), "Wartung heute fällig");
  assert.equal(ownerMaintenanceState("2026-09-14", FIXED_NOW), "Wartung geplant");
});

test("maintenance state falls back for non-dates", () => {
  assert.equal(ownerMaintenanceState(null, FIXED_NOW), "Wartung planen");
  assert.equal(ownerMaintenanceState("", FIXED_NOW), "Wartung planen");
  assert.equal(ownerMaintenanceState("bald", FIXED_NOW), "Wartung planen");
});

test("maintenance labels stay correct across the DST switch", () => {
  // 2026-03-29 is the CEST switch day: 00:30Z is still 2026-03-29 in Berlin.
  const before = new Date("2026-03-29T00:30:00Z");
  assert.equal(ownerMaintenanceState("2026-03-29", before), "Wartung heute fällig");
  // 23:30Z is already 2026-03-30 in Berlin, so 03-29 is overdue.
  const after = new Date("2026-03-29T23:30:00Z");
  assert.equal(ownerMaintenanceState("2026-03-29", after), "Wartung überfällig");
});

// --- SQL idioms on an isolated in-memory DB ----------------------------------
function tinyDb() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE jobs (id INTEGER PRIMARY KEY, status TEXT);
           CREATE TABLE quotes (id INTEGER PRIMARY KEY, job_id INTEGER, status TEXT);
           CREATE TABLE appointments (id INTEGER PRIMARY KEY, job_id INTEGER, start_at TEXT);`);
  return db;
}

test("quotes count is pending-only (accepted quotes do not inflate it)", () => {
  const db = tinyDb();
  db.exec(`INSERT INTO jobs VALUES (1,'quoted'),(2,'quoted');
           INSERT INTO quotes VALUES (10,1,'pending'),(11,1,'accepted'),(12,2,'accepted');`);
  const rows = db
    .prepare(`SELECT j.id, COUNT(DISTINCT CASE WHEN q.status='pending' THEN q.id END) AS quotes
              FROM jobs j LEFT JOIN quotes q ON q.job_id=j.id GROUP BY j.id ORDER BY j.id`)
    .all();
  assert.deepEqual(rows, [{ id: 1, quotes: 1 }, { id: 2, quotes: 0 }]);
  db.close();
});

test("zero-pending quoted jobs still list (truthful LEFT JOIN fallback)", () => {
  const db = tinyDb();
  db.exec(`INSERT INTO jobs VALUES (7,'quoted');`);
  const row = db
    .prepare(`SELECT j.id, COUNT(q.id) quote_count FROM jobs j
              LEFT JOIN quotes q ON q.job_id=j.id AND q.status='pending'
              WHERE j.status='quoted' GROUP BY j.id`)
    .get();
  assert.deepEqual(row, { id: 7, quote_count: 0 });
  db.close();
});

test("current vs past appointments never overlap (no -1day window)", () => {
  const db = tinyDb();
  db.exec(`INSERT INTO appointments (job_id, start_at) VALUES
    (1, datetime('now','-1 hour')), (1, datetime('now','+1 hour')), (1, datetime('now'));`);
  const current = db
    .prepare(`SELECT id FROM appointments WHERE datetime(start_at) >= datetime('now')`)
    .all();
  const past = db
    .prepare(`SELECT id FROM appointments WHERE datetime(start_at) < datetime('now')`)
    .all();
  const all = db.prepare(`SELECT id FROM appointments`).all();
  assert.equal(current.length + past.length, all.length);
  const overlap = current.filter((c) => past.some((p) => p.id === c.id));
  assert.deepEqual(overlap, []);
  db.close();
});

test("past pagination slices with LIMIT/OFFSET and a clamped page", () => {
  const db = tinyDb();
  const insert = db.prepare(`INSERT INTO appointments (job_id, start_at) VALUES (1, ?)`);
  for (let i = 1; i <= 120; i++) insert.run(`2020-01-01 00:${String(i % 60).padStart(2, "0")}:00`);
  const count = db
    .prepare(`SELECT COUNT(*) c FROM appointments WHERE datetime(start_at) < datetime('now')`)
    .get().c;
  assert.equal(count, 120);
  const pages = Math.max(1, Math.ceil(count / 50));
  assert.equal(pages, 3);
  const page3 = db
    .prepare(`SELECT id FROM appointments WHERE datetime(start_at) < datetime('now') ORDER BY datetime(start_at) DESC, id LIMIT 50 OFFSET ?`)
    .all((3 - 1) * 50);
  assert.equal(page3.length, 20);
  const clamped = Math.min(99, pages);
  assert.equal(clamped, 3);
  db.close();
});

// --- jobs page: search + view preservation, specific filter grouping ---------
test("jobs page preserves the query across view filters", () => {
  const src = read("src/app/app/jobs/page.tsx");
  assert.match(src, /next\.set\('q'/);
  assert.match(src, /if \(query\) next\.set\('q',firstParam\(params\.q\)\)/);
});

test("jobs page omits the view param for the default view", () => {
  const src = read("src/app/app/jobs/page.tsx");
  assert.match(src, /hidden=\{currentView === 'current' \? undefined/);
  assert.match(src, /if \(nextView !== 'current'\) next\.set\('view',nextView\)/);
});

test("jobs filters group exactly open/quoted/accepted, in_progress, completed", () => {
  const src = read("src/app/app/jobs/page.tsx");
  assert.match(src, /\['open', 'quoted', 'accepted'\]\.includes\(job\.status\)/);
  assert.match(src, /job\.status === 'in_progress'/);
  assert.match(src, /job\.status === 'completed'/);
  assert.match(src, /label:'Offen',count:openJobs\.length/);
  assert.match(src, /label:'In Arbeit',count:inProgressJobs\.length/);
  assert.match(src, /label:'Abgeschlossen',count:completedJobs\.length/);
});

test("jobs search covers title, category, description, business and status", () => {
  const src = read("src/app/app/jobs/page.tsx");
  assert.match(src, /job\.title,/);
  assert.match(src, /job\.category,/);
  assert.match(src, /job\.description,/);
  assert.match(src, /job\.accepted_business/);
  assert.match(src, /statusLabel\(job\.status\)/);
});

test("jobs quoted actions distinguish offer review from opening", () => {
  const src = read("src/app/app/jobs/page.tsx");
  assert.match(src, /Angebot prüfen/);
  assert.match(src, /Auftrag öffnen/);
});

// --- calendar: no overlap, real links ----------------------------------------
test("calendar separates current/past on the UTC instant (no day window)", () => {
  const src = read("src/app/app/calendar/page.tsx");
  assert.match(src, /datetime\(a\.start_at\) \$\{past \? '<' : '>='\} datetime\('now'\)/);
  assert.doesNotMatch(src, /-1 day/);
});

test("calendar rows link to their job and past pages paginate", () => {
  const src = read("src/app/app/calendar/page.tsx");
  assert.match(src, /href:`\/app\/jobs\/\$\{row\.job_id\}`/);
  assert.match(src, /LIMIT 50 OFFSET \?/);
  assert.match(src, /Seite \$\{page\} von \$\{pages\}/);
});

// --- messages: real categories, query+area preservation, thread intact -------
test("contact categories come from stored values including custom ones", () => {
  assert(STANDARD_CONTACT_CATEGORIES.length > 0);
  assert.equal(normalizeContactCategory(""), "Haus & Allgemein");
  assert.equal(normalizeContactCategory("Pool & Sauna"), "Pool & Sauna");
  assert.equal(normalizeContactCategory("Gartenpflege"), "Garten & Außen");
  const groups = groupContactsByCategory([
    { category: "Pool & Sauna" },
    { category: "Pool & Sauna" },
    { category: "Elektro" },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0][0], "Elektro");
  assert.equal(groups[1][0], "Pool & Sauna");
  assert.equal(groups[1][1].length, 2);
});

test("messages directory preserves query and area in navigation", () => {
  const src = read("src/app/app/messages/page.tsx");
  assert.match(src, /returnParams\.set\('q', rawQuery\)/);
  assert.match(src, /returnParams\.set\('bereich', activeArea\)/);
  assert.match(src, /params\.set\('contact', String\(id\)\)/);
  assert.match(src, /href:contactHref\(contact\.contact_user_id\)/);
  assert.match(src, /href=\{directoryHref\}/);
});

test("messages thread query runs only for an explicit contact", () => {
  const src = read("src/app/app/messages/page.tsx");
  assert.match(src, /const messages = hasRequestedContact && selected/);
});

test("messages thread send, receipts and category save are unchanged", () => {
  const src = read("src/app/app/messages/page.tsx");
  assert.match(src, /OwnerMessageComposer/);
  assert.match(src, /read_at/);
  assert.match(src, /updateContactCategoryAction/);
  assert.match(src, /Bereich speichern/);
  assert.match(src, /Bestehende Kundenbeziehung/);
});

// --- four-page structure: one H1, shared toolbar, touch targets --------------
test("each owner page renders exactly one shared page header", () => {
  for (const page of [
    "src/app/app/page.tsx",
    "src/app/app/jobs/page.tsx",
    "src/app/app/calendar/page.tsx",
    "src/app/app/messages/page.tsx",
  ]) {
    const matches = read(page).match(/<EHOwnerPageHeader/g) || [];
    assert.equal(matches.length, 1, `${page} must render one EHOwnerPageHeader`);
  }
});

test("shared header renders a single H1 with action support", () => {
  const src = read("packages/eh-design/src/workspace-owner.tsx");
  const h1 = src.match(/<h1>/g) || [];
  assert.equal(h1.length, 1);
});

test("shell keeps one profile entry and the toolbar on every owner page", () => {
  const src = read("src/components/shell.tsx");
  const menus = src.match(/<SidebarAccountMenu/g) || [];
  assert.equal(menus.length, 1);
  assert.match(src, /<HouseAssistant placement="toolbar" \/>/);
  assert.match(src, /href="\/notifications"/);
});

test("owner styles ship 44px+ targets and 16px inputs", () => {
  const css = read("packages/eh-design/src/styles.module.css");
  assert(css.includes("min-height:44px"), "expected 44px touch targets");
  assert(css.includes("font-size:16px"), "expected 16px inputs");
  const marker = css.match(/Owner workspace coherence/g) || [];
  assert.equal(marker.length, 1, "owner styles must be appended exactly once");
});
