import { CalendarCheck, Database, ListChecks, LogOut, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import s from '@/components/shell.module.css';
import { EHActions, EHButton, EHCheckbox, EHField, EHFieldGrid, EHFormFeedback, EHFormSection, EHInput, EHMetricsBar, EHPageHeader, EHRecordList, EHScope, EHSection, EHSelect, EHStatus, EHText, EHTextLink, EHTextarea, EHWorkSection, EHWorkspaceGrid, EHWorkflowForm, EHWorkflowStack, type EHRecordEntry } from '@/design-system';
import { adminLogoutAction,adminUpdateClaimAction,moderateReviewAction } from '@/app/actions';
import { adminReviewVerificationLifecycleAction,adminUpdatePartnerContractLifecycleAction } from './actions';
import { statusLabel } from '@/lib/format';

export default async function Admin({searchParams}:{searchParams:Promise<Record<string,string>>}){
  await requireAdmin();
  const sp=await searchParams;
  const verifications=db.prepare(`SELECT v.*,u.email,u.first_name,u.last_name,p.business_name,p.trades,p.postcode,p.verified,c.status contract_status,c.customer_discount_bps,c.insurance_verified,c.qualification_verified,c.contract_verified,c.quality_standard_verified,c.response_target_minutes,c.notes contract_notes
    FROM verification_requests v JOIN users u ON u.id=v.provider_id JOIN provider_profiles p ON p.user_id=v.provider_id LEFT JOIN partner_contracts c ON c.provider_id=v.provider_id
    ORDER BY CASE v.status WHEN 'pending' THEN 0 ELSE 1 END,v.submitted_at DESC`).all() as any[];
  const claims=db.prepare(`SELECT c.*,j.title,hu.email homeowner_email,pu.email provider_email,p.business_name FROM claims c JOIN jobs j ON j.id=c.job_id JOIN users hu ON hu.id=c.homeowner_id JOIN users pu ON pu.id=c.provider_id JOIN provider_profiles p ON p.user_id=c.provider_id ORDER BY CASE c.status WHEN 'pending' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,c.updated_at DESC`).all() as any[];

  const overview=db.prepare(`SELECT
    (SELECT COUNT(*) FROM users) users,
    (SELECT COUNT(*) FROM provider_profiles) providers,
    (SELECT COUNT(*) FROM provider_profiles WHERE verified=1) verifiedProviders,
    (SELECT COUNT(*) FROM jobs) requests,
    (SELECT COUNT(*) FROM jobs WHERE status IN ('open','quoted')) openRequests,
    (SELECT COUNT(*) FROM appointments) bookings,
    (SELECT COUNT(*) FROM job_dispatches) matches,
    (SELECT COUNT(*) FROM reviews) reviews,
    (SELECT COUNT(*) FROM notifications WHERE read_at IS NULL AND channel='in_app') unreadNotifications`).get() as any;
  const recentJobs=db.prepare(`SELECT j.id,j.title,j.status,j.created_at,u.first_name,u.last_name
    FROM jobs j JOIN users u ON u.id=j.homeowner_id ORDER BY j.created_at DESC LIMIT 5`).all() as any[];
  const recentBookings=db.prepare(`SELECT a.start_at,a.status,j.title,p.business_name
    FROM appointments a JOIN jobs j ON j.id=a.job_id JOIN provider_profiles p ON p.user_id=a.provider_id
    ORDER BY a.start_at DESC LIMIT 5`).all() as any[];
  const recentReviews=db.prepare(`SELECT r.rating,r.created_at,j.title,p.business_name
    FROM reviews r JOIN jobs j ON j.id=r.job_id JOIN provider_profiles p ON p.user_id=r.provider_id
    ORDER BY r.created_at DESC LIMIT 5`).all() as any[];
  const openReports=db.prepare(`SELECT rr.id,rr.reason,rr.created_at,rr.status,r.rating,r.comment,r.hidden,
    rep.first_name||' '||rep.last_name reporter,
    pp.business_name partner
    FROM review_reports rr
    JOIN reviews r ON r.id=rr.review_id
    JOIN users rep ON rep.id=rr.reported_by
    JOIN users pr ON pr.id=r.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id=r.provider_id
    ORDER BY rr.status='open' DESC, rr.created_at DESC LIMIT 20`).all() as any[];
  const auditEntries=db.prepare(`SELECT actor,action,target,detail,created_at
    FROM admin_audit_log ORDER BY created_at DESC,id DESC LIMIT 30`).all() as any[];
  // Die drei Warteschlangen der Verwaltung: dieselben Zeilen, die unten bearbeitet
  // werden, hier als Kurzliste. Die Kennzahlen oben zaehlen genau diese Mengen.
  const pendingVerifications=verifications.filter((v:any)=>v.status==='pending');
  const openClaims=claims.filter((c:any)=>c.status==='pending'||c.status==='reviewing');
  const openReportQueue=openReports.filter((r:any)=>r.status==='open');
  const verificationQueue:EHRecordEntry[]=pendingVerifications.slice(0,5).map((v:any)=>({
    id:`pruefung-${v.id}`,
    title:v.business_name||`Anbieter ${v.provider_id}`,
    detail:[v.trades,v.postcode].filter(Boolean).join(' · '),
    status:<EHStatus tone="warning">Prüfung offen</EHStatus>,
  }));
  const claimQueue:EHRecordEntry[]=openClaims.slice(0,5).map((c:any)=>({
    id:`fall-${c.id}`,
    title:c.title,
    detail:[c.business_name,statusLabel(c.status)].filter(Boolean).join(' · '),
    status:<EHStatus tone={c.status==='reviewing'?'info':'warning'}>{statusLabel(c.status)}</EHStatus>,
  }));
  const reportQueue:EHRecordEntry[]=openReportQueue.slice(0,5).map((r:any)=>({
    id:`meldung-${r.id}`,
    title:`★ ${r.rating}/5 — ${r.partner||'Partner'}`,
    detail:[r.reporter,r.reason].filter(Boolean).join(' · '),
    status:<EHStatus tone="warning">Meldung offen</EHStatus>,
  }));
  return <EHScope app><div className={s['wb']}>
    {/* Verwaltung nutzt WerkbankRahmen bewusst nicht: role kennt nur homeowner|provider (Owner-Navi, Profil-Link, BottomNav wären für Admin falsch), nav-config hat keine Admin-Bereiche. Lokaler Rahmen aus denselben wb-Klassen, Inhalt unverändert. Top-Navi/Werkzeuge entfallen: Betriebe/Vorgänge haben keine Routen — nichts erfunden. */}
    <div className={s['wb-top']}>
      <div className={s['wb-brand']}>
        <span className={s['wb-mark']} aria-hidden="true">eh</span>
        <span className={s['wb-name']}><b>einfach hausen</b><small>Verwaltung</small></span>
      </div>
    </div>
    <div className={`${s['wb-body']} ${s['wb-norail']}`}>
      <aside className={s['wb-side']} aria-label="Verwaltung">
        <nav aria-label="Übersicht">
          <p className={s['wb-grp']}>Übersicht</p>
          <Link href="/admin" aria-current="page" className={s['wb-on']}>Übersicht</Link>
          <Link href="/admin/crm">CRM</Link>
          <Link href="/admin/ops">Operations</Link>
        </nav>
        <nav aria-label="Prüfen">
          <p className={s['wb-grp']}>Prüfen</p>
        </nav>
        <nav aria-label="Daten">
          <p className={s['wb-grp']}>Daten</p>
        </nav>
        {/* Soll-Gruppen „Prüfen“ (Nachweise/Servicefälle) und „Daten“ (Exporte) haben keine eigenen Routen — die Warteschlangen leben als Abschnitte im Inhalt. Keine Links erfunden. */}
      </aside>
      <main className={s['wb-main']}><EHSection compact><EHWorkflowStack><EHPageHeader title="Einfach Hausen · Admin" context="Betriebsverwaltung" actions={<><EHButton href="/admin/crm"><Database size={16}/>Leads &amp; CRM</EHButton><form action={adminLogoutAction}><EHButton type="submit" variant="secondary"><LogOut size={16}/>Abmelden</EHButton></form></>} />{sp.error&&<EHFormFeedback kind="error">{sp.error}</EHFormFeedback>}<EHMetricsBar label="Verwaltung" items={[
      {id:'pruefungen',label:'Offene Partnerprüfungen',value:String(pendingVerifications.length),hint:`${verifications.length} Prüfungen insgesamt`},
      {id:'servicefaelle',label:'Offene Servicefälle',value:String(openClaims.length),hint:`${claims.length} Fälle insgesamt`},
      {id:'meldungen',label:'Offene Bewertungsmeldungen',value:String(openReportQueue.length),hint:`${openReports.length} Meldungen insgesamt`},
      {id:'partner',label:'Freigegebene Partner',value:`${overview.verifiedProviders} von ${overview.providers}`,hint:'im Partnernetzwerk'},
    ]} /><EHWorkspaceGrid main={<><EHWorkSection title="Betriebsübersicht"><EHText muted>Ein kompakter Blick auf Nutzer, Vorgänge und Zustellungen – ohne sensible Inhalte.</EHText><EHMetricsBar label="Betriebsübersicht" items={[{id:'nutzer',label:'Nutzer',value:String(overview.users),hint:'Eigentümer und Partner'},{id:'partnernetz',label:'Partner',value:String(overview.providers),hint:`${overview.verifiedProviders} geprüft`},{id:'anfragen',label:'Anfragen',value:String(overview.requests),hint:`${overview.openRequests} offen`},{id:'bookings',label:'Bookings',value:String(overview.bookings),hint:'Termine insgesamt'},{id:'matching',label:'Matching',value:String(overview.matches),hint:'Partner-Zuordnungen'},{id:'mitteilungen',label:'Benachrichtigungen',value:String(overview.unreadNotifications),hint:'ungelesen'}]} /></EHWorkSection><EHWorkSection title="Anfragen"><EHRecordList label="Neueste Anfragen" empty="Noch keine Anfragen." items={recentJobs.map((job:any)=>({id:`anfrage-${job.id}`,title:job.title,detail:`${job.first_name} ${job.last_name} · ${statusLabel(job.status)}`,status:<EHStatus tone={job.status === 'open' ? 'warning' : job.status === 'completed' ? 'success' : 'neutral'}>{statusLabel(job.status)}</EHStatus>,icon:<ListChecks size={20}/>}))} /></EHWorkSection><EHWorkSection title="Bookings"><EHRecordList label="Neueste Bookings" empty="Noch keine Bookings." items={recentBookings.map((booking:any,index:number)=>({id:`booking-${booking.start_at}-${index}`,title:booking.title,detail:`${booking.business_name} · ${String(booking.start_at).slice(0,10)}`,status:<EHStatus tone={booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'error' : 'info'}>{statusLabel(booking.status)}</EHStatus>,icon:<CalendarCheck size={20}/>}))} /></EHWorkSection><EHWorkSection title="Bewertungen"><EHRecordList label="Neueste Bewertungen" empty="Noch keine Bewertungen." items={recentReviews.map((review:any,index:number)=>({id:`bewertung-${review.created_at}-${index}`,title:review.business_name,detail:review.title,status:<EHStatus tone="success">{review.rating}/5</EHStatus>,icon:<Star size={20}/>}))} /></EHWorkSection><EHWorkSection title="Admin-Audit-Log"><EHText muted>Privilegierte Aktionen, chronologisch und ohne geheime Werte. {auditEntries.length} Einträge.</EHText><EHRecordList label="Admin-Audit-Log" empty="Noch keine Admin-Aktionen protokolliert." items={auditEntries.map((entry:any,index:number)=>({id:`audit-${entry.created_at}-${entry.action}-${index}`,title:entry.action,detail:[`${entry.actor} · ${entry.target||'System'}`,entry.detail].filter(Boolean).join(' — '),dateLabel:String(entry.created_at)}))} /></EHWorkSection><EHWorkflowStack>
        <EHWorkSection title="Partnernetzwerk">
          {verifications.length===0&&<EHText muted>Keine Partnerprüfungen vorhanden.</EHText>}
          <EHWorkflowStack>{verifications.map((v:any)=>{
            const kontakt=[v.first_name,v.last_name,v.email].filter(Boolean).join(' ');
            const betrieb=[v.trades,v.postcode].filter(Boolean).join(' · ');
            return <EHWorkflowStack key={v.id}>
              <EHFormSection title={v.business_name||`Anbieter ${v.provider_id}`} description={[kontakt,betrieb].filter(Boolean).join(' · ')}>
                <EHActions>
                  <EHStatus tone={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'error' : 'warning'}>Prüfung {statusLabel(v.status)}</EHStatus>
                  <EHStatus tone={v.contract_status === 'active' ? 'success' : v.contract_status === 'ended' ? 'error' : 'neutral'}>Vertrag {statusLabel(v.contract_status||'pending')}</EHStatus>
                </EHActions>
                <EHButton href={`/api/admin/verification-file/${v.id}`} target="_blank" rel="noreferrer" variant="secondary">Prüfdokument öffnen</EHButton>
                {v.provider_note&&<EHText>{v.provider_note}</EHText>}
                <EHWorkflowForm action={adminReviewVerificationLifecycleAction.bind(null,v.id)}>
                  <EHField id={`pruefnotiz-${v.id}`} label="Prüfnotiz"><EHTextarea id={`pruefnotiz-${v.id}`} name="adminNote" rows={2} defaultValue={v.admin_note||''} placeholder="Prüfnotiz"/></EHField>
                  <EHActions>
                    <EHButton type="submit" name="decision" value="approved"><ShieldCheck size={16}/>Unternehmen freigeben</EHButton>
                    <EHButton type="submit" name="decision" value="rejected" variant="secondary">Ablehnen</EHButton>
                  </EHActions>
                </EHWorkflowForm>
                <EHWorkflowForm action={adminUpdatePartnerContractLifecycleAction.bind(null,v.provider_id)}>
                  <EHFormSection title="Einfach-Hausen-Partnervertrag">
                    <EHFieldGrid>
                      <EHField id={`vertrag-status-${v.id}`} label="Status"><EHSelect id={`vertrag-status-${v.id}`} name="status" defaultValue={v.contract_status||'pending'}><option value="pending">Ausstehend</option><option value="active">Aktiv</option><option value="suspended">Pausiert</option><option value="ended">Beendet</option></EHSelect></EHField>
                      <EHField id={`reaktionsziel-${v.id}`} label="Reaktionsziel (Min.)"><EHInput id={`reaktionsziel-${v.id}`} name="responseTarget" type="number" min={5} max={240} defaultValue={v.response_target_minutes||30}/></EHField>
                    </EHFieldGrid>
                    <EHField id={`kundenvorteil-${v.id}`} label="Kundenvorteil (bps)" hint="Status „Aktiv“ wird serverseitig nur übernommen, wenn die Unternehmensprüfung freigegeben und alle vier folgenden Prüfungen bestätigt sind."><EHInput id={`kundenvorteil-${v.id}`} name="discountBps" type="number" min={0} max={3000} defaultValue={v.customer_discount_bps??0}/></EHField>
                    <EHCheckbox name="insurance" defaultChecked={!!v.insurance_verified} label="Betriebshaftpflicht geprüft"/>
                    <EHCheckbox name="qualification" defaultChecked={!!v.qualification_verified} label="Qualifikation/Zulassung geprüft"/>
                    <EHCheckbox name="contract" defaultChecked={!!v.contract_verified} label="Partnervertrag unterschrieben"/>
                    <EHCheckbox name="quality" defaultChecked={!!v.quality_standard_verified} label="Qualitätsstandard akzeptiert"/>
                    <EHText muted>0 % Auftragsprovision — Partner behalten 100 % ihres Auftragswertes. Monetarisierung erfolgt ausschließlich über Partner-Tarife.</EHText>
                    <EHField id={`vertrag-notizen-${v.id}`} label="Konditionen / interne Notizen"><EHTextarea id={`vertrag-notizen-${v.id}`} name="contractNotes" rows={2} defaultValue={v.contract_notes||''} placeholder="Konditionen / interne Notizen"/></EHField>
                    <EHActions><EHButton type="submit">Partnervertrag speichern</EHButton></EHActions>
                  </EHFormSection>
                </EHWorkflowForm>
              </EHFormSection>
            </EHWorkflowStack>;
          })}</EHWorkflowStack>
        </EHWorkSection>
        <EHWorkSection title="Bewertungs-Moderation">
          <EHText muted>Operations-Lookup und Outbox: <EHTextLink href="/admin/ops">/admin/ops</EHTextLink></EHText>
          {openReports.length===0&&<EHText muted>Keine gemeldeten Bewertungen.</EHText>}
          <EHWorkflowStack>{openReports.map((report:any)=>(
            <EHWorkflowForm key={report.id} action={moderateReviewAction.bind(null,report.id)}>
              <EHFormSection title={`★ ${report.rating}/5 — ${report.partner}`} description={`Gemeldet von ${report.reporter} · ${new Date(report.created_at).toLocaleDateString('de-DE')}`}>
                <EHStatus tone={report.status==='open' ? 'warning' : 'neutral'}>{report.status==='open'?'Offen':report.status==='actioned'?'Bearbeitet':'Verworfen'}</EHStatus>
                <EHText>{report.comment||'(ohne Text)'}{report.reason&&<> — Grund: {report.reason}</>}</EHText>
                <EHActions>
                  {report.status==='open'&&<>
                    <EHButton type="submit" name="decision" value="hide">Bewertung ausblenden</EHButton>
                    <EHButton type="submit" name="decision" value="dismiss" variant="secondary">Meldung verwerfen</EHButton>
                  </>}
                  {report.hidden&&<EHButton type="submit" name="decision" value="restore" variant="secondary">Wieder einblenden</EHButton>}
                </EHActions>
              </EHFormSection>
            </EHWorkflowForm>
          ))}</EHWorkflowStack>
        </EHWorkSection>
        <EHWorkSection title="Servicefälle">
          {claims.length===0&&<EHText muted>Keine Servicefälle vorhanden.</EHText>}
          <EHWorkflowStack>{claims.map((c:any)=>(
            <EHWorkflowForm key={c.id} action={adminUpdateClaimAction.bind(null,c.id)}>
              <EHFormSection title={c.title} description={`Kunde: ${c.homeowner_email} · Partner: ${c.business_name} · ${c.provider_email}`}>
                <EHStatus tone={c.status === 'resolved' ? 'success' : c.status === 'rejected' ? 'error' : 'info'}>{statusLabel(c.status)}</EHStatus>
                <EHText>{c.description}</EHText>
                <EHField id={`fall-status-${c.id}`} label="Status"><EHSelect id={`fall-status-${c.id}`} name="status" defaultValue={c.status}><option value="pending">Offen</option><option value="reviewing">In Prüfung</option><option value="resolved">Gelöst</option><option value="rejected">Abgelehnt</option></EHSelect></EHField>
                <EHField id={`fall-notiz-${c.id}`} label="Rückmeldung / Entscheidung"><EHTextarea id={`fall-notiz-${c.id}`} name="adminNote" rows={3} defaultValue={c.admin_note||''} placeholder="Rückmeldung / Entscheidung"/></EHField>
                <EHActions><EHButton type="submit">Fall aktualisieren</EHButton></EHActions>
              </EHFormSection>
            </EHWorkflowForm>
          ))}</EHWorkflowStack>
        </EHWorkSection>
      </EHWorkflowStack></>} aside={<>
    <EHWorkSection title="Prüf-Warteschlange">
      <EHRecordList label="Offene Partnerprüfungen" items={verificationQueue} empty="Keine offenen Partnerprüfungen." />
    </EHWorkSection>
    <EHWorkSection title="Servicefälle in Arbeit">
      <EHRecordList label="Offene Servicefälle" items={claimQueue} empty="Keine offenen Servicefälle." />
    </EHWorkSection>
    <EHWorkSection title="Gemeldete Bewertungen">
      <EHRecordList label="Offene Bewertungsmeldungen" items={reportQueue} empty="Keine offenen Bewertungsmeldungen." />
    </EHWorkSection>
  </>} /></EHWorkflowStack></EHSection></main></div></div></EHScope>;
}
