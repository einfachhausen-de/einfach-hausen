import { db } from './db';
import { analyzeRequest, parseRequest } from './request-ai';
import { classifyLocally } from './ai-engine';
import { answerAssistant } from './assistant-service';

import { geocodePostcode, distanceKm, regionalPostcodeGeo } from './geocode';
import { structuredLog } from './observability';
import { berlinRequestTimestamp, classifyAvailabilityFreshness, emergencyAvailableAt, emergencyResponseScore, explainMatchScore, preferredRequestWindow, type MatchReason } from './matching';
import { resolveDispatchService, type DispatchService } from './dispatch-config';
import { providerSupportsService } from './provider-directory';
import { createNotification } from './notifications';
import { getProviderManagerIds } from './provider';
import { primaryProperty } from './properties';

// CEO-Audit R6c: ehrliche Fehler/Quota-Hinweise für /app/hausmeister.
// - 401: nicht angemeldet → Anmeldung erforderlich (requireUser, kein Entwurf-Verlust).
// - 402: Gratis-Kontingent aufgebraucht → BYOK oder Bonus (Entwurf bleibt erhalten).
// - 429: zu viele Anfragen → später erneut (Rate-Limit in actions, Entwurf bleibt erhalten).
// Bestehende 401/402/429-Semantik bleibt; Entwürfe werden bei Fehlern nie gelöscht.
export const HAUSMEISTER_LIMIT_HINTS = {
  unauthenticated: 'Bitte melde dich an, um den Hausmeister zu nutzen (401).',
  quotaExhausted: 'KI-Kontingent aufgebraucht (402). Lege einen eigenen API-Key an oder warte auf den nächsten Monat. Dein Entwurf bleibt erhalten.',
  rateLimited: 'Zu viele Anfragen (429). Bitte warte kurz und versuche es erneut. Dein Entwurf bleibt erhalten.',
} as const;
export type HausmeisterIntent='service'|'contact';
export type HausmeisterResult = { jobId:number; threadId:number; reply:string; providerCount:number; intent:HausmeisterIntent };
export type HausmeisterAnswer = { threadId:number; reply:string };

type ServiceRow=DispatchService&{estimate_min:number;estimate_max:number;requires_license:number};

function findService(text:string,parsedCategory:string):ServiceRow{
  const services=db.prepare('SELECT * FROM service_catalog WHERE active=1').all() as ServiceRow[];
  return resolveDispatchService(services,text,parsedCategory) as ServiceRow;
}

function getThread(userId:number,channel:'app'|'whatsapp'){
  let row=db.prepare('SELECT id FROM assistant_threads WHERE user_id=? AND channel=? ORDER BY updated_at DESC LIMIT 1').get(userId,channel) as {id:number}|undefined;
  if(!row){const r=db.prepare('INSERT INTO assistant_threads(user_id,channel) VALUES(?,?)').run(userId,channel);row={id:Number(r.lastInsertRowid)};}
  return row.id;
}

function addAgentMessage(threadId:number,role:'user'|'assistant'|'event',body:string,metadata:Record<string,unknown>={}){
  db.prepare('INSERT INTO assistant_messages(thread_id,role,body,metadata_json) VALUES(?,?,?,?)').run(threadId,role,body,JSON.stringify(metadata));
  db.prepare('UPDATE assistant_threads SET updated_at=CURRENT_TIMESTAMP WHERE id=?').run(threadId);
}

export function appendJobEvent(jobId:number,body:string,metadata:Record<string,unknown>={}){
  const thread=db.prepare('SELECT id FROM assistant_threads WHERE active_job_id=? ORDER BY updated_at DESC LIMIT 1').get(jobId) as {id:number}|undefined;
  if(thread)addAgentMessage(thread.id,'event',body,metadata);
}

/** KI-Chat: ein von der App abgelegtes Foto als Nutzer-Nachricht im App-
 *  Verlauf merken, damit der KI-Dienst die Zugaenglichkeit gegen den Owner
 *  pruefen kann (gleicher Pfad wie beim Hausmeister-Composer). */
