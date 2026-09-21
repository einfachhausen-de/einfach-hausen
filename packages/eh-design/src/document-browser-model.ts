export type EHDocumentFolder = 'invoice' | 'offer' | 'report' | 'warranty' | 'receipt' | 'other';
export type EHDocumentSort = 'newest' | 'oldest' | 'name';
export type EHBrowserDocument = {
  id: string;
  folder: EHDocumentFolder;
  title: string;
  issuer: string;
  context: string;
  date: string;
  dateLabel: string;
  href: string;
  preview: 'pdf' | 'image' | 'none';
  kindLabel: string;
  amount?: string;
  status?: string;
  statusTone?: 'neutral' | 'success' | 'warning';
};

export const DOCUMENT_FOLDER_LABELS: Record<EHDocumentFolder, string> = {
  invoice: 'Rechnungen', offer: 'Angebote', report: 'Berichte',
  warranty: 'Garantien', receipt: 'Zahlungsbelege', other: 'Sonstiges',
};

export function browseDocuments(files: readonly EHBrowserDocument[], folder: EHDocumentFolder | null, query: string, sort: EHDocumentSort): EHBrowserDocument[] {
  const needle = query.trim().toLocaleLowerCase('de');
  const matching = files.filter(file => (!folder || file.folder === folder) &&
    [file.title, file.issuer, file.context, DOCUMENT_FOLDER_LABELS[file.folder]].join(' ').toLocaleLowerCase('de').includes(needle));
  const names = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  return matching.sort((a, b) => {
    if (sort === 'name') return names.compare(a.title, b.title) || a.id.localeCompare(b.id);
    const dates = (a.date || '').localeCompare(b.date || '');
    return (sort === 'oldest' ? dates : -dates) || names.compare(a.title, b.title) || a.id.localeCompare(b.id);
  });
}

export function documentFolders(files: readonly EHBrowserDocument[]): {id: EHDocumentFolder; label: string; count: number}[] {
  return (Object.entries(DOCUMENT_FOLDER_LABELS) as [EHDocumentFolder, string][])
    .map(([id, label]) => ({ id, label, count: files.filter(file => file.folder === id).length }))
    .filter(folder => folder.count > 0);
}

export function previewKind(path: string | null | undefined): EHBrowserDocument['preview'] {
  const extension = path?.split('.').at(-1)?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  return extension && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension) ? 'image' : 'none';
}
