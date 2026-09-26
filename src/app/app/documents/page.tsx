import { FileCheck, FileSignature, FileText, ReceiptText, ShieldCheck } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankKennzahlen, WerkbankKopf, WerkbankRaster } from '@/components/werkbank-seite';
import { EHButton, EHEmptyState, EHField, EHFileInput, EHFormFeedback, EHInput, EHOwnerSection, EHRecordList, EHStatus, EHSubmitButton, EHText, EHWorkflowForm, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import { invoiceStatusLabel } from '@/lib/invoices';
import { uploadOwnerDocumentAction } from '@/app/actions';

const invoiceTone = (status: string) => status==='paid' ? 'success' as const : status==='sent' ? 'warning' as const : 'neutral' as const;

/** Einheitliche Anzeigenamen für automatisch erkannte und auftragsbezogene Dokumentarten. */
const KIND_LABEL: Record<string,string> = {invoice:'Rechnungen',offer:'Angebote',contract:'Verträge',warranty:'Garantien',maintenance:'Wartung',report:'Belege',insurance:'Versicherung',energy:'Energie',other:'Sonstiges'};

/**
 * Symbol je Dokumentart. Die Art ist die fuehrende Information in der Zeile,
 * deshalb traegt jedes Dokument das Symbol seiner Art.
 */
const KIND_ICON: Record<string, React.ReactNode> = {
  invoice: <ReceiptText size={20} />,
  offer: <FileSignature size={20} />,
  report: <FileText size={20} />,
  warranty: <ShieldCheck size={20} />,
  other: <FileCheck size={20} />,
};
const RECEIPT_ICON = <ReceiptText size={20} />;

/** Kurzes Datum fuer die Zeile. */
function day(value: string | null | undefined): string {
  if (!value) return '';
  const raw = String(value);
  return new Date(raw.length === 10 ? raw + 'T12:00:00' : raw).toLocaleDateString('de-DE');
}

function isoDay(value: string | null | undefined): string {
  return value ? String(value).slice(0, 10) : '';
}

export default async function Documents({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const u=await requireUser('homeowner');
  const sp=await searchParams;
  const uploaded=db.prepare(`SELECT d.id,d.kind,d.path,d.created_at,d.title document_title,j.title job_title,p.business_name FROM documents d JOIN jobs j ON j.id=d.job_id LEFT JOIN provider_profiles p ON p.user_id=d.provider_id WHERE j.homeowner_id=? ORDER BY d.created_at DESC`).all(u.id) as any[];
  const invoices=db.prepare(`SELECT i.*,j.title,p.business_name FROM invoices i JOIN jobs j ON j.id=i.job_id JOIN provider_profiles p ON p.user_id=i.provider_id WHERE i.homeowner_id=? ORDER BY i.created_at DESC`).all(u.id) as any[];
  const payments=db.prepare(`SELECT pay.*,j.title,p.business_name FROM payments pay JOIN jobs j ON j.id=pay.job_id JOIN provider_profiles p ON p.user_id=pay.provider_id WHERE pay.homeowner_id=? AND pay.status='paid' ORDER BY pay.paid_at DESC`).all(u.id) as any[];
  const houseDocuments=db.prepare(`SELECT hd.id,hd.title,hd.kind,hd.created_at,dij.status intelligence_status,dij.relevant_date
    FROM house_documents hd LEFT JOIN document_intelligence_jobs dij ON dij.source_type='house_document' AND dij.source_id=hd.id
    WHERE hd.homeowner_id=? ORDER BY hd.created_at DESC`).all(u.id) as any[];
  const empty = invoices.length===0&&uploaded.length===0&&payments.length===0&&houseDocuments.length===0;
  const openInvoices = invoices.filter(i=>i.status==='sent');
  const openTotal = openInvoices.reduce((s:number,i:any)=>s+(typeof i.total_gross==='number'?i.total_gross:0),0);
  const documentTotal = invoices.length+uploaded.length+payments.length+houseDocuments.length;
  const invoiceItems: EHRecordEntry[] = invoices.map(i=>({
    id:`i-${i.id}`,
    title:`Rechnung ${i.invoice_number}`,
    detail:[KIND_LABEL.invoice,i.business_name,i.title].filter(Boolean).join(' · '),
    value:euroExact(i.total_gross),
    date:isoDay(i.issue_date||i.created_at),
    dateLabel:day(i.issue_date||i.created_at),
    icon:KIND_ICON.invoice,
    status:<EHStatus tone={invoiceTone(i.status)}>{invoiceStatusLabel(i.status)}</EHStatus>,
    href:`/app/invoices/${i.id}`,
  }));
  const uploadItems: EHRecordEntry[] = uploaded.map(d=>({
    id:`d-${d.id}`,
    title:d.document_title,
    detail:[KIND_LABEL[d.kind] ?? KIND_LABEL.other,d.business_name||'Einfach Hausen',d.job_title].filter(Boolean).join(' · '),
    date:isoDay(d.created_at),
    dateLabel:day(d.created_at),
    icon:KIND_ICON[d.kind] ?? KIND_ICON.other,
    href:`/api/documents/${d.id}`,
  }));
  const houseDocumentItems: EHRecordEntry[] = houseDocuments.map(d=>({
    id:`h-${d.id}`,
    title:d.title,
    detail:[KIND_LABEL[d.kind] ?? KIND_LABEL.other,d.relevant_date?`relevantes Datum ${day(d.relevant_date)}`:null].filter(Boolean).join(' · '),
    date:isoDay(d.created_at),
    dateLabel:day(d.created_at),
    icon:KIND_ICON[d.kind] ?? KIND_ICON.other,
    status:d.intelligence_status==='queued'||d.intelligence_status==='processing'?<EHStatus tone="info">Wird einsortiert</EHStatus>:d.intelligence_status==='review'?<EHStatus tone="warning">Bitte prüfen</EHStatus>:undefined,
    href:`/api/house-documents/${d.id}`,
  }));
  const receiptItems: EHRecordEntry[] = payments.map(p=>({
    id:`p-${p.id}`,
    title:p.title,
    detail:[KIND_LABEL.invoice,p.business_name,'Quittung'].filter(Boolean).join(' · '),
    value:euroExact(p.amount),
    date:isoDay(p.paid_at||p.created_at),
    dateLabel:day(p.paid_at||p.created_at),
    icon:RECEIPT_ICON,
    href:`/app/documents/${p.job_id}/receipt`,
  }));
  // Neueste zuerst: eine Liste statt Ablage + Zuletzt-Doppel.
  const items = [...houseDocumentItems,...invoiceItems,...uploadItems,...receiptItems]
    .sort((a,b)=>(b.date??'').localeCompare(a.date??''));
  return <WerkbankRahmen role="homeowner" active="/app/documents">
    <WerkbankKopf title="Dokumente" context={openInvoices.length>0 ? `Noch offen: ${euroExact(openTotal)}` : undefined} />
    {sp.uploaded==='1'&&<EHFormFeedback kind="success">Dokument sicher gespeichert. Es wird automatisch gelesen und einsortiert.</EHFormFeedback>}
    <WerkbankKennzahlen label="Dokumente" items={[
      {id:'gesamt',label:'Dokumente',value:String(documentTotal),hint:'alles an einem Ort'},
      {id:'offen',label:'Noch offen',value:String(openInvoices.length),hint:openInvoices.length>0?`${euroExact(openTotal)} zu zahlen`:'nichts offen'},
    ]} />
    <WerkbankRaster main={empty
      ? <EHEmptyState title="Noch keine Dokumente" text="Rechnungen und Belege landen hier automatisch, sobald ein Auftrag abgerechnet wird. Für ein neues Anliegen startest du beim Hausmeister." action={<EHButton href="/app/hausmeister" arrow>Anliegen beschreiben</EHButton>} />
      : <EHOwnerSection title={`Dokumente · ${documentTotal}`} text="Neueste zuerst.">
        <EHRecordList label="Alle Dokumente" items={items} />
      </EHOwnerSection>} aside={<>
      <WerkbankAbschnitt title="Dokument ablegen">
        <EHText muted>PDF oder Foto hochladen. Der Hausmanager liest und sortiert es im Hintergrund; bei Unsicherheit bleibt es sichtbar und wird nur zur Prüfung markiert.</EHText>
        <EHWorkflowForm action={uploadOwnerDocumentAction}>
          <EHField id="owner-document-title" label="Titel" hint="Optional – sonst verwenden wir den Dateinamen."><EHInput id="owner-document-title" name="title" maxLength={180} placeholder="z. B. Heizungswartung 2026" /></EHField>
          <EHField id="owner-document-file" label="PDF oder Foto"><EHFileInput id="owner-document-file" name="document" accept="application/pdf,image/*" required /></EHField>
          <EHSubmitButton pendingLabel="Wird sicher gespeichert …">Hochladen</EHSubmitButton>
        </EHWorkflowForm>
      </WerkbankAbschnitt>
    </>} />
  </WerkbankRahmen>;
}
