import { FileCheck, FileSignature, FileText, ReceiptText, ShieldCheck } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHButton, EHEmptyState, EHMetricsBar, EHOwnerSection, EHPageHeader, EHRecordList, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import { invoiceStatusLabel } from '@/lib/invoices';

const invoiceTone = (status: string) => status==='paid' ? 'success' as const : status==='sent' ? 'warning' as const : 'neutral' as const;

/** Die Ablage kennt genau diese fuenf Dokumentarten (CHECK auf documents.kind). */
const KIND_LABEL: Record<string,string> = {invoice:'Rechnungen',offer:'Angebote',report:'Belege',warranty:'Garantien',other:'Sonstiges'};

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

export default async function Documents(){
  const u=await requireUser('homeowner');
  const uploaded=db.prepare(`SELECT d.id,d.kind,d.path,d.created_at,d.title document_title,j.title job_title,p.business_name FROM documents d JOIN jobs j ON j.id=d.job_id LEFT JOIN provider_profiles p ON p.user_id=d.provider_id WHERE j.homeowner_id=? ORDER BY d.created_at DESC`).all(u.id) as any[];
  const invoices=db.prepare(`SELECT i.*,j.title,p.business_name FROM invoices i JOIN jobs j ON j.id=i.job_id JOIN provider_profiles p ON p.user_id=i.provider_id WHERE i.homeowner_id=? ORDER BY i.created_at DESC`).all(u.id) as any[];
  const payments=db.prepare(`SELECT pay.*,j.title,p.business_name FROM payments pay JOIN jobs j ON j.id=pay.job_id JOIN provider_profiles p ON p.user_id=pay.provider_id WHERE pay.homeowner_id=? AND pay.status='paid' ORDER BY pay.paid_at DESC`).all(u.id) as any[];
  const empty = invoices.length===0&&uploaded.length===0&&payments.length===0;
  const openInvoices = invoices.filter(i=>i.status==='sent');
  const openTotal = openInvoices.reduce((s:number,i:any)=>s+(typeof i.total_gross==='number'?i.total_gross:0),0);
  const documentTotal = invoices.length+uploaded.length+payments.length;
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
  const items = [...invoiceItems,...uploadItems,...receiptItems]
    .sort((a,b)=>(b.date??'').localeCompare(a.date??''));
  return <WerkbankRahmen role="homeowner" active="/app/documents">
    <EHPageHeader title="Dokumente" context={openInvoices.length>0 ? `Noch offen: ${euroExact(openTotal)}` : undefined} />
    <EHMetricsBar label="Dokumente" items={[
      {id:'gesamt',label:'Dokumente',value:String(documentTotal),hint:'alles an einem Ort'},
      {id:'offen',label:'Noch offen',value:String(openInvoices.length),hint:openInvoices.length>0?`${euroExact(openTotal)} zu zahlen`:'nichts offen'},
    ]} />
    <EHWorkspaceGrid main={empty
      ? <EHEmptyState title="Noch keine Dokumente" text="Rechnungen und Belege landen hier automatisch, sobald ein Auftrag abgerechnet wird. Für ein neues Anliegen startest du beim Hausmeister." action={<EHButton href="/app/hausmeister" arrow>Anliegen beschreiben</EHButton>} />
      : <EHOwnerSection title={`Dokumente · ${documentTotal}`} text="Neueste zuerst.">
        <EHRecordList label="Alle Dokumente" items={items} />
      </EHOwnerSection>} aside={<>
      <EHWorkSection title="Foto oder Rechnung ablegen">
        <EHText muted>Belege entstehen automatisch aus deinen Aufträgen. Ein neues Foto legst du am schnellsten über ein Anliegen ab.</EHText>
        <EHButton href="/app/hausmeister" arrow>Zum Hausmeister</EHButton>
      </EHWorkSection>
    </>} />
  </WerkbankRahmen>;
}
