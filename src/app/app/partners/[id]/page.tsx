import { EHEmptyState, EHErrorState, EHButton, EHField, EHFormFeedback, EHInput, EHMetricsBar, EHPageHeader, EHRecordList, EHStatus, EHSubmitButton, EHText, EHWorkflowStack, EHWorkSection, EHWorkspaceGrid } from '@/design-system';
import { notFound } from 'next/navigation';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
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
  // Vier Nachweise traegt jeder Partnervertrag: die Kennzahl zaehlt, wie viele
  // davon bereits bestaetigt sind - nicht, wie viele Zeilen die Liste hat.
  const verifications=[provider.insurance_verified,provider.qualification_verified,provider.contract_verified,provider.quality_standard_verified];
  const verifiedCount=verifications.filter(Boolean).length;
  const returnLabel=sp.job?'Zum Angebot zurück':'Aufträge ansehen';
  return <WerkbankRahmen role="homeowner" active="/app/partners">
    <EHWorkflowStack>
    {sp.message&&<EHFormFeedback kind="success">{String(sp.message)}</EHFormFeedback>}
    {sp.error&&<EHErrorState text={String(sp.error)} />}
    <EHPageHeader title={provider.business_name} context={`Geprüfter Partner · ${rating.toFixed(1)} von 5 aus ${ratingCount} Bewertungen`} actions={<EHButton href={returnHref} variant="secondary">Zurück</EHButton>} />
    <EHMetricsBar label="Partnerdaten" items={[
      { id: 'region', label: 'Region', value: `${provider.postcode} · bis ${provider.radius_km} km` },
      { id: 'bereiche', label: 'Bereiche', value: String(trades.length||1), hint: 'Leistungen' },
      { id: 'bewertung', label: 'Bewertung', value: `${rating.toFixed(1)} / 5`, hint: `${ratingCount} Bewertungen` },
      { id: 'nachweise', label: 'Nachweise', value: `${verifiedCount} / 4`, hint: 'Prüfungen bestätigt' },
    ]} />
    <EHWorkspaceGrid main={<>
    <EHWorkSection title="Profildaten">
      <EHRecordList label="Profildaten" items={[
        { id: 'leistungen', title: trades.length ? trades.join(' · ') : 'Kein Bereich hinterlegt', detail: 'Leistungen' },
        { id: 'standards', title: 'Vertraglich geprüft', detail: 'Standards' },
        { id: 'beschreibung', title: provider.description || 'Zuverlässiger regionaler Vertragspartner für Arbeiten rund ums Eigenheim.', detail: 'Beschreibung' },
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
    <EHButton href={returnHref} arrow>{returnLabel}</EHButton>
    </>} aside={<>
      <EHWorkSection title="Nächster Schritt">
        {sp.job
          ? <><EHText>Dieser Betrieb hat dir für deinen Auftrag ein Angebot gemacht.</EHText><EHButton href={returnHref} arrow>{returnLabel}</EHButton></>
          : <><EHText>Der Betrieb ist geprüft und nimmt Aufträge an.</EHText><EHButton href="/app/hausmeister" arrow>Anliegen beschreiben</EHButton></>}
      </EHWorkSection>
      <EHWorkSection title="Prüfstatus">
        <EHRecordList label="Prüfstatus" items={[
          { id: 'versicherung', title: 'Versicherung', status: <EHStatus tone={provider.insurance_verified?'success':'neutral'}>{provider.insurance_verified?'Geprüft':'In Prüfung'}</EHStatus> },
          { id: 'qualifikation', title: 'Qualifikation', status: <EHStatus tone={provider.qualification_verified?'success':'neutral'}>{provider.qualification_verified?'Geprüft':'In Prüfung'}</EHStatus> },
          { id: 'vertrag', title: 'Partnervertrag', status: <EHStatus tone={provider.contract_verified?'success':'neutral'}>{provider.contract_verified?'Aktiv':'In Prüfung'}</EHStatus> },
          { id: 'qualitaet', title: 'Qualitätsstandard', status: <EHStatus tone={provider.quality_standard_verified?'success':'neutral'}>{provider.quality_standard_verified?'Bestätigt':'In Prüfung'}</EHStatus> },
        ]} />
      </EHWorkSection>
      <EHWorkSection title="Gut zu wissen">
        <EHText muted>Nur Betriebe mit aktivem Partnervertrag erscheinen hier. Versicherung, Qualifikation und Qualitätsstandard prüft Einfach Hausen vor der Aufnahme.</EHText>
      </EHWorkSection>
    </>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
