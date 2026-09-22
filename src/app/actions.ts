'use server';

import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import Stripe from 'stripe';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { authMode, createSession, destroySession, requireUser, supabaseAdmin, establishSupabaseSession } from '@/lib/auth';
import { adminPasswordMatches, createAdminSession, destroyAdminSession, requireAdmin } from '@/lib/admin-auth';
import { createNotification } from '@/lib/notifications';
import { geocodePostcode } from '@/lib/geocode';
import { answerHausmeisterQuestion, appendJobEvent, createEmergencyRequest, createHausmeisterRequest, redispatchOpenJobs, type HausmeisterIntent } from '@/lib/orchestrator';
import { canAccessProviderJob, getProviderContext, getProviderManagerIds } from '@/lib/provider';
import { nextInvoiceNumber } from '@/lib/invoices';
import { normalizeContactCategory } from '@/lib/contact-categories';
import { savePrivateMediaUpload } from '@/lib/intake-media';
import { privateRoot } from '@/lib/security/private-files';
import { completeMaintenanceAndScheduleNext, ensureAssetMaintenance, ensureCompletedWorkMaintenance, ensureMaintenanceTask } from '@/lib/maintenance';
import { createPropertyForOwner, primaryProperty, propertyOwnedBy, syncPropertyFromLegacyProfile } from '@/lib/properties';
import { createBrokerMatches } from '@/lib/broker-matching';
import { isContractKind, isCostInterval } from '@/lib/contracts';
import { enqueueDocumentIntelligence } from '@/lib/document-intelligence';
import { headers } from 'next/headers';
import { checkRateLimit, consumeRateLimitAttempt, applyRateLimitLockout, rateLimitBlockedEvent, recordRateLimitFailure, recordRateLimitSuccess } from '@/lib/security/rate-limit';
import { logAdminAudit, logSecurityEvent } from '@/lib/security/audit';
import { DEMO_LOGIN_ENABLED, DEMO_PASSWORD, demoEmailFor, isDemoEmail } from '@/lib/demo-accounts';
import { ensureLocalDemoAccounts } from '@/lib/ensure-local-demo-accounts';
import { safeNextPath } from '@/lib/safe-redirect';
import {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  providerMemberSchema,
  intakeDescriptionSchema,
  verificationDecisionSchema,
  claimStatusSchema,
  partnerContractSchema,
  quoteSchema,
  invoiceSchema,
  emergencyTypeSchema,
} from '@/lib/security/schemas';

// Constant bcrypt digest of random material: comparing against it for unknown
// accounts keeps response timing independent of account existence.
const DUMMY_PASSWORD_HASH = '$2b$12$VewcCr68WsM1v4sD7Ot47uLqRUkRC3CSJFtnhMGlvkMQfCxOREUHG';

function text(fd: FormData, key: string) { return String(fd.get(key) ?? '').trim(); }
function int(fd: FormData, key: string) { const n = Number(fd.get(key)); return Number.isFinite(n) ? n : null; }

type HomeownerServiceAction = 'consultation' | 'hausmeister_route' | 'insurance_support';
const HOMEOWNER_SERVICE_WINDOW_MS = 15 * 60_000;

function consumeHomeownerServiceLimit(action: HomeownerServiceAction, userId: number, maxAttempts = 8) {
  const kind = 'homeowner_service';
  const identifier = `${action}:${userId}`;
  const now = Date.now();
  try {
    const verdict = db.transaction(() => {
      const row = db.prepare('SELECT attempts,window_start_at,blocked_until FROM auth_rate_limits WHERE kind=? AND identifier=?').get(kind, identifier) as {attempts:number;window_start_at:string;blocked_until:string|null}|undefined;
      if (row?.blocked_until) {
        const blockedUntil = new Date(row.blocked_until).getTime();
        if (!Number.isFinite(blockedUntil)) return { allowed: false, retryAfterSeconds: 30 };
        if (blockedUntil > now) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil - now) / 1000)) };
      }
      const windowStart = row ? new Date(row.window_start_at).getTime() : Number.NaN;
      const fresh = row && Number.isFinite(windowStart) && now - windowStart <= HOMEOWNER_SERVICE_WINDOW_MS;
      const attempts = fresh ? row.attempts + 1 : 1;
      const blocked = attempts > maxAttempts;
      const blockedUntil = blocked ? new Date(now + HOMEOWNER_SERVICE_WINDOW_MS).toISOString() : null;
      const windowIso = fresh ? row.window_start_at : new Date(now).toISOString();
      db.prepare(`INSERT INTO auth_rate_limits(kind,identifier,attempts,window_start_at,blocked_until,updated_at)
        VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(kind,identifier) DO UPDATE SET attempts=excluded.attempts,window_start_at=excluded.window_start_at,blocked_until=excluded.blocked_until,updated_at=CURRENT_TIMESTAMP`)
        .run(kind, identifier, attempts, windowIso, blockedUntil);
      return blocked
        ? { allowed: false, retryAfterSeconds: Math.ceil(HOMEOWNER_SERVICE_WINDOW_MS / 1000) }
        : { allowed: true, retryAfterSeconds: 0 };
    }).immediate();
    if (!verdict.allowed) logSecurityEvent('rate_limit_blocked_request', `${kind}:${identifier}`, `retry_after_s=${verdict.retryAfterSeconds}`);
    return verdict;
  } catch {
    logSecurityEvent('security_validation_reject', `${kind}:${identifier}`, 'rate_limit_state_error');
    return { allowed: false, retryAfterSeconds: 30 };
  }
}

// The last XFF hop is the only entry a directly connected trusted proxy adds;
// leftmost values are client-controlled. Deployment must ensure the edge proxy
// overwrites/appends X-Forwarded-For and blocks direct origin access.
async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for')?.split(',').map(s => s.trim()).filter(Boolean);
    return (forwarded?.length ? forwarded[forwarded.length - 1] : h.get('x-real-ip') || 'local').slice(0, 200);
  } catch { return 'local'; }
}

