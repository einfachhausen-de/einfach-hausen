'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronRight, FileText, Folder, Image as ImageIcon, LayoutGrid, List, Search, Upload, X } from 'lucide-react';
import { EHButton, EHStatus } from './primitives';
import { EHEmptyState, EHInput, EHSelect } from './app';
import { browseDocuments, documentFolders, DOCUMENT_FOLDER_LABELS, type EHBrowserDocument, type EHDocumentFolder, type EHDocumentSort } from './document-browser-model';
import s from './styles.module.css';

export type { EHBrowserDocument } from './document-browser-model';

/** Uses the original authenticated endpoint; no public URL or copied file. */
function DocumentPreview({ file }: { file: EHBrowserDocument }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    if (file.preview === 'none') return;
    const controller = new AbortController();
    fetch(file.href, { method: 'HEAD', credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(response => {
        const mime = response.headers.get('content-type')?.split(';')[0].trim();
        const allowed = file.preview === 'pdf' ? mime === 'application/pdf' : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mime || '');
        setState(response.ok && allowed ? 'ready' : 'error');
      })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [file.href, file.preview]);

  if (file.preview === 'none') return <div className={s.fileBrowserSummary}>
    <FileText size={32} strokeWidth={1.5} aria-hidden="true" />
    <span>{file.kindLabel}</span>
    <strong>{file.title}</strong>
    {file.issuer && <p>{file.issuer}</p>}
    {file.amount && <b>{file.amount}</b>}
    <p>Die vollständige Ansicht erreichst du über „Öffnen“.</p>
  </div>;
  if (state === 'loading') return <p className={s.fileBrowserNotice} role="status">Vorschau wird geladen …</p>;
  if (state === 'error') return <p className={s.fileBrowserNotice} role="status">Die Vorschau ist gerade nicht verfügbar. Versuche, das Dokument über „Öffnen“ aufzurufen.</p>;
  return file.preview === 'image'
    ? <img className={s.fileBrowserImage} src={file.href} alt={file.title} onError={() => setState('error')} />
    : <iframe className={s.fileBrowserPdf} title={`Vorschau: ${file.title}`} src={file.href} />;
}

