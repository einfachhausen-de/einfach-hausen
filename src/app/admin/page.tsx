import { BadgeCheck, CalendarCheck, Database, FileWarning, Handshake, ListChecks, LogOut, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { EHAppHeader, EHButton, EHMetricsBar, EHRecordList, EHScope, EHStatus, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { adminLogoutAction,adminUpdateClaimAction,moderateReviewAction } from '@/app/actions';
import { adminReviewVerificationLifecycleAction,adminUpdatePartnerContractLifecycleAction } from './actions';
import { statusLabel } from '@/lib/format';
import styles from './admin.module.css';

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
    (SELECT COUNT(*) FROM notifications WHERE read_at IS NULL) unreadNotifications`).get() as any;
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
  return <EHScope app><main className="admin-page"><EHAppHeader eyebrow="Betriebsverwaltung" title="Einfach Hausen · Admin" text="Vertragspartner, Qualitätsstandards, Leads und Servicefälle." actions={<><EHButton href="/admin/crm"><Database size={16}/>Leads &amp; CRM</EHButton><form action={adminLogoutAction}><EHButton type="submit" variant="secondary"><LogOut size={16}/>Abmelden</EHButton></form></>} />{sp.error&&<div className="alert error" role="alert">{sp.error}</div>}<EHMetricsBar label="Verwaltung" items={[
      {id:'pruefungen',label:'Offene Partnerprüfungen',value:String(pendingVerifications.length),hint:`${verifications.length} Prüfungen insgesamt`},
      {id:'servicefaelle',label:'Offene Servicefälle',value:String(openClaims.length),hint:`${claims.length} Fälle insgesamt`},
      {id:'meldungen',label:'Offene Bewertungsmeldungen',value:String(openReportQueue.length),hint:`${openReports.length} Meldungen insgesamt`},
      {id:'partner',label:'Freigegebene Partner',value:`${overview.verifiedProviders} von ${overview.providers}`,hint:'im Partnernetzwerk'},
    ]} /><EHWorkspaceGrid main={<><section className={styles.overview} aria-labelledby="admin-overview-title"><div className={styles.overviewIntro}><div><h2 id="admin-overview-title">Betriebsübersicht</h2><p>Ein kompakter Blick auf Nutzer, Vorgänge und Zustellungen – ohne sensible Inhalte.</p></div></div><div className={styles.kpis}><div className={styles.kpi}><span className={styles.kpiLabel}>Nutzer</span><strong className={styles.kpiValue}>{overview.users}</strong><small className={styles.kpiMeta}>Eigentümer und Partner</small></div><div className={styles.kpi}><span className={styles.kpiLabel}>Partner</span><strong className={styles.kpiValue}>{overview.providers}</strong><small className={styles.kpiMeta}>{overview.verifiedProviders} geprüft</small></div><div className={styles.kpi}><span className={styles.kpiLabel}>Anfragen</span><strong className={styles.kpiValue}>{overview.requests}</strong><small className={styles.kpiMeta}>{overview.openRequests} offen</small></div><div className={styles.kpi}><span className={styles.kpiLabel}>Bookings</span><strong className={styles.kpiValue}>{overview.bookings}</strong><small className={styles.kpiMeta}>Termine insgesamt</small></div><div className={styles.kpi}><span className={styles.kpiLabel}>Matching</span><strong className={styles.kpiValue}>{overview.matches}</strong><small className={styles.kpiMeta}>Partner-Zuordnungen</small></div><div className={styles.kpi}><span className={styles.kpiLabel}>Benachrichtigungen</span><strong className={styles.kpiValue}>{overview.unreadNotifications}</strong><small className={styles.kpiMeta}>ungelesen</small></div></div></section><section className={styles.monitorGrid} aria-label="Aktuelle Produktaktivität"><article className={styles.monitorCard}><h3><ListChecks size={17}/>Anfragen</h3>{recentJobs.length?<ul className={styles.monitorList}>{recentJobs.map(job=><li className={styles.monitorItem} key={job.id}><span className={styles.monitorCopy}><strong>{job.title}</strong><small>{job.first_name} {job.last_name} · {statusLabel(job.status)}</small></span><EHStatus tone={job.status === 'open' ? 'warning' : job.status === 'completed' ? 'success' : 'neutral'}>{statusLabel(job.status)}</EHStatus></li>)}</ul>:<p className={styles.emptyMonitor}>Noch keine Anfragen.</p>}</article><article className={styles.monitorCard}><h3><CalendarCheck size={17}/>Bookings</h3>{recentBookings.length?<ul className={styles.monitorList}>{recentBookings.map((booking,index)=><li className={styles.monitorItem} key={`${booking.start_at}-${index}`}><span className={styles.monitorCopy}><strong>{booking.title}</strong><small>{booking.business_name} · {String(booking.start_at).slice(0,10)}</small></span><EHStatus tone={booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'error' : 'info'}>{statusLabel(booking.status)}</EHStatus></li>)}</ul>:<p className={styles.emptyMonitor}>Noch keine Bookings.</p>}</article><article className={styles.monitorCard}><h3><Star size={17}/>Bewertungen</h3>{recentReviews.length?<ul className={styles.monitorList}>{recentReviews.map((review,index)=><li className={styles.monitorItem} key={`${review.created_at}-${index}`}><span className={styles.monitorCopy}><strong>{review.business_name}</strong><small>{review.title}</small></span><EHStatus tone="success">{review.rating}/5</EHStatus></li>)}</ul>:<p className={styles.emptyMonitor}>Noch keine Bewertungen.</p>}</article></section><section className={styles.auditPanel} aria-labelledby="audit-title"><div className={styles.auditHeader}><div><h2 id="audit-title">Admin-Audit-Log</h2><p>Privilegierte Aktionen, chronologisch und ohne geheime Werte.</p></div><span className={styles.auditCount}>{auditEntries.length} Einträge</span></div>{auditEntries.length?<div className={styles.auditList}>{auditEntries.map((entry,index)=><article className={styles.auditEntry} key={`${entry.created_at}-${entry.action}-${index}`}><time dateTime={entry.created_at}>{entry.created_at}</time><div className={styles.auditCopy}><strong>{entry.action}</strong><span>{entry.actor} · {entry.target||'System'}</span>{entry.detail&&<small>{entry.detail}</small>}</div></article>)}</div>:<p className={styles.emptyMonitor}>Noch keine Admin-Aktionen protokolliert.</p>}</section><div className="admin-grid">
    <section className="admin-panel"><h2><BadgeCheck/> Partnernetzwerk</h2>{verifications.length===0&&<p className="muted">Keine Partnerprüfungen vorhanden.</p>}<div className="stack">{verifications.map(v=><article className="admin-card" key={v.id}><div className="admin-card-head"><div><strong>{v.business_name}</strong><small>{v.first_name} {v.last_name} · {v.email}<br/>{v.trades} · {v.postcode}</small></div><div className="admin-status-stack"><EHStatus tone={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'error' : 'warning'}>Prüfung {statusLabel(v.status)}</EHStatus><EHStatus tone={v.contract_status === 'active' ? 'success' : v.contract_status === 'ended' ? 'error' : 'neutral'}>Vertrag {statusLabel(v.contract_status||'pending')}</EHStatus></div></div><a className="admin-file" href={`/api/admin/verification-file/${v.id}`} target="_blank" rel="noreferrer">Prüfdokument öffnen</a>{v.provider_note&&<p>{v.provider_note}</p>}
      <form action={adminReviewVerificationLifecycleAction.bind(null,v.id)} className="admin-form"><textarea name="adminNote" rows={2} defaultValue={v.admin_note||''} placeholder="Prüfnotiz"/><div className="action-row"><EHButton type="submit" name="decision" value="approved"><ShieldCheck size={16}/>Unternehmen freigeben</EHButton><EHButton type="submit" name="decision" value="rejected" variant="secondary">Ablehnen</EHButton></div></form>
      <div className="admin-contract"><h3><Handshake size={16}/> Einfach-Hausen-Partnervertrag</h3><form action={adminUpdatePartnerContractLifecycleAction.bind(null,v.provider_id)} className="admin-form"><div className="two"><label>Status<select name="status" defaultValue={v.contract_status||'pending'}><option value="pending">Ausstehend</option><option value="active">Aktiv</option><option value="suspended">Pausiert</option><option value="ended">Beendet</option></select></label><label>Reaktionsziel (Min.)<input name="responseTarget" type="number" min="5" max="240" defaultValue={v.response_target_minutes||30}/></label></div><div className="admin-zero-commission"><strong>0 % Auftragsprovision</strong><span>Partner behalten 100 % ihres Auftragswertes. Monetarisierung erfolgt ausschließlich über Partner-Tarife.</span></div><label>Kundenvorteil (bps)<input name="discountBps" type="number" min="0" max="3000" defaultValue={v.customer_discount_bps??0}/></label><p className="muted">Status „Aktiv“ wird serverseitig nur übernommen, wenn die Unternehmensprüfung freigegeben und alle vier folgenden Prüfungen bestätigt sind.</p><div className="contract-checkboxes"><label><input type="checkbox" name="insurance" defaultChecked={!!v.insurance_verified}/> Betriebshaftpflicht geprüft</label><label><input type="checkbox" name="qualification" defaultChecked={!!v.qualification_verified}/> Qualifikation/Zulassung geprüft</label><label><input type="checkbox" name="contract" defaultChecked={!!v.contract_verified}/> Partnervertrag unterschrieben</label><label><input type="checkbox" name="quality" defaultChecked={!!v.quality_standard_verified}/> Qualitätsstandard akzeptiert</label></div><textarea name="contractNotes" rows={2} defaultValue={v.contract_notes||''} placeholder="Konditionen / interne Notizen"/><EHButton type="submit">Partnervertrag speichern</EHButton></form></div>
    </article>)}</div></section>
    <section className="admin-panel"><h2><Star/> Bewertungs-Moderation</h2>
      <p className="muted">Operations-Lookup und Outbox: <Link href="/admin/ops">/admin/ops</Link></p>
      {openReports.length===0&&<p className="muted">Keine gemeldeten Bewertungen.</p>}
      <div className="stack">{openReports.map(report=><article className="admin-card" key={report.id}>
        <div className="admin-card-head"><div>
          <strong>★ {report.rating}/5 — {report.partner}</strong>
          <small>Gemeldet von {report.reporter} · {new Date(report.created_at).toLocaleDateString('de-DE')}</small>
        </div><EHStatus tone={report.status==='open' ? 'warning' : 'neutral'}>{report.status==='open'?'Offen':report.status==='actioned'?'Bearbeitet':'Verworfen'}</EHStatus></div>
        <p>{report.comment||'(ohne Text)'}{report.reason&&<> — <strong>Grund:</strong> {report.reason}</>}</p>
        <div className="action-row">
          {report.status==='open'&&<>
            <form action={moderateReviewAction.bind(null,report.id)} className="admin-form"><input type="hidden" name="decision" value="hide"/><EHButton type="submit">Bewertung ausblenden</EHButton></form>
            <form action={moderateReviewAction.bind(null,report.id)} className="admin-form"><input type="hidden" name="decision" value="dismiss"/><EHButton type="submit" variant="secondary">Meldung verwerfen</EHButton></form>
          </>}
          {report.hidden&&<form action={moderateReviewAction.bind(null,report.id)} className="admin-form"><input type="hidden" name="decision" value="restore"/><EHButton type="submit" variant="secondary">Wieder einblenden</EHButton></form>}
        </div>
      </article>)}</div>
    </section>
    <section className="admin-panel"><h2><FileWarning/> Servicefälle</h2>{claims.length===0&&<p className="muted">Keine Servicefälle vorhanden.</p>}<div className="stack">{claims.map(c=><article className="admin-card" key={c.id}><div className="admin-card-head"><div><strong>{c.title}</strong><small>Kunde: {c.homeowner_email}<br/>Partner: {c.business_name} · {c.provider_email}</small></div><EHStatus tone={c.status === 'resolved' ? 'success' : c.status === 'rejected' ? 'error' : 'info'}>{statusLabel(c.status)}</EHStatus></div><p>{c.description}</p><form action={adminUpdateClaimAction.bind(null,c.id)} className="admin-form"><label>Status<select name="status" defaultValue={c.status}><option value="pending">Offen</option><option value="reviewing">In Prüfung</option><option value="resolved">Gelöst</option><option value="rejected">Abgelehnt</option></select></label><textarea name="adminNote" rows={3} defaultValue={c.admin_note||''} placeholder="Rückmeldung / Entscheidung"/><EHButton type="submit">Fall aktualisieren</EHButton></form></article>)}</div></section>
  </div></>} aside={<>
    <EHWorkSection title="Prüf-Warteschlange">
      <EHRecordList label="Offene Partnerprüfungen" items={verificationQueue} empty="Keine offenen Partnerprüfungen." />
    </EHWorkSection>
    <EHWorkSection title="Servicefälle in Arbeit">
      <EHRecordList label="Offene Servicefälle" items={claimQueue} empty="Keine offenen Servicefälle." />
    </EHWorkSection>
    <EHWorkSection title="Gemeldete Bewertungen">
      <EHRecordList label="Offene Bewertungsmeldungen" items={reportQueue} empty="Keine offenen Bewertungsmeldungen." />
    </EHWorkSection>
  </>} /></main></EHScope>;
}
