import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle,CalendarDays,CheckCircle2,MapPin,MessageSquare,Phone,ShieldCheck,Sparkles,Star,UserRound } from 'lucide-react';
import { AppShell,SectionTitle } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { JobMedia } from '@/components/job-media';
import { mediaKindFromPath } from '@/lib/intake-media';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { acceptQuoteAction,cancelJobAction,createCheckoutAction,createClaimAction,reviewAction,sendMessageAction,sendSavedContactMessageAction,turnContactIntoServiceAction } from '@/app/actions';
import { dateLabel,euro,statusLabel } from '@/lib/format';
import { getQuoteRecommendations } from '@/lib/orchestrator';
import { SubmitButton } from '@/components/ui/submit-button';
import { EHButton, EHPanel, EHEmptyState, EHErrorState, EHStatus, EHPageHeader, EHMetricsBar, EHRecordList, EHText, EHWorkSection, EHWorkspaceGrid, EHFormFeedback } from '@/design-system';

function emergencyAvailability(value?:string|null){
  if(!value)return 'Zeit nach Rückmeldung';
  const timestamp=new Date(value).getTime();
  if(!Number.isFinite(timestamp))return dateLabel(value);
  const minutes=Math.max(0,Math.round((timestamp-Date.now())/60000));
  if(minutes<=5)return 'voraussichtlich sofort verfügbar';
  if(minutes<=180)return `voraussichtlich in ca. ${minutes} Min. verfügbar`;
  return `verfügbar ab ${dateLabel(value)}`;
}

function scopeNotes(message:string|undefined,jobDescription:string){
  const offer=(message||'').toLowerCase(); const job=jobDescription.toLowerCase(); const notes:string[]=[];
  if(!offer.includes('material'))notes.push('Material nicht ausdrücklich genannt');
  if(/hecke|baum|schnitt|abbruch|demont|entrümpel|garten/.test(job)&&!/(entsorg|abtransport|abfuhr)/.test(offer))notes.push('Entsorgung/Abtransport nicht ausdrücklich genannt');
  if(!/(anfahrt|fahrtkosten|fahrkosten)/.test(offer))notes.push('Anfahrt nicht ausdrücklich genannt');
  return notes.slice(0,3);
}

