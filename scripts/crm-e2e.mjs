import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import Database from 'better-sqlite3';
import { chromium } from 'playwright-core';

const repo=process.cwd();
const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),'einfach-hausen-crm-e2e-'));
const projectRoot=path.join(tempRoot,'project');
const databasePath=path.join(tempRoot,'app.sqlite3');
const researchPath=path.join(tempRoot,'research.sqlite3');
const adminPassword=`CrmE2E!${randomBytes(12).toString('hex')}`;
let server;
let browser;
let appDb;
let passed=0;
let failed=0;
const serverLog=[];

function check(condition,label,detail=''){
  if(condition){passed++;console.log(`PASS ${label}`);return;}
  failed++;console.error(`FAIL ${label}${detail?`: ${detail}`:''}`);
}

function browserExecutable(){
  const bundled=typeof chromium.executablePath==='function'?chromium.executablePath():'';
  const candidates=[
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    bundled,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/opt/google/chrome/chrome',
    '/snap/chromium/current/usr/lib/chromium-browser/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ].filter(Boolean);
  const found=candidates.find(candidate=>fs.existsSync(candidate));
  if(!found)throw new Error('No Chromium-family browser found; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH or CHROME_PATH');
  return found;
}

async function freePort(){
  return await new Promise((resolve,reject)=>{
    const socket=net.createServer();
    socket.unref();
    socket.on('error',reject);
    socket.listen(0,'127.0.0.1',()=>{const address=socket.address();const port=typeof address==='object'&&address?address.port:0;socket.close(()=>resolve(port));});
  });
}

// A failing route floods the log with identical "GET ... 500" lines and pushes
// the actual compile error out of the tail. Collapse the repetitions so the
// cause survives.
function serverLogTail(limit=60){
  const seen=new Set(); const out=[];
  for(let i=serverLog.length-1;i>=0&&out.length<limit;i-=1){
    const key=serverLog[i].trim();
    if(seen.has(key))continue;
    seen.add(key); out.unshift(serverLog[i]);
  }
  return out.join('');
}

async function waitForServer(url,timeoutMs=90000){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    if(server?.exitCode!==null&&server?.exitCode!==undefined)throw new Error(`Next server exited early (${server.exitCode})\n${serverLogTail()}`);
    try{const response=await fetch(url,{redirect:'manual'});if(response.status<500)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error(`Next server did not become ready\n${serverLogTail()}`);
}

async function waitForDb(query,args=[],predicate=value=>Boolean(value),timeoutMs=30000){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    const value=appDb.prepare(query).get(...args);
    if(predicate(value))return value;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error(`Timed out waiting for DB condition: ${query}`);
}


function createProjectCopy(){
  fs.mkdirSync(projectRoot,{recursive:true});
  // "packages" carries the design system: src/design-system/index.ts re-exports
  // ../../packages/eh-design/src. Scripts that run the precompiled build do not
  // notice its absence, scripts that compile in the copy (next dev) 500 on
  // every page because the canonical UI cannot be resolved.
  for(const directory of ['src','public','packages'])fs.cpSync(path.join(repo,directory),path.join(projectRoot,directory),{recursive:true});
  for(const file of ['package.json','tsconfig.json','next.config.ts','postcss.config.mjs','next-env.d.ts']){
    const source=path.join(repo,file);if(fs.existsSync(source))fs.copyFileSync(source,path.join(projectRoot,file));
  }
  fs.symlinkSync(path.join(repo,'node_modules'),path.join(projectRoot,'node_modules'),'dir');
}

function createResearchFixture(){
  const research=new Database(researchPath);
  research.exec(`
    CREATE TABLE leads (
      id TEXT PRIMARY KEY, entity_type TEXT, name TEXT, category TEXT, address TEXT, locality TEXT, postcode TEXT, region TEXT, country TEXT,
      primary_email TEXT, primary_phone TEXT, primary_website TEXT, socials_json TEXT, status TEXT, contact_permission TEXT, source_provider TEXT,
      source_external_id TEXT, source_release TEXT, provenance_json TEXT, notes TEXT
    );
    CREATE TABLE public_intents (
      id TEXT PRIMARY KEY, title TEXT, topic TEXT, locality TEXT, source_url TEXT, status TEXT, contact_permission TEXT, source_provider TEXT, source_kind TEXT,
      author_handle TEXT, published_at TEXT, intent_score REAL, body_excerpt TEXT, provenance_json TEXT
    );
    CREATE TABLE property_opportunities (
      id TEXT PRIMARY KEY, address TEXT, building_type TEXT, postcode TEXT, locality TEXT, country TEXT, status TEXT, source_provider TEXT, source_external_id TEXT,
      lat REAL, lon REAL, attributes_json TEXT, provenance_json TEXT
    );
  `);
  research.prepare(`INSERT INTO leads VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    'provider-1','business','Research Sanitär GmbH','Sanitär','Musterweg 7','Berlin','10115','Berlin','DE','DNC.Provider@Example.Test','+49 30 12345678','https://research.example','[]','collected','unknown','overture','ov-1','2026-08','[]','Research provider fixture'
  );
  research.prepare(`INSERT INTO public_intents VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    'intent-1','Bad modernisieren','Sanitär','Berlin','https://forum.example/t/1','qualified','unknown','forum','thread','public-user','2026-08-20',8.4,'Öffentliches Signal','{}'
  );
  research.prepare(`INSERT INTO property_opportunities VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    'property-1','Beispielstraße 8','Einfamilienhaus','14467','Potsdam','DE','target_area','open_data','prop-1',52.4,13.1,'{}','{}'
  );
  research.close();
}

async function addLead(page,input){
  const current=new URL(page.url());
  if(current.pathname!=='/admin/crm'||current.search){current.pathname='/admin/crm';current.search='';await page.goto(current.toString());}
  const form=page.locator('form').filter({has:page.getByRole('button',{name:'Lead speichern'})});
  await form.locator('select[name="leadType"]').selectOption(input.leadType||'homeowner');
  await form.locator('select[name="sourceType"]').selectOption(input.sourceType||'manual');
  await form.locator('input[name="name"]').fill(input.name);
  if(input.companyName!==undefined)await form.locator('input[name="companyName"]').fill(input.companyName);
  if(input.category!==undefined)await form.locator('input[name="category"]').fill(input.category);
  if(input.postcode!==undefined)await form.locator('input[name="postcode"]').fill(input.postcode);
  if(input.locality!==undefined)await form.locator('input[name="locality"]').fill(input.locality);
  if(input.email!==undefined)await form.locator('input[name="email"]').fill(input.email);
  if(input.phone!==undefined)await form.locator('input[name="phone"]').fill(input.phone);
  if(input.profileUrl!==undefined)await form.locator('input[name="profileUrl"]').fill(input.profileUrl);
  if(input.sourceDetail!==undefined)await form.locator('input[name="sourceDetail"]').fill(input.sourceDetail);
  if(input.permission!==undefined)await form.locator('select[name="permission"]').selectOption(input.permission);
  if(input.nextFollowUpAt!==undefined)await form.locator('input[name="nextFollowUpAt"]').fill(input.nextFollowUpAt);
  if(input.notes!==undefined)await form.locator('textarea[name="notes"]').fill(input.notes);
  await Promise.all([
    page.waitForURL(url=>url.pathname==='/admin/crm'&&(url.searchParams.get('created')==='1'||url.searchParams.get('updated')==='1')),
    form.getByRole('button',{name:'Lead speichern'}).click(),
  ]);
}

/* Lead-Karten werden als EHWorkflowForm (<form> + Fieldset) gerendert, nicht als <article>.
   Die Status-Select gibt es nur in Aktualisierungsformularen — damit ist die Karte eindeutig. */
function leadCard(page,text){return page.locator('form').filter({has:page.locator('select[name="status"]'),hasText:text}).first();}

async function updateLeadCard(page,text,updates){
  const card=leadCard(page,text);
  await card.waitFor();
  const form=card;
  if(updates.status!==undefined)await form.locator('select[name="status"]').selectOption(updates.status);
  if(updates.permission!==undefined)await form.locator('select[name="permission"]').selectOption(updates.permission);
  if(updates.sourceType!==undefined)await form.locator('select[name="sourceType"]').selectOption(updates.sourceType);
  if(updates.sourceDetail!==undefined)await form.locator('input[name="sourceDetail"]').fill(updates.sourceDetail);
  if(updates.nextFollowUpAt!==undefined){const field=form.locator('input[name="nextFollowUpAt"]');if(await field.isEnabled())await field.fill(updates.nextFollowUpAt);}
  if(updates.channel!==undefined)await form.locator('select[name="channel"]').selectOption(updates.channel);
  if(updates.notes!==undefined)await form.locator('input[name="notes"]').fill(updates.notes);
  await Promise.all([
    page.waitForResponse(response=>response.request().method()==='POST'&&Boolean(response.request().headers()['next-action']),{timeout:30000}),
    form.getByRole('button',{name:'Speichern'}).click(),
  ]);
}

async function clickResearchSync(page){
  const current=new URL(page.url());
  if(current.pathname!=='/admin/crm'||current.search){current.pathname='/admin/crm';current.search='';await page.goto(current.toString());}
  await Promise.all([
    page.waitForURL(url=>url.pathname==='/admin/crm'&&url.searchParams.has('sync'),{timeout:120000}),
    page.getByRole('button',{name:/Research-Daten synchronisieren/}).click(),
  ]);
}

try{
  createProjectCopy();
  createResearchFixture();
  const port=await freePort();
  const base=`http://127.0.0.1:${port}`;
  const nextBin=path.join(repo,'node_modules','next','dist','bin','next');
  server=spawn(process.execPath,[nextBin,'dev','--webpack','-H','127.0.0.1','-p',String(port)],{
    cwd:projectRoot,
    env:{...process.env,DATABASE_PATH:databasePath,BUSINESS_RESEARCH_DB_PATH:researchPath,ADMIN_PASSWORD:adminPassword,NEXT_PUBLIC_APP_URL:base},
    stdio:['ignore','pipe','pipe'],
  });
  for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{serverLog.push(chunk.toString());if(serverLog.length>600)serverLog.shift();});
  await waitForServer(`${base}/admin/login`);
  appDb=new Database(databasePath);
  appDb.pragma('busy_timeout = 5000');
  browser=await chromium.launch({headless:true,executablePath:browserExecutable()});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  // Dev server compiles pages on demand; /admin/crm is query-heavy and the first
  // visit can exceed the 30s default.
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);

  await page.goto(`${base}/admin/login`);
  await page.getByLabel('Admin-Passwort').fill(adminPassword);
  await Promise.all([page.waitForURL('**/admin'),page.getByRole('button',{name:'Admin anmelden'}).click()]);
  await page.getByRole('link',{name:'Leads & CRM'}).click();
  // The page title has been reworded by design more than once ("Leads & CRM" ->
  // "Leads & Outreach CRM"), so the wording is not a contract. The h1 is the
  // stable render barrier; the route assertion below is the real check.
  await page.getByRole('heading',{level:1,name:/Leads/}).waitFor();
  check(new URL(page.url()).pathname==='/admin/crm','admin CRM browser route opens');

  await clickResearchSync(page);
  let count=appDb.prepare("SELECT count(*) n FROM crm_leads WHERE source_type LIKE 'business_research%'").get().n;
  check(count===3,'research business/intent/property rows imported',`count=${count}`);
  await clickResearchSync(page);
  const repeatCount=appDb.prepare("SELECT count(*) n FROM crm_leads WHERE source_type LIKE 'business_research%'").get().n;
  check(repeatCount===count,'research source import is source-id idempotent',`before=${count} after=${repeatCount}`);

  const stamp=Date.now();
  const blankName=`Blank Identity ${stamp}`;
  await addLead(page,{leadType:'homeowner',sourceType:'manual',name:blankName,sourceDetail:'blank-a'});
  await addLead(page,{leadType:'homeowner',sourceType:'manual',name:blankName,sourceDetail:'blank-b'});
  const blanks=appDb.prepare('SELECT count(*) n FROM crm_leads WHERE name=?').get(blankName).n;
  check(blanks===2,'blank email/phone/profile never false-dedupe',`count=${blanks}`);

  const normalizedEmail=`Case.${stamp}@Example.Test`;
  const normalizedName=`Normalized Identity ${stamp}`;
  await addLead(page,{leadType:'homeowner',sourceType:'manual',name:normalizedName,email:normalizedEmail,phone:'+49 (30) 9988 7766',profileUrl:`https://Community.Example/Profile/${stamp}/?utm_source=test`,notes:'first identity'});
  await addLead(page,{leadType:'homeowner',sourceType:'community',name:`${normalizedName} duplicate`,email:normalizedEmail.toLowerCase(),phone:'0049 30 9988-7766',profileUrl:`https://community.example/Profile/${stamp}`,sourceDetail:'normalized duplicate',notes:'second identity'});
  const normEmail=normalizedEmail.toLowerCase();
  const normalizedRows=appDb.prepare('SELECT id,status,contact_permission FROM crm_leads WHERE normalized_email=?').all(normEmail);
  check(normalizedRows.length===1,'normalized email/phone/profile identity deterministically dedupes',`count=${normalizedRows.length}`);
  const normalizedId=normalizedRows[0]?.id;

  await page.goto(`${base}/admin/crm?q=${encodeURIComponent(normalizedName)}`);
  await updateLeadCard(page,normalizedName,{status:'qualified',permission:'consented',sourceType:'referral',sourceDetail:'E2E Empfehlung',nextFollowUpAt:'2026-01-01',channel:'social',notes:'Qualifiziert und Follow-up geplant'});
  await waitForDb('SELECT status,contact_permission,source_type,next_follow_up_at FROM crm_leads WHERE id=?',[normalizedId],row=>row?.status==='qualified'&&row?.contact_permission==='consented'&&row?.source_type==='referral'&&row?.next_follow_up_at==='2026-01-01');
  const eventTypes=new Set(appDb.prepare('SELECT event_type FROM crm_events WHERE lead_id=?').all(normalizedId).map(row=>row.event_type));
  for(const type of ['status_changed','permission_changed','source_changed','follow_up_changed'])check(eventTypes.has(type),`transactional CRM event recorded: ${type}`);
  const audit=appDb.prepare("SELECT 1 ok FROM admin_audit_log WHERE action='crm_lead_update' AND target=? ORDER BY id DESC LIMIT 1").get(`lead:${normalizedId}`);
  check(Boolean(audit),'admin CRM mutation audit row recorded');

  await page.goto(`${base}/admin/crm`);
  const filter=page.locator('form').filter({has:page.locator('input[name="q"]')});
  await filter.locator('input[name="q"]').fill(normalizedName);
  await filter.locator('select[name="followup"]').selectOption('due');
  await Promise.all([page.waitForURL(url=>url.pathname==='/admin/crm'&&url.searchParams.get('followup')==='due'),filter.getByRole('button',{name:'Filtern'}).click()]);
  check(await leadCard(page,normalizedName).isVisible(),'search + due follow-up filter returns expected lead');

  await page.goto(`${base}/admin/crm?q=${encodeURIComponent('Research Sanitär GmbH')}`);
  await updateLeadCard(page,'Research Sanitär GmbH',{status:'do_not_contact',permission:'do_not_contact',sourceType:'business_research',sourceDetail:'overture',channel:'email',notes:'Widerspruch E2E'});
  const researchId=appDb.prepare("SELECT id FROM crm_leads WHERE normalized_email='dnc.provider@example.test'").get().id;
  await waitForDb('SELECT status,contact_permission,next_follow_up_at FROM crm_leads WHERE id=?',[researchId],row=>row?.status==='do_not_contact'&&row?.contact_permission==='do_not_contact'&&row?.next_follow_up_at===null);
  const dncCard=leadCard(page,'Research Sanitär GmbH');
  check((await dncCard.locator('a[href^="mailto:"]').count())===0&&(await dncCard.locator('a[href^="tel:"]').count())===0,'do_not_contact removes direct email/phone actions');

  const research=new Database(researchPath);
  research.prepare("UPDATE leads SET status='qualified',contact_permission='consented',source_provider='refresh-provider',notes='later import tried to reopen' WHERE id='provider-1'").run();
  research.close();
  await clickResearchSync(page);
  let dnc=appDb.prepare('SELECT status,contact_permission,next_follow_up_at FROM crm_leads WHERE id=?').get(researchId);
  check(dnc.status==='do_not_contact'&&dnc.contact_permission==='do_not_contact'&&dnc.next_follow_up_at===null,'later research import cannot overwrite do_not_contact');

  const providerUser=appDb.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name,phone) VALUES(?,?,'provider',?,?,?)").run('DNC.Provider@example.test','not-used','Dora','Provider','+49 30 12345678');
  dnc=appDb.prepare('SELECT status,contact_permission,converted_user_id FROM crm_leads WHERE id=?').get(researchId);
  check(dnc.status==='do_not_contact'&&dnc.contact_permission==='do_not_contact'&&dnc.converted_user_id===Number(providerUser.lastInsertRowid),'provider registration links lead without reopening do_not_contact');
  const providerDupes=appDb.prepare("SELECT count(*) n FROM crm_leads WHERE normalized_email='dnc.provider@example.test'").get().n;
  check(providerDupes===1,'provider conversion does not create duplicate contact',`count=${providerDupes}`);

  await page.goto(`${base}/admin/crm?q=${encodeURIComponent('Research Sanitär GmbH')}`);
  await updateLeadCard(page,'Research Sanitär GmbH',{status:'qualified',permission:'consented',sourceType:'business_research',sourceDetail:'operator-attempt',notes:'attempt to reopen'});
  dnc=await waitForDb('SELECT status,contact_permission FROM crm_leads WHERE id=?',[researchId],row=>Boolean(row));
  check(dnc.status==='do_not_contact'&&dnc.contact_permission==='do_not_contact','operator update cannot silently clear do_not_contact');

  const saleEmail=`sale.${stamp}@example.test`;
  const saleUser=appDb.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name,phone) VALUES(?,?,'homeowner',?,?,?)").run(saleEmail,'not-used','Sina','Verkauf',null);
  const saleUserId=Number(saleUser.lastInsertRowid);
  appDb.prepare('INSERT INTO homeowner_profiles(user_id,postcode,address) VALUES(?,?,?)').run(saleUserId,'10115','Verkaufsweg 1');
  const property=appDb.prepare("INSERT INTO properties(address,postcode,property_type) VALUES(?,?,'house')").run('Verkaufsweg 1','10115');
  const propertyId=Number(property.lastInsertRowid);
  appDb.prepare('INSERT INTO property_ownerships(property_id,homeowner_id,active) VALUES(?,?,1)').run(propertyId,saleUserId);
  appDb.prepare("INSERT INTO sale_leads(property_id,homeowner_id,status) VALUES(?,?,'interested')").run(propertyId,saleUserId);
  await page.goto(`${base}/admin/crm?q=${encodeURIComponent(saleEmail)}`);
  const saleLead=await waitForDb('SELECT id,status,converted_user_id,source_type FROM crm_leads WHERE normalized_email=?',[saleEmail],row=>row?.converted_user_id===saleUserId);
  check(saleLead.status==='converted'&&saleLead.source_type==='existing_customer','sale lifecycle creates/links converted homeowner CRM lead');
  await page.reload();
  const saleDupes=appDb.prepare('SELECT count(*) n FROM crm_leads WHERE normalized_email=?').get(saleEmail).n;
  check(saleDupes===1,'sale lifecycle sync remains duplicate-free',`count=${saleDupes}`);

  const linkedEvents=appDb.prepare("SELECT count(*) n FROM crm_events WHERE event_type='converted'").get().n;
  check(linkedEvents>=2,'conversion events retained for linked platform accounts',`count=${linkedEvents}`);
  check(failed===0,'CRM isolated browser E2E has no failed assertions',`${failed} failed`);
} catch(error){
  failed++;
  console.error(error?.stack||error);
} finally {
  try{await browser?.close();}catch{}
  try{appDb?.close();}catch{}
  if(server&&!server.killed){server.kill('SIGTERM');await new Promise(resolve=>{const timer=setTimeout(resolve,3000);server.once('exit',()=>{clearTimeout(timer);resolve();});});if(server.exitCode===null)server.kill('SIGKILL');}
  fs.rmSync(tempRoot,{recursive:true,force:true});
}

console.log(JSON.stringify({ok:failed===0,passed,failed},null,2));
if(failed)process.exit(1);