/** Two content panes inside the existing app sidebar: three columns in total. */
export function EHDocumentBrowser({ documents, openInvoiceLabel }: { documents: EHBrowserDocument[]; openInvoiceLabel?: string }) {
  const uid = useId();
  const [folder, setFolder] = useState<EHDocumentFolder | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [sort, setSort] = useState<EHDocumentSort>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const previewRef = useRef<HTMLElement>(null);
  const selectedButton = useRef<HTMLButtonElement | null>(null);
  const selected = documents.find(file => file.id === selectedId);
  const files = browseDocuments(documents, folder, query, sort);
  const folders = documentFolders(documents);
  const showFolders = folder === null && !query.trim();

  useEffect(() => {
    if (selectedId && window.matchMedia('(max-width: 1100px)').matches) {
      previewRef.current?.focus();
      previewRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [selectedId]);

  function enterFolder(next: EHDocumentFolder | null) {
    setFolder(next);
    setQuery('');
    setSelectedId(null);
  }

  function closePreview() {
    setSelectedId(null);
    requestAnimationFrame(() => selectedButton.current?.focus());
  }

  const fileButton = (file: EHBrowserDocument) => <button type="button" className={s.fileBrowserFile} aria-pressed={selectedId === file.id} aria-controls={`${uid}-preview`} onClick={event => {
    selectedButton.current = event.currentTarget;
    setSelectedId(file.id);
  }}>
    <span className={s.fileBrowserFileIcon} aria-hidden="true">{file.preview === 'image' ? <ImageIcon size={24} strokeWidth={1.5} /> : <FileText size={24} strokeWidth={1.5} />}<span>{file.kindLabel}</span></span>
    <span className={s.fileBrowserFilename}>{file.title}<small>{file.issuer || file.context || file.kindLabel}</small></span>
  </button>;

  return <section className={s.fileBrowser} aria-label="Dokumentenablage" data-preview-open={Boolean(selected)}>
    <header className={s.fileBrowserHeading}>
      <div><h1>Dokumente</h1><p>{documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'}{openInvoiceLabel ? ` · ${openInvoiceLabel}` : ''}</p></div>
      <EHButton href="/app/home/history#historie-anlegen"><Upload size={18} aria-hidden="true" />Dokument hinzufügen</EHButton>
    </header>

    <div className={s.fileBrowserPanes}>
      <div className={s.fileBrowserExplorer}>
        <div className={s.fileBrowserToolbar}>
          <label className={s.fileBrowserSearch} htmlFor={`${uid}-search`}><Search size={18} aria-hidden="true" /><span className={s.fileBrowserSrOnly}>Dokumente suchen</span><EHInput id={`${uid}-search`} type="search" placeholder={folder ? 'In diesem Ordner suchen' : 'Alle Dokumente durchsuchen'} value={query} onChange={event => {setQuery(event.target.value); setSelectedId(null);}} /></label>
          <div className={s.fileBrowserView} role="group" aria-label="Ansicht">
            <button type="button" aria-label="Listenansicht" title="Listenansicht" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={20} aria-hidden="true" /></button>
            <button type="button" aria-label="Rasteransicht" title="Rasteransicht" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid size={19} aria-hidden="true" /></button>
          </div>
        </div>
        <div className={s.fileBrowserLocation}>
          <nav aria-label="Ordnerpfad"><button type="button" onClick={() => enterFolder(null)} aria-current={!folder ? 'page' : undefined}>Alle Dokumente</button>{folder && <><ChevronRight size={16} aria-hidden="true" /><span aria-current="page">{DOCUMENT_FOLDER_LABELS[folder]}</span></>}</nav>
          {!showFolders && <label className={s.fileBrowserSort} htmlFor={`${uid}-sort`}><span className={s.fileBrowserSrOnly}>Sortierung</span><EHSelect id={`${uid}-sort`} value={sort} onChange={event => setSort(event.target.value as EHDocumentSort)}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option><option value="name">Name A–Z</option></EHSelect></label>}
        </div>

        {documents.length === 0 ? <EHEmptyState title="Deine Ablage ist bereit" text="Rechnungen und Nachweise aus deinen Aufträgen erscheinen hier. Eigene Dokumente kannst du zu einer Arbeit in der Haus-Historie hinzufügen." /> :
          !showFolders && files.length === 0 ? <EHEmptyState title="Keine Dokumente gefunden" text="Versuche einen anderen Suchbegriff oder suche unter „Alle Dokumente“." action={<EHButton variant="secondary" onClick={() => {setQuery(''); setFolder(null);}}>Alle Dokumente anzeigen</EHButton>} /> :
          view === 'list' ? <div className={s.fileBrowserTableWrap}><table className={s.fileBrowserTable}>
            <caption className={s.fileBrowserSrOnly}>{folder ? DOCUMENT_FOLDER_LABELS[folder] : 'Dokumentenablage'}</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">{showFolders ? 'Inhalt' : 'Datum'}</th><th scope="col">{showFolders ? 'Art' : 'Details'}</th></tr></thead>
            <tbody>{showFolders ? folders.map(item => <tr key={item.id}>
              <th scope="row"><button type="button" className={s.fileBrowserFolder} onClick={() => enterFolder(item.id)}><Folder size={23} strokeWidth={1.5} aria-hidden="true" /><span>{item.label}</span><ChevronRight size={16} aria-hidden="true" /></button></th>
              <td>{item.count} {item.count === 1 ? 'Dokument' : 'Dokumente'}</td><td>Ordner</td>
            </tr>) : files.map(file => <tr key={file.id} data-picked={selectedId === file.id}>
              <th scope="row">{fileButton(file)}</th><td>{file.dateLabel}</td><td>{file.status ? <EHStatus tone={file.statusTone}>{file.status}</EHStatus> : file.amount || file.kindLabel}</td>
            </tr>)}</tbody>
          </table></div> : <ul className={s.fileBrowserGrid} aria-label={showFolders ? 'Ordner' : 'Dateien'}>
            {showFolders ? folders.map(item => <li key={item.id}><button type="button" className={s.fileBrowserGridFolder} onClick={() => enterFolder(item.id)}><Folder size={28} strokeWidth={1.5} aria-hidden="true" /><strong>{item.label}</strong><span>{item.count} {item.count === 1 ? 'Dokument' : 'Dokumente'}</span></button></li>) : files.map(file => <li key={file.id} data-picked={selectedId === file.id}>
              {fileButton(file)}<div className={s.fileBrowserGridMeta}><span>{file.dateLabel}</span>{file.status && <EHStatus tone={file.statusTone}>{file.status}</EHStatus>}</div>
            </li>)}
          </ul>}
        <footer className={s.fileBrowserFoot} aria-live="polite">{showFolders ? `${folders.length} Ordner · ${documents.length} Dokumente` : `${files.length} ${files.length === 1 ? 'Dokument' : 'Dokumente'}${query.trim() ? ' gefunden' : ''}`}</footer>
      </div>

      <aside id={`${uid}-preview`} ref={previewRef} tabIndex={-1} className={s.fileBrowserPreview} aria-label="Dateivorschau">
        <div className={s.fileBrowserPreviewHead}><h2>Vorschau</h2>{selected && <button type="button" onClick={closePreview} aria-label="Vorschau schließen"><ArrowLeft className={s.fileBrowserBackIcon} size={18} aria-hidden="true" /><X className={s.fileBrowserCloseIcon} size={18} aria-hidden="true" /><span>Zurück zur Ablage</span></button>}</div>
        {selected ? <>
          <div className={s.fileBrowserPreviewStage}><DocumentPreview key={selected.id} file={selected} /></div>
          <div className={s.fileBrowserDetails}>
            <h3>{selected.title}</h3>
            {selected.status && <EHStatus tone={selected.statusTone}>{selected.status}</EHStatus>}
            <dl><div><dt>Ordner</dt><dd>{DOCUMENT_FOLDER_LABELS[selected.folder]}</dd></div><div><dt>Datum</dt><dd>{selected.dateLabel || 'Nicht hinterlegt'}</dd></div>{selected.issuer && <div><dt>Von</dt><dd>{selected.issuer}</dd></div>}{selected.context && <div><dt>Gehört zu</dt><dd>{selected.context}</dd></div>}{selected.amount && <div><dt>Betrag</dt><dd>{selected.amount}</dd></div>}</dl>
            <EHButton href={selected.href} target="_blank" rel="noopener noreferrer">Öffnen<ArrowUpRight size={18} aria-hidden="true" /></EHButton>
            {selected.preview === 'pdf' && <p>Keine PDF-Vorschau im Browser? Über „Öffnen“ kannst du die Datei ansehen und speichern.</p>}
          </div>
        </> : <div className={s.fileBrowserPreviewEmpty}><FileText size={36} strokeWidth={1.25} aria-hidden="true" /><h3>Ein Blick ins Dokument</h3><p>Wähle eine Datei aus. Hier findest du die Vorschau und die wichtigsten Angaben.</p></div>}
      </aside>
    </div>
  </section>;
}
