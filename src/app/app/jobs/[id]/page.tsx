import { notFound } from 'next/navigation';
import { CalendarDays,CheckCircle2,MapPin,MessageSquare,Phone,ShieldCheck,UserRound } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { crumbs } from '@/components/nav-config';
import { JobMedia } from '@/components/job-media';
import { mediaKindFromPath } from '@/lib/intake-media';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { acceptQuoteAction,cancelJobAction,createCheckoutAction,createClaimAction,reviewAction,sendMessageAction,sendSavedContactMessageAction,turnContactIntoServiceAction } from '@/app/actions';
import { dateLabel,euro,statusLabel } from '@/lib/format';
import { getQuoteRecommendations } from '@/lib/orchestrator';
import { EHActions,EHButton,EHCallout,EHConversation,EHEmptyState,EHErrorState,EHField,EHFormFeedback,EHFormSection,EHInput,EHMetricsBar,EHPageHeader,EHRecordList,EHSelect,EHStatus,EHSubmitButton,EHText,EHTextarea,EHWorkflowForm,EHWorkflowStack,EHWorkSection,EHWorkspaceGrid } from '@/design-system';

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
    return <WerkbankRahmen role="homeowner" active="/app/jobs" breadcrumbs={crumbs('/app/jobs','Ansprechpartner')}>
      <EHWorkflowStack>
      <EHPageHeader title={job.title.replace(/^Ansprechpartner:\s*/,'')} context={[job.category,job.postcode].filter(Boolean).join(' · ')} actions={<EHStatus tone={contact?"success":"neutral"}>{contact?'Verbunden':'Ansprechpartner gesucht'}</EHStatus>} />
      <EHMetricsBar label="Ansprechpartner" items={[
        { id: 'partner', label: 'Angefragte Partner', value: dispatches.total||0, hint: 'regionale Betriebe' },
        { id: 'nachrichten', label: 'Nachrichten', value: messages.length, hint: contact ? 'im Verlauf' : 'noch keine' },
        { id: 'ort', label: 'Ort', value: job.postcode||'–' },
        { id: 'kontakt', label: 'Kontakt', value: contact ? 'Verbunden' : 'Wird gesucht' },
      ]} />
      <EHWorkspaceGrid main={<>
      <EHWorkSection title="Dein Anliegen">
        <EHRecordList label="Eckdaten des Anliegens" items={[
          { id: 'ort', title: job.postcode||'Ohne PLZ', detail: 'Ort', icon: <MapPin size={20} /> },
        ]} />
        {job.description&&<EHText>{job.description}</EHText>}
        {job.photo_id&&<JobMedia src={`/api/job-media/${job.photo_id}`} alt="Foto, Video oder Sprachnachricht zum Thema" kind={mediaKindFromPath(job.photo_path)}/>}
      </EHWorkSection>
      <EHCallout title="Du hast nur einen Ansprechpartner gewählt">
        <EHText muted>Es wurde noch kein Auftrag vergeben und kein Preis vereinbart.</EHText>
      </EHCallout>
      {!contact?<EHEmptyState title="Passender Ansprechpartner wird gesucht" text={`${dispatches.total||0} geprüfte regionale Partner wurden angefragt. Sobald ein Betrieb übernimmt, kannst du direkt schreiben oder anrufen.`} />:<>
        <EHWorkSection title="Dein persönlicher Ansprechpartner">
          <EHRecordList label="Ansprechpartner" items={[
            { id: 'name', title: `${contact.first_name} ${contact.last_name}`, detail: contact.job_title||'Ansprechpartner', icon: <UserRound size={20} /> },
            { id: 'betrieb', title: contact.business_name, detail: 'Betrieb', href: `/app/partners/${contact.provider_id}?job=${job.id}` },
            { id: 'telefon', title: contact.phone||'Keine Nummer hinterlegt', detail: 'Telefon', icon: <Phone size={20} /> },
          ]} />
          <EHText muted>Für Fragen direkt erreichbar. Daraus entsteht nicht automatisch ein Auftrag.</EHText>
          <EHActions>
            <EHButton href={`/app/messages?contact=${contact.contact_user_id}`}><MessageSquare size={16}/>Nachricht</EHButton>
            {contact.phone&&<EHButton href={`tel:${contact.phone}`} variant="secondary"><Phone size={16}/>Anrufen</EHButton>}
          </EHActions>
        </EHWorkSection>
        <EHWorkSection title="Verlauf">
          <EHConversation role="owner" name={`${contact.first_name} ${contact.last_name}`} detail={contact.business_name} phone={contact.phone||undefined}
            messages={messages.map((m:any)=>({ id: String(m.id), mine: m.sender_id===u.id, author: m.sender_id===u.id?'Du':contact.first_name, body: m.body }))}
            composer={<EHWorkflowForm action={sendSavedContactMessageAction.bind(null,contact.contact_user_id,u.id)}>
              <EHField id={`contact-job-message-${job.id}`} label={`Nachricht an ${contact.first_name}`} required>
                <EHInput id={`contact-job-message-${job.id}`} name="body" aria-label={`Nachricht an ${contact.first_name}`} placeholder={`Nachricht an ${contact.first_name} …`} required/>
              </EHField>
              <EHSubmitButton pendingLabel="Wird gesendet …">Nachricht senden</EHSubmitButton>
            </EHWorkflowForm>} />
        </EHWorkSection>
        <EHWorkSection title="Soll daraus doch ein Auftrag werden?">
          <EHText muted>Du entscheidest erst jetzt. Dann organisiert Einfach Hausen separat Termin und Angebote.</EHText>
          <EHWorkflowForm action={turnContactIntoServiceAction.bind(null,job.id)}>
            <EHSubmitButton pendingLabel="Wird organisiert…">Auftrag organisieren</EHSubmitButton>
          </EHWorkflowForm>
        </EHWorkSection>
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
      </EHWorkflowStack>
    </WerkbankRahmen>;
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

  return <WerkbankRahmen role="homeowner" active="/app/jobs" breadcrumbs={crumbs('/app/jobs','Auftrag')}>
    <EHWorkflowStack>
    <EHPageHeader title={job.title} context={[job.category,job.postcode].filter(Boolean).join(' · ')} actions={<><EHStatus tone="neutral">{statusLabel(job.status)}</EHStatus>{job.urgency==='emergency'&&<EHStatus tone="error">NOTFALL</EHStatus>}</>} />
    {sp.error&&<EHErrorState text={sp.error} />}{sp.cancelled==='1'&&<EHFormFeedback kind="success">Auftrag wurde storniert.</EHFormFeedback>}{sp.payment==='processing'&&<EHFormFeedback kind="success">Zahlung eingegangen. Der endgültige Status wird sicher über Stripe bestätigt.</EHFormFeedback>}{sp.payment==='unavailable'&&<EHErrorState text="Onlinezahlung ist derzeit nicht vollständig konfiguriert. Es wurde kein Zahlungsstatus geändert. Stimme die Zahlung direkt mit deinem Ansprechpartner ab oder versuche es später erneut." />}{sp.payment==='cancelled'&&<EHErrorState text="Zahlung wurde abgebrochen. Es wurde nichts belastet." />}
    <EHMetricsBar label="Stand deines Auftrags" items={[
      { id: 'angebote', label: 'Angebote', value: quotes.length, hint: cheapest!=null ? `ab ${euro(cheapest)}` : 'noch keine' },
      { id: 'partner', label: 'Angefragte Partner', value: dispatches.total||0, hint: `${dispatches.quoted||0} mit Angebot` },
      { id: 'termin', label: 'Wunschtermin', value: dateLabel(job.preferred_date) },
      { id: 'nachrichten', label: 'Nachrichten', value: messages.length, hint: contact ? 'mit deinem Ansprechpartner' : 'noch kein Kontakt' },
    ]} />
    <EHWorkspaceGrid main={<>
    <EHWorkSection title="Dein Auftrag">
      <EHRecordList label="Eckdaten des Auftrags" items={[
        { id: 'ort', title: job.postcode||'Ohne PLZ', detail: 'Ort', icon: <MapPin size={20} /> },
        { id: 'termin', title: dateLabel(job.preferred_date), detail: 'Wunschtermin', icon: <CalendarDays size={20} /> },
      ]} />
      {job.description&&<EHText>{job.description}</EHText>}
      {job.photo_id&&<JobMedia src={`/api/job-media/${job.photo_id}`} alt="Foto, Video oder Sprachnachricht zum Auftrag" kind={mediaKindFromPath(job.photo_path)}/>}
    </EHWorkSection>

    <EHCallout title={job.urgency==='emergency'?'Wir suchen jetzt verfügbare Hilfe':'Einfach Hausen organisiert'}>
      <EHText muted>Richtpreis {job.budget_min&&job.budget_max?`${euro(job.budget_min)}–${euro(job.budget_max)}`:'wird ermittelt'}.</EHText>
    </EHCallout>

    <EHWorkSection title="Vergleich">
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
      status:<>{q.status==='accepted'&&<EHStatus tone="success"><CheckCircle2 size={16}/> Gebucht</EHStatus>}{index===0&&<EHStatus tone="info">EMPFEHLUNG</EHStatus>}{job.urgency==='emergency'&&q.emergency_mode==='24_7'&&<EHStatus tone="warning">24/7 NOTDIENST</EHStatus>}{job.urgency==='emergency'&&q.emergency_mode!=='24_7'&&<EHStatus tone="neutral">LOKAL VERFÜGBAR</EHStatus>}{q.amount===cheapest&&<EHStatus tone="success">GÜNSTIGST</EHStatus>}{q.id===fastest&&<EHStatus tone="info">SCHNELLSTER TERMIN</EHStatus>}</>,
      action:<><EHButton href={`/app/partners/${q.provider_id}?job=${job.id}`} variant="secondary" aria-label={`${q.business_name} — Profil ansehen`}>Profil ansehen</EHButton>{q.status==='pending'&&<EHWorkflowForm action={acceptQuoteAction.bind(null,q.id)}><EHSubmitButton pendingLabel="Buchung läuft…">Diesen Partner buchen</EHSubmitButton></EHWorkflowForm>}</>,
    }))} />}
    </EHWorkSection>

    {accepted&&<>
      <EHWorkSection title="Dein persönlicher Ansprechpartner">
      {contact?<EHRecordList label="Ansprechpartner des Auftrags" items={[
        { id: 'name', title: `${contact.first_name} ${contact.last_name}`, detail: contact.job_title||'Ansprechpartner', icon: <UserRound size={20} /> },
        { id: 'betrieb', title: contact.business_name, detail: 'Betrieb', href: `/app/partners/${accepted.provider_id}?job=${job.id}` },
        { id: 'telefon', title: contact.phone||'Keine Nummer hinterlegt', detail: 'Telefon', icon: <Phone size={20} /> },
      ]} />:<EHEmptyState title="Partner weist Ansprechpartner zu" text="Nach der Buchung bekommst du einen konkreten Menschen beim ausführenden Unternehmen." />}
      {contact&&<>
        <EHText muted>Dieser Kontakt bleibt nach dem Auftrag in „Kontakte“ gespeichert.</EHText>
        <EHActions>
          <EHButton href={`/app/messages?contact=${contact.contact_user_id}`}><MessageSquare size={16}/>Nachricht</EHButton>
          {contact.phone&&<EHButton href={`tel:${contact.phone}`} variant="secondary"><Phone size={16}/>Anrufen</EHButton>}
          <EHButton href={`/app/messages?contact=${contact.contact_user_id}`} variant="secondary"><CalendarDays size={16}/>Termin abstimmen</EHButton>
        </EHActions>
      </>}
      </EHWorkSection>

      {contact&&<EHWorkSection title="Verlauf">
        <EHConversation role="owner" name={`${contact.first_name} ${contact.last_name}`} detail={contact.business_name} phone={contact.phone||undefined}
          messages={messages.map((m:any)=>({ id: String(m.id), mine: m.sender_id===u.id, author: m.sender_id===u.id?'Du':contact.first_name, body: m.body }))}
          composer={<EHWorkflowForm action={sendMessageAction.bind(null,job.id,contact.contact_user_id)}>
            <EHField id={`service-job-message-${job.id}`} label={`Nachricht an ${contact.first_name}`} required>
              <EHInput id={`service-job-message-${job.id}`} name="body" aria-label={`Nachricht an ${contact.first_name}`} placeholder={`Nachricht an ${contact.first_name} …`} required/>
            </EHField>
            <EHSubmitButton pendingLabel="Wird gesendet …">Nachricht senden</EHSubmitButton>
          </EHWorkflowForm>} />
      </EHWorkSection>}

      <EHWorkSection title="Abwicklung">
        <EHRecordList label="Abwicklung" items={[
          { id: 'zahlung', title: paid?.status==='paid'?'Bezahlt – Beleg liegt in deiner Hausakte.':accepted.stripe_onboarded?'Optional sichere Zahlung über Einfach Hausen. Die Plattform berechnet dem Partner 0 % Provision pro Auftrag.':'Zahlung wird direkt mit dem Partner abgestimmt.', detail: 'Auftragswert bleibt beim Partner', icon: <ShieldCheck size={20} /> },
        ]} />
        {paid?.status!=='paid'&&accepted.stripe_onboarded&&<EHWorkflowForm action={createCheckoutAction.bind(null,job.id)}><EHSubmitButton pendingLabel="Checkout wird gestartet…">{euro(accepted.amount)} zahlen</EHSubmitButton></EHWorkflowForm>}
      </EHWorkSection>

      {job.status==='accepted'&&paid?.status!=='paid'&&<EHWorkflowForm action={cancelJobAction.bind(null,job.id)}><EHSubmitButton pendingLabel="Wird storniert…">Auftrag stornieren</EHSubmitButton></EHWorkflowForm>}

      <EHWorkSection title="Wenn etwas nicht klappt">
        {claim?<EHCallout title={`Servicefall · ${statusLabel(claim.status)}`}>
          <EHText>{claim.description}</EHText>
          {claim.admin_note&&<EHText muted>Rückmeldung: {claim.admin_note}</EHText>}
        </EHCallout>:<EHWorkflowForm action={createClaimAction.bind(null,job.id)}>
          <EHFormSection title="Zusätzliche Unterstützung nötig?" description="Dein direkter Ansprechpartner ist für die Ausführung da. Wenn ein Problem festhängt, kann der Hausmeisterservice die Koordination übernehmen.">
            <EHField id={`claim-${job.id}`} label="Was ist passiert?" required>
              <EHTextarea id={`claim-${job.id}`} name="description" rows={4} minLength={20} placeholder="Beschreibe kurz, wo die Abstimmung festhängt." required/>
            </EHField>
            <EHSubmitButton pendingLabel="Wird gemeldet …">Hausmeister einschalten</EHSubmitButton>
          </EHFormSection>
        </EHWorkflowForm>}
      </EHWorkSection>
    </>}

    {job.status==='completed'&&!review&&<EHWorkSection title="Bewertung">
      <EHWorkflowForm action={reviewAction.bind(null,job.id)}>
        <EHFormSection title="Bewertung abgeben" description="Wie war die Ausführung?">
          <EHField id={`review-rating-${job.id}`} label="Bewertung" hint="Sternebewertung: 5 Sterne sind sehr gut, 1 Stern ist schlecht.">
            <EHSelect id={`review-rating-${job.id}`} name="rating" defaultValue="5" aria-label="Sternebewertung">
              <option value="5">5 – Sehr gut</option><option value="4">4 – Gut</option><option value="3">3 – Okay</option><option value="2">2 – Schwach</option><option value="1">1 – Schlecht</option>
            </EHSelect>
          </EHField>
          <EHField id={`review-comment-${job.id}`} label="Kommentar">
            <EHTextarea id={`review-comment-${job.id}`} name="comment" placeholder="Wie war die Ausführung?"/>
          </EHField>
          <EHSubmitButton pendingLabel="Bewertung wird gesendet …">Bewertung senden</EHSubmitButton>
        </EHFormSection>
      </EHWorkflowForm>
    </EHWorkSection>}
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
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
