import { AppShell } from '@/components/shell';
import { EHAppHeader, EHDossierList, EHWorkSection, EHEmptyState, EHButton, EHStatus } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import { ownerDate } from '@/lib/owner-format';
import { invoiceStatusLabel } from '@/lib/invoices';

const invoiceTone = (status: string) => status==='paid' ? 'success' as const : status==='sent' ? 'warning' as const : status==='cancelled' ? 'neutral' as const : 'info' as const;

export default async function Documents(){
  const u=await requireUser('homeowner');
  const uploaded=db.prepare(`SELECT d.id,d.kind,d.path,d.created_at,d.title document_title,j.title job_title,p.business_name FROM documents d JOIN jobs j ON j.id=d.job_id LEFT JOIN provider_profiles p ON p.user_id=d.provider_id WHERE j.homeowner_id=? ORDER BY d.created_at DESC`).all(u.id) as any[];
  const invoices=db.prepare(`SELECT i.*,j.title,p.business_name FROM invoices i JOIN jobs j ON j.id=i.job_id JOIN provider_profiles p ON p.user_id=i.provider_id WHERE i.homeowner_id=? ORDER BY i.created_at DESC`).all(u.id) as any[];
  const payments=db.prepare(`SELECT pay.*,j.title,p.business_name FROM payments pay JOIN jobs j ON j.id=pay.job_id JOIN provider_profiles p ON p.user_id=pay.provider_id WHERE pay.homeowner_id=? AND pay.status='paid' ORDER BY pay.paid_at DESC`).all(u.id) as any[];
  const empty = invoices.length===0&&uploaded.length===0&&payments.length===0;
  const openTotal = invoices.filter(i=>i.status!=='paid'&&i.status!=='cancelled').reduce((s:number,i:any)=>s+(typeof i.total_gross==='number'?i.total_gross:0),0);
  const headerText = empty ? 'Rechnungen deiner Partnerbetriebe, Leistungsnachweise und Zahlungsbelege an einem Ort.' : `${invoices.length} ${invoices.length===1?'Rechnung':'Rechnungen'} · ${uploaded.length} ${uploaded.length===1?'Nachweis':'Nachweise'} · ${payments.length} ${payments.length===1?'Zahlungsbeleg':'Zahlungsbelege'}`;
  return <AppShell role="homeowner" active="/app/documents">
    <EHAppHeader eyebrow="Übersicht" title="Dokumente & Rechnungen" text={headerText} />
    {invoices.length>0 && <EHWorkSection title={openTotal>0?`Rechnungen · ${invoices.length} · offen ${euroExact(openTotal)}`:`Rechnungen · ${invoices.length}`}><EHDossierList label="Rechnungen" items={invoices.map(i=>({id:`i-${i.id}`,kind:'Rechnung',title:`Rechnung ${i.invoice_number}`,detail:`${i.business_name} · ${i.title} · ${ownerDate(i.issue_date||i.created_at)}`,amount:euroExact(i.total_gross),href:`/app/invoices/${i.id}`,status:<EHStatus tone={invoiceTone(i.status)}>{invoiceStatusLabel(i.status)}</EHStatus>}))}/></EHWorkSection>}
    {uploaded.length>0 && <EHWorkSection title={`Nachweise & Unterlagen · ${uploaded.length}`}><EHDossierList label="Hochgeladene Dokumente" items={uploaded.map(d=>({id:`d-${d.id}`,kind:d.kind,title:d.document_title,detail:`${d.business_name||'Einfach Hausen'} · ${d.job_title} · ${ownerDate(d.created_at)}`,href:`/api/documents/${d.id}`}))}/></EHWorkSection>}
    {payments.length>0 && <EHWorkSection title={`Zahlungsbelege · ${payments.length}`}><EHDossierList label="Zahlungsbelege" items={payments.map(p=>({id:`p-${p.id}`,kind:'Zahlungsbeleg',title:p.title,detail:`${p.business_name} · ${p.title} · ${ownerDate(p.paid_at||p.created_at)}`,amount:euroExact(p.amount),href:`/app/documents/${p.job_id}/receipt`}))}/></EHWorkSection>}
    {empty && <EHEmptyState title="Noch keine Dokumente" text="Rechnungen, Belege und Leistungsnachweise landen hier nach einer Abwicklung. Für ein neues Anliegen startest du beim Hausmeister." action={<EHButton href="/app/hausmeister" arrow>Anliegen beschreiben</EHButton>} />}
  </AppShell>;
}
