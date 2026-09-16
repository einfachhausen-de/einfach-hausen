import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),'einfach-hausen-architecture-e2e-'));
const projectRoot=path.join(tempRoot,'project');
const databasePath=path.join(tempRoot,'app.sqlite3');
const adminPassword=`ArchitectureE2E!${randomBytes(18).toString('base64url')}`;
const accountPassword=`UserE2E!${randomBytes(18).toString('base64url')}`;
const stamp=`${Date.now()}-${randomBytes(5).toString('hex')}`;
const brokerEmail=`makler-${stamp}@example.test`;
const ownerEmail=`owner-${stamp}@example.test`;
const buyerEmail=`buyer-${stamp}@example.test`;
let server;
let browser;
const serverLog=[];

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

function createProjectCopy(){
  fs.mkdirSync(projectRoot,{recursive:true});
  // "packages" carries the design system: src/design-system/index.ts re-exports
  // ../../packages/eh-design/src, so a copy without it cannot compile a page.
  for(const directory of ['src','public','packages'])fs.cpSync(path.join(repo,directory),path.join(projectRoot,directory),{recursive:true});
  for(const file of ['package.json','tsconfig.json','next.config.ts','postcss.config.mjs','next-env.d.ts']){
    const source=path.join(repo,file);
    if(fs.existsSync(source))fs.copyFileSync(source,path.join(projectRoot,file));
  }
  fs.symlinkSync(path.join(repo,'node_modules'),path.join(projectRoot,'node_modules'),'dir');
  // Production server needs the compiled app; the cache is not portable.
  if(fs.existsSync(path.join(repo,'.next','BUILD_ID'))){
    fs.cpSync(path.join(repo,'.next'),path.join(projectRoot,'.next'),{recursive:true,filter:(source)=>!source.includes(`${path.sep}.next${path.sep}cache`)});
  }
  // Persistent-storage bootstrap mirrors deploy/update-on-oci.sh so the
  // storage gate passes in the test environment.
  fs.mkdirSync(path.join(projectRoot,'data','private'),{recursive:true});
  fs.mkdirSync(path.join(projectRoot,'public','uploads'),{recursive:true});
}

async function freePort(){
  return await new Promise((resolve,reject)=>{
    const socket=net.createServer();
    socket.unref();
    socket.on('error',reject);
    socket.listen(0,'127.0.0.1',()=>{
      const address=socket.address();
      const port=typeof address==='object'&&address?address.port:0;
      socket.close(()=>resolve(port));
    });
  });
}

async function waitForServer(url,timeoutMs=90000){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    if(server?.exitCode!==null&&server?.exitCode!==undefined)throw new Error(`Next server exited early (${server.exitCode})\n${serverLog.slice(-40).join('')}`);
    try{const response=await fetch(url,{redirect:'manual'});if(response.status<500)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error(`Next server did not become ready\n${serverLog.slice(-40).join('')}`);
}

const waitText=async(page,text)=>{try{await page.waitForFunction(value=>document.body.innerText.includes(value),text,{timeout:15000});}catch(error){const body=(await page.locator('body').innerText()).slice(-4000);throw new Error(`Expected text not found: ${text} | url=${page.url()} | body-tail=${body}`,{cause:error});}};
const assertNoOverflow=async(page,label)=>{const x=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);if(x)throw new Error(`${label} has horizontal overflow`);};
const clickAndWaitUrl=async(page,pattern,button,label)=>{try{await Promise.all([page.waitForURL(pattern,{timeout:45000}),button.click()]);}catch(error){const body=(await page.locator('body').innerText()).slice(-3500);const logs=serverLog.slice(-40).join('');throw new Error(`${label} navigation failed | url=${page.url()} | body-tail=${body} | server-tail=${logs}`,{cause:error});}};