export function recordAssistantChatPhoto(userId:number,caption:string,storedPath:string){
  const threadId=getThread(userId,'app');
  addAgentMessage(threadId,'user',caption||'Foto mitgesendet',{photo:storedPath});
  return {threadId};
}

export function recordHausmeisterDocumentUpload(userId:number,input:{documentId:number;name:string;question?:string;reply:string}){
  const threadId=getThread(userId,'app');
  const question=(input.question||'').trim();
  const body=question||`Dokument hochgeladen: ${input.name}`;
  addAgentMessage(threadId,'user',body,{documentId:input.documentId,documentName:input.name,houseDocument:true});
  addAgentMessage(threadId,'assistant',input.reply,{assistantOnly:true,documentId:input.documentId,documentProcessed:true});
  return {threadId,reply:input.reply};
}

async function dispatchJob(jobId:number,homeownerId:number,service:ServiceRow,jobPostcode:string,jobGeo:{lat:number;lon:number}|null,requestKind:HausmeisterIntent|'emergency'='service'){
  const partners=db.prepare(`SELECT p.*,c.status contract_status,c.insurance_verified,c.qualification_verified,c.contract_verified,c.quality_standard_verified,c.customer_discount_bps,c.response_target_minutes,pref.accepts_normal_jobs,pref.accepts_short_notice,pref.accepts_consultation,pref.accepts_emergencies,pref.emergency_mode,pref.emergency_markup_bps,pref.emergency_start,pref.emergency_end,pref.emergency_days,pref.updated_at pref_updated_at,
      (SELECT AVG((julianday(d2.responded_at)-julianday(d2.sent_at))*1440.0) FROM job_dispatches d2 WHERE d2.provider_id=p.user_id AND d2.responded_at IS NOT NULL AND d2.sent_at>=datetime('now','-90 days')) average_response_minutes,
      (SELECT COUNT(*) FROM job_dispatches d3 WHERE d3.provider_id=p.user_id AND d3.responded_at IS NOT NULL AND d3.sent_at>=datetime('now','-90 days')) response_samples,
      CASE WHEN ps.id IS NULL THEN free.monthly_lead_limit ELSE paid.monthly_lead_limit END monthly_lead_limit,
      CASE WHEN ps.id IS NULL THEN 'free' ELSE ps.plan_slug END partner_plan
    FROM provider_profiles p JOIN partner_contracts c ON c.provider_id=p.user_id
    LEFT JOIN provider_preferences pref ON pref.provider_id=p.user_id
    LEFT JOIN partner_subscriptions ps ON ps.provider_id=p.user_id AND ps.status IN ('active','trialing')
    LEFT JOIN partner_plans paid ON paid.slug=ps.plan_slug
    LEFT JOIN partner_plans free ON free.slug='free'
    WHERE p.verified=1 AND c.status='active'`).all() as any[];
  const preferredProviders=new Set((db.prepare('SELECT DISTINCT provider_id FROM homeowner_contacts WHERE homeowner_id=?').all(homeownerId) as Array<{provider_id:number}>).map(r=>r.provider_id));
  const jobTiming=db.prepare('SELECT preferred_date,preferred_time FROM jobs WHERE id=?').get(jobId) as {preferred_date:string|null;preferred_time:string|null}|undefined;
  const timingWindow=preferredRequestWindow({preferredDate:jobTiming?.preferred_date,preferredTime:jobTiming?.preferred_time});
  if(requestKind==='service'&&timingWindow.expired)return 0;
  const shortNotice=timingWindow.shortNotice;
  type Candidate={p:any;distance:number|null;score:number;reasons:MatchReason[]};
  const matches:Candidate[]=[];
  const traceInsert=db.prepare(`INSERT INTO match_decision_trace(job_id,provider_id,decision,reason_key,detail) VALUES(?,?,?,?,?)`);
  const exclude=(providerId:number,reasonKey:string,detail='')=>traceInsert.run(jobId,providerId,'excluded',reasonKey,detail);
  const jobPoint=jobGeo||regionalPostcodeGeo(jobPostcode);
  const alreadyDispatched=new Set((db.prepare('SELECT provider_id FROM job_dispatches WHERE job_id=?').all(jobId) as Array<{provider_id:number}>).map(row=>row.provider_id));
  for(const p of partners){
    if(alreadyDispatched.has(p.user_id)){exclude(p.user_id,'already_dispatched','bereits für diesen Auftrag angefragt');continue;}
    const offerings=(db.prepare(`SELECT service_slug FROM provider_service_offerings WHERE provider_id=? AND active=1`).all(p.user_id) as Array<{service_slug:string}>).map(r=>r.service_slug);
    if(!providerSupportsService(offerings,p.trades,service)){exclude(p.user_id,'unsupported_service',`Gewerke passt nicht zu ${service.title}`);continue;}
    if(requestKind==='contact'&&p.accepts_consultation===0){exclude(p.user_id,'consultation_off','Beratungen abgelehnt');continue;}
    if(requestKind==='service'&&p.accepts_normal_jobs===0){exclude(p.user_id,'normal_jobs_off','Aufträge abgelehnt');continue;}
    if(requestKind==='service'&&shortNotice&&p.accepts_short_notice===0){exclude(p.user_id,'short_notice_off','Kurzfristige Termine abgelehnt');continue;}
    if(requestKind==='emergency'&&(p.accepts_emergencies!==1||!emergencyAvailableAt({emergencyMode:p.emergency_mode,emergencyDays:p.emergency_days,emergencyStart:p.emergency_start,emergencyEnd:p.emergency_end}))){exclude(p.user_id,'emergency_off','Keine Notfall-Bereitschaft im Zeitfenster');continue;}
    if(Number.isFinite(p.monthly_lead_limit)){
      const used=(db.prepare(`SELECT COUNT(*) c FROM job_dispatches WHERE provider_id=? AND sent_at>=datetime('now','start of month')`).get(p.user_id) as {c:number}).c;
      if(used>=Number(p.monthly_lead_limit)){exclude(p.user_id,'lead_limit_reached',`Monatslimit ${used}/${p.monthly_lead_limit} erreicht`);continue;}
    }
    let distance:number|null=null;
    const providerPoint=Number.isFinite(p.lat)&&Number.isFinite(p.lon)?{lat:Number(p.lat),lon:Number(p.lon)}:regionalPostcodeGeo(String(p.postcode||''));
    if(jobPoint&&providerPoint)distance=distanceKm(jobPoint,providerPoint);
    if(distance!==null&&distance>p.radius_km){exclude(p.user_id,'out_of_radius',`${Math.round(distance)} km > Einsatzradius ${p.radius_km} km`);continue;}
    // If neither an exact nor a regional centroid can be resolved, fail closed for narrow-radius matching.
    if(distance===null&&Number(p.radius_km)<50){exclude(p.user_id,'no_geo_fail_closed',`Keine Geo-Auflösung bei Radius ${p.radius_km} km`);continue;}
    const quality=[p.insurance_verified,p.qualification_verified,p.contract_verified,p.quality_standard_verified].filter(Boolean).length;
    const openJobs=(db.prepare(`SELECT COUNT(*) c FROM job_dispatches d JOIN jobs j ON j.id=d.job_id WHERE d.provider_id=? AND d.status='accepted' AND j.status IN ('accepted','in_progress')`).get(p.user_id) as {c:number}).c;
    const emergencyScore=requestKind==='emergency'?emergencyResponseScore({averageResponseMinutes:p.average_response_minutes,responseSamples:p.response_samples,responseTargetMinutes:p.response_target_minutes,emergencyMode:p.emergency_mode}):0;
    const availabilityFreshness=classifyAvailabilityFreshness(p.pref_updated_at ?? p.updated_at);
    const explained=explainMatchScore({qualityVerified:quality,distanceKm:distance,rating:Number(p.rating)||0,existingRelationship:preferredProviders.has(p.user_id),openJobs,emergencyPoints:emergencyScore,availabilityFreshness});
    matches.push({p,distance,score:explained.score,reasons:explained.reasons});
  }
  matches.sort((a,b)=>b.score-a.score||((a.distance??Number.POSITIVE_INFINITY)-(b.distance??Number.POSITIVE_INFINITY))||Number(a.p.user_id)-Number(b.p.user_id));
  const insert=db.prepare(`INSERT OR IGNORE INTO job_dispatches(job_id,provider_id,status,match_score,distance_km,reasons_json) VALUES(?,?,'sent',?,?,?)`);
  let created=0;
  const limit=requestKind==='contact'?8:requestKind==='emergency'?12:30;
  for(const m of matches.slice(0,limit)){
    const result=insert.run(jobId,m.p.user_id,m.score,m.distance,JSON.stringify(m.reasons));
    if(result.changes){
      created++;
      traceInsert.run(jobId,m.p.user_id,'dispatched',m.reasons[0]?.key||'score',m.reasons.map(r=>`${r.key}:${r.points}`).join(' '));
      const title=requestKind==='contact'?'Neue Beratungsanfrage':requestKind==='emergency'?'🚨 Neue Notfallanfrage':'Neue passende Anfrage';
      const body=requestKind==='contact'?`Ein Eigentümer sucht einen fachlichen Ansprechpartner für ${service.title} in ${jobPostcode||'deiner Region'}. Kein Auftrag nötig.`:requestKind==='emergency'?`Dringende ${service.title}-Anfrage in ${jobPostcode||'deiner Region'}. Bitte nur annehmen, wenn du kurzfristig helfen kannst.`:`${service.title} in ${jobPostcode||'deiner Region'} wartet auf deine Rückmeldung.`;
      for(const managerId of getProviderManagerIds(m.p.user_id))createNotification(managerId,title,body,`/pro/jobs/${jobId}`,'dispatch');
    }
  }
  structuredLog.info('internal','job dispatch completed',{job_id:jobId,dispatched:created,request_kind:requestKind});
  return created;
}

