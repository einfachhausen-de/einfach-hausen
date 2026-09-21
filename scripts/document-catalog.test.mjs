import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { loadDocumentCatalog } from '../src/lib/document-catalog.ts';

test('catalog isolates owners, requires active house ownership and links only the current receipt', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`
      CREATE TABLE jobs(id INTEGER, homeowner_id INTEGER, title TEXT);
      CREATE TABLE provider_profiles(user_id INTEGER, business_name TEXT);
      CREATE TABLE documents(id INTEGER, kind TEXT, path TEXT, created_at TEXT, title TEXT, job_id INTEGER, provider_id INTEGER);
      CREATE TABLE invoices(id INTEGER, homeowner_id INTEGER, job_id INTEGER, provider_id INTEGER, invoice_number TEXT, total_gross INTEGER, issue_date TEXT, created_at TEXT, status TEXT);
      CREATE TABLE payments(id INTEGER, homeowner_id INTEGER, job_id INTEGER, provider_id INTEGER, amount INTEGER, paid_at TEXT, created_at TEXT, status TEXT);
      CREATE TABLE house_history_entries(id INTEGER, property_id INTEGER, title TEXT, company_name TEXT, performed_at TEXT);
      CREATE TABLE house_history_documents(id INTEGER, entry_id INTEGER, title TEXT, path TEXT);
      CREATE TABLE property_ownerships(property_id INTEGER, homeowner_id INTEGER, active INTEGER);
      INSERT INTO provider_profiles VALUES(9,'Betrieb');
      INSERT INTO jobs VALUES(10,1,'Unser Dach'),(20,2,'Fremdes Dach');
      INSERT INTO documents VALUES(1,'report','a.pdf','2026-01-01','Unser Bericht',10,9),(2,'report','b.pdf','2026-01-01','Fremder Bericht',20,9);
      INSERT INTO invoices VALUES(1,1,10,9,'R1',10050,'2026-01-01','2026-01-01','sent'),(2,2,20,9,'R2',20000,'2026-01-01','2026-01-01','paid');
      INSERT INTO payments VALUES(1,1,10,9,1000,'2026-01-01','2026-01-01','paid'),(2,1,10,9,2000,'2026-02-01','2026-02-01','paid'),(3,1,10,9,3000,NULL,'2026-03-01','pending'),(4,2,20,9,4000,'2026-03-01','2026-03-01','paid');
      INSERT INTO house_history_entries VALUES(1,100,'Haus A','Firma A','2026-01-01'),(2,200,'Haus B','Firma B','2026-02-01');
      INSERT INTO house_history_documents VALUES(1,1,'Unser Scan','h1.pdf'),(2,2,'Fremder Scan','h2.pdf');
      INSERT INTO property_ownerships VALUES(100,1,1),(100,1,1),(200,1,0),(200,2,1);
    `);
    const result = loadDocumentCatalog(db, 1);
    assert.deepEqual(result.uploaded.map(x => x.id), [1]);
    assert.deepEqual(result.invoices.map(x => x.id), [1]);
    assert.deepEqual(result.payments.map(x => x.id), [2]);
    assert.deepEqual(result.history.map(x => x.id), [1]);
    assert.equal(result.invoices[0].total_gross, 10050);
    db.exec('UPDATE property_ownerships SET active=0 WHERE homeowner_id=1');
    assert.deepEqual(loadDocumentCatalog(db, 1).history, []);
    assert.deepEqual(loadDocumentCatalog(db, 999), { uploaded: [], invoices: [], payments: [], history: [] });
  } finally { db.close(); }
});