export async function registerAction(fd: FormData): Promise<{ error: string } | { redirectTo: string }> {
  const ip = await clientIp();
  const limit = checkRateLimit('register', ip);
  if (!limit.allowed) { rateLimitBlockedEvent('register', ip, limit.retryAfterSeconds); return { error: 'Zu viele Versuche. Bitte später erneut versuchen' }; }
  const parsed = registerSchema.safeParse({
    role: text(fd,'role'), email: text(fd,'email'), password: String(fd.get('password') ?? '').trim(),
    firstName: text(fd,'firstName'), lastName: text(fd,'lastName'), phone: text(fd,'phone'),
    postcode: text(fd,'postcode'), address: text(fd,'address'),
    businessName: text(fd,'businessName'), trades: text(fd,'trades'), radius: int(fd,'radius') ?? 25,
    description: text(fd,'description'), streetAddress: text(fd,'streetAddress'),
    emergencyMode: text(fd,'emergencyMode'), emergencyStart: text(fd,'emergencyStart') || '18:00', emergencyEnd: text(fd,'emergencyEnd') || '22:00',
    emergencyMarkup: int(fd,'emergencyMarkup') ?? 0, openingHours: text(fd,'openingHours'), bookableHours: text(fd,'bookableHours'),
  });
  if (!parsed.success) { recordRateLimitFailure('register', ip); logSecurityEvent('security_validation_reject', 'register', `fields=${parsed.error.issues.length}`); return { error: 'Bitte alle Pflichtfelder ausfüllen' }; }
  const { role, email, password, firstName: first, lastName: last } = parsed.data;
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) { recordRateLimitFailure('register', ip); logSecurityEvent('security_validation_reject', 'register', 'duplicate_email'); return { error: 'Konto existiert bereits' }; }
  const d = parsed.data;
  const emergencyDays=fd.getAll('emergencyDay').map(String).filter(v=>/^[0-6]$/.test(v)).join(',')||'1,2,3,4,5';
  const logoFile=fd.get('logo'); const logoPath=role==='provider'&&logoFile instanceof File&&logoFile.size?await savePublicImageUpload(logoFile):null;
  // Identity authority first (fail-closed): the Supabase identity is created
  // before any application state exists. The app row binds to the verified
  // subject explicitly (T-0168 identity-mapping rule); bcrypt material stays
  // only so the local-dev auth fallback can share the same accounts.
  const admin = supabaseAdmin();
  if (!admin) {
    logSecurityEvent('security_validation_reject', 'register', 'supabase_admin_unavailable');
    return { error: 'Registrierung aktuell nicht verfügbar' };
  }
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role }, // informational only; never authorizes
  });
  if (created.error || !created.data?.user) {
    const reason = created.error?.message ?? 'unknown';
    logSecurityEvent('auth_register_fail', email, `supabase_create=${reason.slice(0, 120)}`);
    return { error: 'Registrierung fehlgeschlagen. Existiert die E-Mail bereits?' };
  }
  const authSubject = created.data.user.id as string;
  const hash = await bcrypt.hash(password, 12);
  const tx = db.transaction(() => {
    const r = db.prepare('INSERT INTO users(email,password_hash,role,first_name,last_name,phone,auth_subject) VALUES(?,?,?,?,?,?,?)').run(email,hash,role,first,last,d.phone||null,authSubject);
    // Hauseigentuemer nutzen einfachhausen kostenlos. Es gibt keine
    // Eigentuemer-Mitgliedschaft und damit auch keine Pilot-Kohorte mit
    // Preisvorteil mehr; bei der Registrierung wird kein Rabattbezug angelegt.
    const id = Number(r.lastInsertRowid);
    if (role==='homeowner') db.prepare('INSERT INTO homeowner_profiles(user_id,postcode,address,onboarding_step) VALUES(?,?,?,\'profile\')').run(id,d.postcode,d.address);
    else {
      db.prepare('INSERT INTO provider_profiles(user_id,business_name,trades,postcode,radius_km,description,street_address,logo_path) VALUES(?,?,?,?,?,?,?,?)').run(id,d.businessName || `${first} ${last}`,d.trades,d.postcode,d.radius,d.description,d.streetAddress,logoPath);
      db.prepare("INSERT INTO partner_contracts(provider_id,status,commission_bps) VALUES(?,'pending',0)").run(id);
      db.prepare("INSERT INTO provider_members(provider_id,user_id,job_title,can_manage_jobs,active) VALUES(?,?,'Geschäftsführung',1,1)").run(id,id);
      db.prepare(`INSERT INTO provider_preferences(provider_id,accepts_normal_jobs,accepts_short_notice,accepts_consultation,accepts_emergencies,emergency_mode,emergency_start,emergency_end,emergency_days,emergency_markup_bps,opening_hours_text,bookable_hours_text,instant_booking) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,1,fd.get('acceptsShortNotice')?1:0,fd.get('acceptsConsultation')?1:0,fd.get('acceptsEmergencies')?1:0,d.emergencyMode==='24_7'?'24_7':'local',d.emergencyStart,d.emergencyEnd,emergencyDays,d.emergencyMarkup*100,d.openingHours,d.bookableHours,fd.get('instantBooking')?1:0);
    }
    return id;
  });
  const id = tx();
  recordRateLimitSuccess('register', ip);
  logSecurityEvent('auth_register', email);
  const postcode=d.postcode; const geo=await geocodePostcode(postcode);
  if(geo){const table=role==='provider'?'provider_profiles':'homeowner_profiles';db.prepare(`UPDATE ${table} SET lat=?,lon=? WHERE user_id=?`).run(geo.lat,geo.lon,id);}
  if(role==='homeowner'){
    createPropertyForOwner(id,{address:d.address,postcode,lat:geo?.lat??null,lon:geo?.lon??null});
  }else{
    const availableCategories=new Set((db.prepare(`SELECT slug FROM provider_categories WHERE active=1`).all() as Array<{slug:string}>).map(r=>r.slug));
    const selectedCategories=fd.getAll('providerCategory').map(String).filter(slug=>availableCategories.has(slug));
    const categories=selectedCategories.length?selectedCategories:['handwerk'];
    const addCategory=db.prepare(`INSERT OR IGNORE INTO provider_category_assignments(provider_id,category_slug) VALUES(?,?)`); for(const slug of categories)addCategory.run(id,slug);
    const availableServices=new Set((db.prepare(`SELECT slug FROM service_catalog WHERE active=1`).all() as Array<{slug:string}>).map(r=>r.slug));
    const selectedServices=fd.getAll('serviceSlug').map(String).filter(slug=>availableServices.has(slug));
    const addService=db.prepare(`INSERT OR IGNORE INTO provider_service_offerings(provider_id,service_slug,active) VALUES(?,?,1)`); for(const slug of selectedServices)addService.run(id,slug);
    if(categories.includes('makler'))db.prepare(`INSERT OR IGNORE INTO broker_search_profiles(provider_id,regions_text) VALUES(?,?)`).run(id,postcode);
    const invites=db.prepare(`SELECT * FROM provider_invites WHERE lower(email)=lower(?) AND status='pending'`).all(email) as any[];
    for(const invite of invites){db.prepare(`UPDATE provider_invites SET status='linked',linked_provider_id=?,linked_at=CURRENT_TIMESTAMP WHERE id=?`).run(id,invite.id);db.prepare(`INSERT OR IGNORE INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category,last_job_id,property_id) VALUES(?,?,?,?,NULL,?)`).run(invite.homeowner_id,id,id,normalizeContactCategory(invite.category||'Haus'),invite.property_id||null);createNotification(invite.homeowner_id,'Früherer Handwerker verbunden',`${d.businessName||`${first} ${last}`} ist jetzt bei Einfach Hausen und wurde deinem Haus als Ansprechpartner zugeordnet.`,'/app/messages','contact');}
  }
  const initialRequest=text(fd,'initialRequest').slice(0,700);
  if(role==='homeowner'&&initialRequest){
    const bounded=intakeDescriptionSchema.safeParse({description:initialRequest});
    if(bounded.success){await answerHausmeisterQuestion(id,bounded.data.description,'app');}
  }
  await createSession(id);
  // Establish the Supabase SSR session server-side so the middleware gate and
  // getCurrentUser() resolve immediately; otherwise the freshly registered
  // user would bounce to /login despite valid credentials.
  const supabaseSession = await establishSupabaseSession(email, password);
  if (!supabaseSession) {
    logSecurityEvent('auth_register', email, 'supabase_session_establishment_failed');
    return { redirectTo: '/login?notice=Konto erstellt. Bitte einmalig anmelden.' };
  }
  return { redirectTo: role==='provider'?'/pro':initialRequest?'/app/hausmeister?answered=1':'/app/onboarding' };
}

export async function loginAction(fd: FormData): Promise<{ error: string } | { redirectTo: string }> {
  const parsed = loginSchema.safeParse({ email: demoEmailFor(text(fd,'email')), password: String(fd.get('password') ?? '').trim() });
  if (parsed.success && DEMO_LOGIN_ENABLED && DEMO_PASSWORD.length > 0 && isDemoEmail(parsed.data.email) && parsed.data.password === DEMO_PASSWORD) {
    ensureLocalDemoAccounts();
    recordRateLimitSuccess('login', parsed.data.email);
  }
  const ip = await clientIp();
  // Two independent dimensions: one IP cannot spray unlimited accounts, and
  // one account cannot be hammered from unlimited sources.
  const identifier = parsed.success ? parsed.data.email : `ip:${ip}`;
  const emailLimit = parsed.success ? checkRateLimit('login', parsed.data.email) : { allowed: true as const, retryAfterSeconds: 0 };
  const ipLimit = checkRateLimit('login', `ip:${ip}`);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    rateLimitBlockedEvent('login', identifier, Math.max(emailLimit.allowed ? 0 : emailLimit.retryAfterSeconds, ipLimit.retryAfterSeconds));
    return { error: 'Zu viele Versuche. Bitte später erneut versuchen' };
  }
  if (!parsed.success) { recordRateLimitFailure('login', `ip:${ip}`); logSecurityEvent('security_validation_reject', 'login', 'invalid_input'); return { error: 'E-Mail oder Passwort ist falsch' }; }
  const { email, password } = parsed.data;
  // Count the attempt BEFORE the expensive comparison so a concurrent batch
  // cannot all pass the gate before any failure is recorded.
  const emailConsumed = consumeRateLimitAttempt('login', email);
  const ipConsumed = consumeRateLimitAttempt('login', `ip:${ip}`);
  if (!emailConsumed.consumed || !ipConsumed.consumed || emailConsumed.blocked || ipConsumed.blocked) {
    rateLimitBlockedEvent('login', email, 3600);
    return { error: 'Zu viele Versuche. Bitte später erneut versuchen' };
  }
  const row=db.prepare('SELECT id,password_hash,role FROM users WHERE email=?').get(email) as {id:number,password_hash:string,role:'homeowner'|'provider'}|undefined;
  // Always run bcrypt exactly once against comparable material.
  const ok = await bcrypt.compare(password,row?.password_hash ?? DUMMY_PASSWORD_HASH);
  if (!row || !ok) {
    applyRateLimitLockout('login', email);
    applyRateLimitLockout('login', `ip:${ip}`);
    logSecurityEvent('auth_login_fail', email, `ip=${ip}`);
    return { error: 'E-Mail oder Passwort ist falsch' };
  }
  recordRateLimitSuccess('login', email);
  recordRateLimitSuccess('login', `ip:${ip}`);
  logSecurityEvent('auth_login_ok', email, `ip=${ip}`);
  await createSession(row.id);
  // Supabase mode: the mh_session cookie alone does not authenticate
  // getCurrentUser() — it ignores the local cookie. Establish the real
  // Supabase SSR session like registerAction and the browser login path
  // (signInWithPassword) do; fail closed so the user does not land on
  // /app only to bounce back to /login.
  if (authMode() !== 'local') {
    const supabaseSession = await establishSupabaseSession(email, password);
    if (!supabaseSession) {
      logSecurityEvent('auth_login_fail', email, 'supabase_session_failed');
      return { error: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen' };
    }
  }
  // Return the destination instead of redirect(). This action is awaited from
  // a client form wrapper; throwing NEXT_REDIRECT there aborts the in-flight
  // transition and surfaces "AbortError: Transition was skipped" in preview.
  return { redirectTo: safeNextPath(text(fd,'next'), row.role==='provider'?'/pro':'/app') };
}
export async function logoutAction(){ await destroySession(); redirect('/'); }

async function savePublicImageUpload(file: File | null) {
  if (!file || file.size===0) return null;
  const types:Record<string,{ext:string,max:number}>={
    'image/jpeg':{ext:'jpg',max:8*1024*1024},'image/png':{ext:'png',max:8*1024*1024},'image/webp':{ext:'webp',max:8*1024*1024},'image/heic':{ext:'heic',max:8*1024*1024},
  };
  const rule=types[file.type]; if(!rule||file.size>rule.max)throw new Error('Ungültige Bilddatei');
  const name = `${Date.now()}-${randomUUID()}.${rule.ext}`;
  const dir = path.join(process.cwd(),'public','uploads'); await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,name),Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function sendHausmeisterAction(fd:FormData){
  const user=await requireUser('homeowner');
  const submitted=text(fd,'description');
  if(submitted.length<4) redirect('/app/hausmeister?error=Schreib%20mir%20kurz,%20worum%20es%20bei%20deinem%20Haus%20geht');
  const bounded=intakeDescriptionSchema.safeParse({description:submitted});
  if(!bounded.success){ logSecurityEvent('security_validation_reject','hausmeister_intake','invalid_description'); redirect('/app/hausmeister?error=Beschreib%20es%20bitte%20k%C3%BCrzer'); }
  const description=bounded.data.description;
  const photo=fd.get('photo'); const saved=await savePrivateMediaUpload(photo instanceof File?photo:null);
  const thread=db.prepare(`SELECT id FROM assistant_threads WHERE user_id=? AND channel='app' ORDER BY updated_at DESC LIMIT 1`).get(user.id) as {id:number}|undefined;
  const draft=thread?db.prepare('SELECT intent FROM assistant_drafts WHERE thread_id=?').get(thread.id) as {intent:HausmeisterIntent}|undefined:undefined;
  if(draft){
    const result=await createHausmeisterRequest(user.id,description,'app',saved,draft.intent,true);
    revalidatePath('/app'); revalidatePath('/app/hausmeister'); revalidatePath('/pro'); revalidatePath('/notifications');
    redirect(result.jobId?`/app/hausmeister?job=${result.jobId}`:'/app/hausmeister?clarify=1');
  }
  await answerHausmeisterQuestion(user.id,description,'app',saved);
  revalidatePath('/app'); revalidatePath('/app/hausmeister');
  redirect('/app/hausmeister?answered=1');
}

export async function createConsultationAction(fd:FormData){
  const user=await requireUser('homeowner');
  const limit=consumeHomeownerServiceLimit('consultation',user.id);
  if(!limit.allowed)redirect('/app/consultation?error=Zu%20viele%20Anfragen.%20Bitte%20versuche%20es%20sp%C3%A4ter%20erneut');
  const submitted=text(fd,'description');
  if(submitted.length<4)redirect('/app/consultation?error=Beschreib%20kurz,%20wobei%20du%20Rat%20brauchst');
  const bounded=intakeDescriptionSchema.safeParse({description:submitted});
  if(!bounded.success){ logSecurityEvent('security_validation_reject','consultation_intake','invalid_description'); redirect('/app/consultation?error=Beschreib%20es%20bitte%20k%C3%BCrzer'); }
  let saved:string|null=null;
  try{
    const photo=fd.get('photo');
    saved=await savePrivateMediaUpload(photo instanceof File?photo:null);
  }catch{
    logSecurityEvent('security_validation_reject','consultation_intake','invalid_media');
    redirect('/app/consultation?error=Das%20Foto%20oder%20Video%20konnte%20nicht%20sicher%20%C3%BCbernommen%20werden.%20Bitte%20pr%C3%BCfe%20Dateityp%20und%20Gr%C3%B6%C3%9Fe');
  }
  const result=await createHausmeisterRequest(user.id,bounded.data.description,'app',saved,'contact',true);
  revalidatePath('/app');revalidatePath('/app/consultation');revalidatePath('/pro');revalidatePath('/notifications');
  redirect(result.jobId?`/app/jobs/${result.jobId}`:'/app/hausmeister?clarify=1');
}

export async function createEmergencyAction(fd:FormData){
  const user=await requireUser('homeowner'); const submitted=text(fd,'description'); if(submitted.length<3)redirect('/app/emergency?error=Beschreib%20kurz,%20was%20passiert%20ist');
  const emergencyType=emergencyTypeSchema.parse(text(fd,'emergencyType')||'other');
  const bounded=intakeDescriptionSchema.safeParse({description:submitted});
  if(!bounded.success){ logSecurityEvent('security_validation_reject','emergency_intake','invalid_description'); redirect('/app/emergency?error=Beschreib%20es%20bitte%20k%C3%BCrzer'); }
  const result=await createEmergencyRequest(user.id,emergencyType,bounded.data.description); revalidatePath('/app');revalidatePath('/app/jobs');revalidatePath('/pro');revalidatePath('/notifications'); redirect(`/app/jobs/${result.jobId}?emergency=1`);
}

export async function startHausmeisterRouteAction(intent:HausmeisterIntent){
  const user=await requireUser('homeowner');
  if(intent!=='contact'&&intent!=='service'){
    logSecurityEvent('security_validation_reject','hausmeister_route','invalid_intent');
    redirect('/app/hausmeister?error=Diese%20Aktion%20ist%20nicht%20verf%C3%BCgbar');
  }
  const limit=consumeHomeownerServiceLimit('hausmeister_route',user.id);
  if(!limit.allowed)redirect('/app/hausmeister?error=Zu%20viele%20Anfragen.%20Bitte%20versuche%20es%20sp%C3%A4ter%20erneut');
  const thread=db.prepare(`SELECT id FROM assistant_threads WHERE user_id=? AND channel='app' ORDER BY updated_at DESC LIMIT 1`).get(user.id) as {id:number}|undefined;
  if(!thread)redirect('/app/hausmeister?error=Beschreib%20dein%20Thema%20zuerst%20kurz%20dem%20Hausmeister');
  const latest=db.prepare(`SELECT body,metadata_json FROM assistant_messages WHERE thread_id=? AND role='user' ORDER BY created_at DESC,id DESC LIMIT 1`).get(thread.id) as {body:string;metadata_json:string}|undefined;
  if(!latest)redirect('/app/hausmeister?error=Beschreib%20dein%20Thema%20zuerst%20kurz%20dem%20Hausmeister');
  const bounded=intakeDescriptionSchema.safeParse({description:latest.body});
  if(!bounded.success){
    logSecurityEvent('security_validation_reject','hausmeister_route','invalid_description');
    redirect('/app/hausmeister?error=Die%20letzte%20Nachricht%20konnte%20nicht%20sicher%20%C3%BCbernommen%20werden');
  }
  let photo:string|null=null; try{const metadata=JSON.parse(latest.metadata_json||'{}');if(typeof metadata.photo==='string'&&metadata.photo.startsWith('job-media/'))photo=metadata.photo;}catch{}
  const result=await createHausmeisterRequest(user.id,bounded.data.description,'app',photo,intent,false);
  revalidatePath('/app'); revalidatePath('/app/hausmeister'); revalidatePath('/pro'); revalidatePath('/notifications');
  redirect(result.jobId?`/app/jobs/${result.jobId}`:'/app/hausmeister?clarify=1');
}

// Compatibility endpoint for older forms/bookmarks. Treat explicit legacy job forms as real service requests.
export async function createJobAction(fd: FormData) {
  const user=await requireUser('homeowner'); const submitted=text(fd,'description'); if(submitted.length<4)return;
  const bounded=intakeDescriptionSchema.safeParse({description:submitted}); if(!bounded.success){ logSecurityEvent('security_validation_reject','legacy_job','invalid_description'); return; }
  const photo=fd.get('photo'); const saved=await savePrivateMediaUpload(photo instanceof File?photo:null);
  const result=await createHausmeisterRequest(user.id,bounded.data.description,'app',saved,'service',true);
  redirect(result.jobId?`/app/jobs/${result.jobId}`:'/app/hausmeister?clarify=1');
}


export async function turnContactIntoServiceAction(jobId:number){
  const user=await requireUser('homeowner');
  const job=db.prepare(`SELECT j.*,(SELECT path FROM job_photos p WHERE p.job_id=j.id ORDER BY p.id ASC LIMIT 1) photo FROM jobs j WHERE j.id=? AND j.homeowner_id=? AND j.request_kind='contact'`).get(jobId,user.id) as any;
  if(!job)return;
  const sourceThread=db.prepare(`SELECT id FROM assistant_threads WHERE user_id=? AND active_job_id=? ORDER BY updated_at DESC LIMIT 1`).get(user.id,jobId) as {id:number}|undefined;
  const result=await createHausmeisterRequest(user.id,job.description,'app',job.photo||null,'service',false,sourceThread?.id);
  revalidatePath('/app'); revalidatePath('/app/hausmeister'); revalidatePath('/pro'); revalidatePath('/notifications');
  redirect(result.jobId?`/app/jobs/${result.jobId}`:'/app/hausmeister?clarify=1');
}

export async function acceptContactRequestAction(jobId:number,fd:FormData){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.canManageJobs)return;
  const contactUserId=int(fd,'contactUserId')||user.id;
  const contact=db.prepare(`SELECT m.user_id,u.first_name,u.last_name,m.job_title FROM provider_members m JOIN users u ON u.id=m.user_id WHERE m.provider_id=? AND m.user_id=? AND m.active=1`).get(ctx.providerId,contactUserId) as any;
  if(!contact)return;
  const job=db.prepare(`SELECT j.* FROM jobs j JOIN job_dispatches d ON d.job_id=j.id WHERE j.id=? AND j.request_kind='contact' AND d.provider_id=? AND d.status IN ('sent','viewed') AND j.status='open'`).get(jobId,ctx.providerId) as any;
  if(!job)return;
  const tx=db.transaction(()=>{
    db.prepare(`UPDATE jobs SET status='accepted',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(jobId);
    db.prepare(`UPDATE job_dispatches SET status=CASE WHEN provider_id=? THEN 'accepted' ELSE 'closed' END,responded_at=COALESCE(responded_at,CURRENT_TIMESTAMP) WHERE job_id=?`).run(ctx.providerId,jobId);
    db.prepare(`INSERT INTO job_assignments(job_id,provider_id,contact_user_id,assigned_by_user_id) VALUES(?,?,?,?) ON CONFLICT(job_id) DO UPDATE SET provider_id=excluded.provider_id,contact_user_id=excluded.contact_user_id,assigned_by_user_id=excluded.assigned_by_user_id,assigned_at=CURRENT_TIMESTAMP`).run(jobId,ctx.providerId,contactUserId,user.id);
    db.prepare(`INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category,last_job_id,property_id,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET provider_id=excluded.provider_id,category=excluded.category,last_job_id=excluded.last_job_id,property_id=excluded.property_id,updated_at=CURRENT_TIMESTAMP`).run(job.homeowner_id,ctx.providerId,contactUserId,normalizeContactCategory(job.category||''),jobId,job.property_id||null);
  }); tx();
  createNotification(job.homeowner_id,'Dein Ansprechpartner ist da',`${contact.first_name} ${contact.last_name} von ${ctx.businessName} ist jetzt dein persönlicher Ansprechpartner für dein Thema.`,`/app/jobs/${jobId}`,'contact');
  if(contactUserId!==user.id)createNotification(contactUserId,'Neue Kontaktanfrage zugewiesen',`Du bist jetzt Ansprechpartner für „${job.title.replace(/^Ansprechpartner:\s*/,'')}“.`,`/pro/jobs/${jobId}`,'assigned');
  appendJobEvent(jobId,`${contact.first_name} ${contact.last_name} von ${ctx.businessName} ist jetzt dein persönlicher Ansprechpartner. Es wurde noch kein Auftrag vergeben; du kannst direkt schreiben oder anrufen.`,{contactUserId,providerId:ctx.providerId,requestKind:'contact'});
  revalidatePath('/pro'); revalidatePath('/pro/orders'); revalidatePath(`/pro/jobs/${jobId}`); revalidatePath(`/app/jobs/${jobId}`); revalidatePath('/app/messages'); revalidatePath('/notifications');
  redirect(`/pro/jobs/${jobId}`);
}