export async function answerHausmeisterQuestion(userId:number,body:string,channel:'app'|'whatsapp'='app',photoPath?:string|null):Promise<HausmeisterAnswer>{
  const user=db.prepare(`SELECT u.id,u.first_name,h.postcode,h.address,h.house_type,h.build_year,h.living_area,h.plot_area FROM users u JOIN homeowner_profiles h ON h.user_id=u.id WHERE u.id=? AND u.role='homeowner'`).get(userId) as any;
  if(!user)throw new Error('Homeowner not found');
  const threadId=getThread(userId,channel);
  addAgentMessage(threadId,'user',body,photoPath?{photo:photoPath}:{});
  const history = (db.prepare("SELECT role,body content FROM assistant_messages WHERE thread_id=? AND role IN ('user','assistant') ORDER BY id DESC LIMIT 8").all(threadId) as Array<{role:'user'|'assistant';content:string}>).reverse();
  const result = await answerAssistant(userId, history, undefined, photoPath);
  const reply = result.reply;
  addAgentMessage(threadId,'assistant',reply,{assistantOnly:true,status:result.status,provider:result.provider,links:result.links});
  return {threadId,reply};
}

export async function createHausmeisterRequest(userId:number,body:string,channel:'app'|'whatsapp'='app',photoPath?:string|null,intent:HausmeisterIntent='service',recordUserMessage=true,threadIdOverride?:number):Promise<HausmeisterResult>{
  const user=db.prepare(`SELECT u.id,u.first_name,h.postcode,h.address,h.lat,h.lon FROM users u JOIN homeowner_profiles h ON h.user_id=u.id WHERE u.id=? AND u.role='homeowner'`).get(userId) as any;
  if(!user)throw new Error('Homeowner not found');
  const threadId=threadIdOverride??getThread(userId,channel);
  if(recordUserMessage)addAgentMessage(threadId,'user',body,photoPath?{photo:photoPath}:{});

  const draft=db.prepare('SELECT combined_text,photo_path,intent FROM assistant_drafts WHERE thread_id=?').get(threadId) as {combined_text:string;photo_path:string|null;intent:HausmeisterIntent}|undefined;
  const effectiveIntent=draft?.intent||intent;
  const combined=draft?`${draft.combined_text}\nErgänzung: ${body}`:body;
  const effectivePhoto=photoPath||draft?.photo_path||null;
  // Stage 1 first (EH T-0207): cloud analysis only when the local engine
  // says reasoning is needed. BYOK runs unmetered; freemium consumes quota.
  const localIntent=classifyLocally(combined);
  const useLocal=!localIntent.needsCloud&&localIntent.confidence>=0.5;
  const parsed=useLocal?parseRequest(combined):await analyzeRequest(combined);
  if(useLocal&&localIntent.serviceHint)parsed.category=localIntent.category;
  const service=findService(combined,parsed.category);
  const postcode=parsed.postcode||user.postcode||'';

  const hasLength=/\b\d+(?:[,.]\d+)?\s*(?:m|meter)\b/i.test(combined);
  let question:string|null=null;
  if(!postcode)question='Für welche Postleitzahl bzw. Adresse soll ich einen passenden regionalen Ansprechpartner suchen?';
  else if(effectiveIntent==='service'&&service.slug==='heckenschnitt'&&!hasLength)question='Wie lang ist die Hecke ungefähr? Eine grobe Angabe in Metern reicht.';
  else if(effectiveIntent==='service'&&!parsed.preferredDate)question='Wann soll die Arbeit ungefähr erledigt werden? Du kannst z. B. „nächsten Dienstag ab 14 Uhr“ schreiben.';
  else if(service.slug==='sonstiges'&&combined.replace(/\s+/g,' ').trim().length<18)question=effectiveIntent==='contact'?'Worum geht es ungefähr? Ein kurzer Satz reicht, damit ich den passenden fachlichen Ansprechpartner finde.':'Was genau soll an deinem Haus erledigt werden? Ein kurzer Satz reicht.';

  if(question){
    db.prepare(`INSERT INTO assistant_drafts(thread_id,combined_text,photo_path,intent,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(thread_id) DO UPDATE SET combined_text=excluded.combined_text,photo_path=COALESCE(excluded.photo_path,assistant_drafts.photo_path),intent=excluded.intent,updated_at=CURRENT_TIMESTAMP`).run(threadId,combined,effectivePhoto,effectiveIntent);
    addAgentMessage(threadId,'assistant',question,{clarification:true,service:service.slug,intent:effectiveIntent});
    return {jobId:0,threadId,reply:question,providerCount:0,intent:effectiveIntent};
  }

  let geo=Number.isFinite(user.lat)&&Number.isFinite(user.lon)?{lat:user.lat,lon:user.lon}:null;
  if(parsed.postcode||!geo) geo=await geocodePostcode(postcode);
  const min=effectiveIntent==='service'?(parsed.budgetMin?parsed.budgetMin*100:service.estimate_min):null;
  const max=effectiveIntent==='service'?(parsed.budgetMax?parsed.budgetMax*100:service.estimate_max):null;
  const baseTitle=service.slug==='sonstiges'?(parsed.title||service.title):service.title;
  const title=effectiveIntent==='contact'?`Ansprechpartner: ${baseTitle}`:baseTitle;
  const property=primaryProperty(userId);
  const result=db.prepare(`INSERT INTO jobs(homeowner_id,title,description,category,postcode,preferred_date,preferred_time,budget_min,budget_max,service_slug,source_channel,request_kind,lat,lon,property_id)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(userId,title,combined,service.category,postcode,effectiveIntent==='service'?parsed.preferredDate:null,effectiveIntent==='service'?parsed.preferredTime:null,min,max,service.slug,channel,effectiveIntent,geo?.lat??null,geo?.lon??null,property?.id??null);
  const jobId=Number(result.lastInsertRowid);
  if(effectivePhoto)db.prepare('INSERT INTO job_photos(job_id,path) VALUES(?,?)').run(jobId,effectivePhoto);
  db.prepare('DELETE FROM assistant_drafts WHERE thread_id=?').run(threadId);
  db.prepare('UPDATE assistant_threads SET active_job_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(jobId,threadId);

  const providerCount=await dispatchJob(jobId,userId,service,postcode,geo,effectiveIntent);
  const euro=(v:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v/100);
  let reply:string;
  if(effectiveIntent==='contact'){
    reply=providerCount>0
      ? `Alles klar. Ich suche dir jetzt einen passenden menschlichen Ansprechpartner für ${service.title}. Ich habe ${providerCount} geprüfte regionale Partner angefragt. Dafür wird noch kein Auftrag vergeben und kein Preis vereinbart. Sobald ein Betrieb übernimmt, kannst du direkt schreiben oder anrufen.`
      : `Alles klar. Ich habe deine Kontaktanfrage für ${service.title} angelegt. In deinem aktuellen Partnergebiet ist gerade kein freigegebener Betrieb automatisch verfügbar. Die Anfrage bleibt offen, bis ein passender Vertragspartner verfügbar ist.`;
  }else{
    const when=parsed.preferredDate?` für ${parsed.preferredDate}${parsed.preferredTime?` ab ${parsed.preferredTime} Uhr`:''}`:'';
    reply=providerCount>0
      ? `Alles klar. Ich habe ${service.title}${when} erkannt. Der Richtpreis liegt aktuell ungefähr bei ${euro(min!)}–${euro(max!)}. Ich habe ${providerCount} passende, vertraglich geprüfte Partner in deiner Region angefragt. Sobald Angebote eintreffen, vergleiche ich Preis, Termin, Entfernung und Qualität und zeige dir meine Empfehlung.`
      : `Alles klar. Ich habe ${service.title}${when} erkannt. Der Richtpreis liegt aktuell ungefähr bei ${euro(min!)}–${euro(max!)}. In deinem aktuellen Partnergebiet ist gerade kein freigegebener Betrieb automatisch verfügbar. Die Anfrage bleibt offen und wird im Partnernetzwerk sichtbar, sobald ein passender Vertragspartner freigeschaltet ist.`;
  }
  addAgentMessage(threadId,'assistant',reply,{jobId,service:service.slug,estimateMin:min,estimateMax:max,providerCount,intent:effectiveIntent});
  return {jobId,threadId,reply,providerCount,intent:effectiveIntent};
}

export async function createEmergencyRequest(userId:number,emergencyType:string,description:string){
  const user=db.prepare(`SELECT u.id,h.postcode,h.lat,h.lon FROM users u JOIN homeowner_profiles h ON h.user_id=u.id WHERE u.id=? AND u.role='homeowner'`).get(userId) as any;
  if(!user)throw new Error('Homeowner not found');
  const labels:Record<string,string>={water:'Wasserrohrbruch / Wasserschaden',heating:'Heizung ausgefallen',electric:'Stromproblem',roof:'Dach- oder Sturmschaden',lock:'Tür / Schloss',sanitary:'Sanitär-Notfall',other:'Sonstiger Notfall'};
  const label=labels[emergencyType]||labels.other; const combined=`${label}. ${description}`.trim(); const parsed=await analyzeRequest(combined); const service=findService(combined,parsed.category); const postcode=parsed.postcode||user.postcode||'';
  let geo=Number.isFinite(user.lat)&&Number.isFinite(user.lon)?{lat:user.lat,lon:user.lon}:null; if(!geo&&postcode)geo=await geocodePostcode(postcode);
  const property=primaryProperty(userId);
  const emergencyNow=berlinRequestTimestamp();
  const result=db.prepare(`INSERT INTO jobs(homeowner_id,title,description,category,postcode,preferred_date,preferred_time,budget_min,budget_max,service_slug,source_channel,request_kind,lat,lon,urgency,emergency_type,property_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'emergency',?,?)`).run(userId,`Notfall: ${label}`,combined,service.category,postcode,emergencyNow.date,emergencyNow.time,service.estimate_min,service.estimate_max,service.slug,'app','service',geo?.lat??null,geo?.lon??null,emergencyType,property?.id??null);
  const jobId=Number(result.lastInsertRowid); const providerCount=await dispatchJob(jobId,userId,service,postcode,geo,'emergency');
  createNotification(userId,'Notfallsuche gestartet',providerCount?`${providerCount} passende Helfer in deiner Region wurden sofort angefragt.`:'Aktuell ist kein freigegebener Notfallhelfer automatisch verfügbar. Dein Vorgang bleibt offen.',`/app/jobs/${jobId}`,'emergency');
  return {jobId,providerCount};
}

export async function redispatchOpenJobs(){
  const jobs=db.prepare(`SELECT * FROM jobs WHERE status IN ('open','quoted') ORDER BY created_at DESC LIMIT 200`).all() as any[];
  let created=0;
  for(const job of jobs){
    const requestKind=job.urgency==='emergency'?'emergency':job.request_kind==='contact'?'contact':'service';
    if(requestKind==='service'&&preferredRequestWindow({preferredDate:job.preferred_date,preferredTime:job.preferred_time}).expired)continue;
    const service=(job.service_slug?db.prepare('SELECT * FROM service_catalog WHERE slug=?').get(job.service_slug):null) as ServiceRow|undefined;
    const fallback=(db.prepare("SELECT * FROM service_catalog WHERE slug='sonstiges'").get()) as ServiceRow;
    const geo=Number.isFinite(job.lat)&&Number.isFinite(job.lon)?{lat:job.lat,lon:job.lon}:regionalPostcodeGeo(String(job.postcode||''));
    created+=await dispatchJob(job.id,job.homeowner_id,service||fallback,job.postcode,geo,requestKind);
  }
  return created;
}

export function getQuoteRecommendations(jobId:number){
  const rows=db.prepare(`SELECT q.*,p.business_name,p.rating,p.rating_count,p.verified,p.stripe_onboarded,d.distance_km,c.insurance_verified,c.qualification_verified,c.contract_verified,c.quality_standard_verified,c.customer_discount_bps,pref.accepts_emergencies,pref.emergency_mode,pref.emergency_markup_bps,pref.emergency_start,pref.emergency_end
    FROM quotes q JOIN provider_profiles p ON p.user_id=q.provider_id
    LEFT JOIN job_dispatches d ON d.job_id=q.job_id AND d.provider_id=q.provider_id
    LEFT JOIN partner_contracts c ON c.provider_id=q.provider_id
    LEFT JOIN provider_preferences pref ON pref.provider_id=q.provider_id
    WHERE q.job_id=? AND q.status IN ('pending','accepted') AND p.verified=1 AND c.status='active' ORDER BY q.amount ASC`).all(jobId) as any[];
  if(!rows.length)return [];
  const minAmount=Math.min(...rows.map(r=>r.amount));
  const now=Date.now();
  return rows.map(r=>{
    const priceScore=minAmount/r.amount*45;
    const quality=(Number(r.rating)||0)/5*25 + [r.insurance_verified,r.qualification_verified,r.contract_verified,r.quality_standard_verified].filter(Boolean).length*4;
    const distance=Number.isFinite(r.distance_km)?Math.max(0,15-Math.min(15,r.distance_km/2)):7;
    let availability=5;
    if(r.available_at){const hours=(new Date(r.available_at).getTime()-now)/3600000;availability=Math.max(0,15-Math.min(15,Math.max(0,hours)/24));}
    return {...r,recommendation_score:priceScore+quality+distance+availability};
  }).sort((a,b)=>b.recommendation_score-a.recommendation_score);
}
