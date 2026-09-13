/**
 * src/lib/contact-directory-store.ts
 * Injectable contact-directory store. Pure DB handle, no global db import:
 * tests construct with new Database(':memory:') + initializeContactDirectory.
 * Positive authenticated ownerId is passed by server wrappers only; every
 * method re-checks tenant before any write. Platform profile fields are
 * readonly snapshots; only manual entries are editable.
 * Status: DRAFT packet, UNRUN. No repository edits made.
 */
import type Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import {
  CONTACT_DIRECTORY_CATEGORIES,
  type ContactDirectoryCategory,
} from './contact-directory-taxonomy';
import { allSubcategoryIdsBelongToMain, mainExists } from './contact-directory-helpers';

export type ContactView = {
  id: number;
  platformUserId: number | null;
  name: string;
  company: string;
  phone: string;
  email: string;
  legacyCategory: string;
  revision: number;
  subcategoryIds: string[];
};

export type DuplicateCandidate = {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
};

export type StoreError =
  | { ok: false; code: 'not-found'; message: string }
  | { ok: false; code: 'forbidden'; message: string }
  | { ok: false; code: 'validation'; message: string; field?: string }
  | { ok: false; code: 'conflict'; message: string }
  | { ok: false; code: 'stale-revision'; message: string; currentRevision: number }
  | { ok: false; code: 'duplicate-candidates'; message: string; candidates: DuplicateCandidate[] };

export type StoreResult<T> = { ok: true; value: T } | StoreError;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s()./-]{5,39}$/;

function hasCRLF(value: string): boolean {
  return value.includes('\n') || value.includes('\r');
}

function fail(code: 'not-found' | 'forbidden', what = 'Kontakt'): StoreError {
  // Non-leaking: foreign owner/entry reads report the same generic message.
  return { ok: false, code, message: `${what} nicht verfügbar.` };
}

function validOwnerId(ownerId: number): boolean {
  return Number.isSafeInteger(ownerId) && ownerId > 0;
}

function checkName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'Name ist erforderlich.';
  if (name.length > 120) return 'Name ist zu lang (max. 120 Zeichen).';
  if (hasCRLF(value)) return 'Name enthält ungültige Zeichen.';
  return null;
}

function checkCompany(value: string): string | null {
  const company = value.trim();
  if (company.length > 120) return 'Firma ist zu lang (max. 120 Zeichen).';
  if (hasCRLF(value)) return 'Firma enthält ungültige Zeichen.';
  return null;
}

function checkEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return null;
  if (email.length > 254) return 'E-Mail ist zu lang (max. 254 Zeichen).';
  if (hasCRLF(value)) return 'E-Mail enthält ungültige Zeichen.';
  if (!EMAIL_RE.test(email.toLowerCase())) return 'E-Mail ist ungültig.';
  return null;
}

function checkPhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) return null;
  if (phone.length > 40) return 'Telefon ist zu lang (max. 40 Zeichen).';
  if (hasCRLF(value)) return 'Telefon enthält ungültige Zeichen.';
  if (!PHONE_RE.test(phone)) return 'Telefon enthält ungültige Zeichen.';
  return null;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function payloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

type EntryRow = {
  id: number;
  homeowner_id: number;
  contact_user_id: number | null;
  display_name: string;
  company: string;
  phone: string;
  email: string;
  legacy_category: string;
  revision: number;
};

export type CreateManualInput = {
  ownerId: number;
  requestId: string;
  mainId: string;
  initialSubcategoryId: string;
  subcategoryIds: string[];
  name: string;
  company: string;
  phone: string;
  email: string;
  allowPossibleDuplicate?: boolean;
};

export type UpdateManualInput = {
  ownerId: number;
  entryId: number;
  revision: number;
  name: string;
  company: string;
  phone: string;
  email: string;
};

export type ReplaceAssignmentsInput = {
  ownerId: number;
  entryId: number;
  mainId: string;
  subcategoryIds: string[];
  revision: number;
};

export type AddExistingInput = {
  ownerId: number;
  entryId: number;
  mainId: string;
  initialSubcategoryId: string;
  subcategoryIds: string[];
  revision: number;
};

