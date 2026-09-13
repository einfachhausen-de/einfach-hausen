/**
 * src/lib/contact-directory-helpers.ts
 * Pure validation helpers over the ROOT-SUPPLIED taxonomy
 * (src/lib/contact-directory-taxonomy.ts — Gina-17, not authored here).
 * Structural readonly typing: root ContactDirectoryCategory is assignable.
 * Status: DRAFT packet, UNRUN. No repository edits made.
 */
import type { ContactDirectoryCategory } from './contact-directory-taxonomy';

export type TaxonomyMain = Pick<ContactDirectoryCategory, 'id' | 'subcategories'>;

export function mainExists(categories: readonly TaxonomyMain[], mainId: string): boolean {
  return categories.some((main) => main.id === mainId);
}

export function mainOfSubcategory(
  categories: readonly TaxonomyMain[],
  subcategoryId: string,
): string | null {
  for (const main of categories) {
    if (main.subcategories.some((sub) => sub.id === subcategoryId)) return main.id;
  }
  return null;
}

export function subcategoryIdsOfMain(categories: readonly TaxonomyMain[], mainId: string): string[] {
  return categories.find((main) => main.id === mainId)?.subcategories.map((sub) => sub.id) ?? [];
}

export function allSubcategoryIdsBelongToMain(
  categories: readonly TaxonomyMain[],
  mainId: string,
  subcategoryIds: readonly string[],
): boolean {
  const allowed = new Set(subcategoryIdsOfMain(categories, mainId));
  if (allowed.size === 0) return false;
  return subcategoryIds.every((id) => allowed.has(id));
}
