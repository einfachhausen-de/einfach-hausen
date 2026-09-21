import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import Database from 'better-sqlite3';
import { chromium } from 'playwright-core';

// T-0206 W1: design-audit screenshot harness. Captures the app surfaces the
// Notion originals reference: owner auth/onboarding/menu/dashboard + provider
// home/menu/firmendaten. Throwaway DB, ephemeral identities, production build.

const root = process.cwd();
const kongEnv = (() => { const raw = execFileSync('docker', ['inspect','-f','{{range .Config.Env}}{{println .}}{{end}}','supabase-kong'], {encoding:'utf8',stdio:['ignore','pipe','ignore']}); return Object.fromEntries(raw.trim().split('\n').filter(Boolean).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];})); })();
const supabaseUrl='https://supabase.delqhi.com', anonKey=kongEnv.SUPABASE_ANON_KEY, serviceKey=kongEnv.SUPABASE_SERVICE_KEY;
const tmpDir=fs.mkdtempSync(path.join(os.tmpdir(),'eh-appshot-'));
const dbPath=path.join(tmpDir,'app.db');
async function freePort(){return new Promise((res,rej)=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const a=s.address();s.close(()=>res(a.port));});s.on('error',rej);});}
const port=await freePort();
const child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','-H','127.0.0.1','-p',String(port)],{cwd:root,env:{...process.env,DATABASE_PATH:dbPath,AUTH_MODE:'supabase',SUPABASE_URL:supabaseUrl,SUPABASE_ANON_KEY:anonKey,SUPABASE_SERVICE_ROLE_KEY:serviceKey,NEXT_PUBLIC_SUPABASE_URL:supabaseUrl,NEXT_PUBLIC_SUPABASE_ANON_KEY:anonKey,NEXT_PUBLIC_APP_URL:`http://127.0.0.1:${port}`,SESSION_COOKIE_NAME:'mh_session_e2e',E2E_INSECURE_COOKIES:'1'},stdio:['ignore','pipe','pipe']});
const base=`http://127.0.0.1:${port}`;
for(let i=0;i<160;i++){try{const r=await fetch(`${base}/api/health`);if(r.status<500)break;}catch{}await new Promise(r=>setTimeout(r,250));}