export async function submitQuoteAction(jobId:number, fd:FormData){
  const user=await requireUser('provider');
  const parsed=quoteSchema.safeParse({ amount: text(fd,'amount'), availableAt: text(fd,'availableAt'), message: text(fd,'message') });
  if(!parsed.success){ logSecurityEvent('security_validation_reject','quote',`fields=${parsed.error.issues.length}`); return; }
  const { amount, availableAt, message } = parsed.data;
  const ctx=getProviderContext(user.id); if(!ctx?.active||!ctx.canManageJobs) redirect(`/pro/jobs/${jobId}?error=Du%20darfst%20f%C3%BCr%20diesen%20Betrieb%20keine%20neuen%20Auftr%C3%A4ge%20verwalten`);
  const profile=db.prepare(`SELECT p.verified,c.status contract_status FROM provider_profiles p LEFT JOIN partner_contracts c ON c.provider_id=p.user_id WHERE p.user_id=?`).get(ctx.providerId) as {verified:number,contract_status:string|null}|undefined;
  if(!profile?.verified || profile.contract_status!=='active') redirect(`/pro/jobs/${jobId}?error=Dein%20Betrieb%20muss%20gepr%C3%BCft%20und%20vertraglich%20freigeschaltet%20sein`);
  const dispatch=db.prepare(`SELECT id FROM job_dispatches WHERE job_id=? AND provider_id=? AND status IN ('sent','viewed','quoted')`).get(jobId,ctx.providerId) as {id:number}|undefined;
  if(!dispatch) return;
  db.prepare(`INSERT INTO quotes(job_id,provider_id,amount,available_at,message,submitted_by_user_id) VALUES(?,?,?,?,?,?)
    ON CONFLICT(job_id,provider_id) DO UPDATE SET amount=excluded.amount,available_at=excluded.available_at,message=excluded.message,submitted_by_user_id=excluded.submitted_by_user_id,status='pending'`).run(jobId,ctx.providerId,amount*100,availableAt||null,message,user.id);
  db.prepare(`UPDATE jobs SET status=CASE WHEN status='open' THEN 'quoted' ELSE status END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(jobId);
  db.prepare(`UPDATE job_dispatches SET status='quoted',responded_at=CURRENT_TIMESTAMP WHERE job_id=? AND provider_id=?`).run(jobId,ctx.providerId);
  const job=db.prepare('SELECT homeowner_id,title FROM jobs WHERE id=?').get(jobId) as {homeowner_id:number,title:string}|undefined;
  if(job){
    createNotification(job.homeowner_id,'Neues Vergleichsangebot',`Für „${job.title}“ ist ein weiteres geprüftes Angebot eingetroffen. Einfach Hausen hat den Vergleich aktualisiert.`,`/app/jobs/${jobId}`,'quote');
    appendJobEvent(jobId,`Ein neues Angebot für „${job.title}“ ist eingetroffen. Ich habe den Vergleich aktualisiert und bewerte Preis, Termin, Entfernung und Partnerqualität.`,{amount:amount*100,providerId:ctx.providerId});
  }
  revalidatePath('/pro'); revalidatePath(`/pro/jobs/${jobId}`); revalidatePath(`/app/jobs/${jobId}`); revalidatePath('/notifications');
}

export async function acceptQuoteAction(quoteId:number){
  const user=await requireUser('homeowner');
  const q=db.prepare(`SELECT q.*,j.homeowner_id,j.preferred_date,j.preferred_time,j.category,j.property_id,p.verified FROM quotes q JOIN jobs j ON j.id=q.job_id JOIN provider_profiles p ON p.user_id=q.provider_id WHERE q.id=?`).get(quoteId) as any;
  if(!q || q.homeowner_id!==user.id || !q.verified) return;
  const preferredContact=(db.prepare(`SELECT m.user_id FROM provider_members m WHERE m.provider_id=? AND m.active=1 AND m.user_id=?`).get(q.provider_id,q.submitted_by_user_id||q.provider_id) as {user_id:number}|undefined)?.user_id
    ||(db.prepare(`SELECT user_id FROM provider_members WHERE provider_id=? AND active=1 ORDER BY can_manage_jobs DESC,id ASC LIMIT 1`).get(q.provider_id) as {user_id:number}|undefined)?.user_id
    ||q.provider_id;
  const start=q.available_at || (q.preferred_date ? `${q.preferred_date}T${q.preferred_time||'09:00'}` : new Date(Date.now()+86400000).toISOString());
  const tx=db.transaction(()=>{
    db.prepare(`UPDATE quotes SET status=CASE WHEN id=? THEN 'accepted' ELSE 'rejected' END WHERE job_id=?`).run(quoteId,q.job_id);
    db.prepare(`UPDATE jobs SET status='accepted',accepted_quote_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(quoteId,q.job_id);
    db.prepare(`INSERT INTO appointments(job_id,provider_id,homeowner_id,start_at,contact_user_id) VALUES(?,?,?,?,?)`).run(q.job_id,q.provider_id,user.id,start,preferredContact);
    db.prepare(`UPDATE job_dispatches SET status=CASE WHEN provider_id=? THEN 'accepted' ELSE 'closed' END,responded_at=COALESCE(responded_at,CURRENT_TIMESTAMP) WHERE job_id=?`).run(q.provider_id,q.job_id);
    db.prepare(`INSERT INTO job_assignments(job_id,provider_id,contact_user_id,assigned_by_user_id) VALUES(?,?,?,?)
      ON CONFLICT(job_id) DO UPDATE SET provider_id=excluded.provider_id,contact_user_id=excluded.contact_user_id,assigned_by_user_id=excluded.assigned_by_user_id,assigned_at=CURRENT_TIMESTAMP`).run(q.job_id,q.provider_id,preferredContact,preferredContact);
    db.prepare(`INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category,last_job_id,property_id,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET provider_id=excluded.provider_id,category=excluded.category,last_job_id=excluded.last_job_id,property_id=excluded.property_id,updated_at=CURRENT_TIMESTAMP`).run(user.id,q.provider_id,preferredContact,normalizeContactCategory(q.category||''),q.job_id,q.property_id||null);
  }); tx();
  const jobTitle=(db.prepare('SELECT title FROM jobs WHERE id=?').get(q.job_id) as {title:string}|undefined)?.title||'Auftrag';
  for(const managerId of getProviderManagerIds(q.provider_id))createNotification(managerId,'Auftrag erhalten',`Das Angebot für „${jobTitle}“ wurde angenommen. Ansprechpartner kann jetzt bestätigt oder geändert werden.`,`/pro/jobs/${q.job_id}`,'accepted');
  if(!getProviderManagerIds(q.provider_id).includes(preferredContact))createNotification(preferredContact,'Neuer Auftrag für dich',`Du bist Ansprechpartner für „${jobTitle}“.`,`/pro/jobs/${q.job_id}`,'accepted');
  const contact=db.prepare('SELECT first_name,last_name FROM users WHERE id=?').get(preferredContact) as {first_name:string,last_name:string}|undefined;
  appendJobEvent(q.job_id,`Gebucht. ${contact?`${contact.first_name} ${contact.last_name} ist ab jetzt dein persönlicher Ansprechpartner beim ausführenden Unternehmen.`:'Der Partner weist dir jetzt einen persönlichen Ansprechpartner zu.'} Einfach Hausen bleibt für Organisation, Hausakte und Unterstützung erreichbar.`,{providerId:q.provider_id,quoteId,contactUserId:preferredContact});
  revalidatePath(`/app/jobs/${q.job_id}`); revalidatePath('/app/calendar'); revalidatePath('/app/messages'); revalidatePath('/pro'); revalidatePath('/pro/orders'); revalidatePath('/notifications');
}

/**
 * Bucht ein Angebot aus einer Empfehlungskarte (Chat oder Vorgangsseite) und
 * meldet zurueck, ob die Buchung wirklich angekommen ist. Die Karte zeigt
 * "Gebucht" nur, wenn hier true steht - eine stille Ablehnung (fremdes Angebot,
 * nicht gepruefter Betrieb) bleibt damit sichtbar.
 */
export async function bookQuoteAction(quoteId:number|string){
  const id=Number(quoteId);
  if(!Number.isSafeInteger(id)||id<=0)return false;
  await acceptQuoteAction(id);
  const stand=db.prepare('SELECT q.status quote_status,j.status job_status FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE q.id=?').get(id) as {quote_status?:string;job_status?:string}|undefined;
  return stand?.quote_status==='accepted'&&stand?.job_status==='accepted';
}

export async function sendMessageAction(jobId:number, recipientId:number, fd:FormData){
  const user=await requireUser(); const body=text(fd,'body'); if(!body) return;
  const row=db.prepare(`SELECT j.homeowner_id,a.contact_user_id FROM jobs j JOIN job_assignments a ON a.job_id=j.id WHERE j.id=?`).get(jobId) as {homeowner_id:number,contact_user_id:number}|undefined;
  if(!row)return;
  const allowed=(user.role==='homeowner'&&user.id===row.homeowner_id&&recipientId===row.contact_user_id)||(user.role==='provider'&&user.id===row.contact_user_id&&recipientId===row.homeowner_id);
  if(!allowed)return;
  db.prepare('INSERT INTO messages(job_id,sender_id,recipient_id,body) VALUES(?,?,?,?)').run(jobId,user.id,recipientId,body.slice(0,4000));
  createNotification(recipientId,'Neue Nachricht',`${user.first_name}: ${body.slice(0,120)}`,user.role==='provider'?`/app/jobs/${jobId}`:`/pro/jobs/${jobId}`,'message');
  revalidatePath(user.role==='provider'?`/pro/jobs/${jobId}`:`/app/jobs/${jobId}`); revalidatePath('/notifications');
  revalidatePath(user.role==='provider'?'/pro/messages':'/app/messages');
}

