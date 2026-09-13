/**
 * src/lib/contact-directory-schema.ts
 * Contact directory DDL + seed + backfill + mirror triggers.
 * Imports ONLY taxonomy (no db import: db.ts imports this module, never the reverse).
 * Called once from src/lib/db.ts END via execWithRetry. See db-insert-snippet.md.
 * Status: DRAFT packet, UNRUN. No repository edits made.
 */
import type Database from 'better-sqlite3';
import {
  CONTACT_DIRECTORY_CATEGORIES,
  type ContactDirectoryCategory,
} from './contact-directory-taxonomy';

export const CONTACT_DIRECTORY_TABLES = [
  'contact_directory_mains',
  'contact_directory_subcategories',
  'homeowner_contact_entries',
  'homeowner_contact_subcategories',
  'contact_directory_receipts',
] as const;

function seedTaxonomy(database: Database.Database, categories: readonly ContactDirectoryCategory[]): void {
  const upsertMain = database.prepare(
    'INSERT INTO contact_directory_mains(slug,title,sort,active) VALUES(?,?,?,1) ' +
      'ON CONFLICT(slug) DO UPDATE SET title=excluded.title,sort=excluded.sort,active=1',
  );
  const upsertSub = database.prepare(
    'INSERT INTO contact_directory_subcategories(slug,main_slug,title,sort,active) VALUES(?,?,?,?,1) ' +
      'ON CONFLICT(slug) DO UPDATE SET main_slug=excluded.main_slug,title=excluded.title,sort=excluded.sort,active=1',
  );
  categories.forEach((main, mainIndex) => {
    upsertMain.run(main.id, main.label, mainIndex);
    main.subcategories.forEach((sub, subIndex) => {
      upsertSub.run(sub.id, main.id, sub.label, subIndex);
    });
  });
  // Non-destructive: unknown/existing rows are kept, never deleted here.
}

function backfillEntries(database: Database.Database): void {
  database
    .prepare(
      'INSERT INTO homeowner_contact_entries(homeowner_id,contact_user_id,display_name,company,phone,email,legacy_category) ' +
        'SELECT hc.homeowner_id,hc.contact_user_id,' +
        "trim(COALESCE((SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.id=hc.contact_user_id),''))," +
        'COALESCE((SELECT p.business_name FROM provider_profiles p WHERE p.user_id=hc.provider_id),\'\'),' +
        'COALESCE((SELECT u.phone FROM users u WHERE u.id=hc.contact_user_id),\'\'),' +
        'COALESCE((SELECT u.email FROM users u WHERE u.id=hc.contact_user_id),\'\'),' +
        'hc.category FROM homeowner_contacts hc WHERE 1 ' +
        'ON CONFLICT(homeowner_id,contact_user_id) DO NOTHING',
    )
    .run();
}