async function identityWithRole(role){
  const email=`design-${role}-${randomUUID()}@e2e.einfachhausen.de`;
  const password='Design!'+Math.random().toString(36).slice(2,12);
  const mk=await fetch(`${supabaseUrl}/auth/v1/admin/users`,{method:'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true})});
  const identity=await mk.json();
  return { email, password, identity };
}
async function cookiesFor(email,password){
  const { createClient }=await import('@supabase/supabase-js');
  const c1=createClient(supabaseUrl,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const signed=await c1.auth.signInWithPassword({email,password});
  const items=[];
  const { createServerClient }=await import('@supabase/ssr');
  const sc=createServerClient(supabaseUrl,anonKey,{cookies:{getAll:()=>[],setAll:(i)=>{items.push(...i.map(x=>({name:x.name,value:x.value})));}}});
  await sc.auth.setSession({access_token:signed.data.session.access_token,refresh_token:signed.data.session.refresh_token});
  return items.map(({name,value})=>`${name}=${value}`).join('; ');
}

const outDir=path.join(root,'artifacts','design-audit');
fs.mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium-browser',args:['--no-sandbox']});
const allIdentities=[];

// --- Public auth + role screens (no persona needed) ---
const pubCtx=await browser.newContext({viewport:{width:390,height:844}});
const pub=await pubCtx.newPage();
const publicRoutes=[['/login','notion-LogIn_oder_Neu'],['/role','notion-first_action'],['/register?role=homeowner','notion-kontoerstellung.eigentumer'],['/register?role=provider','notion-firmendaten-register-provider']];
for(const [route,name] of publicRoutes){
  try{ await pub.goto(base+route,{waitUntil:'networkidle',timeout:30000}); await pub.waitForTimeout(500); await pub.screenshot({path:path.join(outDir,`app390-${name}.png`)}); console.log('shot',name); }
  catch(e){ console.log('skip',name,String(e).slice(0,80)); }
}
await pubCtx.close();

// --- Owner dashboard + menu (needs homeowner persona) ---
const owner=await identityWithRole('homeowner'); allIdentities.push(owner.identity);
const odb=new Database(dbPath);
odb.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name,auth_subject) VALUES(?,?,?,?,?,?)").run(owner.email,'x','homeowner','Maria','Muster',owner.identity.id);
const ownerId=Number(odb.prepare('SELECT id FROM users WHERE email=?').get(owner.email).id);
odb.prepare("INSERT INTO homeowner_profiles(user_id,postcode,address,onboarding_step) VALUES(?,'10115','Beispielweg 1','done')").run(ownerId);
odb.prepare("INSERT INTO properties(address,postcode) VALUES('Beispielweg 1','10115')").run();
const propertyId=Number(odb.prepare('SELECT id FROM properties ORDER BY id DESC LIMIT 1').get().id);
odb.prepare("INSERT INTO property_ownerships(property_id,homeowner_id,active) VALUES(?,?,1)").run(propertyId,ownerId);
const oc=await cookiesFor(owner.email,owner.password);
const ownerCtx=await browser.newContext({viewport:{width:390,height:844}});
const opage=await ownerCtx.newPage();
await opage.setExtraHTTPHeaders({cookie:oc});
const ownerRoutes=[['/app','notion-Homesceen_EH_02'],['/app/more','notion-Menuepunkte_01']];
for(const [route,name] of ownerRoutes){
  try{ await opage.goto(base+route,{waitUntil:'networkidle',timeout:30000}); await opage.waitForTimeout(600); await opage.screenshot({path:path.join(outDir,`app390-${name}.png`)}); console.log('shot',name); }
  catch(e){ console.log('skip',name,String(e).slice(0,80)); }
}
await ownerCtx.close();

// --- Provider home + firmendaten (needs verified+activated provider persona) ---
const prov=await identityWithRole('provider'); allIdentities.push(prov.identity);
odb.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name,auth_subject) VALUES(?,?,?,?,?,?)").run(prov.email,'x','provider','Thomas','Weber',prov.identity.id);
const provId=Number(odb.prepare('SELECT id FROM users WHERE email=?').get(prov.email).id);
odb.prepare("INSERT INTO provider_profiles(user_id,business_name,trades,postcode,radius_km,description,street_address,verified) VALUES(?,?,?,?,?,?,?,1)").run(provId,'Gartenbau Müller','Garten, Heckenschnitt','46325',40,'Garten- und Landschaftsbau','Gartenstraße 12, Borken');
odb.prepare("INSERT INTO partner_contracts(provider_id,status,commission_bps,insurance_verified,qualification_verified,contract_verified,quality_standard_verified) VALUES(?,'active',0,1,1,1,1)").run(provId);
odb.prepare("INSERT INTO provider_members(provider_id,user_id,job_title,can_manage_jobs,active) VALUES(?,?,?,?,1)").run(provId,provId,'GF',1);
odb.prepare("INSERT INTO provider_preferences(provider_id,accepts_normal_jobs) VALUES(?,1)").run(provId);
odb.prepare("INSERT INTO partner_subscriptions(provider_id,plan_slug,status) VALUES(?,'free','active')").run(provId);
const pc=await cookiesFor(prov.email,prov.password);
const provCtx=await browser.newContext({viewport:{width:390,height:844}});
const ppage=await provCtx.newPage();
await ppage.setExtraHTTPHeaders({cookie:pc});
const provRoutes=[['/pro','notion-Homesceen.dienstleister'],['/pro/profile','notion-firmendaten_und_leistungen']];
for(const [route,name] of provRoutes){
  try{ await ppage.goto(base+route,{waitUntil:'networkidle',timeout:30000}); await ppage.waitForTimeout(600); await ppage.screenshot({path:path.join(outDir,`app390-${name}.png`)}); console.log('shot',name); }
  catch(e){ console.log('skip',name,String(e).slice(0,80)); }
}
await provCtx.close();
await browser.close();

for(const ident of allIdentities){
  try{ await fetch(`${supabaseUrl}/auth/v1/admin/users/${ident.id}`,{method:'DELETE',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`}}); }catch{}
}
odb.close();
child.kill('SIGKILL');
try{fs.rmSync(tmpDir,{recursive:true,force:true});}catch{}
process.exit(0);