try{
  createProjectCopy();
  const port=await freePort();
  const base=`http://127.0.0.1:${port}`;
  const nextBin=path.join(repo,'node_modules','next','dist','bin','next');
  // Registration is fail-closed on the Supabase identity authority: without a
  // service-role key, registerAction redirects to
  // "/register?error=Registrierung aktuell nicht verfuegbar"
  // (src/app/actions.ts:120-123). AUTH_MODE:'local' does not change that - it
  // only switches session verification - so a suite that registers real
  // accounts has to talk to the same identity authority as the browser suite.
  // This is exactly why this suite failed the first time it ever executed in
  // CI: it spawned a local-auth server with no credentials and every
  // registration was refused before a page could even render.
  const sanitizedEnv={...process.env};
  for(const key of Object.keys(sanitizedEnv)){
    if(/(?:STRIPE|WHATSAPP|META_|OPENAI|OPENROUTER|SILICONFLOW|OMNIROUTE|API_KEY|ACCESS_TOKEN|AUTH_TOKEN|WEBHOOK_SECRET)/i.test(key))delete sanitizedEnv[key];
  }
  const supabaseUrl=process.env.SUPABASE_URL||'https://supabase.delqhi.com';
  const supabaseAnonKey=process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey=process.env.SUPABASE_SERVICE_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabaseAnonKey||!supabaseServiceKey)throw new Error('SUPABASE_ANON_KEY/SUPABASE_SERVICE_KEY missing from the architecture e2e env');
  // Dev mode (StrictMode/Fast-Refresh double-mounting) races the Supabase SSR
  // cookie and drops sessions mid-flow - the same reason scripts/e2e.mjs runs
  // the precompiled production server. Use that path here too.
  if(!fs.existsSync(path.join(projectRoot,'.next','BUILD_ID')))throw new Error('No production build found - run `npm run build` (with the Supabase build env) before npm run test:e2e:architecture.');
  server=spawn(process.execPath,[nextBin,'start','-H','127.0.0.1','-p',String(port)],{
    cwd:projectRoot,
    env:{
      ...sanitizedEnv,
      DATABASE_PATH:databasePath,
      ADMIN_PASSWORD:adminPassword,
      SESSION_COOKIE_NAME:'e2e_session',
      NEXT_PUBLIC_APP_URL:base,
      AUTH_MODE:'supabase',
      E2E_INSECURE_COOKIES:'1',
      SUPABASE_URL:supabaseUrl,
      SUPABASE_ANON_KEY:supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY:supabaseServiceKey,
      SUPABASE_SERVICE_KEY:supabaseServiceKey,
      NEXT_PUBLIC_SUPABASE_URL:supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:supabaseAnonKey,
    },
    stdio:['ignore','pipe','pipe'],
  });
  for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{serverLog.push(chunk.toString());if(serverLog.length>250)serverLog.shift();});
  await waitForServer(`${base}/register?role=provider`);
  browser=await chromium.launch({headless:true,executablePath:browserExecutable()});

  // A) One professional account can carry several provider categories, including broker.
  const brokerCtx=await browser.newContext({viewport:{width:390,height:844}}); const broker=await brokerCtx.newPage();
  await broker.goto(base+'/register?role=provider');
  await broker.getByLabel('Vorname').fill('Mara'); await broker.getByLabel('Nachname').fill('Makler'); await broker.getByLabel('E-Mail').fill(brokerEmail); await broker.locator('input[name="password"]').fill(accountPassword);   await broker.getByLabel('Unternehmensname').fill('Hauswert Makler GmbH'); await broker.getByLabel('Gewerke').fill('Immobilienvermittlung, Bewertung'); await broker.getByLabel('Postleitzahl').fill('46325');
  await Promise.all([broker.waitForURL('**/pro'),broker.getByRole('button',{name:'Kostenlos registrieren'}).click()]);
  await broker.goto(base+'/pro/profile'); await waitText(broker,'Ein Konto, beliebig erweiterbar');
  // Tätigkeiten sind eine Profil-Einstellung, keine Frage bei der Registrierung:
  // ein Konto trägt beliebig viele davon. Die Kästchen werden über ihren Slug
  // adressiert, nicht über das Label – die Beschreibung hinter dem Titel kann
  // sich ändern, der Slug ist die Datenidentität.
  const categoryBox=slug=>broker.locator(`input[name="providerCategory"][value="${slug}"]`);
  for(const slug of ['handwerk','makler'])await categoryBox(slug).check();
  // Saving changed company or service data does not confirm with "saved": the
  // action sends the profile back into review whenever business name, trades,
  // categories or services differ (src/app/pro/profile/actions.ts:76-104). That
  // is the contract even for a provider that was never verified - the audit
  // entry records was_verified precisely because the branch fires regardless.
  // This first save adds both categories, so it lands on ?profile=review.
  await Promise.all([broker.waitForURL(/profile=review/),broker.getByRole('button',{name:'Profil speichern'}).click()]);
  await waitText(broker,'Die Partnerfreigabe ist pausiert');
  await broker.goto(base+'/pro/profile'); await waitText(broker,'Ein Konto, beliebig erweiterbar');
  if(!(await categoryBox('handwerk').isChecked())||!(await categoryBox('makler').isChecked()))throw new Error('Professional account must support multiple provider categories');
  await broker.getByLabel('Regionen / PLZ').fill('463, Borken'); await broker.getByLabel('Immobilientypen').fill('Einfamilienhaus, Doppelhaushälfte'); await broker.getByLabel('Kaufpreis ab €').fill('250000'); await broker.getByLabel('Kaufpreis bis €').fill('1200000'); await broker.getByLabel('Wohnfläche ab m²').fill('80'); await broker.getByLabel('Wohnfläche bis m²').fill('300'); await broker.getByLabel('Spezialisierungen').fill('Eigenheime, modernisierte Bestandsimmobilien');
  // Only the broker search fields change here, none of the fields the lifecycle
  // comparison tracks - so this is the save that confirms with ?profile=saved.
  await Promise.all([broker.waitForURL(/profile=saved/),broker.getByRole('button',{name:'Profil speichern'}).click()]);
  await broker.getByLabel('Nachweis').setInputFiles({name:'makler-nachweis.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n% Test\n')}); await broker.getByLabel('Hinweis').fill('Makler-Gewerbe und Berufshaftpflicht liegen vor.'); await Promise.all([broker.waitForURL(/verification=submitted/),broker.getByRole('button',{name:'Zur Prüfung einreichen'}).click()]);

  const adminCtx=await browser.newContext({viewport:{width:1180,height:1000}}); const admin=await adminCtx.newPage(); await admin.goto(base+'/admin/login'); await admin.getByLabel('Admin-Passwort').fill(adminPassword); await Promise.all([admin.waitForURL('**/admin'),admin.getByRole('button',{name:'Admin anmelden'}).click()]); let card=admin.locator('.admin-card').filter({hasText:'Hauswert Makler GmbH'}).first(); await card.getByRole('button',{name:'Unternehmen freigeben'}).click(); await admin.reload();
  // EHStatus rendert eine CSS-Modul-Klasse plus data-status; die alte Prüfung
  // auf ".status.approved" traf nie ein Element. Der Ton ist die stabilere
  // Aussage: nach der Freigabe ist der Prüf-Status der einzige "success"-Chip
  // in der Karte (der Vertrag steht noch auf "pending").
  await card.locator('[data-status="success"]').first().waitFor(); card=admin.locator('.admin-card').filter({hasText:'Hauswert Makler GmbH'}).first(); await card.getByLabel('Status').selectOption('active'); for(const name of ['Betriebshaftpflicht geprüft','Qualifikation/Zulassung geprüft','Partnervertrag unterschrieben','Qualitätsstandard akzeptiert'])await card.getByLabel(name).check(); await card.getByRole('button',{name:'Partnervertrag speichern'}).click(); await admin.reload(); await card.getByText(/Vertrag Aktiv/).waitFor();

  // B) Property is the durable central record; valuation and sale matching stay owner-controlled.
  const ownerCtx=await browser.newContext({viewport:{width:390,height:844}}); const owner=await ownerCtx.newPage(); await owner.goto(base+'/register?role=homeowner'); await owner.getByLabel('Vorname').fill('Olivia'); await owner.getByLabel('Nachname').fill('Eigentümer'); await owner.getByLabel('E-Mail').fill(ownerEmail); await owner.locator('input[name="password"]').fill(accountPassword); await owner.getByLabel('Postleitzahl').fill('46325'); await owner.locator('input[name="address"]').fill('Musterstraße 12, 46325 Borken'); await clickAndWaitUrl(owner,'**/app**',owner.getByRole('button',{name:'Kostenlos registrieren'}),'owner registration');
  await owner.goto(base+'/app/home'); await owner.locator('#hausprofil summary').click(); await owner.getByLabel('Haustyp').selectOption('Einfamilienhaus'); await owner.getByLabel('Baujahr').fill('2001'); await owner.getByLabel('Wohnfläche (m²)').fill('160'); await owner.getByLabel('Grundstück (m²)').fill('650'); await owner.getByRole('button',{name:'Hausprofil speichern'}).click();
  await owner.goto(base+'/app/home/history'); await owner.locator('#hist-category').selectOption({label:'Dach & Fassade'}); await owner.getByLabel('Datum').fill('2025-06-12'); await owner.getByLabel('Was wurde gemacht?').fill('Dach erneuert 2025'); await owner.getByLabel('Firma').fill('Dachbau Alt GmbH'); await owner.getByLabel('Kosten €').fill('18500'); await owner.getByLabel('Garantie bis').fill('2030-06-12'); await owner.getByRole('button',{name:'In Hausakte speichern'}).click(); await waitText(owner,'Dach erneuert 2025');
  await owner.goto(base+'/app/home/sale'); await owner.getByLabel('Von €').fill('700000'); await owner.getByLabel('Bis €').fill('800000'); await owner.getByRole('button',{name:/Bewertung speichern/}).click(); await owner.waitForTimeout(200); await waitText(owner,'700.000'); await owner.getByRole('button',{name:'Makler finden'}).click(); await owner.waitForURL(/lead=/); await waitText(owner,'Hauswert Makler GmbH'); await waitText(owner,'Private Nachrichten, Zahlungen, Rechnungen, Versicherungen und vollständige Dokumente bleiben außerhalb des Verkaufshandoffs.'); await assertNoOverflow(owner,'Mobile sale matching');

  // C) Broker cannot see owner contact before explicit release.
  await broker.goto(base+'/pro/leads'); await waitText(broker,'Noch keine freigegebenen Immobilienanfragen'); if((await broker.locator('body').innerText()).includes(ownerEmail))throw new Error('Owner contact leaked before explicit release');
  const shareForm=owner.locator('form').filter({has:owner.getByRole('button',{name:'Freigabe erteilen'})}).first();
  await shareForm.getByRole('checkbox').check();
  await shareForm.getByRole('button',{name:'Freigabe erteilen'}).click();
  await owner.waitForTimeout(200); await broker.reload(); await waitText(broker,'Olivia Eigentümer'); await waitText(broker,ownerEmail); await assertNoOverflow(broker,'Mobile broker lead');

  // D) The same property and its history can be transferred to a new owner. An
  // active sale share is deliberately left in place so the transfer itself must
  // revoke it atomically.
  const buyerCtx=await browser.newContext({viewport:{width:390,height:844}}); const buyer=await buyerCtx.newPage(); await buyer.goto(base+'/register?role=homeowner'); await buyer.getByLabel('Vorname').fill('Ben'); await buyer.getByLabel('Nachname').fill('Käufer'); await buyer.getByLabel('E-Mail').fill(buyerEmail); await buyer.locator('input[name="password"]').fill(accountPassword); await buyer.getByLabel('Postleitzahl').fill('46325'); await clickAndWaitUrl(buyer,'**/app**',buyer.getByRole('button',{name:'Kostenlos registrieren'}),'buyer registration');
  await owner.goto(base+'/app/home/history'); await owner.getByLabel('E-Mail des Käufers').fill(buyerEmail); await owner.getByRole('button',{name:'Übergabe vorbereiten'}).click(); await owner.waitForURL(/transfer=/); const token=new URL(owner.url()).searchParams.get('transfer'); if(!token)throw new Error('house transfer token missing');
  await buyer.goto(base+`/transfer/${token}`); await waitText(buyer,'Hausakte übernehmen'); await buyer.getByRole('button',{name:'Hausakte jetzt übernehmen'}).click(); await buyer.waitForURL(/\/app\/home\?transfer=accepted/); await buyer.goto(base+'/app/home/history'); await waitText(buyer,'Dach erneuert 2025'); await waitText(buyer,'Olivia Eigentümer'); await waitText(buyer,'Ben Käufer'); await buyer.goto(base+'/app/home/sale'); await waitText(buyer,'700.000'); await assertNoOverflow(buyer,'Transferred property sale page');
  await broker.reload(); await waitText(broker,'Noch keine freigegebenen Immobilienanfragen'); if((await broker.locator('body').innerText()).includes(ownerEmail))throw new Error('Broker retained former-owner contact after property transfer');

  console.log(JSON.stringify({ok:true,vision:'one provider account + flexible categories + persistent property ownership history + valuation + permissioned broker matching + transfer revokes sale shares'},null,2));
} finally {
  try{await browser?.close();}catch{}
  if(server&&!server.killed){
    server.kill('SIGTERM');
    await new Promise(resolve=>{const timer=setTimeout(resolve,3000);server.once('exit',()=>{clearTimeout(timer);resolve();});});
    if(server.exitCode===null)server.kill('SIGKILL');
  }
  fs.rmSync(tempRoot,{recursive:true,force:true});
}