export default async function JobDetail({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<Record<string,string>>}){
  const u=await requireUser('homeowner'); const {id}=await params; const sp=await searchParams;
  const job=db.prepare(`SELECT j.*,(SELECT id FROM job_photos p WHERE p.job_id=j.id LIMIT 1) photo_id,(SELECT path FROM job_photos p WHERE p.job_id=j.id LIMIT 1) photo_path FROM jobs j WHERE j.id=? AND j.homeowner_id=?`).get(Number(id),u.id) as any; if(!job)notFound();
  if(job.request_kind==='contact'){
    const contact=db.prepare(`SELECT a.provider_id,a.contact_user_id,u.first_name,u.last_name,u.phone,u.email,m.job_title,p.business_name FROM job_assignments a JOIN users u ON u.id=a.contact_user_id JOIN provider_members m ON m.user_id=a.contact_user_id JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.job_id=?`).get(job.id) as any;
    const messages=contact?db.prepare('SELECT * FROM contact_messages WHERE homeowner_id=? AND contact_user_id=? ORDER BY created_at').all(u.id,contact.contact_user_id) as any[]:[];
    const dispatches=db.prepare(`SELECT COUNT(*) total FROM job_dispatches WHERE job_id=?`).get(job.id) as any;
    return <AppShell role="homeowner" active="/app/jobs" title="Ansprechpartner" subtitle={job.category} breadcrumbs={crumbs('/app/jobs','Ansprechpartner')}>
      <EHPageHeader title={job.title.replace(/^Ansprechpartner:\s*/,'')} context={[job.category,job.postcode].filter(Boolean).join(' · ')} actions={<EHStatus tone={contact?"success":"neutral"}>{contact?'Verbunden':'Ansprechpartner gesucht'}</EHStatus>} />
      <EHMetricsBar label="Ansprechpartner" items={[
        { id: 'partner', label: 'Angefragte Partner', value: dispatches.total||0, hint: 'regionale Betriebe' },
        { id: 'nachrichten', label: 'Nachrichten', value: messages.length, hint: contact ? 'im Verlauf' : 'noch keine' },
        { id: 'ort', label: 'Ort', value: job.postcode||'–' },
        { id: 'kontakt', label: 'Kontakt', value: contact ? 'Verbunden' : 'Wird gesucht' },
      ]} />
      <EHWorkspaceGrid main={<>
      <EHWorkSection title="Dein Anliegen"><div className="meta-line"><span><MapPin/>{job.postcode}</span></div>{job.description&&<p>{job.description}</p>}{job.photo_id&&<JobMedia src={`/api/job-media/${job.photo_id}`} alt="Foto, Video oder Sprachnachricht zum Thema" kind={mediaKindFromPath(job.photo_path)}/>}
</EHWorkSection>
      <div className="ai-summary"><Sparkles/><div><strong>Du hast nur einen Ansprechpartner gewählt</strong><p>Es wurde noch kein Auftrag vergeben und kein Preis vereinbart.</p></div></div>
      {!contact?<EHEmptyState title="Passender Ansprechpartner wird gesucht" text={`${dispatches.total||0} geprüfte regionale Partner wurden angefragt. Sobald ein Betrieb übernimmt, kannst du direkt schreiben oder anrufen.`} />:<>
        <SectionTitle>Dein persönlicher Ansprechpartner</SectionTitle>
        <EHPanel title="Ansprechpartner"><UserRound/><div className="grow"><strong>{contact.first_name} {contact.last_name}</strong><p>{contact.job_title||'Ansprechpartner'} · <Link className="inline-partner-link" href={`/app/partners/${contact.provider_id}?job=${job.id}`}>{contact.business_name}</Link></p><small>Für Fragen direkt erreichbar. Daraus entsteht nicht automatisch ein Auftrag.</small></div></EHPanel>
        <div className="direct-contact-actions"><Link className="btn primary" href={`/app/messages?contact=${contact.contact_user_id}`}><MessageSquare size={16}/>Nachricht</Link>{contact.phone&&<a className="btn ghost" href={`tel:${contact.phone}`}><Phone size={16}/>Anrufen</a>}</div>
        <div className="chat">{messages.map((m:any)=><div className={m.sender_id===u.id?'msg mine':'msg'} key={m.id}><small>{m.sender_id===u.id?'Du':contact.first_name}</small><p>{m.body}</p></div>)}<form action={sendSavedContactMessageAction.bind(null,contact.contact_user_id,u.id)} className="chat-form"><label className="owner-visually-hidden" htmlFor={`contact-job-message-${job.id}`}>Nachricht an {contact.first_name}</label><input id={`contact-job-message-${job.id}`} name="body" aria-label={`Nachricht an ${contact.first_name}`} placeholder={`Nachricht an ${contact.first_name} …`} required/><SubmitButton className="" pendingLabel="…"><span aria-hidden="true">↗</span><span className="owner-visually-hidden">Nachricht senden</span></SubmitButton></form></div>
        <div className="contact-to-service"><div><strong>Soll daraus doch ein Auftrag werden?</strong><p>Du entscheidest erst jetzt. Dann organisiert Einfach Hausen separat Termin und Angebote.</p></div><form action={turnContactIntoServiceAction.bind(null,job.id)}><SubmitButton className="btn primary" pendingLabel="Wird organisiert…">Auftrag organisieren</SubmitButton></form></div>
      </>}
      </>} aside={<>
        <EHWorkSection title="Nächster Schritt">
          {contact?<>
            <EHText>{`Schreib ${contact.first_name} direkt – daraus entsteht noch kein Auftrag.`}</EHText>
            <EHButton href={`/app/messages?contact=${contact.contact_user_id}`} arrow>Nachricht schreiben</EHButton>
            {contact.phone&&<EHButton href={`tel:${contact.phone}`} variant="secondary">Anrufen</EHButton>}
          </>:<EHText muted>{(dispatches.total||0)>0?`${dispatches.total} geprüfte Betriebe sind angefragt. Sobald einer übernimmt, kannst du direkt schreiben oder anrufen.`:'Es ist noch kein Betrieb angefragt.'}</EHText>}
        </EHWorkSection>
        <EHWorkSection title="Dein Kontakt">
          {contact?<EHRecordList label="Kontaktdaten" items={[
            { id: 'name', title: `${contact.first_name} ${contact.last_name}`, detail: contact.job_title||'Ansprechpartner' },
            { id: 'betrieb', title: contact.business_name, detail: 'Betrieb', href: `/app/partners/${contact.provider_id}?job=${job.id}` },
            { id: 'telefon', title: contact.phone||'Keine Nummer hinterlegt', detail: 'Telefon' },
            { id: 'mail', title: contact.email||'Keine Adresse hinterlegt', detail: 'E-Mail' },
          ]} />:<EHText muted>Ein persönlicher Ansprechpartner wird zugewiesen, sobald ein Betrieb übernimmt.</EHText>}
        </EHWorkSection>
        <EHWorkSection title="Gut zu wissen">
          <EHText muted>Du hast nur einen Ansprechpartner gewählt: kein Auftrag, kein Preis, keine Verpflichtung.</EHText>
        </EHWorkSection>
      </>} />
    </AppShell>;
  }
  const quotes=getQuoteRecommendations(job.id); const accepted=quotes.find(q=>q.status==='accepted');
  const paid=db.prepare(`SELECT status FROM payments WHERE job_id=? ORDER BY id DESC LIMIT 1`).get(job.id) as any;
  const review=db.prepare('SELECT * FROM reviews WHERE job_id=?').get(job.id) as any;
  const claim=accepted?db.prepare('SELECT * FROM claims WHERE job_id=?').get(job.id) as any:null;
  const contact=accepted?db.prepare(`SELECT a.provider_id,a.contact_user_id,u.first_name,u.last_name,u.phone,u.email,m.job_title,p.business_name FROM job_assignments a JOIN users u ON u.id=a.contact_user_id JOIN provider_members m ON m.user_id=a.contact_user_id JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.job_id=?`).get(job.id) as any:null;
  const messages=contact?db.prepare('SELECT * FROM contact_messages WHERE homeowner_id=? AND contact_user_id=? ORDER BY created_at').all(u.id,contact.contact_user_id) as any[]:[];
  const dispatches=db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='quoted' THEN 1 ELSE 0 END) quoted FROM job_dispatches WHERE job_id=?`).get(job.id) as any;
  const cheapest=quotes.length?Math.min(...quotes.map(q=>q.amount)):null;
  const available=quotes.filter(q=>q.available_at).sort((a,b)=>new Date(a.available_at).getTime()-new Date(b.available_at).getTime()); const fastest=available[0]?.id;

  return <AppShell role="homeowner" active="/app/jobs" breadcrumbs={crumbs('/app/jobs','Auftrag')}>
    <EHPageHeader title={job.title} context={[job.category,job.postcode].filter(Boolean).join(' · ')} actions={<><EHStatus tone="neutral">{statusLabel(job.status)}</EHStatus>{job.urgency==='emergency'&&<EHStatus tone="error">NOTFALL</EHStatus>}</>} />
    {sp.error&&<EHErrorState text={sp.error} />}{sp.cancelled==='1'&&<EHFormFeedback kind="success">Auftrag wurde storniert.</EHFormFeedback>}{sp.payment==='processing'&&<EHFormFeedback kind="success">Zahlung eingegangen. Der endgültige Status wird sicher über Stripe bestätigt.</EHFormFeedback>}{sp.payment==='unavailable'&&<EHErrorState text="Onlinezahlung ist derzeit nicht vollständig konfiguriert. Es wurde kein Zahlungsstatus geändert. Stimme die Zahlung direkt mit deinem Ansprechpartner ab oder versuche es später erneut." />}{sp.payment==='cancelled'&&<EHErrorState text="Zahlung wurde abgebrochen. Es wurde nichts belastet." />}
    <EHMetricsBar label="Stand deines Auftrags" items={[
      { id: 'angebote', label: 'Angebote', value: quotes.length, hint: cheapest!=null ? `ab ${euro(cheapest)}` : 'noch keine' },
      { id: 'partner', label: 'Angefragte Partner', value: dispatches.total||0, hint: `${dispatches.quoted||0} mit Angebot` },
      { id: 'termin', label: 'Wunschtermin', value: dateLabel(job.preferred_date) },
      { id: 'nachrichten', label: 'Nachrichten', value: messages.length, hint: contact ? 'mit deinem Ansprechpartner' : 'noch kein Kontakt' },
    ]} />
    <EHWorkspaceGrid main={<>
    <EHWorkSection title="Dein Auftrag"><div className="meta-line"><span><MapPin/>{job.postcode}</span><span><CalendarDays/>{dateLabel(job.preferred_date)}</span></div>{job.description&&<p>{job.description}</p>}{job.photo_id&&<JobMedia src={`/api/job-media/${job.photo_id}`} alt="Foto, Video oder Sprachnachricht zum Auftrag" kind={mediaKindFromPath(job.photo_path)}/> }
</EHWorkSection>

    <div className={job.urgency==='emergency'?"ai-summary emergency-summary":"ai-summary"}><Sparkles/><div><strong>{job.urgency==='emergency'?'Wir suchen jetzt verfügbare Hilfe':'Einfach Hausen organisiert'}</strong><p>Richtpreis {job.budget_min&&job.budget_max?`${euro(job.budget_min)}–${euro(job.budget_max)}`:'wird ermittelt'}.</p></div></div>

    <SectionTitle>Vergleich</SectionTitle>
    {quotes.length===0?<EHEmptyState title="Angebote werden eingeholt" text="Einfach Hausen klärt Verfügbarkeit und Angebote mit passenden Partnern." />:<EHRecordList label="Angebote im Vergleich" items={quotes.map((q,index)=>({
      id:String(q.id),
      title:q.business_name,
      detail:[
        `✓ Vertragspartner · ${q.rating_count?`⭐ ${q.rating.toFixed(1)} (${q.rating_count})`:'Neu im Netzwerk'}`,
        q.message||'Angebot für den beschriebenen Leistungsumfang.',
        ...(job.urgency==='emergency'
          ? [`Hilfe: ${emergencyAvailability(q.available_at)}`,Number.isFinite(q.distance_km)?`Entfernung: ${q.distance_km.toFixed(1)} km`:'',`Zuschlag: ${q.emergency_markup_bps?`bis ${(q.emergency_markup_bps/100).toFixed(0)} %`:'kein hinterlegter Zuschlag'}`]
          : [q.available_at?`Verfügbar: ${dateLabel(q.available_at)}`:'Termin nach Abstimmung',Number.isFinite(q.distance_km)?`${q.distance_km.toFixed(1)} km`:'']),
        ...scopeNotes(q.message,job.description),
      ].filter(Boolean).join(' · '),
      value:euro(q.amount),
      status:<span className="quote-badges">{index===0&&<span className="recommend">EMPFEHLUNG</span>}{job.urgency==='emergency'&&q.emergency_mode==='24_7'&&<span className="emergency-quote-badge">24/7 NOTDIENST</span>}{job.urgency==='emergency'&&q.emergency_mode!=='24_7'&&<span className="emergency-quote-badge local">LOKAL VERFÜGBAR</span>}{q.amount===cheapest&&<span className="compare-badge">GÜNSTIGST</span>}{q.id===fastest&&<span className="compare-badge fast">SCHNELLSTER TERMIN</span>}</span>,
      action:<><Link className="btn ghost" href={`/app/partners/${q.provider_id}?job=${job.id}`} aria-label={`${q.business_name} — Profil ansehen`}>Profil ansehen</Link>{q.status==='pending'&&<form action={acceptQuoteAction.bind(null,q.id)}><SubmitButton className="btn primary" pendingLabel="Buchung läuft…">Diesen Partner buchen</SubmitButton></form>}{q.status==='accepted'&&<span className="accepted-label"><CheckCircle2/> Gebucht</span>}</>,
    }))} />}

    {accepted&&<>
      <SectionTitle>Dein persönlicher Ansprechpartner</SectionTitle>
      {contact?<EHPanel title="Ansprechpartner"><UserRound/><div className="grow"><strong>{contact.first_name} {contact.last_name}</strong><p>{contact.job_title||'Ansprechpartner'} · <Link className="inline-partner-link" href={`/app/partners/${accepted.provider_id}?job=${job.id}`}>{contact.business_name}</Link></p><small>Dieser Kontakt bleibt nach dem Auftrag in „Kontakte“ gespeichert.</small></div></EHPanel>:<EHEmptyState title="Partner weist Ansprechpartner zu" text="Nach der Buchung bekommst du einen konkreten Menschen beim ausführenden Unternehmen." />}
      {contact&&<><div className="direct-contact-actions"><Link className="btn primary" href={`/app/messages?contact=${contact.contact_user_id}`}><MessageSquare size={16}/>Nachricht</Link>{contact.phone&&<a className="btn ghost" href={`tel:${contact.phone}`}><Phone size={16}/>Anrufen</a>}<Link className="btn ghost" href={`/app/messages?contact=${contact.contact_user_id}`}><CalendarDays size={16}/>Termin abstimmen</Link></div>
        <div className="chat">{messages.map((m:any)=><div className={m.sender_id===u.id?'msg mine':'msg'} key={m.id}><small>{m.sender_id===u.id?'Du':contact.first_name}</small><p>{m.body}</p></div>)}<form action={sendMessageAction.bind(null,job.id,contact.contact_user_id)} className="chat-form"><label className="owner-visually-hidden" htmlFor={`service-job-message-${job.id}`}>Nachricht an {contact.first_name}</label><input id={`service-job-message-${job.id}`} name="body" aria-label={`Nachricht an ${contact.first_name}`} placeholder={`Nachricht an ${contact.first_name} …`} required/><SubmitButton pendingLabel="…"><span aria-hidden="true">↗</span><span className="owner-visually-hidden">Nachricht senden</span></SubmitButton></form></div></>}

      <SectionTitle>Abwicklung</SectionTitle><EHPanel title="Auftragswert bleibt beim Partner"><ShieldCheck /><div><strong>Auftragswert bleibt beim Partner</strong><p>{paid?.status==='paid'?'Bezahlt – Beleg liegt in deiner Hausakte.':accepted.stripe_onboarded?'Optional sichere Zahlung über Einfach Hausen. Die Plattform berechnet dem Partner 0 % Provision pro Auftrag.':'Zahlung wird direkt mit dem Partner abgestimmt.'}</p></div>{paid?.status!=='paid'&&accepted.stripe_onboarded&&<form action={createCheckoutAction.bind(null,job.id)}><SubmitButton className="btn dark" pendingLabel="Checkout wird gestartet…">{euro(accepted.amount)} zahlen</SubmitButton></form>}</EHPanel>

      {job.status==='accepted'&&paid?.status!=='paid'&&<form action={cancelJobAction.bind(null,job.id)} className="cancel-job-form"><SubmitButton className="btn ghost wide" pendingLabel="Wird storniert…">Auftrag stornieren</SubmitButton></form>}

      <SectionTitle>Wenn etwas nicht klappt</SectionTitle>{claim?<div className="claim-notice"><AlertTriangle/><div><strong>Servicefall · {statusLabel(claim.status)}</strong><p>{claim.description}</p>{claim.admin_note&&<small>Rückmeldung: {claim.admin_note}</small>}</div></div>:<form action={createClaimAction.bind(null,job.id)} className="claim-form"><div><strong>Zusätzliche Unterstützung nötig?</strong><p>Dein direkter Ansprechpartner ist für die Ausführung da. Wenn ein Problem festhängt, kann der Hausmeisterservice die Koordination übernehmen.</p></div><label>Was ist passiert?<textarea name="description" rows={4} minLength={20} placeholder="Beschreibe kurz, wo die Abstimmung festhängt." required/></label><button className="btn ghost"><AlertTriangle size={16}/>Hausmeister einschalten</button></form>}
    </>}

    {job.status==='completed'&&!review&&<><SectionTitle>Bewertung</SectionTitle><form action={reviewAction.bind(null,job.id)} className="review-card"><div className="stars"><Star/><Star/><Star/><Star/><Star/></div><label>Bewertung<select name="rating" defaultValue="5"><option value="5">5 – Sehr gut</option><option value="4">4 – Gut</option><option value="3">3 – Okay</option><option value="2">2 – Schwach</option><option value="1">1 – Schlecht</option></select></label><textarea name="comment" placeholder="Wie war die Ausführung?"/><button className="btn primary">Bewertung senden</button></form></>}
    </>} aside={<>
      <EHWorkSection title="Auftrag im Überblick">
        <EHRecordList label="Eckdaten des Auftrags" items={[
          { id: 'status', title: statusLabel(job.status), detail: 'Status' },
          { id: 'kategorie', title: job.category||'Ohne Bereich', detail: 'Bereich' },
          { id: 'ort', title: job.postcode||'Ohne PLZ', detail: 'Ort' },
          { id: 'termin', title: dateLabel(job.preferred_date), detail: 'Wunschtermin' },
          { id: 'richtpreis', title: job.budget_min&&job.budget_max?`${euro(job.budget_min)}–${euro(job.budget_max)}`:'wird ermittelt', detail: 'Richtpreis' },
        ]} />
      </EHWorkSection>
      <EHWorkSection title="Nächster Schritt">
        {paid?.status==='paid'
          ? <><EHText>Der Auftrag ist bezahlt. Der Beleg liegt in deiner Hausakte.</EHText><EHButton href="/app/documents" variant="secondary" arrow>Beleg ansehen</EHButton></>
          : accepted&&contact
            ? <><EHText>{`Stimme Termin und Details mit ${contact.first_name} ab.`}</EHText><EHButton href={`/app/messages?contact=${contact.contact_user_id}`} arrow>Nachricht schreiben</EHButton></>
            : accepted
              ? <EHText muted>Der Partner weist jetzt einen Ansprechpartner zu. Danach kannst du direkt schreiben oder anrufen.</EHText>
              : quotes.length>0
                ? <EHText muted>Vergleiche unten die Angebote und buche den Partner, der dir zusagt.</EHText>
                : <EHText muted>Einfach Hausen klärt Verfügbarkeit und Angebote mit passenden Partnern.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Dein Ansprechpartner">
        {contact?<EHRecordList label="Ansprechpartner" items={[
          { id: 'name', title: `${contact.first_name} ${contact.last_name}`, detail: contact.job_title||'Ansprechpartner' },
          { id: 'betrieb', title: contact.business_name, detail: 'Betrieb' },
          { id: 'telefon', title: contact.phone||'Keine Nummer hinterlegt', detail: 'Telefon' },
        ]} />:<EHText muted>Noch kein Ansprechpartner. Er wird benannt, sobald ein Partner den Auftrag übernimmt.</EHText>}
      </EHWorkSection>
    </>} />
  </AppShell>;
}
