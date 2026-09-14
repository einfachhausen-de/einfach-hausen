import Link from 'next/link';
import { BadgeCheck, ChevronRight } from 'lucide-react';
import { EHAppHeader, EHPanel, EHList, EHEmptyState, EHErrorState, EHButton, EHField, EHInput, EHFormFeedback, EHSubmitButton } from '@/design-system';
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
  return <AppShell role="homeowner" active="/app/jobs" title="Partnerprofil" subtitle="Geprüfter Einfach-Hausen-Partner" breadcrumbs={crumbs('/app/jobs','Partnerprofil')}>
    {sp.message&&<EHFormFeedback kind="success">{String(sp.message)}</EHFormFeedback>}
    {sp.error&&<EHErrorState text={String(sp.error)} />}
    <EHButton href={returnHref} variant="secondary">Zurück</EHButton>
    <EHAppHeader eyebrow="Geprüfter Partner" title={provider.business_name} text={`${Number(provider.rating||0).toFixed(1)} von 5 aus ${provider.rating_count||0} Bewertungen — ${provider.description||'Zuverlässiger regionaler Vertragspartner für Arbeiten rund ums Eigenheim.'}`} />
    <section className="partner-profile-hero"><div className={provider.logo_path?'partner-profile-cover has-logo':'partner-profile-cover'}>{provider.logo_path?<img src={provider.logo_path} alt={`${provider.business_name} Logo`}/>:<span>{provider.business_name?.slice(0,2).toUpperCase()}</span>}<BadgeCheck/></div><div className="partner-tags">{trades.map((t:string)=><span key={t}>{t}</span>)}</div></section>
    <EHList label="Profildaten" items={[
      { id: 'region', title: `${provider.postcode} · bis ${provider.radius_km} km`, text: 'Region' },
      { id: 'standards', title: 'Vertraglich geprüft', text: 'Standards' },
      { id: 'leistungen', title: `${trades.length||1} Bereiche`, text: 'Leistungen' },
    ]} />
    <EHList label="Prüfstatus" items={[
      { id: 'vers', title: provider.insurance_verified?'Geprüft':'In Prüfung', text: 'Versicherung' },
      { id: 'quali', title: provider.qualification_verified?'Geprüft':'In Prüfung', text: 'Qualifikation' },
      { id: 'vertrag', title: provider.contract_verified?'Aktiv':'In Prüfung', text: 'Partnervertrag' },
      { id: 'qualitaet', title: provider.quality_standard_verified?'Bestätigt':'In Prüfung', text: 'Qualitätsstandard' },
    ]} />
    <EHPanel title={`Bewertungen · ${provider.rating_count||0} insgesamt`}>
    {reviews.map((r:any,i:number)=><article key={`${r.created_at}-${i}`}><div><strong>{r.first_name||'Kunde'}</strong><span>★ {r.rating}/5</span></div><p>{r.comment||'Zuverlässig ausgeführt.'}</p><details><summary>Melden</summary><form action={reportReviewAction.bind(null,r.id)}><EHField id={`report-${r.id}`} label="Grund der Meldung"><EHInput id={`report-${r.id}`} name="reason" maxLength={500} placeholder="Was stimmt an dieser Bewertung nicht?" aria-label="Grund der Meldung" required/></EHField><EHSubmitButton pendingLabel="Meldung wird gesendet …">Bewertung melden</EHSubmitButton></form></details></article>)}
    {reviews.length===0&&<EHEmptyState title="Noch keine öffentliche Bewertung" text="Der Betrieb ist geprüft und neu im Netzwerk." />}
    </EHPanel>
    <Link href={returnHref} className="btn primary wide partner-return">{sp.job?'Zum Angebot zurück':'Aufträge ansehen'} <ChevronRight size={16}/></Link>
  </AppShell>;
}
