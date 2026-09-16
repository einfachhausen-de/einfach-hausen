import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { EHButton, EHEmptyState, EHMetricsBar, EHPageHeader, EHRecordViews, EHStatus, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import { invoiceStatusLabel } from '@/lib/invoices';

const invoiceTone = (status: string) => status==='paid' ? 'success' as const : status==='sent' ? 'warning' as const : 'neutral' as const;

/** Kurzes Datum fuer die Zeile; die Chronik sortiert am ISO-Wert. */
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
  const items: EHRecordEntry[] = [
    ...invoices.map(i=>({
      id:`i-${i.id}`,
      title:`Rechnung ${i.invoice_number}`,
      detail:[i.business_name,i.title].filter(Boolean).join(' · '),
      value:euroExact(i.total_gross),
      date:isoDay(i.issue_date||i.created_at),
      dateLabel:day(i.issue_date||i.created_at),
      status:<EHStatus tone={invoiceTone(i.status)}>{invoiceStatusLabel(i.status)}</EHStatus>,
      href:`/app/invoices/${i.id}`,
    })),
    ...uploaded.map(d=>({
      id:`d-${d.id}`,
      title:d.document_title,
      detail:[d.kind,d.business_name||'Einfach Hausen',d.job_title].filter(Boolean).join(' · '),
      date:isoDay(d.created_at),
      dateLabel:day(d.created_at),
      href:`/api/documents/${d.id}`,
    })),
    ...payments.map(p=>({
      id:`p-${p.id}`,
      title:p.title,
      detail:[p.business_name,'Zahlungsbeleg'].filter(Boolean).join(' · '),
      value:euroExact(p.amount),
      date:isoDay(p.paid_at||p.created_at),
      dateLabel:day(p.paid_at||p.created_at),
      href:`/app/documents/${p.job_id}/receipt`,
    })),
  ].sort((a,b)=>(b.date??'').localeCompare(a.date??''));
  return <AppShell role="homeowner" active="/app/documents" breadcrumbs={crumbs('/app/home','Dokumente')}>
    <EHPageHeader title="Dokumente & Rechnungen" context={openInvoices.length>0 ? `Offen: ${euroExact(openTotal)}` : undefined} />
    {!empty && <EHMetricsBar label="Dokumente" items={[
      {id:'rechnungen',label:'Rechnungen',value:String(invoices.length)},
      {id:'nachweise',label:'Nachweise',value:String(uploaded.length)},
      {id:'belege',label:'Zahlungsbelege',value:String(payments.length)},
      ...(openInvoices.length>0 ? [{id:'offen',label:'Offen',value:euroExact(openTotal),hint:'noch nicht bezahlt'}] : []),
    ]} />}
    {empty
      ? <EHEmptyState title="Noch keine Dokumente" text="Rechnungen, Belege und Leistungsnachweise landen hier nach einer Abwicklung. Für ein neues Anliegen startest du beim Hausmeister." action={<EHButton href="/app/hausmeister" arrow>Anliegen beschreiben</EHButton>} />
      : <EHRecordViews label="Dokumente & Rechnungen" storageKey="dokumente" defaultView="chronik" switcherLabel="Dokumente: Ansicht wechseln" items={items} />}
  </AppShell>;
}
