import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays,CheckCircle2,MapPin,MessageSquare,Phone,ShieldCheck,UserRound } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt } from '@/components/werkbank-seite';
import { JobMedia } from '@/components/job-media';
import { mediaKindFromPath } from '@/lib/intake-media';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { acceptQuoteAction,bookQuoteAction,cancelJobAction,createCheckoutAction,createClaimAction,reviewAction,sendMessageAction,sendSavedContactMessageAction,turnContactIntoServiceAction } from '@/app/actions';
import { dateLabel,euro,statusLabel } from '@/lib/format';
import { ownerDate } from '@/lib/owner-format';
import { getQuoteRecommendations } from '@/lib/orchestrator';
import { offerCard } from '@/lib/offer-cards';
import { EHActivity, EHActions, EHButton, EHCallout, EHConversation, EHEmptyState, EHErrorState, EHField, EHFormFeedback, EHFormSection, EHInput, EHMetricsBar, EHRecommendation, EHRecordList, EHSelect, EHStatus, EHSubmitButton, EHText, EHTextarea, EHWorkflowForm, EHWorkflowStack, type EHActivityStep } from '@/design-system';

/**
 * Rechte Spalte und Kopf dieser Seite. Dieselben Token wie auf /app und /app/jobs:
 * Karten, Registerlinie, keine zweite Stilfamilie.
 */

function emergencyAvailability(value?:string|null){
  if(!value)return 'Zeit nach Rückmeldung';
  const timestamp=new Date(value).getTime();
  if(!Number.isFinite(timestamp))return dateLabel(value);
  const minutes=Math.max(0,Math.round((timestamp-Date.now())/60000));
  if(minutes<=5)return 'voraussichtlich sofort verfügbar';
  if(minutes<=180)return `voraussichtlich in ca. ${minutes} Min. verfügbar`;
  return `verfügbar ab ${dateLabel(value)}`;
}

// Gruende, aus denen ein Betrieb nicht angefragt wurde: das Protokoll der
// Vermittlung speichert Schluessel, hier bekommen sie Klartext.
const AUSSCHLUSS:Record<string,string> = {
  already_dispatched:'war schon angefragt', unsupported_service:'Gewerk passt nicht', consultation_off:'nimmt keine Beratungen an',
  normal_jobs_off:'nimmt keine Aufträge an', short_notice_off:'keine kurzfristigen Termine', emergency_off:'keine Notfall-Bereitschaft',
  lead_limit_reached:'Monatslimit erreicht', out_of_radius:'zu weit entfernt', no_geo_fail_closed:'Ort nicht prüfbar',
};

/**
 * Was fuer diesen Vorgang geschehen ist - aus dem Pruefprotokoll der Vermittlung
 * (`match_decision_trace`) und den Anfragen, nicht aus einer Schaetzung. Betriebe,
 * die nicht angefragt wurden, bleiben namenlos.
 */
