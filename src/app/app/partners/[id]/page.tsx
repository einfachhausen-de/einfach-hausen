import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EHEmptyState, EHErrorState, EHButton, EHField, EHFormFeedback, EHInput, EHMetricsBar, EHPageHeader, EHRecordList, EHSubmitButton, EHWorkSection } from '@/design-system';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { reportReviewAction } from '@/app/actions';

export default async function PartnerProfile({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<Record<string,string>>}){
  await requireUser('homeowner'); const {id}=await params; const sp=await searchParams; const providerId=Number(id); if(!providerId)notFound();
  const provider=db.prepare(`SELECT p.*,c.status contract_status,c.insurance_verified,c.qualification_verified,c.contract_verified,c.quality_standard_verified FROM provider_profiles p LEFT JOIN partner_contracts c ON c.provider_id=p.user_id WHERE p.user_id=? AND p.verified=1 AND c.status='active'`).get(providerId) as any; if(!provider)notFound();
  const reviews=db.prepare(`SELECT r.id,r.rating,r.comment,r.created_at,u.first_name FROM reviews r JOIN users u ON u.id=r.homeowner_id WHERE r.provider_id=? AND r.hidden=0 ORDER BY r.created_at DESC LIMIT 5`).all(providerId) as any[];
  const trades=String(provider.trades||'').split(',').map((x:string)=>x.trim()).filter(Boolean).slice(0,6);
  const returnHref=sp.job?`/app/jobs/${Number(sp.job)}`:'/app/jobs';
  const rating=Number(provider.rating||0); const ratingCount=Number(provider.rating_count||0);
  return <AppShell role="homeowner" active="/app/partners" title="Partnerprofil" subtitle="Geprüfter Einfach-Hausen-Partner" breadcrumbs={crumbs('/app/messages','Partnerprofil')}>
    {sp.message&&<EHFormFeedback kind="success">{String(sp.message)}</EHFormFeedback>}
    {sp.error&&<EHErrorState text={String(sp.error)} />}
    <EHPageHeader title={provider.business_name} context={`Geprüfter Partner · ${rating.toFixed(1)} von 5 aus ${ratingCount} Bewertungen`} actions={<EHButton href={returnHref} variant="secondary">Zurück</EHButton>} />
    <EHMetricsBar label="Partnerdaten" items={[
      { id: 'region', label: 'Region', value: `${provider.postcode} · bis ${provider.radius_km} km` },
      { id: 'bereiche', label: 'Bereiche', value: String(trades.length||1) },
      { id: 'bewertung', label: 'Bewertung', value: `${rating.toFixed(1)} / 5`, hint: `${ratingCount} Bewertungen` },
    ]} />
    <EHWorkSection title="Profildaten">
      <EHRecordList label="Profildaten" items={[
        { id: 'leistungen', title: trades.length ? trades.join(' · ') : 'Kein Bereich hinterlegt', detail: 'Leistungen' },
        { id: 'standards', title: 'Vertraglich geprüft', detail: 'Standards' },
        { id: 'beschreibung', title: provider.description || 'Zuverlässiger regionaler Vertragspartner für Arbeiten rund ums Eigenheim.', detail: 'Beschreibung' },
      ]} />
    </EHWorkSection>
    <EHWorkSection title="Prüfstatus">
      <EHRecordList label="Prüfstatus" items={[
        { id: 'versicherung', title: 'Versicherung', detail: provider.insurance_verified?'Geprüft':'In Prüfung' },
        { id: 'qualifikation', title: 'Qualifikation', detail: provider.qualification_verified?'Geprüft':'In Prüfung' },
        { id: 'vertrag', title: 'Partnervertrag', detail: provider.contract_verified?'Aktiv':'In Prüfung' },
        { id: 'qualitaet', title: 'Qualitätsstandard', detail: provider.quality_standard_verified?'Bestätigt':'In Prüfung' },
      ]} />
    </EHWorkSection>
    <EHWorkSection title={`Bewertungen · ${ratingCount} insgesamt`}>
    {reviews.length===0
      ? <EHEmptyState title="Noch keine öffentliche Bewertung" text="Der Betrieb ist geprüft und neu im Netzwerk." />
      : <EHRecordList label={`Bewertungen · ${ratingCount} insgesamt`} items={reviews.map((r:any,i:number)=>({
          id: `review-${r.id}-${i}`,
          title: r.first_name||'Kunde',
          detail: r.comment||'Zuverlässig ausgeführt.',
          value: `★ ${r.rating}/5`,
          action: <details><summary>Melden</summary><form action={reportReviewAction.bind(null,r.id)}><EHField id={`report-${r.id}`} label="Grund der Meldung"><EHInput id={`report-${r.id}`} name="reason" maxLength={500} placeholder="Was stimmt an dieser Bewertung nicht?" aria-label="Grund der Meldung" required/></EHField><EHSubmitButton pendingLabel="Meldung wird gesendet …">Bewertung melden</EHSubmitButton></form></details>,
        }))} />}
    </EHWorkSection>
    <Link href={returnHref} className="btn primary wide partner-return">{sp.job?'Zum Angebot zurück':'Aufträge ansehen'} <ChevronRight size={16}/></Link>
  </AppShell>;
}