export function initializeContactDirectory(database: Database.Database): void {
  const run = database.transaction(() => {
    database.exec(
      'CREATE TABLE IF NOT EXISTS contact_directory_mains ' +
        "(slug TEXT PRIMARY KEY,title TEXT NOT NULL,sort INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1);" +
        'CREATE TABLE IF NOT EXISTS contact_directory_subcategories ' +
        '(slug TEXT PRIMARY KEY,main_slug TEXT NOT NULL REFERENCES contact_directory_mains(slug) ON DELETE RESTRICT,' +
        "title TEXT NOT NULL,sort INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1);" +
        'CREATE INDEX IF NOT EXISTS idx_contact_subs_main ON contact_directory_subcategories(main_slug,sort);' +
        'CREATE TABLE IF NOT EXISTS homeowner_contact_entries ' +
        '(id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,' +
        'contact_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,' +
        "display_name TEXT NOT NULL DEFAULT '',company TEXT NOT NULL DEFAULT ''," +
        "phone TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT ''," +
        "legacy_category TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 0," +
        'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
        'UNIQUE(homeowner_id,contact_user_id),UNIQUE(homeowner_id,id));' +
        'CREATE INDEX IF NOT EXISTS idx_contact_entries_owner ON homeowner_contact_entries(homeowner_id,updated_at DESC);' +
        'CREATE INDEX IF NOT EXISTS idx_contact_entries_platform ON homeowner_contact_entries(homeowner_id,contact_user_id);' +
        'CREATE TABLE IF NOT EXISTS homeowner_contact_subcategories ' +
        '(homeowner_id INTEGER NOT NULL,entry_id INTEGER NOT NULL,subcategory_id TEXT NOT NULL ' +
        'REFERENCES contact_directory_subcategories(slug) ON DELETE RESTRICT,' +
        'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
        'PRIMARY KEY(homeowner_id,entry_id,subcategory_id),' +
        'FOREIGN KEY(homeowner_id,entry_id) REFERENCES homeowner_contact_entries(homeowner_id,id) ON DELETE CASCADE);' +
        'CREATE INDEX IF NOT EXISTS idx_contact_subs_entry ON homeowner_contact_subcategories(entry_id,subcategory_id);' +
        'CREATE TABLE IF NOT EXISTS contact_directory_receipts ' +
        '(homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,' +
        'request_id TEXT NOT NULL,payload_hash TEXT NOT NULL,entry_id INTEGER NOT NULL ' +
        'REFERENCES homeowner_contact_entries(id) ON DELETE CASCADE,' +
        'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
        'PRIMARY KEY(homeowner_id,request_id),FOREIGN KEY(homeowner_id,entry_id) REFERENCES homeowner_contact_entries(homeowner_id,id) ON DELETE CASCADE);',
    );
    seedTaxonomy(database, CONTACT_DIRECTORY_CATEGORIES);
    backfillEntries(database);
    database.exec(
      'CREATE TRIGGER IF NOT EXISTS trg_hc_entry_mirror_insert AFTER INSERT ON homeowner_contacts BEGIN ' +
        'INSERT INTO homeowner_contact_entries(homeowner_id,contact_user_id,display_name,company,phone,email,legacy_category) ' +
        "SELECT NEW.homeowner_id,NEW.contact_user_id," +
        "trim(COALESCE((SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.id=NEW.contact_user_id),''))," +
        'COALESCE((SELECT p.business_name FROM provider_profiles p WHERE p.user_id=NEW.provider_id),\'\'),' +
        'COALESCE((SELECT u.phone FROM users u WHERE u.id=NEW.contact_user_id),\'\'),' +
        'COALESCE((SELECT u.email FROM users u WHERE u.id=NEW.contact_user_id),\'\'),NEW.category ' +
        'ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET ' +
        'display_name=excluded.display_name,company=excluded.company,phone=excluded.phone,' +
        'email=excluded.email,legacy_category=excluded.legacy_category,updated_at=CURRENT_TIMESTAMP; END;',
    );
    database.exec(
      'CREATE TRIGGER IF NOT EXISTS trg_hc_entry_mirror_update AFTER UPDATE ON homeowner_contacts BEGIN ' +
        'UPDATE homeowner_contact_entries SET ' +
        "display_name=trim(COALESCE((SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.id=NEW.contact_user_id),''))," +
        'company=COALESCE((SELECT p.business_name FROM provider_profiles p WHERE p.user_id=NEW.provider_id),\'\'),' +
        'phone=COALESCE((SELECT u.phone FROM users u WHERE u.id=NEW.contact_user_id),\'\'),' +
        'email=COALESCE((SELECT u.email FROM users u WHERE u.id=NEW.contact_user_id),\'\'),' +
        'legacy_category=NEW.category,updated_at=CURRENT_TIMESTAMP ' +
        'WHERE homeowner_id=NEW.homeowner_id AND contact_user_id=NEW.contact_user_id; END;',
    );
    // Intentionally NO DELETE trigger: homeowner_contacts reassignment deletes
    // must not erase saved address-book entries or their subcategory links.
    // Account deletion cascades via homeowner_contact_entries FK (ON DELETE CASCADE).
  });
  run.immediate();
}