function vermittlung(job:any,stand:{modus:'auftrag'|'kontakt';angefragt:number;geantwortet:number;angebote:number;guenstigst:number|null;kontakt:boolean}):EHActivityStep[]{
  const trace=db.prepare(`SELECT decision,reason_key,COUNT(*) anzahl,MIN(detail) beispiel FROM match_decision_trace WHERE job_id=? GROUP BY decision,reason_key ORDER BY anzahl DESC`).all(job.id) as Array<{decision:string;reason_key:string;anzahl:number;beispiel:string}>;
  const geprueft=trace.reduce((sum,zeile)=>sum+Number(zeile.anzahl),0);
  const ausgeschlossen=trace.filter(zeile=>zeile.decision==='excluded').slice(0,5).map(zeile=>`${zeile.anzahl}× ${AUSSCHLUSS[zeile.reason_key]||zeile.beispiel||zeile.reason_key}`);
  const beendet=['cancelled','completed'].includes(String(job.status));
  const kontaktweg=stand.modus==='kontakt';
  const betriebe=(anzahl:number)=>`${anzahl} ${anzahl===1?'Betrieb':'Betriebe'}`;
  return [
    { key:'anfrage', label:'Anfrage aufgenommen', state:'done', meta:ownerDate(job.created_at),
      details:[`Bereich: ${job.category||'ohne Angabe'}`,`Ort: ${job.postcode||'ohne PLZ'}`] },
    { key:'betriebe', label:'Passende Betriebe geprüft', state:geprueft?'done':'pending', meta:geprueft?betriebe(geprueft):'Noch keine Prüfung',
      details:geprueft?['Geprüft werden Betriebe im Netzwerk, die das Gewerk anbieten.',...ausgeschlossen]
        :['Sobald der Vorgang vorliegt, prüft Einfach Hausen Gewerk, Region und Verfügbarkeit.'] },
    { key:'anfragen', label:kontaktweg?'Kontaktbetriebe angefragt':'Betriebe angefragt', state:stand.angefragt?'done':'pending', meta:stand.angefragt?betriebe(stand.angefragt):'Noch keine Anfrage',
      details:stand.angefragt?[`${stand.geantwortet} von ${stand.angefragt} ${stand.angefragt===1?'hat':'haben'} geantwortet.`,'Namen zeigen wir erst, wenn ein Betrieb zusagt.']
        :['Aktuell passt kein Betrieb zu Gewerk und Region.'] },
    kontaktweg
      ? { key:'ergebnis', label:'Ansprechpartner verbunden', state:stand.kontakt?'done':'pending', meta:stand.kontakt?'Verbunden':'Wird gesucht',
          details:stand.kontakt?['Ein Betrieb hat den Kontakt übernommen.','Name und Telefon stehen oben auf dieser Seite.']
            :['Sobald ein Betrieb übernimmt, wird ein Ansprechpartner benannt.'] }
      : { key:'ergebnis', label:'Angebote eingegangen', state:stand.angebote?'done':'pending', meta:stand.angebote?`${stand.angebote} ${stand.angebote===1?'Angebot':'Angebote'}`:'Noch keins',
          details:stand.angebote?[stand.guenstigst!==null?`Günstigstes Angebot: ab ${euro(stand.guenstigst)}.`:'Den Preis findest du im Angebot.','Die Betriebe stehen unten im Vergleich.']
            :[beendet?'Zu diesem Vorgang wurde kein Angebot abgegeben.':'Einfach Hausen fragt bei den angefragten Betrieben nach.'] },
  ];
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
    const dispatches=db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status IN ('declined','quoted','accepted') THEN 1 ELSE 0 END) geantwortet FROM job_dispatches WHERE job_id=?`).get(job.id) as any;
    return <WerkbankRahmen role="homeowner" active="/app/jobs" rail={<>
        <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
        <div className="eh-werkbank-karte">
          <h4>Nächster Schritt</h4>
          {contact?<>
            <EHText>{`Schreib ${contact.first_name} direkt – daraus entsteht noch kein Auftrag.`}</EHText>
            <EHButton href={`/app/messages?contact=${contact.contact_user_id}`} arrow>Nachricht schreiben</EHButton>
            {contact.phone&&<EHButton href={`tel:${contact.phone}`} variant="secondary">Anrufen</EHButton>}
          </>:<EHText muted>{(dispatches.total||0)>0?`${dispatches.total} geprüfte Betriebe sind angefragt. Sobald einer übernimmt, kannst du direkt schreiben oder anrufen.`:'Es ist noch kein Betrieb angefragt.'}</EHText>}
        </div>
        <div className="eh-werkbank-karte">
          <h4>Dein Kontakt</h4>
          {contact?<>
            <div className="eh-werkbank-row"><span>Ansprechpartner</span><span>{`${contact.first_name} ${contact.last_name}`}</span></div>
            <div className="eh-werkbank-row"><span>Betrieb</span><Link href={`/app/partners/${contact.provider_id}?job=${job.id}`}>{contact.business_name}</Link></div>
            <div className="eh-werkbank-row"><span>Telefon</span><span>{contact.phone||'Keine Nummer hinterlegt'}</span></div>
            <div className="eh-werkbank-row"><span>E-Mail</span><span>{contact.email||'Keine Adresse hinterlegt'}</span></div>
          </>:<p className="eh-werkbank-leer">Ein persönlicher Ansprechpartner wird zugewiesen, sobald ein Betrieb übernimmt.</p>}
        </div>
        <div className="eh-werkbank-karte">
          <h4>Gut zu wissen</h4>
          <p className="eh-werkbank-leer">Du hast nur einen Ansprechpartner gewählt: kein Auftrag, kein Preis, keine Verpflichtung.</p>
        </div>
      </>}>
      
      <header className="eh-werkbank-kopf">
        <div className="eh-werkbank-kopf-copy">
          <h1>{job.title.replace(/^Ansprechpartner:\s*/,'')}</h1>
          <span>{[job.category,job.postcode].filter(Boolean).join(' · ')}</span>
        </div>
        <div className="eh-werkbank-kopf-tools">
          <EHStatus tone={contact?"success":"neutral"}>{contact?'Verbunden':'Ansprechpartner gesucht'}</EHStatus>
        </div>
      </header>
      <EHWorkflowStack>
      <EHMetricsBar label="Ansprechpartner" items={[
        { id: 'partner', label: 'Angefragte Partner', value: dispatches.total||0, hint: 'regionale Betriebe' },
        { id: 'nachrichten', label: 'Nachrichten', value: messages.length, hint: contact ? 'im Verlauf' : 'noch keine' },
        { id: 'ort', label: 'Ort', value: job.postcode||'–' },
        { id: 'kontakt', label: 'Kontakt', value: contact ? 'Verbunden' : 'Wird gesucht' },
      ]} />
      <>
      <WerkbankAbschnitt title="Dein Anliegen">
        <EHRecordList label="Eckdaten des Anliegens" items={[
          { id: 'ort', title: job.postcode||'Ohne PLZ', detail: 'Ort', icon: <MapPin size={20} /> },
        ]} />
        {job.description&&<EHText>{job.description}</EHText>}
        {job.photo_id&&<JobMedia src={`/api/job-media/${job.photo_id}`} alt="Foto, Video oder Sprachnachricht zum Thema" kind={mediaKindFromPath(job.photo_path)}/>}
      </WerkbankAbschnitt>
      <EHCallout title="Du hast nur einen Ansprechpartner gewählt">
        <EHText muted>Es wurde noch kein Auftrag vergeben und kein Preis vereinbart.</EHText>
      </EHCallout>
      <WerkbankAbschnitt title="Wie wir passende Betriebe gesucht haben">
        <EHActivity steps={vermittlung(job,{modus:'kontakt',angefragt:dispatches.total||0,geantwortet:dispatches.geantwortet||0,angebote:0,guenstigst:null,kontakt:Boolean(contact)})} />
        <EHText size="meta" muted>Angaben aus dem Prüfprotokoll der Vermittlung. Betriebe, die nicht angefragt wurden, bleiben namenlos.</EHText>
      </WerkbankAbschnitt>
      {!contact?<EHEmptyState title="Passender Ansprechpartner wird gesucht" text={`${dispatches.total||0} geprüfte regionale Partner wurden angefragt. Sobald ein Betrieb übernimmt, kannst du direkt schreiben oder anrufen.`} />:<>
        <WerkbankAbschnitt title="Dein persönlicher Ansprechpartner">
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
        </WerkbankAbschnitt>
        <WerkbankAbschnitt title="Verlauf">
          <EHConversation role="owner" name={`${contact.first_name} ${contact.last_name}`} detail={contact.business_name} phone={contact.phone||undefined}
            messages={messages.map((m:any)=>({ id: String(m.id), mine: m.sender_id===u.id, author: m.sender_id===u.id?'Du':contact.first_name, body: m.body }))}
            composer={<EHWorkflowForm action={sendSavedContactMessageAction.bind(null,contact.contact_user_id,u.id)}>
              <EHField id={`contact-job-message-${job.id}`} label={`Nachricht an ${contact.first_name}`} required>
                <EHInput id={`contact-job-message-${job.id}`} name="body" aria-label={`Nachricht an ${contact.first_name}`} placeholder={`Nachricht an ${contact.first_name} …`} required/>
              </EHField>
              <EHSubmitButton pendingLabel="Wird gesendet …">Nachricht senden</EHSubmitButton>
            </EHWorkflowForm>} />
        </WerkbankAbschnitt>
        <WerkbankAbschnitt title="Soll daraus doch ein Auftrag werden?">
          <EHText muted>Du entscheidest erst jetzt. Dann organisiert Einfach Hausen separat Termin und Angebote.</EHText>
          <EHWorkflowForm action={turnContactIntoServiceAction.bind(null,job.id)}>
            <EHSubmitButton pendingLabel="Wird organisiert…">Auftrag organisieren</EHSubmitButton>
          </EHWorkflowForm>
        </WerkbankAbschnitt>
      </>}
      </>
      </EHWorkflowStack>
    </WerkbankRahmen>;
  }
  const quotes=getQuoteRecommendations(job.id); const accepted=quotes.find(q=>q.status==='accepted');
  const paid=db.prepare(`SELECT status FROM payments WHERE job_id=? ORDER BY id DESC LIMIT 1`).get(job.id) as any;
  const review=db.prepare('SELECT * FROM reviews WHERE job_id=?').get(job.id) as any;
  const claim=accepted?db.prepare('SELECT * FROM claims WHERE job_id=?').get(job.id) as any:null;
  const contact=accepted?db.prepare(`SELECT a.provider_id,a.contact_user_id,u.first_name,u.last_name,u.phone,u.email,m.job_title,p.business_name FROM job_assignments a JOIN users u ON u.id=a.contact_user_id JOIN provider_members m ON m.user_id=a.contact_user_id JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.job_id=?`).get(job.id) as any:null;
  const messages=contact?db.prepare('SELECT * FROM contact_messages WHERE homeowner_id=? AND contact_user_id=? ORDER BY created_at').all(u.id,contact.contact_user_id) as any[]:[];
  const dispatches=db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='quoted' THEN 1 ELSE 0 END) quoted,SUM(CASE WHEN status IN ('declined','quoted','accepted') THEN 1 ELSE 0 END) geantwortet FROM job_dispatches WHERE job_id=?`).get(job.id) as any;
  const cheapest=quotes.length?Math.min(...quotes.map(q=>q.amount)):null;
  // Offene Angebote als Entscheidungskarte; null, sobald gebucht oder keins offen ist.
  const angebotsKarte=offerCard(u.id,job.id);
  const available=quotes.filter(q=>q.available_at).sort((a,b)=>new Date(a.available_at).getTime()-new Date(b.available_at).getTime()); const fastest=available[0]?.id;

  return <WerkbankRahmen role="homeowner" active="/app/jobs" rail={<>
      <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
      <div className="eh-werkbank-karte">
        <h4>Auftrag im Überblick</h4>
        <div className="eh-werkbank-row"><span>Status</span><span>{statusLabel(job.status)}</span></div>
        <div className="eh-werkbank-row"><span>Bereich</span><span>{job.category||'Ohne Bereich'}</span></div>
        <div className="eh-werkbank-row"><span>Ort</span><span>{job.postcode||'Ohne PLZ'}</span></div>
        <div className="eh-werkbank-row"><span>Wunschtermin</span><span>{dateLabel(job.preferred_date)}</span></div>
        <div className="eh-werkbank-row"><span>Richtpreis</span><span>{job.budget_min&&job.budget_max?`${euro(job.budget_min)}–${euro(job.budget_max)}`:'wird ermittelt'}</span></div>
      </div>
      <div className="eh-werkbank-karte">
        <h4>Nächster Schritt</h4>
        {paid?.status==='paid'
          ? <><EHText>Der Auftrag ist bezahlt. Der Beleg liegt in deiner Hausakte.</EHText><EHButton href="/app/documents" variant="secondary" arrow>Beleg ansehen</EHButton></>
          : accepted&&contact
            ? <><EHText>{`Stimme Termin und Details mit ${contact.first_name} ab.`}</EHText><EHButton href={`/app/messages?contact=${contact.contact_user_id}`} arrow>Nachricht schreiben</EHButton></>
            : accepted
              ? <EHText muted>Der Partner weist jetzt einen Ansprechpartner zu. Danach kannst du direkt schreiben oder anrufen.</EHText>
              : quotes.length>0
                ? <EHText muted>Vergleiche unten die Angebote und buche den Partner, der dir zusagt.</EHText>
                : <EHText muted>Einfach Hausen klärt Verfügbarkeit und Angebote mit passenden Partnern.</EHText>}
      </div>
      <div className="eh-werkbank-karte">
        <h4>Dein Ansprechpartner</h4>
        {contact?<>
          <div className="eh-werkbank-row"><span>Ansprechpartner</span><span>{`${contact.first_name} ${contact.last_name}`}</span></div>
          <div className="eh-werkbank-row"><span>Betrieb</span><span>{contact.business_name}</span></div>
          <div className="eh-werkbank-row"><span>Telefon</span><span>{contact.phone||'Keine Nummer hinterlegt'}</span></div>
        </>:<p className="eh-werkbank-leer">Noch kein Ansprechpartner. Er wird benannt, sobald ein Partner den Auftrag übernimmt.</p>}
      </div>
    </>}>
    
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>{job.title}</h1>
        <span>{[job.category,job.postcode].filter(Boolean).join(' · ')}</span>
      </div>
      <div className="eh-werkbank-kopf-tools">
        <EHStatus tone="neutral">{statusLabel(job.status)}</EHStatus>
        {job.urgency==='emergency'&&<EHStatus tone="error">NOTFALL</EHStatus>}
      </div>
    </header>
    <EHWorkflowStack>
    {sp.error&&<EHErrorState text={sp.error} />}{sp.cancelled==='1'&&<EHFormFeedback kind="success">Auftrag wurde storniert.</EHFormFeedback>}{sp.payment==='processing'&&<EHFormFeedback kind="success">Zahlung eingegangen. Der endgültige Status wird sicher über Stripe bestätigt.</EHFormFeedback>}{sp.payment==='unavailable'&&<EHErrorState text="Onlinezahlung ist derzeit nicht vollständig konfiguriert. Es wurde kein Zahlungsstatus geändert. Stimme die Zahlung direkt mit deinem Ansprechpartner ab oder versuche es später erneut." />}{sp.payment==='cancelled'&&<EHErrorState text="Zahlung wurde abgebrochen. Es wurde nichts belastet." />}
    <EHMetricsBar label="Stand deines Auftrags" items={[
      { id: 'angebote', label: 'Angebote', value: quotes.length, hint: cheapest!=null ? `ab ${euro(cheapest)}` : 'noch keine' },
      { id: 'partner', label: 'Angefragte Partner', value: dispatches.total||0, hint: `${dispatches.quoted||0} mit Angebot` },
      { id: 'termin', label: 'Wunschtermin', value: dateLabel(job.preferred_date) },
      { id: 'nachrichten', label: 'Nachrichten', value: messages.length, hint: contact ? 'mit deinem Ansprechpartner' : 'noch kein Kontakt' },
    ]} />
    <>
    <WerkbankAbschnitt title="Dein Auftrag">
      <EHRecordList label="Eckdaten des Auftrags" items={[
        { id: 'ort', title: job.postcode||'Ohne PLZ', detail: 'Ort', icon: <MapPin size={20} /> },
        { id: 'termin', title: dateLabel(job.preferred_date), detail: 'Wunschtermin', icon: <CalendarDays size={20} /> },
      ]} />
      {job.description&&<EHText>{job.description}</EHText>}
      {job.photo_id&&<JobMedia src={`/api/job-media/${job.photo_id}`} alt="Foto, Video oder Sprachnachricht zum Auftrag" kind={mediaKindFromPath(job.photo_path)}/>}
    </WerkbankAbschnitt>

    <EHCallout title={job.urgency==='emergency'?'Wir suchen jetzt verfügbare Hilfe':'Einfach Hausen organisiert'}>
      <EHText muted>Richtpreis {job.budget_min&&job.budget_max?`${euro(job.budget_min)}–${euro(job.budget_max)}`:'wird ermittelt'}.</EHText>
    </EHCallout>

    <WerkbankAbschnitt title="Wie wir passende Betriebe gesucht haben">
      <EHActivity steps={vermittlung(job,{modus:'auftrag',angefragt:dispatches.total||0,geantwortet:dispatches.geantwortet||0,angebote:quotes.length,guenstigst:cheapest,kontakt:Boolean(contact)})} />
      <EHText size="meta" muted>Angaben aus dem Prüfprotokoll der Vermittlung. Betriebe, die nicht angefragt wurden, bleiben namenlos.</EHText>
    </WerkbankAbschnitt>

    <WerkbankAbschnitt title="Vergleich">
    {angebotsKarte&&<EHRecommendation question={angebotsKarte.question} subject={angebotsKarte.subject} options={angebotsKarte.options} onPrimary={bookQuoteAction} />}
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
    </WerkbankAbschnitt>

    {accepted&&<>
      <WerkbankAbschnitt title="Dein persönlicher Ansprechpartner">
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
      </WerkbankAbschnitt>

      {contact&&<WerkbankAbschnitt title="Verlauf">
        <EHConversation role="owner" name={`${contact.first_name} ${contact.last_name}`} detail={contact.business_name} phone={contact.phone||undefined}
          messages={messages.map((m:any)=>({ id: String(m.id), mine: m.sender_id===u.id, author: m.sender_id===u.id?'Du':contact.first_name, body: m.body }))}
          composer={<EHWorkflowForm action={sendMessageAction.bind(null,job.id,contact.contact_user_id)}>
            <EHField id={`service-job-message-${job.id}`} label={`Nachricht an ${contact.first_name}`} required>
              <EHInput id={`service-job-message-${job.id}`} name="body" aria-label={`Nachricht an ${contact.first_name}`} placeholder={`Nachricht an ${contact.first_name} …`} required/>
            </EHField>
            <EHSubmitButton pendingLabel="Wird gesendet …">Nachricht senden</EHSubmitButton>
          </EHWorkflowForm>} />
      </WerkbankAbschnitt>}

      <WerkbankAbschnitt title="Abwicklung">
        <EHRecordList label="Abwicklung" items={[
          { id: 'zahlung', title: paid?.status==='paid'?'Bezahlt – Beleg liegt in deiner Hausakte.':accepted.stripe_onboarded?'Optional sichere Zahlung über Einfach Hausen. Die Plattform berechnet dem Partner 0 % Provision pro Auftrag.':'Zahlung wird direkt mit dem Partner abgestimmt.', detail: 'Auftragswert bleibt beim Partner', icon: <ShieldCheck size={20} /> },
        ]} />
        {paid?.status!=='paid'&&accepted.stripe_onboarded&&<EHWorkflowForm action={createCheckoutAction.bind(null,job.id)}><EHSubmitButton pendingLabel="Checkout wird gestartet…">{euro(accepted.amount)} zahlen</EHSubmitButton></EHWorkflowForm>}
      </WerkbankAbschnitt>

      {job.status==='accepted'&&paid?.status!=='paid'&&<EHWorkflowForm action={cancelJobAction.bind(null,job.id)}><EHSubmitButton pendingLabel="Wird storniert…">Auftrag stornieren</EHSubmitButton></EHWorkflowForm>}

      <WerkbankAbschnitt title="Wenn etwas nicht klappt">
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
      </WerkbankAbschnitt>
    </>}

    {job.status==='completed'&&!review&&<WerkbankAbschnitt title="Bewertung">
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
    </WerkbankAbschnitt>}
    </>
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