export async function markInProgressAction(jobId:number){
  const user=await requireUser('provider'); const ctx=canAccessProviderJob(user.id,jobId); if(!ctx)return;
  const job=db.prepare(`SELECT j.homeowner_id,j.title FROM jobs j JOIN quotes q ON q.id=j.accepted_quote_id WHERE j.id=? AND q.provider_id=?`).get(jobId,ctx.providerId) as any; if(!job)return;
  db.prepare(`UPDATE jobs SET status='in_progress',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(jobId);
  createNotification(job.homeowner_id,'Auftrag gestartet',`${user.first_name} hat „${job.title}“ als in Arbeit markiert. Einfach Hausen behält den Status im Blick.`,`/app/jobs/${jobId}`,'status');
  appendJobEvent(jobId,`${user.first_name} hat mit „${job.title}“ begonnen. Bei Fragen kannst du deinen Ansprechpartner direkt kontaktieren; Einfach Hausen bleibt parallel für Organisation und Hilfe da.`,{status:'in_progress',contactUserId:user.id});
  revalidatePath(`/pro/jobs/${jobId}`); revalidatePath(`/app/jobs/${jobId}`); revalidatePath('/notifications');
}

export async function markCompleteAction(jobId:number){
  const user=await requireUser('provider'); const ctx=canAccessProviderJob(user.id,jobId); if(!ctx)return;
  const job=db.prepare(`SELECT j.homeowner_id,j.title,j.category,j.property_id,j.status,q.amount,q.provider_id FROM jobs j JOIN quotes q ON q.id=j.accepted_quote_id WHERE j.id=? AND q.provider_id=?`).get(jobId,ctx.providerId) as any; if(!job||job.status==='completed')return;
  db.prepare(`UPDATE jobs SET status='completed',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(jobId);
  db.prepare(`UPDATE appointments SET status='completed' WHERE job_id=?`).run(jobId);
  const assigned=db.prepare('SELECT contact_user_id FROM job_assignments WHERE job_id=?').get(jobId) as {contact_user_id:number}|undefined;
  if(assigned)db.prepare(`INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category,last_job_id,property_id,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET provider_id=excluded.provider_id,category=excluded.category,last_job_id=excluded.last_job_id,property_id=excluded.property_id,updated_at=CURRENT_TIMESTAMP`).run(job.homeowner_id,ctx.providerId,assigned.contact_user_id,normalizeContactCategory(job.category||''),jobId,job.property_id||null);
  if(job.property_id&&!db.prepare(`SELECT 1 FROM house_history_entries WHERE job_id=? LIMIT 1`).get(jobId)){
    const provider=db.prepare(`SELECT business_name FROM provider_profiles WHERE user_id=?`).get(ctx.providerId) as {business_name:string}|undefined;
    const contact=assigned?db.prepare(`SELECT first_name,last_name FROM users WHERE id=?`).get(assigned.contact_user_id) as {first_name:string,last_name:string}|undefined:undefined;
    db.prepare(`INSERT INTO house_history_entries(homeowner_id,property_id,job_id,category,title,performed_at,company_name,provider_id,contact_name,cost_amount,notes) VALUES(?,?,?,?,?,date('now'),?,?,?,?,?)`).run(job.homeowner_id,job.property_id,jobId,normalizeContactCategory(job.category||''),job.title,provider?.business_name||ctx.businessName,ctx.providerId,contact?`${contact.first_name} ${contact.last_name}`:'',job.amount||null,'Aus Einfach Hausen automatisch aus dem abgeschlossenen Auftrag übernommen.');
  }
  if(job.property_id)ensureCompletedWorkMaintenance(job.homeowner_id,job.property_id,job.category||'',job.title,new Date());
  createNotification(job.homeowner_id,'Auftrag erledigt',`„${job.title}“ wurde als erledigt markiert. Dein Ansprechpartner bleibt für künftige Aufträge in „Kontakte“ gespeichert.`,`/app/jobs/${jobId}`,'completed');
  appendJobEvent(jobId,`„${job.title}“ wurde als erledigt gemeldet. Dein Ansprechpartner bleibt in deiner Hausakte gespeichert, damit du ihn später direkt wieder kontaktieren kannst.`,{status:'completed'});
  revalidatePath(`/pro/jobs/${jobId}`); revalidatePath(`/app/jobs/${jobId}`); revalidatePath('/app/messages'); revalidatePath('/notifications');
}

export async function cancelJobAction(jobId:number){
  const user=await requireUser('homeowner');
  const job=db.prepare(`SELECT j.*,q.provider_id FROM jobs j LEFT JOIN quotes q ON q.id=j.accepted_quote_id WHERE j.id=? AND j.homeowner_id=?`).get(jobId,user.id) as any;
  if(!job||job.status!=='accepted')return;
  const paid=db.prepare(`SELECT 1 FROM payments WHERE job_id=? AND status='paid' LIMIT 1`).get(jobId);
  if(paid)redirect(`/app/jobs/${jobId}?error=Ein%20bereits%20bezahlter%20Auftrag%20kann%20nicht%20direkt%20storniert%20werden.%20Bitte%20nutze%20den%20Servicefall.`);
  const assignment=db.prepare('SELECT contact_user_id FROM job_assignments WHERE job_id=?').get(jobId) as {contact_user_id:number}|undefined;
  const tx=db.transaction(()=>{
    db.prepare(`UPDATE jobs SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(jobId);
    db.prepare(`UPDATE appointments SET status='cancelled' WHERE job_id=? AND status='confirmed'`).run(jobId);
    db.prepare(`UPDATE job_dispatches SET status='closed' WHERE job_id=? AND status!='declined'`).run(jobId);
  }); tx();
  const recipients=new Set<number>(); if(job.provider_id)for(const id of getProviderManagerIds(job.provider_id))recipients.add(id); if(assignment?.contact_user_id)recipients.add(assignment.contact_user_id);
  for(const id of recipients)createNotification(id,'Auftrag storniert',`${user.first_name} ${user.last_name} hat „${job.title}“ storniert.`,`/pro/jobs/${jobId}`,'cancelled');
  appendJobEvent(jobId,`„${job.title}“ wurde vom Kunden storniert.`,{status:'cancelled'});
  revalidatePath('/app'); revalidatePath('/app/jobs'); revalidatePath(`/app/jobs/${jobId}`); revalidatePath('/pro'); revalidatePath('/pro/orders'); revalidatePath('/notifications');
  redirect(`/app/jobs/${jobId}?cancelled=1`);
}

export async function createCheckoutAction(jobId:number){
  const user=await requireUser('homeowner');
  const q=db.prepare(`SELECT q.amount,q.provider_id,j.title,j.homeowner_id,p.stripe_account_id,p.stripe_onboarded,p.verified FROM jobs j JOIN quotes q ON q.id=j.accepted_quote_id JOIN provider_profiles p ON p.user_id=q.provider_id WHERE j.id=?`).get(jobId) as any;
  if(!q || q.homeowner_id!==user.id) return;
  if(!process.env.STRIPE_SECRET_KEY) redirect(`/app/jobs/${jobId}?error=Stripe%20ist%20noch%20nicht%20konfiguriert`);
  if(!q.verified) redirect(`/app/jobs/${jobId}?error=Der%20Partner%20ist%20nicht%20mehr%20verifiziert`);
  if(!q.stripe_account_id || !q.stripe_onboarded) redirect(`/app/jobs/${jobId}?error=Der%20Dienstleister%20hat%20seine%20Auszahlung%20noch%20nicht%20vollst%C3%A4ndig%20eingerichtet`);
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!); const origin=process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000';
  const session=await stripe.checkout.sessions.create({ mode:'payment', customer_email:user.email, line_items:[{price_data:{currency:process.env.STRIPE_CURRENCY||'eur',product_data:{name:q.title},unit_amount:q.amount},quantity:1}],payment_intent_data:{transfer_data:{destination:q.stripe_account_id},metadata:{jobId:String(jobId),homeownerId:String(user.id),providerId:String(q.provider_id),platformCommissionBps:'0'}},success_url:`${origin}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/app/jobs/${jobId}?payment=cancelled`,metadata:{jobId:String(jobId),homeownerId:String(user.id),providerId:String(q.provider_id),platformCommissionBps:'0'}});
  db.prepare('INSERT INTO payments(job_id,homeowner_id,provider_id,amount,currency,status,stripe_session_id) VALUES(?,?,?,?,?,?,?)').run(jobId,user.id,q.provider_id,q.amount,process.env.STRIPE_CURRENCY||'eur','pending',session.id);
  redirect(session.url!);
}

export async function createInvoiceAction(jobId:number,fd:FormData){
  const user=await requireUser('provider'); const ctx=canAccessProviderJob(user.id,jobId); if(!ctx)return;
  const row=db.prepare(`SELECT j.id,j.homeowner_id,j.title,j.status,q.amount,q.provider_id,p.business_name,p.street_address,p.tax_id,p.vat_id,pu.email provider_email,pu.phone provider_phone,hu.first_name homeowner_first,hu.last_name homeowner_last,h.address homeowner_address,h.postcode homeowner_postcode FROM jobs j JOIN quotes q ON q.id=j.accepted_quote_id JOIN provider_profiles p ON p.user_id=q.provider_id JOIN users pu ON pu.id=p.user_id JOIN users hu ON hu.id=j.homeowner_id JOIN homeowner_profiles h ON h.user_id=j.homeowner_id WHERE j.id=? AND q.provider_id=? AND j.request_kind='service' AND j.status IN ('accepted','in_progress','completed')`).get(jobId,ctx.providerId) as any;
  if(!row)return;
  if(!row.street_address)redirect(`/pro/jobs/${jobId}?error=Bitte%20hinterlege%20zuerst%20die%20vollst%C3%A4ndige%20Firmenanschrift%20im%20Partnerprofil`);
  if(!row.tax_id&&!row.vat_id)redirect(`/pro/jobs/${jobId}?error=Bitte%20hinterlege%20f%C3%BCr%20Rechnungen%20Steuernummer%20oder%20USt-IdNr.%20im%20Partnerprofil`);
  const collect=(name:string)=>fd.getAll(name).map(String);
  const num=(name:string,i:number)=>(collect(name)[i]??'').trim().replace(',','.');
  // Optional trailing form rows stay droppable; only genuinely filled lines are validated.
  const rowCount=Math.max(...['itemDescription','itemQuantity','itemUnit','itemPrice','itemTax'].map(n=>collect(n).length),0);
  const rows=[] as Array<{description:string;quantity:string;unit:string;unitPriceEur:string;taxRatePercent:string}>;
  for(let i=0;i<rowCount;i++){
    const description=collect('itemDescription')[i]??'';
    if(!description.trim()&&!num('itemPrice',i))continue;
    rows.push({description,quantity:num('itemQuantity',i)||'1',unit:(collect('itemUnit')[i]??'').trim(),unitPriceEur:num('itemPrice',i)||'0',taxRatePercent:num('itemTax',i)||'19'});
  }
  const parsed=invoiceSchema.safeParse({
    items: rows,
    issueDate: text(fd,'issueDate'), serviceDate: text(fd,'serviceDate'), dueDate: text(fd,'dueDate'), notes: text(fd,'notes'),
  });
  if(!parsed.success){ logSecurityEvent('security_validation_reject','invoice',`fields=${parsed.error.issues.length}`); redirect(`/pro/jobs/${jobId}?error=Rechnungspositionen%20pr%C3%BCfen`); }
  const calculated=parsed.data.items.map((item,i)=>{
    const unitPrice=Math.round(item.unitPriceEur*100); const net=Math.round(item.quantity*unitPrice);
    const lineTax=Math.round(net*item.taxRatePercent*100/10000); const gross=net+lineTax;
    return { description:item.description, quantity:item.quantity, unit:item.unit||'Stk.', unitPrice, taxBps:Math.round(item.taxRatePercent*100), position:i+1, lineNet:net, lineTax, gross };
  });
  let subtotal=0,tax=0,total=0; for(const c of calculated){subtotal+=c.lineNet;tax+=c.lineTax;total+=c.gross;}
  const invoiceNumber=nextInvoiceNumber(ctx.providerId);
  const tx=db.transaction(()=>{
    const result=db.prepare(`INSERT INTO invoices(job_id,provider_id,homeowner_id,invoice_number,status,issue_date,service_date,due_date,currency,seller_name,seller_address,seller_tax_id,seller_vat_id,seller_email,seller_phone,buyer_name,buyer_address,notes,subtotal_net,tax_amount,total_gross,created_by_user_id,sent_at) VALUES(?,?,?,?, 'sent',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(jobId,ctx.providerId,row.homeowner_id,invoiceNumber,parsed.data.issueDate||new Date().toISOString().slice(0,10),parsed.data.serviceDate||parsed.data.issueDate||new Date().toISOString().slice(0,10),parsed.data.dueDate||new Date(Date.now()+14*86400000).toISOString().slice(0,10),process.env.STRIPE_CURRENCY||'eur',row.business_name,row.street_address,row.tax_id||'',row.vat_id||'',row.provider_email||'',row.provider_phone||'',`${row.homeowner_first} ${row.homeowner_last}`.trim(),row.homeowner_address||row.homeowner_postcode||'',parsed.data.notes,subtotal,tax,total,user.id);
    const invoiceId=Number(result.lastInsertRowid); const insertItem=db.prepare(`INSERT INTO invoice_items(invoice_id,position,description,quantity,unit,unit_price_net,tax_rate_bps,line_net,line_tax,line_gross) VALUES(?,?,?,?,?,?,?,?,?,?)`); for(const item of calculated)insertItem.run(invoiceId,item.position,item.description,item.quantity,item.unit,item.unitPrice,item.taxBps,item.lineNet,item.lineTax,item.gross); return invoiceId;
  });
  const invoiceId=tx();
  createNotification(row.homeowner_id,'Neue Rechnung',`${row.business_name} hat dir Rechnung ${invoiceNumber} f��r „${row.title}“ gesendet.`,`/app/invoices/${invoiceId}`,'invoice');
  appendJobEvent(jobId,`${row.business_name} hat Rechnung ${invoiceNumber} gesendet. Sie liegt jetzt in deiner Hausakte.`,{invoiceId,invoiceNumber,totalGross:total});
  revalidatePath(`/pro/jobs/${jobId}`);revalidatePath('/pro/orders');revalidatePath(`/app/jobs/${jobId}`);revalidatePath('/app/documents');revalidatePath('/notifications');
  redirect(`/pro/invoices/${invoiceId}?sent=1`);
}

export async function cancelInvoiceAction(invoiceId:number){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx)return;
  const invoice=db.prepare(`SELECT * FROM invoices WHERE id=? AND provider_id=?`).get(invoiceId,ctx.providerId) as any; if(!invoice||!['draft','sent'].includes(invoice.status))return;
  const paid=db.prepare(`SELECT 1 FROM payments WHERE invoice_id=? AND status='paid'`).get(invoiceId); if(paid)return;
  db.prepare(`UPDATE invoices SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(invoiceId);
  createNotification(invoice.homeowner_id,'Rechnung storniert',`Rechnung ${invoice.invoice_number} wurde vom Dienstleister storniert.`,`/app/invoices/${invoiceId}`,'invoice');
  revalidatePath(`/pro/invoices/${invoiceId}`);revalidatePath(`/app/invoices/${invoiceId}`);revalidatePath('/app/documents');
}

export async function createInvoiceCheckoutAction(invoiceId:number){
  const user=await requireUser('homeowner');
  const invoice=db.prepare(`SELECT i.*,p.stripe_account_id,p.stripe_onboarded,p.verified FROM invoices i JOIN provider_profiles p ON p.user_id=i.provider_id WHERE i.id=? AND i.homeowner_id=?`).get(invoiceId,user.id) as any;
  if(!invoice||invoice.status!=='sent')return;
  if(!process.env.STRIPE_SECRET_KEY)redirect(`/app/invoices/${invoiceId}?error=Onlinezahlung%20ist%20gerade%20nicht%20verf%C3%BCgbar`);
  if(!invoice.verified||!invoice.stripe_account_id||!invoice.stripe_onboarded)redirect(`/app/invoices/${invoiceId}?error=Der%20Dienstleister%20hat%20die%20Onlinezahlung%20noch%20nicht%20vollst%C3%A4ndig%20eingerichtet`);
  const existing=db.prepare(`SELECT stripe_session_id FROM payments WHERE invoice_id=? AND status='pending' ORDER BY id DESC LIMIT 1`).get(invoiceId) as {stripe_session_id:string}|undefined;
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!); const origin=process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000';
  if(existing?.stripe_session_id){try{const previous=await stripe.checkout.sessions.retrieve(existing.stripe_session_id);if(previous.url)redirect(previous.url);}catch{}}
  const session=await stripe.checkout.sessions.create({mode:'payment',customer_email:user.email,line_items:[{price_data:{currency:invoice.currency||'eur',product_data:{name:`Rechnung ${invoice.invoice_number}`},unit_amount:invoice.total_gross},quantity:1}],payment_intent_data:{transfer_data:{destination:invoice.stripe_account_id},metadata:{jobId:String(invoice.job_id),invoiceId:String(invoice.id),homeownerId:String(user.id),providerId:String(invoice.provider_id),platformCommissionBps:'0'}},success_url:`${origin}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/app/invoices/${invoiceId}?payment=cancelled`,metadata:{kind:'invoice_payment',jobId:String(invoice.job_id),invoiceId:String(invoice.id),homeownerId:String(user.id),providerId:String(invoice.provider_id),platformCommissionBps:'0'}});
  db.prepare(`INSERT INTO payments(job_id,homeowner_id,provider_id,amount,currency,status,stripe_session_id,invoice_id) VALUES(?,?,?,?,?,'pending',?,?)`).run(invoice.job_id,user.id,invoice.provider_id,invoice.total_gross,invoice.currency||'eur',session.id,invoice.id);
  redirect(session.url!);
}

export async function reviewAction(jobId:number, fd:FormData){
  const user=await requireUser('homeowner'); const rating=Math.max(1,Math.min(5,int(fd,'rating')||5));
  const { resolveReviewContext } = await import('@/lib/review-eligibility');
  const eligible = resolveReviewContext(db, jobId, user.role ?? null, user.id);
  if (!eligible.allowed) redirect(`/app/jobs/${jobId}?error=${encodeURIComponent(eligible.reason)}`);
  const row=db.prepare('SELECT j.homeowner_id,q.provider_id FROM jobs j LEFT JOIN quotes q ON q.id=j.accepted_quote_id WHERE j.id=?').get(jobId) as any;
  if (!row || !row.provider_id || row.homeowner_id !== user.id) redirect(`/app/jobs/${jobId}?error=Selbstbewertung%20nicht%20erlaubt`);
  db.prepare('INSERT OR REPLACE INTO reviews(job_id,homeowner_id,provider_id,rating,comment,verified,eligibility_reason) VALUES(?,?,?,?,?,?,?)').run(jobId, user.id, row.provider_id, rating, text(fd, 'comment'), 1, eligible.reason);
  const agg=db.prepare('SELECT AVG(rating) avg,COUNT(*) count FROM reviews WHERE provider_id=? AND hidden=0').get(row.provider_id) as any;
  db.prepare('UPDATE provider_profiles SET rating=?,rating_count=? WHERE user_id=?').run(agg.avg||0,agg.count||0,row.provider_id);
  const assigned=db.prepare('SELECT contact_user_id FROM job_assignments WHERE job_id=?').get(jobId) as {contact_user_id:number}|undefined; const recipients=new Set<number>([...getProviderManagerIds(row.provider_id),...(assigned?[assigned.contact_user_id]:[])]); for(const recipient of recipients)createNotification(recipient,'Neue Bewertung',`Der Auftrag hat eine ${rating}-Sterne-Bewertung erhalten.`,`/pro/orders`,'review');
  revalidatePath(`/app/jobs/${jobId}`); revalidatePath('/notifications');
}

export async function toggleFeatureFlagAction(key:string){
  await requireAdmin();
  const { isFeatureEnabled, setFeatureEnabled } = await import('@/lib/feature-flags');
  setFeatureEnabled(key, !isFeatureEnabled(key), 'admin-ops');
  logAdminAudit('feature-flag', isFeatureEnabled(key)?'disabled':'enabled', key);
  revalidatePath('/admin/ops');
}

export async function reportReviewAction(reviewId:number, fd:FormData){
  const user=await requireUser();
  const reason=String(fd.get('reason')??'').slice(0,500);
  const review=db.prepare('SELECT id,provider_id FROM reviews WHERE id=? AND hidden=0').get(reviewId) as {id:number,provider_id:number}|undefined;
  // Die Meldung kommt vom Partnerdetail: zurueck dorthin, damit die Query
  // (Erfolg/Hinweis) nicht im /app/partners-Redirect verloren geht.
  if(!review) notFound();
  db.prepare(`INSERT INTO review_reports(review_id,reported_by,reason) VALUES(?,?,?)
    ON CONFLICT(review_id) DO UPDATE SET reason=excluded.reason`).run(reviewId,user.id,reason);
  logSecurityEvent('review_reported','trust',`review=${reviewId} by=${user.id}`);
  revalidatePath('/app/partners'); revalidatePath('/admin');
  redirect(`/app/partners/${review.provider_id}?message=Danke.%20Die%20Bewertung%20wurde%20gemeldet%20und%20wird%20geprueft.`);
}

export async function requeueDeadNotificationAction(notificationId:number){
  await requireAdmin();
  const { requeueDeadNotification } = await import('@/lib/notifications');
  const ok = requeueDeadNotification(notificationId, 'admin-ops');
  logAdminAudit('requeue-notification', ok ? 'requeued' : 'not-dead', `notification=${notificationId}`);
  revalidatePath('/admin/ops');
}

export async function moderateReviewAction(reviewId:number, fd:FormData){
  await requireAdmin();
  const decision=String(fd.get('decision')??'');
  const note=String(fd.get('note')??'').slice(0,500);
  if(decision==='hide'){
    db.prepare('UPDATE reviews SET hidden=1 WHERE id=?').run(reviewId);
    db.prepare("UPDATE review_reports SET status='actioned',handled_at=CURRENT_TIMESTAMP WHERE review_id=?").run(reviewId);
  } else if(decision==='dismiss'){
    db.prepare("UPDATE review_reports SET status='dismissed',handled_at=CURRENT_TIMESTAMP WHERE review_id=?").run(reviewId);
  } else if(decision==='restore'){
    db.prepare('UPDATE reviews SET hidden=0 WHERE id=?').run(reviewId);
    db.prepare("UPDATE review_reports SET status='dismissed',handled_at=CURRENT_TIMESTAMP WHERE review_id=?").run(reviewId);
  } else return;
  // Recompute aggregate on moderation (hidden reviews leave the public average).
  const row=db.prepare('SELECT provider_id FROM reviews WHERE id=?').get(reviewId) as {provider_id:number}|undefined;
  if(row){
    const agg=db.prepare('SELECT AVG(rating) avg,COUNT(*) count FROM reviews WHERE provider_id=? AND hidden=0').get(row.provider_id) as any;
    db.prepare('UPDATE provider_profiles SET rating=?,rating_count=? WHERE user_id=?').run(agg.avg||0,agg.count||0,row.provider_id);
  }
  logAdminAudit('moderate-review',decision,`review=${reviewId} ${note}`);
  revalidatePath('/admin'); revalidatePath('/app/partners');
}

export async function saveProfileAction(fd:FormData){
  const user=await requireUser();
  db.prepare('UPDATE users SET first_name=?,last_name=?,phone=? WHERE id=?').run(text(fd,'firstName'),text(fd,'lastName'),text(fd,'phone')||null,user.id);
  if(user.role==='homeowner'){
    db.prepare('UPDATE homeowner_profiles SET postcode=?,address=? WHERE user_id=?').run(text(fd,'postcode'),text(fd,'address'),user.id);
    const postcode=text(fd,'postcode'); const geo=await geocodePostcode(postcode); if(geo)db.prepare('UPDATE homeowner_profiles SET lat=?,lon=? WHERE user_id=?').run(geo.lat,geo.lon,user.id);
    syncPropertyFromLegacyProfile(user.id);
  } else {
    const ctx=getProviderContext(user.id); if(!ctx)return;
    if(ctx.isOwner||ctx.canManageJobs){
      const current=db.prepare('SELECT business_name,trades,verified FROM provider_profiles WHERE user_id=?').get(ctx.providerId) as any;
      const businessName=text(fd,'businessName')||current?.business_name||ctx.businessName; const trades=text(fd,'trades')||current?.trades||'';
      const logo=fd.get('logo'); const newLogo=logo instanceof File&&logo.size?await savePublicImageUpload(logo):null;
      db.prepare('UPDATE provider_profiles SET business_name=?,trades=?,postcode=?,radius_km=?,description=?,street_address=?,tax_id=?,vat_id=?,logo_path=COALESCE(?,logo_path) WHERE user_id=?').run(businessName,trades,text(fd,'postcode'),int(fd,'radius')||25,text(fd,'description'),text(fd,'streetAddress'),text(fd,'taxId'),text(fd,'vatId'),newLogo,ctx.providerId);
      const emergencyDays=fd.getAll('emergencyDay').map(String).filter(v=>/^[0-6]$/.test(v)).join(',')||'1,2,3,4,5';
      const weeklyCapacityRaw=int(fd,'weeklyCapacity')||0; const weeklyCapacity=weeklyCapacityRaw>0?Math.min(200,weeklyCapacityRaw):null;
      db.prepare(`INSERT INTO provider_preferences(provider_id,accepts_normal_jobs,accepts_short_notice,accepts_consultation,accepts_emergencies,emergency_mode,emergency_start,emergency_end,emergency_days,emergency_markup_bps,opening_hours_text,bookable_hours_text,instant_booking,weekly_capacity,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(provider_id) DO UPDATE SET accepts_normal_jobs=excluded.accepts_normal_jobs,accepts_short_notice=excluded.accepts_short_notice,accepts_consultation=excluded.accepts_consultation,accepts_emergencies=excluded.accepts_emergencies,emergency_mode=excluded.emergency_mode,emergency_start=excluded.emergency_start,emergency_end=excluded.emergency_end,emergency_days=excluded.emergency_days,emergency_markup_bps=excluded.emergency_markup_bps,opening_hours_text=excluded.opening_hours_text,bookable_hours_text=excluded.bookable_hours_text,instant_booking=excluded.instant_booking,weekly_capacity=excluded.weekly_capacity,updated_at=CURRENT_TIMESTAMP`).run(ctx.providerId,fd.get('acceptsNormalJobs')?1:0,fd.get('acceptsShortNotice')?1:0,fd.get('acceptsConsultation')?1:0,fd.get('acceptsEmergencies')?1:0,text(fd,'emergencyMode')==='24_7'?'24_7':'local',text(fd,'emergencyStart')||'18:00',text(fd,'emergencyEnd')||'22:00',emergencyDays,Math.max(0,Math.min(100,int(fd,'emergencyMarkup')||0))*100,text(fd,'openingHours'),text(fd,'bookableHours'),fd.get('instantBooking')?1:0,weeklyCapacity);
      if(fd.get('providerCategoriesPresent')){
        const available=new Set((db.prepare(`SELECT slug FROM provider_categories WHERE active=1`).all() as Array<{slug:string}>).map(r=>r.slug));
        const selected=fd.getAll('providerCategory').map(String).filter(slug=>available.has(slug));
        const categories=selected.length?selected:['handwerk'];
        const categoryTx=db.transaction(()=>{db.prepare(`DELETE FROM provider_category_assignments WHERE provider_id=?`).run(ctx.providerId);const insert=db.prepare(`INSERT INTO provider_category_assignments(provider_id,category_slug) VALUES(?,?)`);for(const slug of categories)insert.run(ctx.providerId,slug);});categoryTx();
        if(categories.includes('makler'))db.prepare(`INSERT OR IGNORE INTO broker_search_profiles(provider_id,regions_text) VALUES(?,?)`).run(ctx.providerId,text(fd,'postcode'));
      }
      if(fd.get('serviceProfilePresent')){
        const availableServices=new Set((db.prepare(`SELECT slug FROM service_catalog WHERE active=1`).all() as Array<{slug:string}>).map(r=>r.slug));
        const selectedServices=fd.getAll('serviceSlug').map(String).filter(slug=>availableServices.has(slug));
        const serviceTx=db.transaction(()=>{db.prepare(`DELETE FROM provider_service_offerings WHERE provider_id=?`).run(ctx.providerId);const insert=db.prepare(`INSERT INTO provider_service_offerings(provider_id,service_slug,active) VALUES(?,?,1)`);for(const slug of selectedServices)insert.run(ctx.providerId,slug);});serviceTx();
      }
      if(fd.get('brokerProfilePresent')){
        const euroToCents=(key:string)=>{const raw=String(fd.get(key)||'').trim().replace(',','.');if(!raw)return null;const value=Number(raw);return Number.isFinite(value)&&value>=0?Math.round(value*100):null;};
        const area=(key:string)=>{const raw=String(fd.get(key)||'').trim().replace(',','.');if(!raw)return null;const value=Number(raw);return Number.isFinite(value)&&value>=0?value:null;};
        db.prepare(`INSERT INTO broker_search_profiles(provider_id,regions_text,property_types_text,min_price,max_price,min_living_area,max_living_area,min_plot_area,max_plot_area,residential,commercial,specialties,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(provider_id) DO UPDATE SET regions_text=excluded.regions_text,property_types_text=excluded.property_types_text,min_price=excluded.min_price,max_price=excluded.max_price,min_living_area=excluded.min_living_area,max_living_area=excluded.max_living_area,min_plot_area=excluded.min_plot_area,max_plot_area=excluded.max_plot_area,residential=excluded.residential,commercial=excluded.commercial,specialties=excluded.specialties,updated_at=CURRENT_TIMESTAMP`).run(ctx.providerId,text(fd,'brokerRegions'),text(fd,'brokerPropertyTypes'),euroToCents('brokerMinPrice'),euroToCents('brokerMaxPrice'),area('brokerMinLivingArea'),area('brokerMaxLivingArea'),area('brokerMinPlotArea'),area('brokerMaxPlotArea'),fd.get('brokerResidential')?1:0,fd.get('brokerCommercial')?1:0,text(fd,'brokerSpecialties').slice(0,1000));
      }
      if(current?.verified && (current.business_name!==businessName || current.trades!==trades)){
        db.prepare('UPDATE provider_profiles SET verified=0 WHERE user_id=?').run(ctx.providerId);
        db.prepare(`UPDATE verification_requests SET status='pending',reviewed_at=NULL,admin_note='',submitted_at=CURRENT_TIMESTAMP WHERE provider_id=?`).run(ctx.providerId);
      }
      const postcode=text(fd,'postcode'); const geo=await geocodePostcode(postcode); if(geo)db.prepare('UPDATE provider_profiles SET lat=?,lon=? WHERE user_id=?').run(geo.lat,geo.lon,ctx.providerId);
    }
  }
  revalidatePath(user.role==='provider'?'/pro/profile':'/app/profile'); revalidatePath('/pro'); revalidatePath('/pro/team');
}

export async function uploadDocumentAction(jobId:number, fd:FormData){
  const user=await requireUser('provider'); const ctx=canAccessProviderJob(user.id,jobId); if(!ctx)return;
  const allowed=db.prepare(`SELECT j.homeowner_id,j.title FROM jobs j JOIN quotes q ON q.id=j.accepted_quote_id WHERE j.id=? AND q.provider_id=?`).get(jobId,ctx.providerId) as {homeowner_id:number,title:string}|undefined;
  if(!allowed) return;
  const file=fd.get('document'); if(!(file instanceof File) || file.size===0) return;
  const stored=await savePrivateFile(file,'documents');
  const kind=['invoice','offer','report','warranty','other'].includes(text(fd,'kind'))?text(fd,'kind'):'other';
  const inserted=db.prepare('INSERT INTO documents(job_id,provider_id,kind,title,path) VALUES(?,?,?,?,?)').run(jobId,ctx.providerId,kind,text(fd,'title').slice(0,160),stored);
  enqueueDocumentIntelligence({homeownerId:allowed.homeowner_id,sourceType:'job_document',sourceId:Number(inserted.lastInsertRowid),storedPath:stored,originalName:text(fd,'title').slice(0,160)||file.name,mimeType:file.type});
  createNotification(allowed.homeowner_id,'Neues Dokument',`${text(fd,'title').slice(0,160)} wurde zu „${allowed.title}“ hinzugefügt.`,`/app/documents`,'document');
  revalidatePath(`/pro/jobs/${jobId}`); revalidatePath('/app/documents'); revalidatePath(`/app/jobs/${jobId}`); revalidatePath('/notifications');
}


export async function uploadOwnerDocumentAction(fd:FormData){
  const user=await requireUser('homeowner');
  const property=primaryProperty(user.id);
  const file=fd.get('document');
  if(!(file instanceof File)||file.size===0)return;
  const stored=await savePrivateFile(file,'house-documents');
  const title=(text(fd,'title')||file.name).slice(0,180);
  const inserted=db.prepare(`INSERT INTO house_documents(homeowner_id,property_id,title,path,kind) VALUES(?,?,?,?,'other')`).run(user.id,property?.id??null,title,stored);
  enqueueDocumentIntelligence({homeownerId:user.id,sourceType:'house_document',sourceId:Number(inserted.lastInsertRowid),storedPath:stored,originalName:title,mimeType:file.type});
  revalidatePath('/app/documents');revalidatePath('/notifications');redirect('/app/documents?uploaded=1');
}

export async function addHouseHistoryAction(fd:FormData){
  const user=await requireUser('homeowner'); const property=primaryProperty(user.id); if(!property)return; const title=text(fd,'title'); const performedAt=text(fd,'performedAt'); if(!title||!performedAt)return;
  const before=fd.get('beforePhoto'); const after=fd.get('afterPhoto'); const document=fd.get('document');
  const beforePath=before instanceof File&&before.size?await savePrivateFile(before,'house-history'):null; const afterPath=after instanceof File&&after.size?await savePrivateFile(after,'house-history'):null;
  const companyName=text(fd,'companyName'); const contactEmail=text(fd,'contactEmail').toLowerCase(); let providerId:number|null=null;
  if(contactEmail){const byEmail=db.prepare(`SELECT p.user_id FROM provider_profiles p JOIN users u ON u.id=p.user_id WHERE lower(u.email)=lower(?) LIMIT 1`).get(contactEmail) as {user_id:number}|undefined;providerId=byEmail?.user_id||null;}
  if(!providerId&&companyName){const byName=db.prepare(`SELECT user_id FROM provider_profiles WHERE lower(business_name)=lower(?) LIMIT 1`).get(companyName) as {user_id:number}|undefined;providerId=byName?.user_id||null;}
  const cost=Number(String(fd.get('cost')||'').replace(',','.')); const costAmount=Number.isFinite(cost)&&cost>=0?Math.round(cost*100):null; const category=normalizeContactCategory(text(fd,'category')||'Haus');
  const r=db.prepare(`INSERT INTO house_history_entries(homeowner_id,category,title,performed_at,company_name,provider_id,contact_name,contact_phone,contact_email,cost_amount,guarantee_until,maintenance_due,notes,before_photo,after_photo,property_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(user.id,category,title,performedAt,companyName,providerId,text(fd,'contactName'),text(fd,'contactPhone'),contactEmail,costAmount,text(fd,'guaranteeUntil')||null,text(fd,'maintenanceDue')||null,text(fd,'notes').slice(0,3000),beforePath,afterPath,property.id);
  const entryId=Number(r.lastInsertRowid);
  if(document instanceof File&&document.size){
    const stored=await savePrivateFile(document,'house-history');
    const inserted=db.prepare(`INSERT INTO house_history_documents(entry_id,title,path) VALUES(?,?,?)`).run(entryId,text(fd,'documentTitle')||document.name,stored);
    enqueueDocumentIntelligence({homeownerId:user.id,sourceType:'history_document',sourceId:Number(inserted.lastInsertRowid),storedPath:stored,originalName:text(fd,'documentTitle')||document.name,mimeType:document.type});
  }
  if(providerId){const member=db.prepare(`SELECT user_id FROM provider_members WHERE provider_id=? AND active=1 ORDER BY can_manage_jobs DESC,id LIMIT 1`).get(providerId) as {user_id:number}|undefined;if(member)db.prepare(`INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category,last_job_id,property_id,updated_at) VALUES(?,?,?,?,NULL,?,CURRENT_TIMESTAMP) ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET provider_id=excluded.provider_id,category=excluded.category,property_id=excluded.property_id,updated_at=CURRENT_TIMESTAMP`).run(user.id,providerId,member.user_id,category,property.id);}
  else if(contactEmail){db.prepare(`INSERT INTO provider_invites(homeowner_id,email,company_name,category,token,property_id) VALUES(?,?,?,?,?,?)`).run(user.id,contactEmail,companyName,category,randomUUID(),property.id);}
  const maintenanceDue=text(fd,'maintenanceDue');
  const derived=ensureCompletedWorkMaintenance(user.id,property.id,category,title,performedAt,maintenanceDue||null);
  if(maintenanceDue&&!derived)ensureMaintenanceTask({homeownerId:user.id,propertyId:property.id,title:`Wartung: ${title}`,category,dueDate:maintenanceDue});
  revalidatePath('/app/home');revalidatePath('/app/home/history');revalidatePath('/app/year');revalidatePath('/app/messages');
}

export async function createHouseTransferAction(fd:FormData){
  const user=await requireUser('homeowner'); const property=primaryProperty(user.id); const email=text(fd,'targetEmail').toLowerCase(); if(!property||!email)return;
  const token=randomUUID(); db.prepare(`INSERT INTO house_transfers(homeowner_id,target_email,token,property_id) VALUES(?,?,?,?)`).run(user.id,email,token,property.id);
  const target=db.prepare(`SELECT id FROM users WHERE lower(email)=lower(?) AND role='homeowner'`).get(email) as {id:number}|undefined; if(target)createNotification(target.id,'Hausakte zur Übergabe bereit',`${user.first_name} ${user.last_name} möchte dir eine digitale Hausakte übergeben.`,`/transfer/${token}`,'house_transfer');
  revalidatePath('/app/home/history'); redirect(`/app/home/history?transfer=${token}`);
}

export async function acceptHouseTransferAction(token:string){
  const user=await requireUser('homeowner'); const transfer=db.prepare(`SELECT * FROM house_transfers WHERE token=? AND status='active'`).get(token) as any; if(!transfer)return;
  if(String(transfer.target_email).toLowerCase()!==user.email.toLowerCase())redirect(`/transfer/${token}?error=Diese%20Hausakte%20wurde%20f%C3%BCr%20eine%20andere%20E-Mail-Adresse%20freigegeben`);
  const propertyId=Number(transfer.property_id); if(!propertyId||!propertyOwnedBy(transfer.homeowner_id,propertyId))return;
  const property=db.prepare(`SELECT * FROM properties WHERE id=?`).get(propertyId) as any; if(!property)return;
  const tx=db.transaction(()=>{
    db.prepare(`UPDATE property_ownerships SET active=0,ended_at=CURRENT_TIMESTAMP WHERE property_id=? AND homeowner_id=? AND active=1`).run(propertyId,transfer.homeowner_id);
    db.prepare(`INSERT INTO property_ownerships(property_id,homeowner_id,started_at,active) VALUES(?,?,CURRENT_TIMESTAMP,1)`).run(propertyId,user.id);
    db.prepare(`UPDATE homeowner_profiles SET postcode=?,address=?,lat=?,lon=?,house_type=?,build_year=?,living_area=?,plot_area=? WHERE user_id=?`).run(property.postcode,property.address,property.lat,property.lon,property.property_type,property.build_year,property.living_area,property.plot_area,user.id);
    db.prepare(`UPDATE house_assets SET homeowner_id=? WHERE property_id=?`).run(user.id,propertyId);
    db.prepare(`UPDATE maintenance_tasks SET homeowner_id=? WHERE property_id=?`).run(user.id,propertyId);
    db.prepare(`UPDATE document_intelligence_jobs SET homeowner_id=? WHERE source_type='house_document' AND source_id IN (SELECT id FROM house_documents WHERE property_id=?)`).run(user.id,propertyId);
    db.prepare(`UPDATE house_documents SET homeowner_id=?,updated_at=CURRENT_TIMESTAMP WHERE property_id=?`).run(user.id,propertyId);
    const contacts=db.prepare(`SELECT * FROM homeowner_contacts WHERE property_id=? AND homeowner_id=?`).all(propertyId,transfer.homeowner_id) as any[];
    const upsertContact=db.prepare(`INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category,last_job_id,property_id,updated_at) VALUES(?,?,?,?,NULL,?,CURRENT_TIMESTAMP) ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET provider_id=excluded.provider_id,category=excluded.category,property_id=excluded.property_id,updated_at=CURRENT_TIMESTAMP`);
    for(const contact of contacts)upsertContact.run(user.id,contact.provider_id,contact.contact_user_id,contact.category,propertyId);
    // House-related contacts are copied to the buyer, but the prior owner's private
    // conversation relationship remains theirs. Detach it from the transferred house
    // instead of deleting it so historical private messages stay accessible only to
    // the previous homeowner.
    db.prepare(`UPDATE homeowner_contacts SET property_id=NULL,updated_at=CURRENT_TIMESTAMP WHERE property_id=? AND homeowner_id=?`).run(propertyId,transfer.homeowner_id);
    // Ownership transfer invalidates every sale-purpose broker permission granted by
    // the previous owner. Keep this inside the same transaction as the ownership
    // mutation so a broker can never observe the transferred property with a stale
    // active share. The buyer must explicitly create a new sale share if desired.
    db.prepare(`UPDATE property_shares SET status='revoked',revoked_at=CURRENT_TIMESTAMP WHERE property_id=? AND purpose='sale' AND status='active'`).run(propertyId);
    db.prepare(`UPDATE broker_lead_matches SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE sale_lead_id IN (SELECT id FROM sale_leads WHERE property_id=?) AND status NOT IN ('sold','rejected','revoked')`).run(propertyId);
    db.prepare(`UPDATE house_transfers SET status='accepted',accepted_by_user_id=?,accepted_at=CURRENT_TIMESTAMP WHERE id=?`).run(user.id,transfer.id);
  });tx();
  createNotification(transfer.homeowner_id,'Hausakte übergeben',`${user.first_name} ${user.last_name} hat die Hausakte übernommen.`,'/app/home/history','house_transfer'); revalidatePath('/app/home');revalidatePath('/app/home/history');revalidatePath('/app/year');revalidatePath('/app/messages');redirect('/app/home?transfer=accepted');
}

export async function savePropertyValuationAction(fd:FormData){
  const user=await requireUser('homeowner'); const property=primaryProperty(user.id); if(!property)return;
  const toCents=(key:string)=>{const value=Number(String(fd.get(key)||'').replace(',','.'));return Number.isFinite(value)&&value>=0?Math.round(value*100):null;};
  const estimatedMin=toCents('estimatedMin'); const estimatedMax=toCents('estimatedMax'); const type=text(fd,'valuationType')||'orientation'; const notes=text(fd,'notes').slice(0,2000);
  const completed=estimatedMin!=null&&estimatedMax!=null&&estimatedMax>=estimatedMin;
  db.prepare(`INSERT INTO property_valuations(property_id,homeowner_id,status,valuation_type,estimated_min,estimated_max,notes,completed_at) VALUES(?,?,?, ?,?,?,?,?)`).run(property.id,user.id,completed?'completed':'requested',type,estimatedMin,estimatedMax,notes,completed?new Date().toISOString():null);
  if(completed)db.prepare(`UPDATE properties SET estimated_value_min=?,estimated_value_max=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(estimatedMin,estimatedMax,property.id);
  revalidatePath('/app/home/sale'); revalidatePath('/app/home');
}

export async function startSaleProcessAction(){
  const user=await requireUser('homeowner'); const property=primaryProperty(user.id); if(!property)return;
  let lead=db.prepare(`SELECT id FROM sale_leads WHERE property_id=? AND homeowner_id=? AND status NOT IN ('sold','cancelled') ORDER BY id DESC LIMIT 1`).get(property.id,user.id) as {id:number}|undefined;
  if(!lead){const result=db.prepare(`INSERT INTO sale_leads(property_id,homeowner_id,status) VALUES(?,?,'interested')`).run(property.id,user.id);lead={id:Number(result.lastInsertRowid)};}
  createBrokerMatches(lead.id);
  revalidatePath('/app/home/sale'); redirect(`/app/home/sale?lead=${lead.id}`);
}

export async function grantBrokerContactAction(matchId:number){
  const user=await requireUser('homeowner');
  const match=db.prepare(`SELECT m.*,l.property_id,l.homeowner_id,p.business_name FROM broker_lead_matches m JOIN sale_leads l ON l.id=m.sale_lead_id JOIN provider_profiles p ON p.user_id=m.provider_id WHERE m.id=?`).get(matchId) as any;
  if(!match||match.homeowner_id!==user.id||!propertyOwnedBy(user.id,match.property_id))return;
  const permissions=JSON.stringify(['property_summary','owner_contact']);
  db.prepare(`UPDATE property_shares SET status='revoked',revoked_at=CURRENT_TIMESTAMP WHERE property_id=? AND provider_id=? AND purpose='sale' AND status='active'`).run(match.property_id,match.provider_id);
  db.prepare(`INSERT INTO property_shares(property_id,homeowner_id,provider_id,purpose,permissions_json,status) VALUES(?,?,?,'sale',?,'active')`).run(match.property_id,user.id,match.provider_id,permissions);
  db.prepare(`UPDATE broker_lead_matches SET status='contact_released',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(matchId);
  db.prepare(`UPDATE sale_leads SET status='contact_released',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('interested','matched')`).run(match.sale_lead_id);
  for(const managerId of getProviderManagerIds(match.provider_id))createNotification(managerId,'Neue freigegebene Immobilienanfrage',`${user.first_name} ${user.last_name} hat den Kontakt für eine passende Immobilie freigegeben.`,`/pro/leads?match=${matchId}`,'sale_lead');
  createNotification(user.id,'Kontakt freigegeben',`${match.business_name} darf jetzt die freigegebene Objektzusammenfassung und deine Kontaktdaten sehen. Private Dokumente bleiben gesperrt.`,'/app/home/sale','privacy');
  revalidatePath('/app/home/sale'); revalidatePath('/pro/leads'); revalidatePath('/notifications');
}

export async function revokeBrokerContactAction(matchId:number){
  const user=await requireUser('homeowner'); const match=db.prepare(`SELECT m.*,l.property_id,l.homeowner_id FROM broker_lead_matches m JOIN sale_leads l ON l.id=m.sale_lead_id WHERE m.id=?`).get(matchId) as any; if(!match||match.homeowner_id!==user.id)return;
  db.prepare(`UPDATE property_shares SET status='revoked',revoked_at=CURRENT_TIMESTAMP WHERE property_id=? AND provider_id=? AND purpose='sale' AND status='active'`).run(match.property_id,match.provider_id);
  db.prepare(`UPDATE broker_lead_matches SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(matchId);
  for(const managerId of getProviderManagerIds(match.provider_id))createNotification(managerId,'Freigabe widerrufen','Der Eigentümer hat die Freigabe für diese Immobilienanfrage widerrufen.','/pro/leads','privacy');
  revalidatePath('/app/home/sale'); revalidatePath('/pro/leads'); revalidatePath('/notifications');
}

export async function updateBrokerLeadStatusAction(matchId:number,fd:FormData){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.canManageJobs)return;
  const requested=text(fd,'status'); const allowed=new Set(['interested','rejected','inspection','mandate','sold']); if(!allowed.has(requested))return;
  const match=db.prepare(`SELECT m.*,l.property_id,l.homeowner_id,l.id sale_lead_id FROM broker_lead_matches m JOIN sale_leads l ON l.id=m.sale_lead_id WHERE m.id=? AND m.provider_id=?`).get(matchId,ctx.providerId) as any; if(!match)return;
  const share=db.prepare(`SELECT 1 FROM property_shares WHERE property_id=? AND provider_id=? AND purpose='sale' AND status='active'`).get(match.property_id,ctx.providerId); if(!share)return;
  db.prepare(`UPDATE broker_lead_matches SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(requested,matchId);
  if(['inspection','mandate','sold'].includes(requested))db.prepare(`UPDATE sale_leads SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(requested,match.sale_lead_id);
  const labels:Record<string,string>={interested:'Makler hat Interesse',rejected:'Makler lehnt Anfrage ab',inspection:'Besichtigung vereinbart',mandate:'Maklerauftrag erteilt',sold:'Immobilie verkauft'};
  createNotification(match.homeowner_id,labels[requested]||'Verkaufsprozess aktualisiert',`${ctx.businessName} hat den Status deiner Immobilienanfrage aktualisiert.`,'/app/home/sale','sale_lead');
  revalidatePath('/pro/leads'); revalidatePath('/app/home/sale'); revalidatePath('/notifications');
}

export async function adminLoginAction(fd:FormData){
  const ip=await clientIp();
  const limit=checkRateLimit('admin_login', ip);
  if(!limit.allowed){ rateLimitBlockedEvent('admin_login', ip, limit.retryAfterSeconds); logAdminAudit('admin-login','login_blocked',`ip:${ip}`); redirect('/admin/login?error=Anmeldung%20fehlgeschlagen'); }
  const parsed=adminLoginSchema.safeParse({ password: String(fd.get('password') ?? '').trim() });
  // Constant-shape check runs on every attempt, including malformed input.
  const password=parsed.success ? parsed.data.password : '';
  if(!adminPasswordMatches(password)){
    recordRateLimitFailure('admin_login', ip);
    logSecurityEvent('admin_login_fail','admin',`ip=${ip}`);
    logAdminAudit('admin-login','login_fail',`ip:${ip}`);
    redirect('/admin/login?error=Anmeldung%20fehlgeschlagen');
  }
  recordRateLimitSuccess('admin_login', ip);
  logSecurityEvent('admin_login_ok','admin',`ip=${ip}`);
  logAdminAudit('admin-login','login_ok',`ip:${ip}`);
  await createAdminSession(); redirect('/admin');
}
export async function adminLogoutAction(){await destroyAdminSession();redirect('/admin/login');}

async function savePrivateFile(file:File,subdir:string){
  const ok=file.type==='application/pdf'||file.type.startsWith('image/');
  if(!ok||file.size===0||file.size>12*1024*1024) throw new Error('Ungültige Datei');
  const ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').slice(0,6)||'bin';
  const name=`${Date.now()}-${randomUUID()}.${ext}`; const dir=path.join(privateRoot(),subdir);
  await fs.mkdir(dir,{recursive:true}); await fs.writeFile(path.join(dir,name),Buffer.from(await file.arrayBuffer()),{mode:0o600});
  return `${subdir}/${name}`;
}

export async function submitVerificationAction(fd:FormData){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.isOwner)redirect('/pro/profile?verification=owner'); const file=fd.get('document');
  if(!(file instanceof File)||file.size===0) redirect('/pro/profile?verification=file');
  const saved=await savePrivateFile(file,'verification');
  db.prepare(`INSERT INTO verification_requests(provider_id,document_path,status,provider_note,submitted_at,reviewed_at,admin_note) VALUES(?,?,'pending',?,CURRENT_TIMESTAMP,NULL,'') ON CONFLICT(provider_id) DO UPDATE SET document_path=excluded.document_path,status='pending',provider_note=excluded.provider_note,submitted_at=CURRENT_TIMESTAMP,reviewed_at=NULL,admin_note=''`).run(ctx.providerId,saved,text(fd,'note').slice(0,1000));
  db.prepare('UPDATE provider_profiles SET verified=0 WHERE user_id=?').run(ctx.providerId);
  revalidatePath('/pro/profile'); revalidatePath('/admin'); redirect('/pro/profile?verification=submitted');
}

export async function adminReviewVerificationAction(requestId:number,fd:FormData){
  await requireAdmin();
  const parsed=verificationDecisionSchema.safeParse({ decision: text(fd,'decision'), adminNote: text(fd,'adminNote') });
  if(!parsed.success){ logAdminAudit('admin','verification_review_invalid',`request:${requestId}`); return; }
  const { decision, adminNote } = parsed.data;
  const row=db.prepare('SELECT provider_id FROM verification_requests WHERE id=?').get(requestId) as {provider_id:number}|undefined; if(!row)return;
  const tx=db.transaction(()=>{db.prepare('UPDATE verification_requests SET status=?,admin_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?').run(decision,adminNote,requestId);db.prepare('UPDATE provider_profiles SET verified=? WHERE user_id=?').run(decision==='approved'?1:0,row.provider_id);logAdminAudit('admin','verification_review',`provider:${row.provider_id}`,`request=${requestId};decision=${decision}`);}); tx();
  createNotification(row.provider_id,decision==='approved'?'Unternehmensprüfung bestanden':'Unternehmensprüfung abgelehnt',decision==='approved'?'Deine Unternehmensnachweise sind geprüft. Für Kundenanfragen muss zusätzlich der Einfach-Hausen-Partnervertrag aktiv sein.':(adminNote||'Bitte prüfe deine Nachweise und reiche sie erneut ein.'),'/pro/profile','verification');
  revalidatePath('/admin'); revalidatePath('/pro/profile'); revalidatePath('/pro'); revalidatePath('/notifications');
}

export async function createInsuranceSupportAction(jobId:number,fd:FormData){
  const user=await requireUser('homeowner');
  if(!Number.isSafeInteger(jobId)||jobId<=0){
    logSecurityEvent('security_validation_reject','insurance_support','invalid_job');
    redirect('/app/insurance?error=Der%20Auftrag%20ist%20ung%C3%BCltig');
  }
  const limit=consumeHomeownerServiceLimit('insurance_support',user.id);
  if(!limit.allowed)redirect('/app/insurance?error=Zu%20viele%20Anfragen.%20Bitte%20versuche%20es%20sp%C3%A4ter%20erneut');
  const submitted=text(fd,'description');
  const bounded=intakeDescriptionSchema.safeParse({description:submitted});
  if(!bounded.success||bounded.data.description.length<20){
    logSecurityEvent('security_validation_reject','insurance_support','invalid_description');
    redirect('/app/insurance?error=Beschreib%20den%20Schadenfall%20bitte%20mit%20mindestens%2020%20Zeichen');
  }
  const row=db.prepare(`SELECT j.homeowner_id,j.status,j.request_kind,q.provider_id,c.id claim_id
    FROM jobs j
    JOIN quotes q ON q.id=j.accepted_quote_id
    LEFT JOIN claims c ON c.job_id=j.id
    WHERE j.id=? AND j.homeowner_id=?`).get(jobId,user.id) as {homeowner_id:number;status:string;request_kind:string;provider_id:number;claim_id:number|null}|undefined;
  if(!row||row.homeowner_id!==user.id||row.request_kind!=='service'||!['accepted','in_progress','completed'].includes(row.status)){
    logSecurityEvent('security_validation_reject','insurance_support',`unauthorized_job=${jobId}`);
    redirect('/app/insurance?error=F%C3%BCr%20diesen%20Auftrag%20kann%20keine%20Versicherungsunterst%C3%BCtzung%20angelegt%20werden');
  }
  if(row.claim_id)redirect('/app/insurance?error=Zu%20diesem%20Auftrag%20gibt%20es%20bereits%20einen%20Servicefall');
  const description=`Versicherungsunterstützung: ${bounded.data.description}`.slice(0,4000);
  const created=db.prepare(`INSERT OR IGNORE INTO claims(job_id,homeowner_id,provider_id,description,status) VALUES(?,?,?,?,'pending')`).run(jobId,user.id,row.provider_id,description);
  if(created.changes!==1)redirect('/app/insurance?error=Der%20Servicefall%20wurde%20bereits%20angelegt');
  const assigned=db.prepare('SELECT contact_user_id FROM job_assignments WHERE job_id=?').get(jobId) as {contact_user_id:number}|undefined;
  const recipients=new Set<number>([...getProviderManagerIds(row.provider_id),...(assigned?[assigned.contact_user_id]:[])]);
  for(const recipient of recipients)createNotification(recipient,'Versicherungsunterstützung angefragt',`Der Kunde hat zu Auftrag #${jobId} einen Servicefall zur Versicherungsunterstützung übergeben.`,`/pro/jobs/${jobId}`,'claim');
  createNotification(user.id,'Servicefall übernommen',`Die Versicherungsunterstützung zu Auftrag #${jobId} wurde intern übernommen. Eine Versicherung wurde nicht automatisch kontaktiert.`,`/app/jobs/${jobId}`,'claim');
  revalidatePath('/app/insurance'); revalidatePath(`/app/jobs/${jobId}`); revalidatePath(`/pro/jobs/${jobId}`); revalidatePath('/admin'); revalidatePath('/notifications');
  redirect(`/app/insurance?success=${jobId}`);
}

export async function createClaimAction(jobId:number,fd:FormData){
  const user=await requireUser('homeowner'); const description=text(fd,'description'); if(description.length<20)return;
  const row=db.prepare(`SELECT j.homeowner_id,j.status,q.provider_id FROM jobs j JOIN quotes q ON q.id=j.accepted_quote_id WHERE j.id=?`).get(jobId) as any;
  if(!row||row.homeowner_id!==user.id||!['accepted','in_progress','completed'].includes(row.status)) return;
  db.prepare(`INSERT INTO claims(job_id,homeowner_id,provider_id,description,status) VALUES(?,?,?,?,'pending') ON CONFLICT(job_id) DO UPDATE SET description=excluded.description,status=CASE WHEN claims.status IN ('resolved','rejected') THEN 'pending' ELSE claims.status END,admin_note=CASE WHEN claims.status IN ('resolved','rejected') THEN '' ELSE claims.admin_note END,updated_at=CURRENT_TIMESTAMP`).run(jobId,user.id,row.provider_id,description.slice(0,4000));
  const assigned=db.prepare('SELECT contact_user_id FROM job_assignments WHERE job_id=?').get(jobId) as {contact_user_id:number}|undefined;
  const recipients=new Set<number>([...getProviderManagerIds(row.provider_id),...(assigned?[assigned.contact_user_id]:[])]); for(const recipient of recipients)createNotification(recipient,'Problemfall gemeldet',`Der Kunde hat zu Auftrag #${jobId} einen Problemfall gemeldet.`,`/pro/jobs/${jobId}`,'claim');
  revalidatePath(`/app/jobs/${jobId}`); revalidatePath(`/pro/jobs/${jobId}`); revalidatePath('/admin'); revalidatePath('/notifications');
}

export async function adminUpdateClaimAction(claimId:number,fd:FormData){
  await requireAdmin();
  const parsed=claimStatusSchema.safeParse({ status: text(fd,'status'), adminNote: text(fd,'adminNote') });
  if(!parsed.success){ logAdminAudit('admin','claim_update_invalid',`claim:${claimId}`); return; }
  const { status, adminNote } = parsed.data;
  const claim=db.prepare('SELECT job_id,homeowner_id,provider_id FROM claims WHERE id=?').get(claimId) as {job_id:number,homeowner_id:number,provider_id:number}|undefined; if(!claim)return;
  db.transaction(()=>{db.prepare('UPDATE claims SET status=?,admin_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,adminNote,claimId);logAdminAudit('admin','claim_update',`claim:${claimId}`,`job=${claim.job_id};status=${status}`);})();
  const body=adminNote||`Der Fall wurde auf „${status}“ gesetzt.`; createNotification(claim.homeowner_id,'Problemfall aktualisiert',body,`/app/jobs/${claim.job_id}`,'claim');
  const assigned=db.prepare('SELECT contact_user_id FROM job_assignments WHERE job_id=?').get(claim.job_id) as {contact_user_id:number}|undefined; const recipients=new Set<number>([...getProviderManagerIds(claim.provider_id),...(assigned?[assigned.contact_user_id]:[])]); for(const recipient of recipients)createNotification(recipient,'Problemfall aktualisiert',body,`/pro/jobs/${claim.job_id}`,'claim');
  logAdminAudit('admin','claim_update',`claim:${claimId}`,`job=${claim.job_id};status=${status}`);
  revalidatePath('/admin'); revalidatePath(`/app/jobs/${claim.job_id}`); revalidatePath(`/pro/jobs/${claim.job_id}`); revalidatePath('/notifications');
}

export async function createStripeOnboardingAction(){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.isOwner)redirect('/pro/profile?stripe=owner');
  if(!process.env.STRIPE_SECRET_KEY) redirect('/pro/profile?stripe=missing');
  const profile=db.prepare('SELECT stripe_account_id,business_name FROM provider_profiles WHERE user_id=?').get(ctx.providerId) as any;
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY); let accountId=profile?.stripe_account_id as string|undefined;
  if(!accountId){const account=await stripe.accounts.create({type:'express',country:'DE',email:user.email,business_profile:{name:profile?.business_name||`${user.first_name} ${user.last_name}`},capabilities:{card_payments:{requested:true},transfers:{requested:true}}});accountId=account.id;db.prepare('UPDATE provider_profiles SET stripe_account_id=?,stripe_onboarded=0 WHERE user_id=?').run(accountId,ctx.providerId);}
  const origin=process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000';
  const link=await stripe.accountLinks.create({account:accountId,refresh_url:`${origin}/api/stripe/connect/refresh`,return_url:`${origin}/api/stripe/connect/return`,type:'account_onboarding'});
  redirect(link.url);
}

export async function markNotificationsReadAction(){const user=await requireUser();db.prepare('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL').run(user.id);revalidatePath('/notifications');}

export async function declineDispatchAction(jobId:number){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.canManageJobs)return;
  db.prepare(`UPDATE job_dispatches SET status='declined',responded_at=CURRENT_TIMESTAMP WHERE job_id=? AND provider_id=? AND status IN ('sent','viewed')`).run(jobId,ctx.providerId);
  revalidatePath('/pro'); revalidatePath(`/pro/jobs/${jobId}`);
}

export async function adminUpdatePartnerContractAction(providerId:number,fd:FormData){
  await requireAdmin();
  const parsed=partnerContractSchema.safeParse({
    status: text(fd,'status'),
    discountBps: int(fd,'discountBps') ?? 0,
    responseTarget: int(fd,'responseTarget') ?? 30,
    contractNotes: text(fd,'contractNotes'),
  });
  if(!parsed.success){ logAdminAudit('admin','contract_update_invalid',`provider:${providerId}`); return; }
  const { status, discountBps: discount, responseTarget: response, contractNotes } = parsed.data;
  const commission=0;
  db.transaction(()=>{
    db.prepare(`INSERT INTO partner_contracts(provider_id,status,commission_bps,customer_discount_bps,insurance_verified,qualification_verified,contract_verified,quality_standard_verified,response_target_minutes,starts_at,notes,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,CASE WHEN ?='active' THEN COALESCE((SELECT starts_at FROM partner_contracts WHERE provider_id=?),CURRENT_TIMESTAMP) ELSE (SELECT starts_at FROM partner_contracts WHERE provider_id=?) END,?,CURRENT_TIMESTAMP)
      ON CONFLICT(provider_id) DO UPDATE SET status=excluded.status,commission_bps=excluded.commission_bps,customer_discount_bps=excluded.customer_discount_bps,insurance_verified=excluded.insurance_verified,qualification_verified=excluded.qualification_verified,contract_verified=excluded.contract_verified,quality_standard_verified=excluded.quality_standard_verified,response_target_minutes=excluded.response_target_minutes,starts_at=excluded.starts_at,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`).run(
        providerId,status,commission,discount,fd.get('insurance')?1:0,fd.get('qualification')?1:0,fd.get('contract')?1:0,fd.get('quality')?1:0,response,status,providerId,providerId,contractNotes);
    logAdminAudit('admin','partner_contract_update',`provider:${providerId}`,`status=${status}`);
  })();
  createNotification(providerId,status==='active'?'Partnervertrag aktiv':'Partnerstatus aktualisiert',status==='active'?'Dein Einfach-Hausen-Partnervertrag ist aktiv. Passende regionale Kundenanfragen werden ab jetzt automatisch an dich disponiert.':`Dein Partnerstatus wurde auf ${status} gesetzt.`,'/pro/profile','contract');
  if(status==='active')await redispatchOpenJobs();
  revalidatePath('/admin'); revalidatePath('/pro'); revalidatePath('/pro/profile'); revalidatePath('/notifications');
}

export async function addProviderMemberAction(fd:FormData){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.canManageJobs)redirect('/pro/team?error=Keine%20Berechtigung');
  const parsed=providerMemberSchema.safeParse({email:text(fd,'email'),password:String(fd.get('password') ?? '').trim(),firstName:text(fd,'firstName'),lastName:text(fd,'lastName'),jobTitle:text(fd,'jobTitle'),phone:text(fd,'phone')});
  if(!parsed.success){ logSecurityEvent('security_validation_reject','member_add',`fields=${parsed.error.issues.length}`); redirect('/pro/team?error=Bitte%20alle%20Pflichtfelder%20ausf%C3%BCllen'); }
  const { email, password, firstName: first, lastName: last, jobTitle, phone } = parsed.data;
  if(db.prepare('SELECT id FROM users WHERE email=?').get(email))redirect('/pro/team?error=E-Mail%20ist%20bereits%20registriert');
  const hash=await bcrypt.hash(password,12);
  const tx=db.transaction(()=>{
    const r=db.prepare(`INSERT INTO users(email,password_hash,role,first_name,last_name,phone) VALUES(?,?,'provider',?,?,?)`).run(email,hash,first,last,phone||null);
    const memberId=Number(r.lastInsertRowid);
    db.prepare('INSERT INTO provider_members(provider_id,user_id,job_title,can_manage_jobs,active) VALUES(?,?,?,?,1)').run(ctx.providerId,memberId,jobTitle,fd.get('canManageJobs')?1:0);
    return memberId;
  });
  const memberId=tx(); createNotification(memberId,'Willkommen im Partnerteam',`Du hast jetzt App-Zugang für ${ctx.businessName}.`,'/pro','team');
  revalidatePath('/pro/team'); redirect('/pro/team?member=created');
}

export async function updateProviderMemberAction(memberUserId:number,fd:FormData){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.canManageJobs)return;
  const member=db.prepare('SELECT * FROM provider_members WHERE provider_id=? AND user_id=?').get(ctx.providerId,memberUserId) as any; if(!member)return;
  let nextManage=fd.get('canManageJobs')?1:0; let nextActive=fd.get('active')?1:0;
  if(memberUserId===ctx.providerId){nextManage=1;nextActive=1;}
  if(member.active&&member.can_manage_jobs&&(!nextManage||!nextActive)){const managers=(db.prepare('SELECT COUNT(*) c FROM provider_members WHERE provider_id=? AND active=1 AND can_manage_jobs=1').get(ctx.providerId) as {c:number}).c;if(managers<=1)redirect('/pro/team?error=Mindestens%20eine%20Person%20muss%20Auftr%C3%A4ge%20verwalten');}
  db.prepare('UPDATE provider_members SET job_title=?,can_manage_jobs=?,active=? WHERE provider_id=? AND user_id=?').run(text(fd,'jobTitle'),nextManage,nextActive,ctx.providerId,memberUserId);
  revalidatePath('/pro/team'); revalidatePath('/pro');
}

export async function assignJobContactAction(jobId:number,fd:FormData){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.canManageJobs)return;
  const contactUserId=int(fd,'contactUserId'); if(!contactUserId)return;
  const contact=db.prepare(`SELECT m.user_id,u.first_name,u.last_name FROM provider_members m JOIN users u ON u.id=m.user_id WHERE m.provider_id=? AND m.user_id=? AND m.active=1`).get(ctx.providerId,contactUserId) as any; if(!contact)return;
  const job=db.prepare(`SELECT j.id,j.homeowner_id,j.title,j.category,j.request_kind,j.property_id FROM jobs j WHERE j.id=? AND j.status IN ('accepted','in_progress') AND ((j.request_kind='contact' AND EXISTS(SELECT 1 FROM job_dispatches d WHERE d.job_id=j.id AND d.provider_id=? AND d.status='accepted')) OR EXISTS(SELECT 1 FROM quotes q WHERE q.id=j.accepted_quote_id AND q.provider_id=?))`).get(jobId,ctx.providerId,ctx.providerId) as any; if(!job)return;
  const previous=db.prepare('SELECT contact_user_id FROM job_assignments WHERE job_id=?').get(jobId) as {contact_user_id:number}|undefined;
  const tx=db.transaction(()=>{
    db.prepare(`INSERT INTO job_assignments(job_id,provider_id,contact_user_id,assigned_by_user_id) VALUES(?,?,?,?) ON CONFLICT(job_id) DO UPDATE SET contact_user_id=excluded.contact_user_id,assigned_by_user_id=excluded.assigned_by_user_id,assigned_at=CURRENT_TIMESTAMP`).run(jobId,ctx.providerId,contactUserId,user.id);
    if(job.request_kind!=='contact')db.prepare('UPDATE appointments SET contact_user_id=? WHERE job_id=?').run(contactUserId,jobId);
    if(previous&&previous.contact_user_id!==contactUserId)db.prepare('DELETE FROM homeowner_contacts WHERE homeowner_id=? AND contact_user_id=? AND last_job_id=?').run(job.homeowner_id,previous.contact_user_id,jobId);
    db.prepare(`INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category,last_job_id,property_id,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET provider_id=excluded.provider_id,category=excluded.category,last_job_id=excluded.last_job_id,property_id=excluded.property_id,updated_at=CURRENT_TIMESTAMP`).run(job.homeowner_id,ctx.providerId,contactUserId,normalizeContactCategory(job.category||''),jobId,job.property_id||null);
  }); tx();
  createNotification(job.homeowner_id,'Dein Ansprechpartner steht fest',`${contact.first_name} ${contact.last_name} von ${ctx.businessName} kümmert sich um „${job.title}“.`,`/app/jobs/${jobId}`,'contact');
  if(contactUserId!==user.id)createNotification(contactUserId,job.request_kind==='contact'?'Kontaktanfrage zugewiesen':'Auftrag zugewiesen',`Du bist jetzt Ansprechpartner für „${job.title.replace(/^Ansprechpartner:\s*/,'')}“.`,`/pro/jobs/${jobId}`,'assigned');
  appendJobEvent(jobId,job.request_kind==='contact'?`${contact.first_name} ${contact.last_name} von ${ctx.businessName} ist dein direkter Ansprechpartner. Du kannst jetzt schreiben oder anrufen; es ist weiterhin kein Auftrag vergeben.`:`${contact.first_name} ${contact.last_name} von ${ctx.businessName} ist dein direkter Ansprechpartner für diesen Auftrag. Du kannst jetzt direkt schreiben, anrufen oder den Termin abstimmen.`,{contactUserId,providerId:ctx.providerId,requestKind:job.request_kind});
  revalidatePath(`/pro/jobs/${jobId}`); revalidatePath(`/app/jobs/${jobId}`); revalidatePath('/app/messages'); revalidatePath('/pro/orders'); revalidatePath('/notifications');
}

export async function updateAutomationPrefsAction(fd:FormData){
  const user=await requireUser('homeowner');
  const patch:Record<string,boolean>={};
  for(const slug of ['wartungserinnerung','heiz-check-herbst','angebotsvergleich']){
    const v=fd.get(`automation:${slug}`);
    // Checkbox-Semantik: vorhanden+an -> true, 'off'/'0'/missing -> false.
    // Abo-Slugs filtert setAutomationPrefs ehrlich heraus (kein Enforcement erfunden).
    patch[slug]=v==='on'||v==='1'||v==='true';
  }
  const { setAutomationPrefs } = await import('@/lib/hausmanager');
  setAutomationPrefs(user.id,patch);
  revalidatePath('/app/hausmanager');
  redirect('/app/hausmanager?prefs=saved');
}

export async function updateContactCategoryAction(contactUserId:number,fd:FormData){
  const user=await requireUser('homeowner');
  const relation=db.prepare('SELECT 1 FROM homeowner_contacts WHERE homeowner_id=? AND contact_user_id=?').get(user.id,contactUserId);
  if(!relation)return;
  const custom=text(fd,'customCategory'); const selected=text(fd,'category');
  const category=normalizeContactCategory(custom||selected||'Haus & Allgemein');
  db.prepare('UPDATE homeowner_contacts SET category=?,updated_at=CURRENT_TIMESTAMP WHERE homeowner_id=? AND contact_user_id=?').run(category,user.id,contactUserId);
  revalidatePath('/app');revalidatePath('/app/messages');revalidatePath('/app/home');
  redirect(`/app/messages?contact=${contactUserId}&category=saved`);
}

export async function sendSavedContactMessageAction(contactUserId:number,homeownerId:number,fd:FormData){
  const user=await requireUser(); const body=text(fd,'body'); if(!body)return;
  const relation=db.prepare('SELECT * FROM homeowner_contacts WHERE homeowner_id=? AND contact_user_id=?').get(homeownerId,contactUserId) as any; if(!relation)return;
  let recipientId:number;
  if(user.role==='homeowner'){
    if(user.id!==homeownerId)return; recipientId=contactUserId;
  }else{
    if(user.id!==contactUserId)return; const ctx=getProviderContext(user.id); if(!ctx||ctx.providerId!==relation.provider_id)return; recipientId=homeownerId;
  }
  db.prepare('INSERT INTO contact_messages(homeowner_id,provider_id,contact_user_id,sender_id,body) VALUES(?,?,?,?,?)').run(homeownerId,relation.provider_id,contactUserId,user.id,body.slice(0,4000));
  createNotification(recipientId,'Neue direkte Nachricht',`${user.first_name}: ${body.slice(0,120)}`,user.role==='homeowner'?`/pro/messages?homeowner=${homeownerId}`:`/app/messages?contact=${contactUserId}`,'message');
  revalidatePath('/app/messages'); revalidatePath('/pro/messages'); revalidatePath('/notifications');
}

export async function startPartnerPlanCheckoutAction(planSlug:string){
  const user=await requireUser('provider'); const ctx=getProviderContext(user.id); if(!ctx?.isOwner)redirect('/pro/plans?error=Nur%20der%20Firmeninhaber%20kann%20den%20Tarif%20%C3%A4ndern');
  const plan=db.prepare('SELECT * FROM partner_plans WHERE slug=? AND active=1').get(planSlug) as any; if(!plan)return;
  if(plan.monthly_amount===0){const current=db.prepare('SELECT stripe_subscription_id FROM partner_subscriptions WHERE provider_id=?').get(ctx.providerId) as {stripe_subscription_id:string|null}|undefined;if(current?.stripe_subscription_id&&process.env.STRIPE_SECRET_KEY){const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);try{await stripe.subscriptions.cancel(current.stripe_subscription_id);}catch{}}db.prepare(`INSERT INTO partner_subscriptions(provider_id,plan_slug,status,updated_at) VALUES(?,?,'active',CURRENT_TIMESTAMP) ON CONFLICT(provider_id) DO UPDATE SET plan_slug=excluded.plan_slug,status='active',stripe_subscription_id=NULL,current_period_end=NULL,trial_end=NULL,updated_at=CURRENT_TIMESTAMP`).run(ctx.providerId,plan.slug);revalidatePath('/pro/plans');redirect('/pro/plans?checkout=success');}
  if(!process.env.STRIPE_SECRET_KEY)redirect('/pro/plans?error=Stripe%20ist%20noch%20nicht%20konfiguriert');
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY); const origin=process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000';
  db.prepare(`INSERT INTO partner_subscriptions(provider_id,plan_slug,status,updated_at) VALUES(?,?,'pending',CURRENT_TIMESTAMP) ON CONFLICT(provider_id) DO UPDATE SET plan_slug=excluded.plan_slug,status='pending',updated_at=CURRENT_TIMESTAMP`).run(ctx.providerId,plan.slug);
  const session=await stripe.checkout.sessions.create({mode:'subscription',customer_email:user.email,line_items:[{price_data:{currency:'eur',product_data:{name:`Einfach Hausen Partner ${plan.title}`},unit_amount:plan.monthly_amount,recurring:{interval:'month'}},quantity:1}],subscription_data:{trial_period_days:plan.trial_days||60},success_url:`${origin}/api/partner-memberships/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/pro/plans?checkout=cancelled`,metadata:{kind:'partner_membership',providerId:String(ctx.providerId),planSlug:plan.slug}});
  redirect(session.url!);
}

export async function saveHouseProfileAction(fd:FormData){
  const user=await requireUser('homeowner');
  const postcode=text(fd,'postcode');
  db.prepare(`UPDATE homeowner_profiles SET address=?,postcode=?,house_type=?,build_year=?,living_area=?,plot_area=? WHERE user_id=?`).run(text(fd,'address'),postcode,text(fd,'houseType'),int(fd,'buildYear'),Number(fd.get('livingArea'))||null,Number(fd.get('plotArea'))||null,user.id);
  const geo=await geocodePostcode(postcode); if(geo)db.prepare('UPDATE homeowner_profiles SET lat=?,lon=? WHERE user_id=?').run(geo.lat,geo.lon,user.id);
  syncPropertyFromLegacyProfile(user.id);
  revalidatePath('/app/home'); revalidatePath('/app/profile'); revalidatePath('/app/home/sale');
}

export async function addHouseAssetAction(fd:FormData){
  const user=await requireUser('homeowner'); const kind=text(fd,'kind'); const name=text(fd,'name'); if(!kind||!name)return; const property=primaryProperty(user.id); if(!property)return;
  const r=db.prepare('INSERT INTO house_assets(homeowner_id,kind,name,details,installed_year,property_id) VALUES(?,?,?,?,?,?)').run(user.id,kind,name,text(fd,'details').slice(0,1000),int(fd,'installedYear'),property.id);
  const assetId=Number(r.lastInsertRowid);
  ensureAssetMaintenance(user.id,property.id,assetId,kind,name);
  revalidatePath('/app/home'); revalidatePath('/app/year');
}

export async function completeMaintenanceTaskAction(taskId:number){
  const user=await requireUser('homeowner'); const property=primaryProperty(user.id); if(!property)return;
  completeMaintenanceAndScheduleNext(user.id,property.id,taskId);
  revalidatePath('/app/home'); revalidatePath('/app/year');
}

// --- Vertraege & Tarife -----------------------------------------------------

function ownHouseContract(id:number, homeownerId:number) {
  return db.prepare('SELECT * FROM house_contracts WHERE id=? AND homeowner_id=?').get(id, homeownerId) as any | undefined;
}

// "1.234,56" and "1234.56" both mean the same to a German homeowner.
function centsFromEurosInput(value:string): number | null {
  const raw = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function addHouseContractAction(fd:FormData){
  const user=await requireUser('homeowner'); const property=primaryProperty(user.id);
  const provider=text(fd,'provider'); if(!provider)return;
  const kindRaw=text(fd,'kind'); const kind=isContractKind(kindRaw)?kindRaw:'sonstiges';
  const intervalRaw=text(fd,'costInterval'); const costInterval=isCostInterval(intervalRaw)?intervalRaw:'month';
  const document=fd.get('document');
  const stored=document instanceof File&&document.size?await savePrivateFile(document,'house-contracts'):null;
  const inserted=db.prepare(`INSERT INTO house_contracts(homeowner_id,property_id,kind,provider,tariff,contract_number,cost_amount,cost_interval,started_at,term_months,renewal_months,cancellation_days,cancellation_deadline,notice,document_title,document_path) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(user.id,property?.id??null,kind,provider,text(fd,'tariff'),text(fd,'contractNumber'),
      centsFromEurosInput(text(fd,'cost')),costInterval,text(fd,'startedAt')||null,
      int(fd,'termMonths'),int(fd,'renewalMonths')??12,int(fd,'cancellationDays')??30,
      text(fd,'cancellationDeadline')||null,text(fd,'notice').slice(0,2000),
      text(fd,'documentTitle')||(document instanceof File?document.name:''),stored);
  if(stored&&document instanceof File)enqueueDocumentIntelligence({homeownerId:user.id,sourceType:'contract_document',sourceId:Number(inserted.lastInsertRowid),storedPath:stored,originalName:text(fd,'documentTitle')||document.name,mimeType:document.type});
  revalidatePath('/app/contracts'); redirect('/app/contracts?saved=1');
}

export async function updateHouseContractAction(fd:FormData){
  const user=await requireUser('homeowner'); const id=int(fd,'id'); if(!id)return;
  if(!ownHouseContract(id,user.id))return;
  const kindRaw=text(fd,'kind'); const kind=isContractKind(kindRaw)?kindRaw:'sonstiges';
  const intervalRaw=text(fd,'costInterval'); const costInterval=isCostInterval(intervalRaw)?intervalRaw:'month';
  db.prepare(`UPDATE house_contracts SET kind=?,provider=?,tariff=?,contract_number=?,cost_amount=?,cost_interval=?,started_at=?,term_months=?,renewal_months=?,cancellation_days=?,cancellation_deadline=?,notice=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND homeowner_id=?`)
    .run(kind,text(fd,'provider')||'Unbekannt',text(fd,'tariff'),text(fd,'contractNumber'),
      centsFromEurosInput(text(fd,'cost')),costInterval,text(fd,'startedAt')||null,
      int(fd,'termMonths'),int(fd,'renewalMonths')??12,int(fd,'cancellationDays')??30,
      text(fd,'cancellationDeadline')||null,text(fd,'notice').slice(0,2000),id,user.id);
  revalidatePath('/app/contracts'); redirect('/app/contracts?saved=1');
}

// Switching ends a contract; it never deletes it. The house file keeps what was
// in place before - that history is the point of the Hausakte.
export async function setHouseContractStatusAction(id:number, status:string){
  const user=await requireUser('homeowner');
  if(!['active','cancelled','expired'].includes(status))return;
  if(!ownHouseContract(id,user.id))return;
  db.prepare(`UPDATE house_contracts SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND homeowner_id=?`).run(status,id,user.id);
  revalidatePath('/app/contracts'); redirect('/app/contracts?saved=1');
}
