import fs from 'node:fs';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHButton, EHEmptyState, EHMetricsBar, EHOwnerSection, EHPageHeader, EHRecordList, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import { invoiceStatusLabel } from '@/lib/invoices';
import { resolvePrivatePath } from '@/lib/security/private-files';

const invoiceTone = (status: string) => status==='paid' ? 'success' as const : status==='sent' ? 'warning' as const : 'neutral' as const;

/** Die Ablage kennt genau diese fuenf Dokumentarten (CHECK auf documents.kind). */
const KIND_LABEL: Record<string,string> = {invoice:'Rechnungen',offer:'Angebote',report:'Berichte',warranty:'Garantien',other:'Sonstiges'};

/** Kurzes Datum fuer die Zeile; die Chronik sortiert am ISO-Wert. */
function day(value: string | null | undefined): string {
  if (!value) return '';
  const raw = String(value);
  return new Date(raw.length === 10 ? raw + 'T12:00:00' : raw).toLocaleDateString('de-DE');
}

function isoDay(value: string | null | undefined): string {
  return value ? String(value).slice(0, 10) : '';
}

/**
 * Groesse der abgelegten Datei. Ueber resolvePrivatePath statt eines eigenen
 * path.join: die Funktion ist die gepruefte, traversal-sichere Abkuerzung auf
 * die private Ablage, und ein literaler Pfad wird von Turbopack als
 * Verzeichnis-Asset aufgeloest. Fehlt die Datei, zaehlt sie mit null Byte.
 */
// Eine einzelne Verzeichnisliste statt eines statSync pro Dokument (kein N+1
// beim Wachstum der Akte). Fehlt eine Datei, traegt sie null Byte.
function storedSizes(paths: Array<string | null | undefined>): Map<string, number> {
  const sizes = new Map<string, number>();
  const roots = new Set<string>();
  for (const p of paths) {
    if (!p) continue;
    const absolute = resolvePrivatePath(p);
    if (absolute) roots.add(absolute);
  }
  for (const root of roots) {
    try {
      const entries = fs.readdirSync(root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        try { sizes.set(`${root}/${entry.name}`, fs.statSync(`${root}/${entry.name}`).size); } catch {}
      }
    } catch {}
  }
  return sizes;
}

function sizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default async function Documents(){
  const u=await requireUser('homeowner');
  const uploaded=db.prepare(`SELECT d.id,d.kind,d.path,d.created_at,d.title document_title,j.title job_title,p.business_name FROM documents d JOIN jobs j ON j.id=d.job_id LEFT JOIN provider_profiles p ON p.user_id=d.provider_id WHERE j.homeowner_id=? ORDER BY d.created_at DESC`).all(u.id) as any[];
  const invoices=db.prepare(`SELECT i.*,j.title,p.business_name FROM invoices i JOIN jobs j ON j.id=i.job_id JOIN provider_profiles p ON p.user_id=i.provider_id WHERE i.homeowner_id=? ORDER BY i.created_at DESC`).all(u.id) as any[];
  const payments=db.prepare(`SELECT pay.*,j.title,p.business_name FROM payments pay JOIN jobs j ON j.id=pay.job_id JOIN provider_profiles p ON p.user_id=pay.provider_id WHERE pay.homeowner_id=? AND pay.status='paid' ORDER BY pay.paid_at DESC`).all(u.id) as any[];
  const empty = invoices.length===0&&uploaded.length===0&&payments.length===0;
  const openInvoices = invoices.filter(i=>i.status==='sent');
  const openTotal = openInvoices.reduce((s:number,i:any)=>s+(typeof i.total_gross==='number'?i.total_gross:0),0);
  // Die Groesse kommt aus der privaten Ablage selbst, nicht aus einer Schaetzung:
  // fehlt eine Datei, traegt sie null Byte bei.
  const byteSizes = storedSizes(uploaded.map(d=>d.path));
  const uploads = uploaded.map(d=>({...d,bytes:byteSizes.get(resolvePrivatePath(d.path) ?? '') ?? 0}));
  const storedTotal = uploads.reduce((sum:number,d:any)=>sum+d.bytes,0);
  const byKind = new Map<string,{count:number;bytes:number}>();
  for (const d of uploads) {
    const key = KIND_LABEL[d.kind] ? d.kind : 'other';
    const group = byKind.get(key) ?? {count:0,bytes:0};
    group.count += 1;
    group.bytes += d.bytes;
    byKind.set(key,group);
  }
  const documentTotal = invoices.length+uploaded.length+payments.length;
  // Soll-Gruppierung (#dokumente): Rechnungen, Angebote & Nachweise, Belege —
  // je Gruppe eine Sektion mit Anzahl, statt einer flachen Gesamtliste.
  const invoiceItems: EHRecordEntry[] = invoices.map(i=>({
    id:`i-${i.id}`,
    title:`Rechnung ${i.invoice_number}`,
    detail:[i.business_name,i.title].filter(Boolean).join(' · '),
    value:euroExact(i.total_gross),
    date:isoDay(i.issue_date||i.created_at),
    dateLabel:day(i.issue_date||i.created_at),
    status:<EHStatus tone={invoiceTone(i.status)}>{invoiceStatusLabel(i.status)}</EHStatus>,
    href:`/app/invoices/${i.id}`,
  }));
  const uploadItems: EHRecordEntry[] = uploads.map(d=>({
    id:`d-${d.id}`,
    title:d.document_title,
    detail:[KIND_LABEL[d.kind] ?? 'Sonstiges',d.business_name||'Einfach Hausen',d.job_title].filter(Boolean).join(' · '),
    value:sizeLabel(d.bytes),
    date:isoDay(d.created_at),
    dateLabel:day(d.created_at),
    href:`/api/documents/${d.id}`,
  }));
  const receiptItems: EHRecordEntry[] = payments.map(p=>({
    id:`p-${p.id}`,
    title:p.title,
    detail:[p.business_name,'Zahlungsbeleg'].filter(Boolean).join(' · '),
    value:euroExact(p.amount),
    date:isoDay(p.paid_at||p.created_at),
    dateLabel:day(p.paid_at||p.created_at),
    href:`/app/documents/${p.job_id}/receipt`,
  }));
  const items = [...invoiceItems,...uploadItems,...receiptItems]
    .sort((a,b)=>(b.date??'').localeCompare(a.date??''));
  return <WerkbankRahmen role="homeowner" active="/app/documents">
    <EHPageHeader title="Dokumente & Rechnungen" context={openInvoices.length>0 ? `Offen: ${euroExact(openTotal)}` : undefined} />
    <EHMetricsBar label="Dokumente" items={[
      {id:'gesamt',label:'Dokumente',value:String(documentTotal),hint:'in dieser Ablage'},
      {id:'rechnungen',label:'Rechnungen',value:String(invoices.length),hint:openInvoices.length>0?`${euroExact(openTotal)} offen`:undefined},
      {id:'nachweise',label:'Nachweise',value:String(uploaded.length),hint:'Dateien aus Aufträgen'},
      {id:'groesse',label:'Gesamtgröße',value:sizeLabel(storedTotal),hint:'Nachweise auf der Platte'},
    ]} />
    <EHWorkspaceGrid main={empty
      ? <EHEmptyState title="Noch keine Dokumente" text="Rechnungen, Belege und Leistungsnachweise landen hier nach einer Abwicklung. Für ein neues Anliegen startest du beim Hausmeister." action={<EHButton href="/app/hausmeister" arrow>Anliegen beschreiben</EHButton>} />
      : <>
        {invoiceItems.length>0 && <EHOwnerSection title={`Rechnungen (${invoiceItems.length})`}>
          <EHRecordList label="Rechnungen" items={invoiceItems} />
        </EHOwnerSection>}
        {uploadItems.length>0 && <EHOwnerSection title={`Angebote & Nachweise (${uploadItems.length})`}>
          <EHRecordList label="Angebote und Nachweise" items={uploadItems} />
        </EHOwnerSection>}
        {receiptItems.length>0 && <EHOwnerSection title={`Zahlungsbelege (${receiptItems.length})`}>
          <EHRecordList label="Zahlungsbelege" items={receiptItems} />
        </EHOwnerSection>}
      </>} aside={<>
      <EHWorkSection title="Speicherbelegung">
        <EHText muted>{uploads.length===0
          ? 'Nachweise aus Aufträgen werden hier mit ihrer echten Dateigröße geführt. Bisher liegt keine Datei.'
          : `${uploads.length} ${uploads.length===1?'Datei':'Dateien'} · ${sizeLabel(storedTotal)}`}</EHText>
        {byKind.size>0 && <EHRecordList label="Speicherbelegung nach Dokumentart" items={Array.from(byKind.entries()).sort((a,b)=>b[1].bytes-a[1].bytes).map(([kind,group])=>({
          id:`art-${kind}`,
          title:KIND_LABEL[kind] ?? 'Sonstiges',
          detail:`${group.count} ${group.count===1?'Dokument':'Dokumente'}`,
          value:sizeLabel(group.bytes),
        }))} />}
      </EHWorkSection>
      <EHWorkSection title="Zuletzt hinzugefügt">
        <EHRecordList label="Zuletzt hinzugefügte Dokumente" items={items.slice(0,4)} empty="Noch nichts abgelegt." />
      </EHWorkSection>
      <EHButton href="/app/home/history#historie-anlegen" arrow>Dokument hochladen</EHButton>
    </>} />
  </WerkbankRahmen>;
}