export function createContactDirectoryStore(
  database: Database.Database,
  taxonomy: readonly ContactDirectoryCategory[] = CONTACT_DIRECTORY_CATEGORIES,
) {
  function toView(row: EntryRow): ContactView {
    const links = database
      .prepare(
        'SELECT subcategory_id FROM homeowner_contact_subcategories WHERE homeowner_id=? AND entry_id=? ORDER BY subcategory_id',
      )
      .all(row.homeowner_id, row.id) as Array<{ subcategory_id: string }>;
    return {
      id: row.id,
      platformUserId: row.contact_user_id,
      name: row.display_name,
      company: row.company,
      phone: row.phone,
      email: row.email,
      legacyCategory: row.legacy_category,
      revision: row.revision,
      subcategoryIds: links.map((link) => link.subcategory_id),
    };
  }

  function loadEntry(ownerId: number, entryId: number): EntryRow | undefined {
    return database
      .prepare('SELECT * FROM homeowner_contact_entries WHERE homeowner_id=? AND id=?')
      .get(ownerId, entryId) as EntryRow | undefined;
  }

  function list(ownerId: number): StoreResult<ContactView[]> {
    if (!validOwnerId(ownerId)) return fail('not-found');
    const rows = database
      .prepare('SELECT * FROM homeowner_contact_entries WHERE homeowner_id=? ORDER BY updated_at DESC,id DESC')
      .all(ownerId) as EntryRow[];
    return { ok: true, value: rows.map(toView) };
  }

  function get(ownerId: number, entryId: number): StoreResult<ContactView> {
    if (!validOwnerId(ownerId)) return fail('not-found');
    const row = loadEntry(ownerId, entryId);
    if (!row) return fail('not-found');
    return { ok: true, value: toView(row) };
  }

  function findByPlatformUserId(ownerId: number, userId: number): StoreResult<ContactView> {
    if (!validOwnerId(ownerId)) return fail('not-found');
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return { ok: false, code: 'validation', message: 'Ungültige Kontakt-ID.' };
    }
    const row = database
      .prepare('SELECT * FROM homeowner_contact_entries WHERE homeowner_id=? AND contact_user_id=?')
      .get(ownerId, userId) as EntryRow | undefined;
    if (!row) return fail('not-found');
    return { ok: true, value: toView(row) };
  }

  function checkSelection(
    mainId: string,
    subcategoryIds: readonly string[],
    initialSubcategoryId: string | null,
    allowEmpty = false,
  ): StoreError | null {
    if (!mainExists(taxonomy, mainId)) {
      return { ok: false, code: 'validation', message: 'Unbekannter Bereich.', field: 'mainId' };
    }
    const unique = [...new Set(subcategoryIds.map(String))].filter(Boolean);
    if (unique.length === 0 && !allowEmpty) {
      return { ok: false, code: 'validation', message: 'Mindestens eine Unterkategorie wählen.', field: 'subcategoryIds' };
    }
    if (!allSubcategoryIdsBelongToMain(taxonomy, mainId, unique)) {
      return { ok: false, code: 'validation', message: 'Auswahl passt nicht zum gewählten Bereich.', field: 'subcategoryIds' };
    }
    if (initialSubcategoryId !== null && !unique.includes(initialSubcategoryId)) {
      return {
        ok: false,
        code: 'validation',
        message: 'Die ursprüngliche Unterkategorie muss Teil der Auswahl sein.',
        field: 'initialSubcategoryId',
      };
    }
    return null;
  }

  function sameStringSet(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;
    const set = new Set(a);
    return b.every((item) => set.has(item));
  }

  function findDuplicateCandidates(
    ownerId: number,
    email: string,
    phone: string,
    excludeEntryId: number | null,
  ): DuplicateCandidate[] {
    const normalizedEmail = email ? normalizeEmail(email) : '';
    const normalizedPhone = phone ? normalizePhone(phone) : '';
    if (!normalizedEmail && normalizedPhone.length < 7) return [];
    const rows = database
      .prepare('SELECT id,display_name,company,phone,email FROM homeowner_contact_entries WHERE homeowner_id=?')
      .all(ownerId) as Array<{ id: number; display_name: string; company: string; phone: string; email: string }>;
    return rows
      .filter((row) => (excludeEntryId === null || row.id !== excludeEntryId))
      .filter((row) => {
        if (normalizedEmail && row.email && normalizeEmail(row.email) === normalizedEmail) return true;
        const rowPhone = row.phone ? normalizePhone(row.phone) : '';
        if (normalizedPhone.length >= 7 && rowPhone === normalizedPhone) return true;
        return false;
      })
      .map((row) => ({ id: row.id, name: row.display_name, company: row.company, phone: row.phone, email: row.email }));
  }
  function createManual(input: CreateManualInput): StoreResult<ContactView> {
    const { ownerId, requestId, mainId, initialSubcategoryId, subcategoryIds, allowPossibleDuplicate } = input;
    if (!validOwnerId(ownerId)) return fail('not-found');
    const trimmedRequestId = String(requestId || '').trim();
    if (!/^[A-Za-z0-9._:-]{8,100}$/.test(trimmedRequestId)) {
      return { ok: false, code: 'validation', message: 'Ungültige Anfragekennung.', field: 'requestId' };
    }
    const name = input.name.trim();
    const company = input.company.trim();
    const phone = input.phone.trim();
    const email = input.email.trim();
    const nameError = checkName(input.name);
    if (nameError) return { ok: false, code: 'validation', message: nameError, field: 'name' };
    const companyError = checkCompany(input.company);
    if (companyError) return { ok: false, code: 'validation', message: companyError, field: 'company' };
    const phoneError = checkPhone(input.phone);
    if (phoneError) return { ok: false, code: 'validation', message: phoneError, field: 'phone' };
    const emailError = checkEmail(input.email);
    if (emailError) return { ok: false, code: 'validation', message: emailError, field: 'email' };
    const uniqueSelection = [...new Set(subcategoryIds.map(String))].filter(Boolean);
    const selectionError = checkSelection(mainId, uniqueSelection, initialSubcategoryId);
    if (selectionError) return selectionError;
    const canonicalPayload = {
      intent: 'create-manual',
      mainId,
      subcategoryIds: [...uniqueSelection].sort(),
      name,
      company,
      phone,
      email,
    };
    const hash = payloadHash(canonicalPayload);
    const existing = database
      .prepare('SELECT entry_id,payload_hash FROM contact_directory_receipts WHERE homeowner_id=? AND request_id=?')
      .get(ownerId, trimmedRequestId) as { entry_id: number; payload_hash: string } | undefined;
    if (existing) {
      if (existing.payload_hash !== hash) {
        return { ok: false, code: 'conflict', message: 'Diese Anfrage wurde bereits mit anderen Daten gesendet.' };
      }
      const row = loadEntry(ownerId, existing.entry_id);
      if (!row) return fail('not-found');
      return { ok: true, value: toView(row) };
    }
    if (!allowPossibleDuplicate) {
      const candidates = findDuplicateCandidates(ownerId, email, phone, null);
      if (candidates.length > 0) {
        return { ok: false, code: 'duplicate-candidates', message: 'Möglicherweise gibt es diesen Kontakt bereits.', candidates };
      }
    }
    const insert = database.transaction(() => {
      const result = database
        .prepare(
          'INSERT INTO homeowner_contact_entries(homeowner_id,contact_user_id,display_name,company,phone,email) VALUES(?,NULL,?,?,?,?)',
        )
        .run(ownerId, name, company, phone, email);
      const entryId = Number(result.lastInsertRowid);
      const addLink = database.prepare(
        'INSERT OR IGNORE INTO homeowner_contact_subcategories(homeowner_id,entry_id,subcategory_id) VALUES(?,?,?)',
      );
      for (const subcategoryId of uniqueSelection) addLink.run(ownerId, entryId, subcategoryId);
      database
        .prepare('INSERT INTO contact_directory_receipts(homeowner_id,request_id,payload_hash,entry_id) VALUES(?,?,?,?)')
        .run(ownerId, trimmedRequestId, hash, entryId);
      return entryId;
    });
    const entryId = insert.immediate() as number;
    const row = loadEntry(ownerId, entryId);
    if (!row) return fail('not-found');
    return { ok: true, value: toView(row) };
  }

  function updateManual(input: UpdateManualInput): StoreResult<ContactView> {
    const { ownerId, entryId, revision } = input;
    if (!validOwnerId(ownerId)) return fail('not-found');
    const name = input.name.trim();
    const company = input.company.trim();
    const phone = input.phone.trim();
    const email = input.email.trim();
    const nameError = checkName(input.name);
    if (nameError) return { ok: false, code: 'validation', message: nameError, field: 'name' };
    const companyError = checkCompany(input.company);
    if (companyError) return { ok: false, code: 'validation', message: companyError, field: 'company' };
    const phoneError = checkPhone(input.phone);
    if (phoneError) return { ok: false, code: 'validation', message: phoneError, field: 'phone' };
    const emailError = checkEmail(input.email);
    if (emailError) return { ok: false, code: 'validation', message: emailError, field: 'email' };
    const row = loadEntry(ownerId, entryId);
    if (!row) return fail('not-found');
    if (row.contact_user_id !== null) {
      return { ok: false, code: 'forbidden', message: 'Verknüpfte Plattformkontakte werden nicht manuell bearbeitet.' };
    }
    const unchanged =
      row.display_name === name && row.company === company && row.phone === phone && row.email === email;
    if (unchanged) return { ok: true, value: toView(row) };
    if (row.revision !== revision) {
      return { ok: false, code: 'stale-revision', message: 'Der Kontakt wurde inzwischen geändert.', currentRevision: row.revision };
    }
    database
      .prepare(
        'UPDATE homeowner_contact_entries SET display_name=?,company=?,phone=?,email=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE homeowner_id=? AND id=? AND revision=?',
      )
      .run(name, company, phone, email, ownerId, entryId, revision);
    const updated = loadEntry(ownerId, entryId);
    if (!updated) return fail('not-found');
    return { ok: true, value: toView(updated) };
  }

  function replaceAssignments(input: ReplaceAssignmentsInput): StoreResult<ContactView> {
    const { ownerId, entryId, mainId, subcategoryIds, revision } = input;
    if (!validOwnerId(ownerId)) return fail('not-found');
    const uniqueSelection = [...new Set(subcategoryIds.map(String))].filter(Boolean);
    const selectionError = checkSelection(mainId, uniqueSelection, null, true);
    if (selectionError) return selectionError;
    const row = loadEntry(ownerId, entryId);
    if (!row) return fail('not-found');
    const current = toView(row).subcategoryIds.filter((id) => {
      const ownerMain = subcategoryOwnerMain(id);
      return ownerMain === mainId;
    });
    if (sameStringSet(current, uniqueSelection)) {
      // Identical desired group set: no-op even on stale revision.
      return { ok: true, value: toView(row) };
    }
    if (row.revision !== revision) {
      return { ok: false, code: 'stale-revision', message: 'Der Kontakt wurde inzwischen geändert.', currentRevision: row.revision };
    }
    const apply = database.transaction(() => {
      const mainSubs = database
        .prepare('SELECT slug FROM contact_directory_subcategories WHERE main_slug=?')
        .all(mainId) as Array<{ slug: string }>;
      if (mainSubs.length > 0) {
        const placeholders = mainSubs.map(() => '?').join(',');
        database
          .prepare(
            `DELETE FROM homeowner_contact_subcategories WHERE homeowner_id=? AND entry_id=? AND subcategory_id IN (${placeholders})`,
          )
          .run(ownerId, entryId, ...mainSubs.map((sub) => sub.slug));
      }
      const addLink = database.prepare(
        'INSERT OR IGNORE INTO homeowner_contact_subcategories(homeowner_id,entry_id,subcategory_id) VALUES(?,?,?)',
      );
      for (const subcategoryId of uniqueSelection) addLink.run(ownerId, entryId, subcategoryId);
      database
        .prepare('UPDATE homeowner_contact_entries SET revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE homeowner_id=? AND id=?')
        .run(ownerId, entryId);
    });
    apply.immediate();
    const updated = loadEntry(ownerId, entryId);
    if (!updated) return fail('not-found');
    return { ok: true, value: toView(updated) };
  }

  function subcategoryOwnerMain(subcategoryId: string): string | null {
    const link = database
      .prepare('SELECT main_slug FROM contact_directory_subcategories WHERE slug=?')
      .get(subcategoryId) as { main_slug: string } | undefined;
    return link?.main_slug ?? null;
  }

  function addExisting(input: AddExistingInput): StoreResult<ContactView> {
    const { ownerId, entryId, mainId, initialSubcategoryId, subcategoryIds, revision } = input;
    if (!validOwnerId(ownerId)) return fail('not-found');
    const uniqueSelection = [...new Set(subcategoryIds.map(String))].filter(Boolean);
    const selectionError = checkSelection(mainId, uniqueSelection, initialSubcategoryId);
    if (selectionError) return selectionError;
    const row = loadEntry(ownerId, entryId);
    if (!row) return fail('not-found');
    const before = new Set(toView(row).subcategoryIds);
    const missing = uniqueSelection.filter((id) => !before.has(id));
    if (missing.length === 0) return { ok: true, value: toView(row) };
    if (row.revision !== revision) {
      return { ok: false, code: 'stale-revision', message: 'Der Kontakt wurde inzwischen geändert.', currentRevision: row.revision };
    }
    const apply = database.transaction(() => {
      const addLink = database.prepare(
        'INSERT OR IGNORE INTO homeowner_contact_subcategories(homeowner_id,entry_id,subcategory_id) VALUES(?,?,?)',
      );
      for (const subcategoryId of missing) addLink.run(ownerId, entryId, subcategoryId);
      database
        .prepare('UPDATE homeowner_contact_entries SET revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE homeowner_id=? AND id=?')
        .run(ownerId, entryId);
    });
    apply.immediate();
    const updated = loadEntry(ownerId, entryId);
    if (!updated) return fail('not-found');
    return { ok: true, value: toView(updated) };
  }

  // Acquire the write lock BEFORE receipt, duplicate, revision and membership reads.
  // Inner transactions use better-sqlite3 savepoints. No decision can race another writer.
  return {
    list, get, findByPlatformUserId,
    createManual: (input: CreateManualInput) => database.transaction(createManual).immediate(input),
    updateManual: (input: UpdateManualInput) => database.transaction(updateManual).immediate(input),
    replaceAssignments: (input: ReplaceAssignmentsInput) => database.transaction(replaceAssignments).immediate(input),
    addExisting: (input: AddExistingInput) => database.transaction(addExisting).immediate(input),
  };
}

export type ContactDirectoryStore = ReturnType<typeof createContactDirectoryStore>;
