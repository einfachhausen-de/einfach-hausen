"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createContactDirectoryStore, type ContactView, type StoreResult } from '@/lib/contact-directory-store';
import { contactDirectoryCategory } from '@/lib/contact-directory-taxonomy';
import type { EHDirectoryFormState } from '@/design-system';

export async function submitDirectoryAction(_previous: EHDirectoryFormState, data: FormData): Promise<EHDirectoryFormState> {
  const user = await requireUser('homeowner');
  const value = (key: string) => typeof data.get(key) === 'string' ? String(data.get(key)) : '';
  const integer = (key: string) => /^\d+$/.test(value(key)) && Number.isSafeInteger(Number(value(key))) ? Number(value(key)) : -1;
  const intent = value('intent');
  const mainId = value('mainId');
  const initialSubcategoryId = value('initialSubcategoryId');
  const entryId = integer('entryId');
  const revision = integer('revision');
  const subcategoryIds = data.getAll('subcategoryIds').filter((item): item is string => typeof item === 'string');
  if (subcategoryIds.length > 128) return { error: 'Bitte prüfe die gewählten Leistungen.' };
  if (!['create', 'update', 'replace', 'existing'].includes(intent)) return { error: 'Diese Aktion ist nicht verfügbar.' };
  if (intent !== 'create' && (entryId < 1 || revision < 0)) return { error: 'Kontakt nicht verfügbar. Öffne ihn erneut.' };
  const store = createContactDirectoryStore(db);
  const fields = { name: value('name'), company: value('company'), phone: value('phone'), email: value('email') };
  let result: StoreResult<ContactView>;
  try {
    if (intent === 'create') result = store.createManual({ ownerId: user.id, requestId: value('requestId'), mainId, initialSubcategoryId, subcategoryIds, ...fields, allowPossibleDuplicate: ['true', 'on'].includes(value('allowPossibleDuplicate')) });
    else if (intent === 'update') result = store.updateManual({ ownerId: user.id, entryId, revision, ...fields });
    else if (intent === 'replace') result = store.replaceAssignments({ ownerId: user.id, entryId, revision, mainId, subcategoryIds });
    else result = store.addExisting({ ownerId: user.id, entryId, revision, mainId, initialSubcategoryId, subcategoryIds });
  } catch (error) {
    // Never log private contact fields or SQL parameter values.
    console.error('Contact directory save failed:', error instanceof Error ? error.name : 'UnknownError');
    return { error: 'Speichern ist gerade nicht möglich. Deine Eingaben bleiben erhalten. Bitte versuche es erneut.' };
  }
  if (!result.ok) {
    const duplicates = result.code === 'duplicate-candidates' ? result.candidates.flatMap(candidate => {
      const contact = store.get(user.id, candidate.id);
      return contact.ok ? [contact.value] : [];
    }) : undefined;
    return {
      error: result.code === 'stale-revision' ? `${result.message} Öffne den Kontakt erneut, bevor du deine Änderungen übernimmst.` : result.message,
      fieldErrors: 'field' in result && result.field ? { [result.field]: result.message } : undefined,
      duplicates,
    };
  }
  revalidatePath('/app/messages');
  const params = new URLSearchParams({ entry: String(result.value.id), saved: '1' });
  const main = contactDirectoryCategory(mainId);
  if (main) params.set('main', main.id);
  if (main?.subcategories.some(item => item.id === initialSubcategoryId)) params.set('sub', initialSubcategoryId);
  // NEXT_REDIRECT must escape the action, not enter its database-error catch.
  redirect(`/app/messages?${params}`);
}
export async function submitDirectoryShortcut(data: FormData): Promise<void> {
  const user = await requireUser('homeowner');
  const value = (key: string) => typeof data.get(key) === 'string' ? String(data.get(key)) : '';
  const raw = value('entryId');
  const entryId = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : -1;
  const intent = value('intent');
  const from = value('from');
  const back = from.startsWith('/app/messages') ? from : '/app/messages';
  const store = createContactDirectoryStore(db);
  if (entryId > 0 && ['pin', 'unpin', 'emergency-on', 'emergency-off'].includes(intent)) {
    try {
      if (intent === 'pin') store.setFlags({ ownerId: user.id, entryId, pinned: true });
      else if (intent === 'unpin') store.setFlags({ ownerId: user.id, entryId, pinned: false });
      else if (intent === 'emergency-on') store.setFlags({ ownerId: user.id, entryId, emergency: true });
      else store.setFlags({ ownerId: user.id, entryId, emergency: false });
    } catch (error) {
      console.error('Contact directory shortcut failed:', error instanceof Error ? error.name : 'UnknownError');
    }
  }
  revalidatePath('/app/messages');
  redirect(back);
}
