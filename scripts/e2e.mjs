import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright-core';
// T-0129 Browser-E2E v2: the public-platform matrix is the SAME list the
// visual canonicals (T-0130) are built from, so behavioral and visual proof
// can never cover different route sets.
import { PUBLIC_ROUTES } from './lib/visual-canonicals.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browserName=process.env.E2E_BROWSER||'chromium';
const E2E_SW=process.env.E2E_SW||'';
const browserType={chromium,firefox,webkit}[browserName];
if(!browserType)throw new Error(`Unsupported E2E_BROWSER: ${browserName}`);
const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),'einfach-hausen-full-e2e-'));
const projectRoot=path.join(tempRoot,'project');
const databasePath=path.join(tempRoot,'app.sqlite3');
const artifactsDir=path.join(repo,'artifacts','e2e');
fs.mkdirSync(artifactsDir,{recursive:true});
const adminPassword=`FullE2E!${randomBytes(18).toString('base64url')}`;
// E2E persona emails must be deletable through the Supabase admin API, so they
// use a dedicated test domain and get collected for final cleanup.
const password=`UserE2E!${randomBytes(18).toString('base64url')}`;
const stamp=`${Date.now()}-${randomBytes(5).toString('hex')}`;
const providerEmail=`ehprov-${stamp}@example.test`;
const techEmail=`thomas-${stamp}@example.test`;
const ownerEmail=`maria-${stamp}@example.test`;
const buyerEmail=`buyer-${stamp}@example.test`;
let server;
let browser;
const e2eIdentityEmails=[providerEmail,techEmail,ownerEmail,buyerEmail];
// GoTrue's admin list-users endpoint reads ONLY filter/page/per_page - there is
// no `email` query parameter (see supabase/auth internal/api/admin.go,
// adminUsers). A `?email=` filter is therefore silently ignored and the call
// returns the first page of ALL users. Deleting that page wiped every identity
// in the shared Supabase project, including those of the parallel
// browser-matrix jobs: chromium finished first, its cleanup removed the users
// firefox/webkit were still using, and both then failed mid-onboarding with
// "User from sub claim in JWT does not exist".
// Page through and match the exact address client-side instead - the same
// pattern scripts/seed-demo-users.mjs already uses for findUser().
async function listSupabaseUsers(){
  const out=[];
  for(let page=1;page<=20;page+=1){
    const res=await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`,{headers:{apikey:supabaseServiceKey,Authorization:`Bearer ${supabaseServiceKey}`}});
    if(!res.ok)return out;
    const payload=await res.json().catch(()=>({}));
    const users=Array.isArray(payload.users)?payload.users:[];
    out.push(...users);
    if(users.length<1000)return out;
  }
  return out;
}
async function findSupabaseUserByEmail(email){
  const wanted=String(email||'').toLowerCase();
  const users=await listSupabaseUsers();
  return users.find((user)=>String(user.email||'').toLowerCase()===wanted)||null;
}
async function deleteE2eIdentities(){
  // Only ever delete the four identities this run created, matched by exact
  // address. Never delete a user we did not create.
  const wanted=new Set(e2eIdentityEmails.map((email)=>email.toLowerCase()));
  try{
    for(const user of await listSupabaseUsers()){
      if(!wanted.has(String(user.email||'').toLowerCase()))continue;
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,{method:'DELETE',headers:{apikey:supabaseServiceKey,Authorization:`Bearer ${supabaseServiceKey}`}});
    }
  }catch{}
}
const serverLog=[];
process.on('exit',()=>{try{if(server&&!server.killed)server.kill('SIGKILL');}catch{}try{if(!process.env.E2E_KEEP_TEMP)fs.rmSync(tempRoot,{recursive:true,force:true});else console.error('E2E-KEPT ' + tempRoot);}catch{}});

function browserExecutable(){
  const bundled=typeof browserType.executablePath==='function'?browserType.executablePath():'';
  if(browserName!=='chromium'){
    if(!bundled||!fs.existsSync(bundled))throw new Error(`No ${browserName} browser found; install the Playwright browser for E2E_BROWSER=${browserName}`);
    return bundled;
  }
  const candidates=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,process.env.CHROME_PATH,bundled,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge','/opt/google/chrome/chrome',
    '/snap/chromium/current/usr/lib/chromium-browser/chrome','/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser','/snap/bin/chromium'].filter(Boolean);
  const found=candidates.find(candidate=>fs.existsSync(candidate));
  if(!found)throw new Error('No Chromium-family browser found; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH or CHROME_PATH');
  return found;
}

// Dev server compiles pages on demand; first visits can exceed the 30s default.
function newE2EContext(options){return browser.newContext({serviceWorkers:E2E_SW==='block'?'block':'allow',...options}).then(context=>{context.setDefaultTimeout(120000);return context;});}

function createProjectCopy(){
  fs.mkdirSync(projectRoot,{recursive:true});
  // "packages" carries the design system: src/design-system/index.ts re-exports
  // ../../packages/eh-design/src. This script runs the precompiled production
  // build, so it never noticed the gap - scripts that compile inside the copy
  // fail with a 500 on every page.
  for(const directory of ['src','public','packages'])fs.cpSync(path.join(repo,directory),path.join(projectRoot,directory),{recursive:true});
  for(const file of ['package.json','tsconfig.json','next.config.ts','postcss.config.mjs','next-env.d.ts']){
    const source=path.join(repo,file);if(fs.existsSync(source))fs.copyFileSync(source,path.join(projectRoot,file));
  }
  fs.symlinkSync(path.join(repo,'node_modules'),path.join(projectRoot,'node_modules'),'dir');
  // Production server needs the compiled app; the cache is not portable.
  if(fs.existsSync(path.join(repo,'.next','BUILD_ID'))){
    fs.cpSync(path.join(repo,'.next'),path.join(projectRoot,'.next'),{recursive:true,filter:(source)=>!source.includes(`${path.sep}.next${path.sep}cache`)});
  }
  // Persistent-storage bootstrap mirrors deploy/update-on-oci.sh so the
  // /api/health storage gate passes in the test environment.
  fs.mkdirSync(path.join(projectRoot,'data','private'),{recursive:true});
  fs.mkdirSync(path.join(projectRoot,'public','uploads'),{recursive:true});
}

async function freePort(){return await new Promise((resolve,reject)=>{const socket=net.createServer();socket.unref();socket.on('error',reject);socket.listen(0,'127.0.0.1',()=>{const address=socket.address();const port=typeof address==='object'&&address?address.port:0;socket.close(()=>resolve(port));});});}
async function waitForServer(url,timeoutMs=90000){const started=Date.now();while(Date.now()-started<timeoutMs){if(server?.exitCode!==null&&server?.exitCode!==undefined)throw new Error(`Next server exited early (${server.exitCode})\n${serverLog.slice(-60).join('')}`);try{const response=await fetch(url,{redirect:'manual'});if(response.status<500)return;}catch{}await new Promise(resolve=>setTimeout(resolve,250));}throw new Error(`Next server did not become ready\n${serverLog.slice(-60).join('')}`);}
async function waitText(page,text){
  // Engine-agnostic text matching: WebKit drops the space at innerText line
  // boundaries entirely ("Wir kümmern uns / um den Rest." reads as "unsum"),
  // while textContent, aria-label and the visible rendering keep it (verified
  // by screenshot 2026-08-31). Strip ALL whitespace on both sides: the same
  // word stream in the same order still decides truth, engine-identically.
  const expected=text.replace(/\s+/g,'').toLowerCase();
  try{await page.waitForFunction(value=>document.body.innerText.replace(/\s+/g,'').toLowerCase().includes(value),expected,{timeout:120000});}catch(error){const body=(await page.locator('body').innerText()).slice(-5000);throw new Error(`Expected text not found: ${text} | url=${page.url()} | body-tail=${body}`,{cause:error});}}
// React 19 streaming hydration transiently keeps a second tree in a S:<n>
// container; structural assertions must wait for the settled DOM (T-0006).
async function waitForDomStable(page,selector,expected=1,timeout=20000){const started=Date.now();let last=-1;while(Date.now()-started<timeout){const count=await page.locator(selector).count().catch(()=>-1);if(count===last&&(count===expected||count===0))return;last=count;await page.waitForTimeout(300);}throw new Error(`DOM never stabilized: ${selector} count=${last} expected=${expected}`);}
// Navigation helper: goto + settled DOM (React 19 streaming keeps a transient
// second tree during hydration; structural locators need the settled view).
async function nav(page,url,options){let response;try{response=await page.goto(url,options);}catch(error){
  // Engine tolerance for the acceptance matrix (same policy as the auth
  // 502-retry): Firefox aborts in-flight navigations (NS_BINDING_ABORTED) when
  // a click-triggered route change is still streaming, and a Supabase gateway
  // hiccup during a middleware redirect can keep `load` from firing within the
  // goto timeout. One deterministic retry per navigation; downstream waitText
  // assertions still decide truth, so no behavioral coverage is weakened.
  if(!/NS_BINDING_ABORTED|frame was detached|ERR_ABORTED|Timeout .*exceeded|interrupted by another navigation/.test(String(error)))throw error;
  await page.waitForTimeout(1000);
  try{ response=await page.goto(url,{...options,waitUntil:'load'}); }
  catch(retryError){
    if(!/Timeout .*exceeded/.test(String(retryError)))throw retryError;
    response=await page.goto(url,{...options,waitUntil:'domcontentloaded'});
  }
}await waitForDomStable(page,'.app-page',1).catch(()=>{});return response;}
// Structural reads/writes can still race the hydration swap; retry until the
// transient S:<n> tree is gone instead of failing the whole flow.
async function strictRetry(page,fn,attempts=8){let lastError;for(let attempt=0;attempt<attempts;attempt++){try{return await fn();}catch(error){if(!String(error).includes('strict mode violation'))throw error;lastError=error;await page.waitForTimeout(600);}}throw lastError;}
// Mobile navigation of the app surfaces. Every /app and /pro route renders
// WerkbankRahmen (src/components/werkbank-rahmen.tsx) -> WerkbankShell, whose
// sidebar opens as a Sheet on small viewports. The former
// <details class="mobile-menu"> drawers in shell.tsx / owner-menu.tsx are not
// rendered by any route any more, so asserting on them tested nothing but the
// absence of a component that is still in the tree. These helpers assert the
// navigation that actually reaches the user: the trigger in the top bar and the
// links inside the sheet.
const MOBILE_SIDEBAR='[data-mobile="true"]';
async function openMobileSidebar(page,label){
  const trigger=page.locator('[data-slot="sidebar-trigger"]').first();
  await trigger.waitFor({timeout:30000});
  await page.evaluate(()=>window.scrollTo(0,0));
  await trigger.click();
  await page.locator(MOBILE_SIDEBAR).first().waitFor({state:'visible',timeout:20000}).catch(()=>{throw new Error(`${label} mobile sidebar did not open`);});
}
async function mobileSidebarHrefs(page){
  return await page.locator(`${MOBILE_SIDEBAR} a[href]`).evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
}
async function assertMobileSidebarCloses(page,label){
  await page.keyboard.press('Escape');
  await page.locator(MOBILE_SIDEBAR).first().waitFor({state:'hidden',timeout:10000}).catch(()=>{throw new Error(`${label} mobile sidebar did not close`);});
}
// A bare "has horizontal overflow" is impossible to act on: it does not say
// which element is too wide. Report the boxes that stick out, and flag the
// ones whose own content does not fit (scrollWidth > clientWidth) - that is
// the actual culprit, its ancestors are only being pushed wide by it.
async function assertNoOverflow(page,label){
  // Metrics taken before the webfont swaps in are measured with the fallback
  // face, which is wider: the page "overflows" for a moment and no real user
  // ever sees it. Firefox lost its font swap race on /pro/team and failed a
  // run that was green before and after. Settle the fonts first.
  await page.evaluate(()=>document.fonts?.ready).catch(()=>{});
  const report=await page.evaluate(()=>{
    const doc=document.documentElement;
    if(doc.scrollWidth<=doc.clientWidth+0.5)return null;
    const limit=doc.clientWidth;
    const offenders=[];
    for(const el of document.querySelectorAll('*')){
      const rect=el.getBoundingClientRect();
      if(rect.width<1||rect.height<1)continue;
      if(rect.right<=limit+0.5)continue;
      const style=getComputedStyle(el);
      offenders.push({
        tag:el.tagName.toLowerCase(),
        cls:String(el.className||'').trim().split(/\s+/).slice(0,3).join('.'),
        id:el.id||'',
        right:Math.round(rect.right),
        width:Math.round(rect.width),
        selfOverflow:el.scrollWidth>el.clientWidth+0.5,
        overflowX:style.overflowX,
        text:String(el.textContent||'').trim().slice(0,50),
      });
    }
    return {scrollWidth:doc.scrollWidth,clientWidth:limit,offenders};
  });
  if(!report)return;
  // Prefer the boxes that genuinely cannot fit their content; they explain the
  // rest. Fall back to the widest boxes if nothing reports its own overflow.
  const ranked=report.offenders.filter(o=>o.selfOverflow).concat(report.offenders.filter(o=>!o.selfOverflow));
  const detail=ranked.slice(0,6).map(o=>`${o.tag}${o.id?'#'+o.id:''}${o.cls?'.'+o.cls:''} right=${o.right} w=${o.width} overflowX=${o.overflowX}${o.selfOverflow?' [content overflows]':''} text="${o.text}"`).join('\n    ');
  throw new Error(`${label} has horizontal overflow (scrollWidth=${report.scrollWidth} clientWidth=${report.clientWidth}):\n    ${detail}`);
}
const runtimeErrors=[];
const trackedPages=[];
// ---------------------------------------------------------------------------
// Documented engine artifacts.
// Everything below is a browser reporting quirk, not a product defect. Each
// rule is scoped to one engine and one exact signature. The flow assertions
// still decide truth: a real navigation or render failure breaks a
// waitForURL/waitText assertion long before this gate is reached, so dropping
// these does not weaken the suite - it stops the matrix from failing on noise
// that a real user never sees.
// ---------------------------------------------------------------------------
// Firefox/juggler (T-0129 matrix notes): aborted React Flight streams surface
// as RSC-payload fallback or input-stream errors, and the service-worker
// interception of malformed empty-URL requests is reported by the browser
// itself even though the handler never rejects.
function isToleratedFirefoxPageError(message){
  return browserName==='firefox' && message==='Error in input stream';
}
function isToleratedFirefoxConsole(text,source){
  return browserName==='firefox' && (
    text==='JSHandle@object'
    || /A ServiceWorker intercepted the request and encountered an unexpected error/.test(text)
    || (text==='Error' && /_next\/static\/chunks\//.test(source||''))
    // Firefox reports an image whose request the next navigation cancelled as
    // "Image corrupt or truncated". The bytes are fine - every PNG chunk CRC
    // of /brand/logo-full.png verifies and the IDAT stream decompresses - the
    // response was aborted mid-flight. Scoped to image URLs so a genuinely
    // broken asset still fails the run.
    || (/Image corrupt or truncated/.test(text) && /\.(?:png|jpe?g|webp|avif|gif|svg)(?:\?|$)/i.test(source||'')));
}
// Next.js logs a failed RSC fetch itself and then falls back to a full browser
// navigation - the framework recovers and the user gets the page, so the
// navigation is not broken. Deliberately NOT scoped to one engine: Firefox and
// WebKit both emit it when a prefetch is cancelled by the navigation it was
// warming up. Under load either engine may or may not win that race, which is
// why the same commit was green once and red the next time.
function isToleratedRscFallback(text){
  return /Failed to fetch RSC payload .* Falling back to browser navigation/.test(text);
}
// WebKit: Next.js `Link` prefetches are cancelled the moment the pointer
// leaves a link or the page navigates on. WebKit reports every cancellation
// twice - once as a page error naming the `?_rsc=` URL ("... due to access
// control checks") and once as a generic "Load failed" for the chunk that was
// in flight. Prefetching is only an optimisation (Next.js falls back to a
// full navigation), so the cancelled request never changes what is rendered.
function isToleratedWebKitPageError(message){
  if(browserName!=='webkit')return false;
  return (/due to access control checks/.test(message) && /_rsc=/.test(message))
    || /^Load failed$/.test(message);
}
function isToleratedWebKitConsole(text,source){
  if(browserName!=='webkit')return false;
  return /^TypeError: Load failed$/.test(text) && /_next\/static\//.test(source||'');
}
function isToleratedPageError(message){
  return isToleratedFirefoxPageError(message)||isToleratedWebKitPageError(message);
}
function isToleratedConsoleError(text,source){
  // Offline probe and the 404 not-found probe are deliberately provoked.
  if(/ERR_INTERNET_DISCONNECTED|Failed to load resource.*503/i.test(text))return true;
  if(/__e2e-unknown-route__/.test(source||'') && /404/.test(text))return true;
  if(isToleratedRscFallback(text))return true;
  return isToleratedFirefoxConsole(text,source)||isToleratedWebKitConsole(text,source);
}
function trackPage(page,label){
  trackedPages.push({page,label});
  page.on('pageerror',error=>{
    if(isToleratedPageError(error.message))return;
    runtimeErrors.push(`${label}: pageerror: ${error.message}`);
  });
  page.on('console',message=>{
    if(message.type()!=='error')return;
    const text=message.text();
    const location=message.location();
    const source=location?.url?` source=${location.url}`:'';
    if(isToleratedConsoleError(text,source))return;
    runtimeErrors.push(`${label}: console: ${text}${source}`);
  });
}
async function assertKeyboardFocus(page,label){
  // Headless Chromium on Linux can swallow the very first Tab (no prior user
  // activation). Try up to three tabs before declaring the page unfocusable;
  // any non-BODY activeElement still proves a focus target exists.
  // The service-worker shell can briefly serve an unhydrated loading state;
  // keep tabbing for up to ~8s until a real focus target appears.
  const deadline=Date.now()+8000;
  let focused={tag:'',href:'',text:''};
  while(Date.now()<deadline){
    await page.locator('body').press('Tab');
    focused=await page.evaluate(()=>{const el=document.activeElement;return {tag:el?.tagName||'',href:el instanceof HTMLAnchorElement?el.getAttribute('href'):'',text:(el?.textContent||'').trim().slice(0,120)};});
    if(focused.tag&&focused.tag!=='BODY')break;
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!focused.tag||focused.tag==='BODY')throw new Error(`${label} has no keyboard focus target after Tab`);
}
async function clickAndWaitUrl(page,locator,matcher,timeout=30000){await Promise.all([page.waitForURL(matcher,{timeout}),locator.click()]);}
async function clickServerAction(page,locator,timeout=90000){try{await Promise.all([page.waitForResponse(r=>r.request().method()==='POST',{timeout}),locator.click()]);}catch(error){throw new Error(`server action click failed: ${error.message.split('\n')[0]}\nserverLog tail:\n${serverLog.slice(-12).join('')}`,{cause:error});} await page.waitForLoadState('load').catch(()=>{}); await page.waitForTimeout(400);}
// The production hydration window can briefly double-render a freshly navigated
// document; register fields are filled only after the DOM settles to one input.
async function fillRegisterField(page,name,value){const field=page.locator(`input[name="${name}"]:visible`);await field.waitFor({timeout:20000});await field.fill(value);}
async function sendHousemaster(page,text,matcher=null){const c=page.getByPlaceholder(/Beschreib kurz|Beantworte nur noch|Was soll draußen|Was ist kaputt|Was soll gereinigt|Wobei brauchst du/);await c.click();await c.pressSequentially(text,{delay:1});const button=page.locator('button.send-action:not([disabled])');if(matcher)await clickAndWaitUrl(page,button,matcher);else await clickServerAction(page,button);}

createProjectCopy();
const port=await freePort();
const base=`http://127.0.0.1:${port}`;
const nextBin=path.join(repo,'node_modules','next','dist','bin','next');
const sanitizedEnv={...process.env};
for(const key of Object.keys(sanitizedEnv)){
  if(/(?:STRIPE|WHATSAPP|META_|OPENAI|OPENROUTER|SILICONFLOW|OMNIROUTE|API_KEY|ACCESS_TOKEN|AUTH_TOKEN|WEBHOOK_SECRET)/i.test(key))delete sanitizedEnv[key];
}
// T-0006 modernization: the behavioral E2E runs the REAL production auth path.
// The server runs in supabase mode against the OCI SIN Supabase gateway, so
// registerAction creates live identities, the login form uses the client
// Supabase client and users bind auth_subject exactly like in production.
// The gateway keys come from the environment (host kong container env).
const supabaseUrl=process.env.SUPABASE_URL||'https://supabase.delqhi.com';
const supabaseAnonKey=process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey=process.env.SUPABASE_SERVICE_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!supabaseAnonKey||!supabaseServiceKey)throw new Error('SUPABASE_ANON_KEY/SUPABASE_SERVICE_KEY missing from e2e env');
const runtimeEnv={...sanitizedEnv,DATABASE_PATH:databasePath,ADMIN_PASSWORD:adminPassword,SESSION_COOKIE_NAME:'e2e_session',NEXT_PUBLIC_APP_URL:base,AUTH_MODE:'supabase',E2E_INSECURE_COOKIES:'1',SUPABASE_URL:supabaseUrl,SUPABASE_ANON_KEY:supabaseAnonKey,SUPABASE_SERVICE_ROLE_KEY:supabaseServiceKey,SUPABASE_SERVICE_KEY:supabaseServiceKey,NEXT_PUBLIC_SUPABASE_URL:supabaseUrl,NEXT_PUBLIC_SUPABASE_ANON_KEY:supabaseAnonKey};
// Production build + start (like scripts/t0200-register-e2e.mjs): dev-mode
// StrictMode/Fast-Refresh double-mounting races the Supabase SSR cookie and
// drops sessions mid-flow. The production server is the reliable, truthful path.
if(!fs.existsSync(path.join(projectRoot,'.next','BUILD_ID'))){throw new Error('No production build found — run `npm run build` (with the Supabase build env) before npm run test:e2e.');}
// The client Supabase client is inlined at build time (NEXT_PUBLIC_*). A build
// without the Supabase build env silently degrades the login form to the
// fail-soft proxy: register works server-side, but the browser never calls
// GoTrue /token and the tech-persona login times out (T-0147 root cause,
// 2026-09-01). Fail fast instead of burning a full run.
if(!fs.readdirSync(path.join(projectRoot,'.next','static','chunks'),{recursive:true}).some(f=>String(f).endsWith('.js')&&fs.readFileSync(path.join(projectRoot,'.next','static','chunks',f),'utf8').includes(new URL(supabaseUrl).hostname))){
  throw new Error('Client bundle lacks the inlined Supabase origin — rebuild with the Supabase build env (NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY, see /etc/einfach-hausen-build.env, T-0200) before npm run test:e2e.');
}
server=spawn(process.execPath,[nextBin,'start','-H','127.0.0.1','-p',String(port)],{cwd:projectRoot,env:runtimeEnv,stdio:['ignore','pipe','pipe']});
for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{serverLog.push(chunk.toString());if(serverLog.length>300)serverLog.shift();});
await waitForServer(`${base}/`,120000);
browser=await browserType.launch({headless:true,executablePath:browserExecutable()});

try {
// 0) Öffentliche Website ist mobile-first, nutzenorientiert und als PWA installierbar.
const publicCtx=await newE2EContext({viewport:{width:390,height:844}}); const publicPage=await publicCtx.newPage(); trackPage(publicPage,'public-mobile');
await nav(publicPage, base+'/')
// Canonical root is the approved Atelier-02 landing (sealed capsule docs/brand/system, commit 714dcb9):
// hero h1 "Dein Haus. Einfach geregelt." and the benefit-first intake composer.
await publicPage.getByRole('heading',{name:/Dein Haus\./i}).waitFor();
await waitText(publicPage,'Einfach');
await waitText(publicPage,'Dein Anliegen in deinen Worten');
const hero=publicPage.locator('#anliegen');
for(const removedText of ['Was steht bei deinem Haus an?','kostenlos & unverbindlich','unverbindlich starten','kein Auftrag ohne deine Entscheidung','Nichts wird ohne dich beauftragt']){
  if(await hero.getByText(removedText,{exact:true}).count())throw new Error(`Landing hero still contains removed copy: ${removedText}`);
}
const heroRequest=publicPage.locator('form[action="/register"] input[name="request"]').first();
if(!(await heroRequest.count()))throw new Error('Landing intake composer missing');
const composerLabel=await heroRequest.getAttribute('aria-label');
if(composerLabel!=='Anliegen beschreiben' && !(await publicPage.locator('label[for="'+(await heroRequest.getAttribute('id'))+'"]').count()))throw new Error('Landing intake composer missing accessible label');
if(/KI-Hausmeister/i.test(await publicPage.locator('body').innerText()))throw new Error('Landing page still foregrounds AI instead of customer benefit');
await assertNoOverflow(publicPage,'Mobile landing');
// T-0129 v2: every canonical public route (DESIGN.md §5.1, 16 routes incl.
// the legal pages) must be a real, indexable page (200) AND carry the
// platform cues of DESIGN.md §5.4/§5.5/§11: a skip link + main landmark, the
// complete legal footer navigation (Impressum/Datenschutz/AGB) and a
// canonical <title>. Auth routes (/login, /welcome) render their own shell
// and are only held to the 200 + <title> contract here.
const authShellRoutes=new Set(['/login','/welcome']);
for(const route of PUBLIC_ROUTES){
  const r=await publicPage.request.get(base+route);if(!r.ok())throw new Error(`Public route ${route} failed (${r.status()})`);
  const html=await r.text();
  if(!/<title>[^<]{3,}<\/title>/.test(html))throw new Error(`Public route ${route} has no <title>`);
  if(authShellRoutes.has(route))continue;
  if(!html.includes('href="#main-content"')||!html.includes('id="main-content"'))throw new Error(`Public route ${route} lacks skip link / main landmark`);
  for(const legal of ['/impressum','/datenschutz','/agb'])if(!html.includes(`href="${legal}"`))throw new Error(`Public route ${route} footer lacks legal link ${legal}`);
}
// State screens are part of the platform surface (DESIGN.md §5.4/§10): an
// unknown path must answer 404 with the designed not-found page and a way
// back, not a blank framework page.
const notFoundResponse=await publicPage.request.get(base+'/__e2e-unknown-route__');
if(notFoundResponse.status()!==404)throw new Error(`Unknown route answered ${notFoundResponse.status()} instead of 404`);
await nav(publicPage, base+'/__e2e-unknown-route__');
await publicPage.getByRole('heading',{name:'Das gibt es hier nicht.'}).waitFor();
if(!(await publicPage.locator('a[href="/"]').count()))throw new Error('404 page has no way back to the start page');
await assertNoOverflow(publicPage,'Mobile 404 state');
await assertKeyboardFocus(publicPage,'Mobile 404 state');
// Legacy auth routes resolve on the server (T-0168): /welcome and /role have been
// server redirects since 74a3406, not self-service pages. The role is read from the
// application DB, never chosen in the client. Asserting the redirect is strictly
// stronger than the page-copy assertions it replaces: it proves the deleted client
// flow is gone AND that an anonymous visitor is sent to login.
for(const legacyAuthRoute of ['/welcome','/role']){
  await nav(publicPage, base+legacyAuthRoute);
  try{ await publicPage.waitForURL(/\/login/,{timeout:30000}); }
  catch{ throw new Error(`Legacy auth route ${legacyAuthRoute} did not resolve an anonymous visitor to /login (landed on ${publicPage.url()})`); }
  if(await publicPage.getByRole('heading',{name:/Willkommen bei einfachhausen/i}).count())throw new Error(`Legacy welcome page still rendered at ${legacyAuthRoute}`);
}
// Intake entry moved into the product: /kontakt serves 'Anliegen starten' -> /register?role=homeowner.
const kontaktResponse=await publicPage.request.get(base+'/kontakt'); if(!kontaktResponse.ok())throw new Error('Kontakt route failed');
const kontaktHtml=await kontaktResponse.text();
if(!kontaktHtml.includes('Anliegen starten')||!kontaktHtml.includes('/register?role=homeowner'))throw new Error('Kontakt intake entry missing');
// The former logged-out new-owner entry (welcome card -> /role role selection) no
// longer exists: /role is one of the server redirects asserted above, and the owner
// entry is the registration form itself, checked next.
// Owner registration (server action flow) stays the canonical owner onboarding entry.
// /register (auth-v2) opens directly in register mode and exposes a stable submit id.
await nav(publicPage, base+'/register?role=homeowner')
const ownerRegisterSubmit=publicPage.locator('#btn-submit-register');
await ownerRegisterSubmit.waitFor();
if(!(await publicPage.getByLabel(/Vorname/).count()))throw new Error('Owner registration missing Vorname field');
if(!(await publicPage.getByLabel(/Nachname/).count()))throw new Error('Owner registration missing Nachname field');
if(!(await publicPage.locator('input[name="password"]').count()))throw new Error('Owner registration missing Passwort field');
if(!(await publicPage.getByLabel(/Postleitzahl/).count()))throw new Error('Owner registration missing PLZ field');
if(!(await ownerRegisterSubmit.isEnabled()))throw new Error('Owner registration submit action is not usable');
// The P0 demo backdoors are fail-closed (88431f0): unless demo login is explicitly
// switched on, the registration form must not offer the public demo fill.
if(process.env.DEMO_LOGIN_ENABLED!=='1'&&await publicPage.locator('#btn-demo-kunde').count())throw new Error('Demo backdoor is visible although demo login is disabled');
await nav(publicPage, base+'/')
const manifestResponse=await publicPage.request.get(base+'/manifest.webmanifest'); if(!manifestResponse.ok())throw new Error('PWA manifest unavailable');
const manifest=await manifestResponse.json(); if(manifest.display!=='standalone'||!Array.isArray(manifest.icons)||manifest.icons.length<3)throw new Error('PWA manifest incomplete');
const swResponse=await publicPage.request.get(base+'/sw.js'); const swText=await swResponse.text(); if(!swResponse.ok()||!swText.includes('einfach-hausen-public-shell')||!swText.includes('offlineResponse'))throw new Error('Service worker unavailable or missing safe offline shell'); const swCache=swResponse.headers()['cache-control']||''; if(!/no-cache|no-store/i.test(swCache))throw new Error('Service worker must not be long-term cached');
await nav(publicPage, publicPage.url());
await publicPage.evaluate(async()=>{if(!('serviceWorker' in navigator))throw new Error('service worker unsupported');await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
if(browserName==='chromium'){
  // Chromium is the supported local service-worker offline probe. Firefox/WebKit
  // still execute the complete product flow below; their headless runners do
  // not consistently surface synthetic context offline failures to navigation.
  await publicCtx.setOffline(true); await nav(publicPage, base+'/offline-proof'); await waitText(publicPage,'Gerade keine Verbindung.'); await publicCtx.setOffline(false); await nav(publicPage, base+'/');
}
await assertKeyboardFocus(publicPage,'Mobile landing');
await publicPage.screenshot({path:path.join(artifactsDir,'mobile-landing.png'),fullPage:true});
await publicCtx.close();

const desktopCtx=await newE2EContext({viewport:{width:1320,height:900}}); const desktop=await desktopCtx.newPage(); trackPage(desktop,'public-desktop');
for(const route of ['/','/leistungen','/preise','/so-funktionierts','/eigenheimbesitzer','/partner','/hausakte','/hilfe','/sicherheit','/kontakt','/impressum','/datenschutz','/agb']){const response=await nav(desktop, base+route);if(!response?.ok())throw new Error(`Public route failed: ${route} status=${response?.status()}`);await assertNoOverflow(desktop,`Desktop ${route}`);}
await nav(desktop, base+'/'); await assertKeyboardFocus(desktop,'Desktop landing'); await desktopCtx.close();

// 1) Firma registrieren, prüfen und als Vertragspartner aktivieren.
const managerCtx=await newE2EContext({viewport:{width:390,height:844}}); const manager=await managerCtx.newPage(); trackPage(manager,'provider-manager');
const pageErrors=[];
manager.on('console',(m)=>{if(m.type()==='error')pageErrors.push(m.text());});
manager.on('pageerror',(e)=>pageErrors.push('pageerror: '+e.message));
await nav(manager, base+'/register?role=provider')
await manager.locator('#btn-submit-register').waitFor();
await fillRegisterField(manager,'businessName','Gartenbau Müller'); await fillRegisterField(manager,'firstName','Daniel'); await fillRegisterField(manager,'lastName','Müller');
await fillRegisterField(manager,'email',providerEmail); await fillRegisterField(manager,'password',password);
await fillRegisterField(manager,'postcode','46325');
await fillRegisterField(manager,'trades','Garten- und Landschaftsbau, Heckenschnitt, Hausmeisterservice');
try{await Promise.all([manager.waitForURL('**/pro'),manager.locator('#btn-submit-register').click()]);}catch(navError){console.error('E2EDIAG register url=',manager.url());console.error('E2EDIAG register body=',(await manager.locator('body').innerText()).slice(0,500).replace(/\n+/g,' | '));throw navError;}
await nav(manager, base+'/pro/profile')
await manager.waitForLoadState('networkidle').catch(()=>{});
await waitForDomStable(manager,'input[name="document"]',1);
const preVerifyConsultationToggle=manager.getByLabel('Beratung / fachliche Fragen',{exact:true}); if(!(await preVerifyConsultationToggle.isChecked()))await preVerifyConsultationToggle.check(); const preVerifyShortNoticeToggle=manager.getByLabel('Kurzfristige Aufträge',{exact:true}); if(!(await preVerifyShortNoticeToggle.isChecked()))await preVerifyShortNoticeToggle.check();
const preVerifyEmergencyToggle=manager.getByLabel('Notfälle',{exact:true}); if(!(await preVerifyEmergencyToggle.isChecked()))await preVerifyEmergencyToggle.check();
try{await manager.locator('select[name="emergencyMode"]').waitFor({timeout:30000});await manager.locator('select[name="emergencyMode"]').selectOption('24_7');}catch(modeError){console.error('E2EDIAG emergencymode count=',await manager.locator('select[name="emergencyMode"]').count());console.error('E2EDIAG emergencymode body=',(await manager.locator('body').innerText()).slice(0,400).replace(/\n+/g,' | '));throw modeError;}
try{await clickAndWaitUrl(manager,manager.getByRole('button',{name:'Profil speichern'}),/profile=(?:review|saved)/);}catch(saveError){console.error('E2EDIAG profilesave url=',manager.url());console.error('E2EDIAG profilesave body=',(await manager.locator('body').innerText()).slice(0,400).replace(/\n+/g,' | '));throw saveError;}
await nav(manager, base+'/pro/profile'); await waitForDomStable(manager,'input[name="document"]',1);
try{
  await manager.getByLabel('Nachweis').setInputFiles({name:'gewerbe.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n% Test\n')});
}catch(uploadError){
  const dom=await manager.evaluate(()=>({
    mains:document.querySelectorAll('main').length,
    forms:document.querySelectorAll('form').length,
    inputs:[...document.querySelectorAll('input[name="document"]')].map(el=>{const f=el.closest('form');return {formClass:f?f.className:null,visible:!!(el.offsetWidth||el.offsetHeight)};}),
    bodyStart:document.body.innerHTML.slice(0,400),
  }));
  console.error('E2EDIAG verification DOM:',JSON.stringify(dom,null,1));
  throw uploadError;
}
await manager.getByLabel('Hinweis').fill('Gewerbe, Qualifikation und Betriebshaftpflicht liegen vor.');
await clickAndWaitUrl(manager,manager.getByRole('button',{name:'Zur Prüfung einreichen'}),/verification=submitted/);

const adminCtx=await newE2EContext({viewport:{width:1180,height:1000}}); const admin=await adminCtx.newPage(); trackPage(admin,'admin');
await nav(admin, base+'/admin/login'); await admin.getByLabel('Admin-Passwort').fill(adminPassword);
await Promise.all([admin.waitForURL('**/admin'),admin.getByRole('button',{name:'Admin anmelden'}).click()]);
await admin.getByRole('heading',{name:'Betriebsübersicht'}).waitFor(); await waitText(admin,'Nutzer'); await waitText(admin,'Anfragen'); await waitText(admin,'Bookings'); await waitText(admin,'Matching'); await waitText(admin,'Benachrichtigungen'); await admin.getByRole('heading',{name:'Bewertungen',exact:true}).waitFor();
// Partner cards are EHFormSection blocks, which render <fieldset><legend>. Anchor on
// the legend so the right partner is selected; the previous `.admin-card` class no
// longer exists anywhere in the admin UI (it was rewritten onto the design system).
let companyCard=admin.locator('fieldset').filter({has:admin.locator('legend',{hasText:'Gartenbau Müller'})}).first();
await clickServerAction(admin,companyCard.getByRole('button',{name:'Unternehmen freigeben'}));
try { await companyCard.getByText(/Prüfung Freigegeben/).waitFor({timeout:30000}); } catch(e) {
  console.error('E2EDIAG url=',admin.url());
  console.error('E2EDIAG body=',(await admin.locator('body').innerText()).slice(0,600).replace(/\n+/g,' | '));
  console.error('E2EDIAG serverLog tail:\n'+serverLog.slice(-40).join(''));
  throw e;
}
// The approval action revalidates /admin and re-renders the page; reload so the
// uncontrolled contract form starts from fresh server state (a stale DOM resets
// select/checkboxes to defaults before the submit lands).
await nav(admin, admin.url()); await admin.getByRole('heading',{name:'Betriebsübersicht'}).waitFor();
companyCard=admin.locator('fieldset').filter({has:admin.locator('legend',{hasText:'Gartenbau Müller'})}).first();
await companyCard.getByLabel('Status').selectOption('active');
for(const name of ['Betriebshaftpflicht geprüft','Qualifikation/Zulassung geprüft','Partnervertrag unterschrieben','Qualitätsstandard akzeptiert']) await companyCard.getByLabel(name).check();
await clickServerAction(admin,companyCard.getByRole('button',{name:'Partnervertrag speichern'}));
try { await companyCard.getByText(/Vertrag Aktiv/).waitFor({timeout:60000}); } catch(e) {
  console.error('E2EDIAG contract url=',admin.url());
  console.error('E2EDIAG contract body=',(await admin.locator('body').innerText()).slice(0,2600).replace(/\n+/g,' | '));
  throw e;
}
await nav(manager, base+'/pro/profile'); await waitText(manager,'Aktiver Einfach-Hausen-Vertragspartner'); await waitText(manager,'0 % Provision');
await waitForDomStable(manager,'#provider-content',1);
try{
  const providerCanvas=await manager.evaluate(()=>getComputedStyle(document.body).backgroundColor); if(providerCanvas==='rgb(17, 21, 18)')throw new Error('Provider app must use shared light canvas');
}catch(canvasError){
  const dom=await manager.evaluate(()=>[...document.querySelectorAll('.app-page')].map(m=>({
    parentChain:(()=>{let c=[],e=m;for(let i=0;i<5&&e;i++){c.push(e.tagName+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''));e=e.parentElement;}return c.join('<');})(),
    head:m.querySelector('h1,strong')?.textContent?.slice(0,60)||'',
  })));
  console.error('E2EDIAG duplicate shells:',JSON.stringify(dom,null,1));
  // Is the second tree sticky, and which tree does React own?
  const ownership=await manager.evaluate(()=>{
    return [...document.querySelectorAll('.app-page')].map((m,i)=>({
      i,
      reactOwned:Object.keys(m).some((k)=>k.startsWith('__reactContainer')),
      hidden:getComputedStyle(m).display==='none',
      firstStrong:m.querySelector('strong')?.textContent?.slice(0,40)||'',
    }));
  }).catch(()=>({evalFailed:true}));
  console.error('E2EDIAG shell ownership:',JSON.stringify(ownership));
  await manager.waitForTimeout(3000);
  const afterWait=await manager.evaluate(()=>document.querySelectorAll('.app-page').length).catch(()=>-1);
  console.error('E2EDIAG app-page count after 3s:',afterWait);
  throw canvasError;
}
// Partner-Navigation auf 390px: der Werkbank-Rahmen hat Pillen-Navi und
// <details>-Drawer ersetzt, die Sidebar oeffnet mobil als Sheet. Geprueft wird
// deshalb der Trigger in der Kopfzeile und dass das Sheet die echte
// Partner-Navigation traegt - ein leeres Sheet wuerde "es oeffnet" bestehen.
await openMobileSidebar(manager,'Provider');
const providerHrefs=await mobileSidebarHrefs(manager);
for(const href of ['/pro','/pro/orders','/pro/messages','/pro/team','/pro/profile']){
  if(!providerHrefs.includes(href))throw new Error(`Provider mobile sidebar is missing ${href}`);
}
await assertMobileSidebarCloses(manager,'Provider');
await manager.getByLabel('Firmenanschrift').fill('Gartenstraße 12, 46325 Borken'); await manager.getByLabel('Steuernummer').fill('307/1234/5678');
// Partner onboarding completeness: region radius, weekly capacity, availability, team.
const radiusInput=manager.getByLabel(/Einsatzradius/); if(await radiusInput.count())await radiusInput.fill('40');
await strictRetry(manager,()=>manager.getByLabel('Wöchentliche Kapazität (Aufträge)').fill('12'));
const emergencyToggle=manager.getByLabel('Notfälle',{exact:true}); if(!(await emergencyToggle.isChecked()))await emergencyToggle.check(); await manager.getByLabel('Modell').selectOption('24_7'); await manager.getByLabel('Max. Notfallzuschlag %').fill('20'); await clickServerAction(manager,manager.getByRole('button',{name:'Profil speichern'}));
await waitText(manager,'Aktiver Einfach-Hausen-Vertragspartner');
await nav(manager, manager.url());
const capacityAfterReload=await strictRetry(manager,()=>manager.getByLabel('Wöchentliche Kapazität (Aufträge)').inputValue()); if(capacityAfterReload!=='12')throw new Error(`Weekly capacity did not persist, got ${capacityAfterReload}`);
const radiusAfterReload=await manager.getByLabel(/Einsatzradius/).inputValue(); if(radiusAfterReload!=='40')throw new Error(`Service radius did not persist, got ${radiusAfterReload}`);

// 2) Firma legt einen echten Ansprechpartner an. Nur ein Schalter für Auftragsverwaltung.
// Die Seite führt jetzt EHPageHeader (h1 "Team" + Betriebsname als Kontext) und
// EHMetricsBar; die frühere Marketing-Überschrift "Dein Team. Klare
// Zuständigkeiten." gibt es dort nicht mehr.
await nav(manager, base+'/pro/team'); await manager.getByRole('heading',{level:1,name:'Team',exact:true}).waitFor(); await waitText(manager,'Aufträge verwalten'); await assertNoOverflow(manager,'Mobile partner team');
await manager.getByLabel('Vorname').last().fill('Thomas'); await manager.getByLabel('Nachname').last().fill('Weber');
await manager.getByLabel('Funktion').fill('Techniker'); await manager.locator('input[name="email"]').last().fill(techEmail); await manager.getByLabel('Telefon').last().fill('+49 151 12345678'); await manager.getByLabel('Startpasswort').fill(password);
await clickAndWaitUrl(manager,manager.getByRole('button',{name:'Ansprechpartner anlegen'}),/member=created/); await waitText(manager,'Thomas Weber');
let thomasCard=manager.locator('form').filter({has:manager.getByLabel('Bezeichnung')}).filter({hasText:'Thomas Weber'});
try{
  if(await thomasCard.getByLabel('Aufträge verwalten').isChecked())throw new Error('Technician must not manage new jobs by default');
}catch(teamError){
  const diag=await manager.evaluate(()=>({
    cards:document.querySelectorAll('form').length,
    checkboxes:document.querySelectorAll('input[name="canManageJobs"]').length,
    sContainers:[...document.querySelectorAll('body > div[id^="S:"]')].length,
    bodyTail:document.body.innerText.slice(-400),
  })).catch(()=>({evalFailed:true}));
  console.error('E2EDIAG team state:',JSON.stringify(diag));
  console.error('E2EDIAG serverLog tail:\n'+serverLog.slice(-30).join(''));
  throw teamError;
}
await thomasCard.getByLabel('Aufträge verwalten').check(); await clickServerAction(manager,thomasCard.getByRole('button',{name:'Änderungen speichern'})); await nav(manager, manager.url()); thomasCard=manager.locator('form').filter({has:manager.getByLabel('Bezeichnung')}).filter({hasText:'Thomas Weber'}); if(!(await thomasCard.getByLabel('Aufträge verwalten').isChecked()))throw new Error('Provider manage-jobs AN did not persist');
await thomasCard.getByLabel('Aufträge verwalten').uncheck(); await clickServerAction(manager,thomasCard.getByRole('button',{name:'Änderungen speichern'})); await nav(manager, manager.url()); thomasCard=manager.locator('form').filter({has:manager.getByLabel('Bezeichnung')}).filter({hasText:'Thomas Weber'}); if(await thomasCard.getByLabel('Aufträge verwalten').isChecked())throw new Error('Provider manage-jobs AUS did not persist');

// 3) Kunde startet beim Hausmeisterservice und entscheidet danach bewusst: Mensch oder Auftrag.
const ownerCtx=await newE2EContext({viewport:{width:390,height:844}}); const owner=await ownerCtx.newPage(); trackPage(owner,'homeowner');
await nav(owner, base+'/register?role=homeowner')
await owner.locator('#btn-submit-register').waitFor();
await fillRegisterField(owner,'firstName','Maria'); await fillRegisterField(owner,'lastName','Test'); await fillRegisterField(owner,'email',ownerEmail); await fillRegisterField(owner,'password',password); await fillRegisterField(owner,'postcode','46325');
await Promise.all([owner.waitForURL('**/app/onboarding'),owner.locator('#btn-submit-register').click()]);
await waitText(owner,'Trag Straße und PLZ ein, damit Einfach Hausen Betriebe in deiner Region findet.');
// Resume works: leaving mid-onboarding and returning keeps the saved step.
await nav(owner, base+'/app'); await waitText(owner,'Einrichtung unvollständig');
await clickAndWaitUrl(owner,owner.getByRole('link',{name:'Einrichtung fortsetzen'}),/\/app\/onboarding$/);
await waitText(owner,'Trag Straße und PLZ ein, damit Einfach Hausen Betriebe in deiner Region findet.');
await strictRetry(owner,()=>owner.getByLabel('Straße und Hausnummer').fill('Gartenweg 12'));
await clickServerAction(owner,owner.getByRole('button',{name:'Weiter'})); await waitText(owner,'Wähle die Bereiche, die dich interessieren. Überspringen ist möglich.');
// Optional steps are skippable.
await strictRetry(owner,()=>owner.getByRole('button',{name:'Überspringen'}).click()); await waitText(owner,'Sag, über welchen Weg wir dich am besten erreichen.');
await strictRetry(owner,()=>owner.getByRole('button',{name:'Überspringen'}).click());
await Promise.all([owner.waitForURL('**/app?onboarding=done'),owner.waitForLoadState('load')]);
if(await owner.getByText('Einrichtung unvollständig').count())throw new Error('Onboarding banner shown after completion');
await assertNoOverflow(owner,'Mobile customer app');
// Die Owner-Startseite ist die EHOwnerSection-Komposition ("Wartet auf dich",
// "Hausakte", "Nächste Termine"). Die früheren Anker gehören zu EHOwnerComposer,
// das keine Seite mehr rendert.
await nav(owner, base+'/app'); await waitText(owner,'Wartet auf dich'); await waitText(owner,'Hausakte'); await waitText(owner,'Nächste Termine');
// Owner mobile navigation: derselbe Werkbank-Rahmen, also dieselbe Sidebar.
// Der frueher hier gepruefte Notion-Drawer (.mobile-menu / .ehn-drawer) wird von
// keiner Route mehr gerendert. Was bleiben muss: fuenf Hausbereiche, ein eigener
// Konto-Block und das Schliessen nach einer Navigation.
await openMobileSidebar(owner,'Owner');
const ownerHrefs=await mobileSidebarHrefs(owner);
for(const href of ['/app','/app/home','/app/contracts','/app/jobs','/app/messages']){
  if(!ownerHrefs.includes(href))throw new Error(`Mobile homeowner sidebar must expose the area ${href}`);
}
for(const href of ['/app/profile','/notifications','/app/hilfe']){
  if(!ownerHrefs.includes(href))throw new Error(`Mobile homeowner sidebar must expose the account entry ${href}`);
}
await clickAndWaitUrl(owner,owner.locator(`${MOBILE_SIDEBAR} a[href="/app/jobs"]`).first(),/\/app\/jobs/);
if(await owner.locator(MOBILE_SIDEBAR).first().isVisible())throw new Error('Mobile owner menu did not close after navigation');
await nav(owner, base+'/app/profile'); await waitText(owner,'Einfach Hausen aufs Handy'); await assertNoOverflow(owner,'Mobile customer profile');
await nav(owner, base+'/app/hausmeister'); await assertNoOverflow(owner,'Mobile housemaster');
await sendHousemaster(owner,'Meine Hecke ist zu hoch. Dienstag ab 14 Uhr hätte ich Zeit. Wen kann ich dazu fragen?',/answered=1/);
await waitText(owner,'Wie soll es weitergehen?'); await waitText(owner,'Ansprechpartner finden'); await waitText(owner,'Auftrag organisieren');
// Eine normale Hausfrage darf noch keine Partneranfrage erzeugen.
await nav(manager, base+'/pro'); await waitText(manager,'Keine neuen Aufträge.');
// A normal house question must not create a partner request, so there must be
// no dispatch card to open. The earlier assertion looked for the empty-state
// copy "Keine neuen Anfragen im Umkreis", which the rebuilt /pro start page no
// longer renders.
if(await manager.locator('a[href^="/pro/jobs/"]').count()!==0)throw new Error('A normal house question must not create a partner request');

// 3a) Zuerst nur einen Menschen verbinden — ausdrücklich noch kein Auftrag.
await clickAndWaitUrl(owner,owner.getByRole('button',{name:/Ansprechpartner finden/}),/\/app\/jobs\/\d+/); const contactJobId=Number(owner.url().split('/').pop()); if(!contactJobId)throw new Error('contact job missing');
await waitText(owner,'Du hast nur einen Ansprechpartner gewählt'); await waitText(owner,'noch kein Auftrag');
await nav(manager, base+'/pro');
let contactHref=null;
for(let attempt=0;attempt<8&&!contactHref;attempt++){
  const req=manager.locator(`a[href="/pro/jobs/${contactJobId}"]`).first();
  try{ await req.waitFor({timeout:5000}); contactHref=await req.getAttribute('href'); }
  catch{ await manager.waitForTimeout(700); await nav(manager, base+'/pro'); }
}
if(!contactHref)throw new Error('contact dispatch card never became visible');
if(contactHref!==`/pro/jobs/${contactJobId}`)throw new Error(`contact dispatch card href mismatch: ${contactHref}`);
// Dev-mode Fast Refresh can full-reload mid-interaction and swallow clicks;
// a direct navigation with one retry is deterministic here.
try { await nav(manager, base+`/pro/jobs/${contactJobId}`); }
catch{ await manager.waitForTimeout(2000); await nav(manager, base+`/pro/jobs/${contactJobId}`); }
await waitText(manager,'Nur persönlicher Ansprechpartner gesucht');
const contactSelect=manager.getByLabel('Ansprechpartner'); const contactThomas=contactSelect.locator('option').filter({hasText:'Thomas Weber'}); const contactThomasValue=await contactThomas.getAttribute('value'); if(!contactThomasValue)throw new Error('Thomas contact option missing'); await contactSelect.selectOption(contactThomasValue);
await clickServerAction(manager,manager.getByRole('button',{name:'Kontakt übernehmen'}));
await nav(manager, manager.url()); await waitText(manager,'Du bist mit dem Eigentümer verbunden');
await nav(owner, base+`/app/jobs/${contactJobId}`); await waitText(owner,'Thomas Weber'); await waitText(owner,'noch kein Auftrag'); await assertNoOverflow(owner,'Mobile contact detail');

// Direkter Kontakt funktioniert schon ohne Auftrag.
await owner.getByRole('link',{name:'Nachricht',exact:true}).click(); await waitText(owner,'Zurück zur Kontaktliste'); await assertNoOverflow(owner,'Mobile contacts');
await owner.getByPlaceholder(/Nachricht an Thomas/).fill('Thomas, kannst du kurz sagen, ob du dir das ansehen würdest?'); await clickServerAction(owner,owner.getByRole('button',{name:'Nachricht senden'}));
const techCtx=await newE2EContext({viewport:{width:390,height:844}}); const tech=await techCtx.newPage(); trackPage(tech,'provider-contact');
tech.on('framenavigated',f=>{ if(f===tech.mainFrame()) console.error('E2E-NAV:',JSON.stringify(tech.url())); });
tech.on('response',r=>{ if(r.status()>=300){ console.error('E2E-RES:',r.status(),r.request().method(),r.url().slice(base.length)); } });
// The tech persona signs in through the REAL client-side Supabase form (the same
// production path proven by t0169/t0170 evidence). The Supabase identity mirrors
// the local team member created above (same email + Startpasswort) so the one-time
// email bridge binds auth_subject to that row on the first authenticated request.
const supabaseAdminBase=supabaseUrl;
let supabaseTechUserId=null;
{
  const mk=await fetch(`${supabaseAdminBase}/auth/v1/admin/users`,{method:'POST',headers:{apikey:supabaseServiceKey,Authorization:`Bearer ${supabaseServiceKey}`,'Content-Type':'application/json'},body:JSON.stringify({email:techEmail,password,email_confirm:true,user_metadata:{role:'provider',e2e:true}})});
  if(mk.ok){const u=await mk.json();supabaseTechUserId=u.id;console.error('E2EDIAG supabase tech user id:',supabaseTechUserId);}
  // 422 = already exists. Resolve the id by exact address; `?email=` would be
  // ignored by GoTrue and `users[0]` would be an arbitrary other user.
  else if(mk.status===422){const existing=await findSupabaseUserByEmail(techEmail);supabaseTechUserId=existing?.id||null;}
  else throw new Error(`Supabase identity creation failed: HTTP ${mk.status}`);
}
await nav(tech, base+'/login'); await tech.getByRole('heading',{name:/Willkommen zurück/}).waitFor(); const loginButton=tech.locator('#btn-submit-login:visible'); const loginBox=await loginButton.boundingBox(); if(!loginBox || loginBox.height < 44)throw new Error('Login primary action must be at least 44px high');
let loggedIn=false;
for(let attempt=0;attempt<3&&!loggedIn;attempt++){
  await tech.waitForLoadState('networkidle').catch(()=>{}); await tech.waitForTimeout(800*attempt);
  await tech.locator('input[inputmode="email"]:visible').fill(techEmail);
  await tech.locator('input[type="password"]:visible').fill(password);
  let enabled=false;
  try{ await tech.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith('Anmelden')&&b.getClientRects().length>0);return b&&!b.disabled;},{timeout:8000}); enabled=true; }catch{}
  if(enabled){
    await Promise.all([tech.waitForURL('**/pro',{timeout:60000}).catch(async()=>{ await tech.waitForTimeout(1500); const errbox=await tech.locator('[role="alert"]').textContent().catch(()=>'(no alert)'); throw new Error('post-click nav failed: '+tech.url()+' | errbox='+errbox); }),loginButton.click()]);
    loggedIn=true;
    const sbCookies=await techCtx.cookies(base+'/app');
    console.error('E2EDIAG sb cookies after login:',JSON.stringify(sbCookies.map(c=>c.name)));
  }
}
if(!loggedIn)throw new Error('Tech login never completed (form submit did not navigate to /pro)');
await nav(tech, base+'/pro/messages',{timeout:60000}); await waitText(tech,'Maria Test'); await waitText(tech,'ob du dir das ansehen würdest');
await tech.waitForLoadState('load').catch(()=>{}); await tech.waitForTimeout(800); await tech.getByPlaceholder(/Nachricht an Maria/).fill('Ja, das kann ich mir ansehen. Wenn du möchtest, kann daraus separat ein Auftrag werden.'); await clickServerAction(tech,tech.getByRole('button',{name:'Nachricht senden'}));
await nav(owner, base+`/app/jobs/${contactJobId}`); await waitText(owner,'separat ein Auftrag');

// 3b) Erst jetzt entscheidet Maria, daraus einen echten Auftrag zu machen.
await nav(owner, base+`/app/jobs/${contactJobId}`); await clickAndWaitUrl(owner,owner.getByRole('button',{name:'Auftrag organisieren'}),/clarify=1/); await waitText(owner,'Wie lang ist die Hecke ungefähr?');
await sendHousemaster(owner,'Etwa 25 Meter.',/job=\d+/); const jobId=Number(new URL(owner.url()).searchParams.get('job')); if(!jobId)throw new Error('service job missing');
await owner.getByText(/Richtpreis liegt aktuell ungefähr/).waitFor(); await owner.getByText(/vertraglich geprüfte Partner/).waitFor();
await owner.screenshot({path:path.join(artifactsDir,'owner-ai-housemaster.png'),fullPage:true});

// 4) Nur berechtigter Firmenmanager sieht die neue Anfrage und erstellt das Angebot.
await nav(manager, base+'/pro'); await manager.getByText('Heckenschnitt').first().waitFor(); await manager.getByText('Heckenschnitt').first().click();
await manager.getByLabel('Gesamtpreis (€)').fill('139'); await manager.getByLabel('Leistungsumfang').fill('Heckenschnitt inkl. Abtransport des Schnittguts und sauberer Übergabe.');
await clickServerAction(manager,manager.getByRole('button',{name:'Angebot senden'}));
await manager.screenshot({path:path.join(artifactsDir,'provider-dispatch-offer.png'),fullPage:true});

// 5) Kunde vergleicht und bucht. Danach existiert ein echter Ansprechpartner.
await nav(owner, base+`/app/jobs/${jobId}`); await waitText(owner,'Gartenbau Müller'); await waitText(owner,'EMPFEHLUNG'); await waitText(owner,'GÜNSTIGST');
await clickAndWaitUrl(owner,owner.getByRole('link',{name:/Gartenbau Müller/}).first(),/\/app\/partners\//); await waitText(owner,'Geprüfter Partner'); await waitText(owner,'Gartenbau Müller'); await assertNoOverflow(owner,'Mobile partner profile'); await clickAndWaitUrl(owner,owner.getByRole('link',{name:/Zum Angebot zurück/}),new RegExp(`/app/jobs/${jobId}`));
await clickServerAction(owner,owner.getByRole('button',{name:'Diesen Partner buchen'})); await waitText(owner,'Gebucht');
await waitText(owner,'Dein persönlicher Ansprechpartner');

// Manager weist bewusst Thomas zu.
await nav(manager, base+`/pro/jobs/${jobId}`); await waitText(manager,'Ansprechpartner');
const assignmentDisclosure=manager.locator('details.provider-disclosure').filter({hasText:'Ansprechpartner ändern'}); if(await assignmentDisclosure.count())await assignmentDisclosure.locator('summary').click(); await assignmentDisclosure.waitFor({state:'open'}).catch(()=>{}); const assignmentForm=assignmentDisclosure.locator('form:visible').filter({has:manager.getByLabel('Ansprechpartner')}).first(); await assignmentForm.waitFor(); const assignmentSelect=assignmentForm.getByLabel('Ansprechpartner'); await assignmentSelect.waitFor(); const thomasOption=assignmentSelect.locator('option').filter({hasText:'Thomas Weber'}); await thomasOption.waitFor({state:'attached'}); const thomasValue=await thomasOption.getAttribute('value'); if(!thomasValue)throw new Error('Thomas option missing'); await assignmentSelect.selectOption(thomasValue); const assignmentButton=assignmentForm.getByRole('button',{name:/Ansprechpartner festlegen|Zuweisung speichern/}); await clickServerAction(manager,assignmentButton);
await nav(owner, owner.url()); await waitText(owner,'Thomas Weber'); await waitText(owner,'Techniker · Gartenbau Müller');
await owner.screenshot({path:path.join(artifactsDir,'owner-personal-contact.png'),fullPage:true});

// 6) Derselbe Ansprechpartner bleibt auch nach der späteren Buchung erreichbar.
await owner.getByRole('link',{name:'Nachricht',exact:true}).click(); await waitText(owner,'Zurück zur Kontaktliste');
await owner.getByPlaceholder(/Nachricht an Thomas/).fill('Thomas, bitte kurz Bescheid sagen, bevor du losfährst.'); await clickServerAction(owner,owner.getByRole('button',{name:'Nachricht senden'}));
await nav(tech, base+'/pro/messages'); await waitText(tech,'Thomas, bitte kurz Bescheid');
await tech.getByPlaceholder(/Nachricht an Maria/).fill('Gerne, ich melde mich etwa 30 Minuten vorher.'); await clickServerAction(tech,tech.getByRole('button',{name:'Nachricht senden'}));
await nav(owner, owner.url()); await waitText(owner,'30 Minuten vorher');

// 7) Ansprechpartner führt aus, dokumentiert und bleibt danach gespeichert.
await nav(tech, base+`/pro/jobs/${jobId}`); await waitText(tech,'Du bist der persönliche Ansprechpartner'); await clickServerAction(tech,tech.getByRole('button',{name:'Arbeit starten'})); await clickServerAction(tech,tech.getByRole('button',{name:'Als erledigt markieren'}));
await waitText(tech,'Rechnung erstellen'); const invoiceForm=tech.locator('form:visible').filter({has:tech.locator('input[name="itemDescription"]')}).first(); await invoiceForm.locator('input[name="itemDescription"]').first().fill('Heckenschnitt inkl. Entsorgung'); await invoiceForm.locator('input[name="itemPrice"]').first().fill('116.81'); await clickAndWaitUrl(tech,tech.getByRole('button',{name:'Rechnung erstellen & senden'}),/\/pro\/invoices\/\d+/); const invoiceId=Number(new URL(tech.url()).pathname.split('/').pop()); if(!invoiceId)throw new Error('invoice missing'); const invoiceNumber=await tech.evaluate(()=>{const m=document.body.innerText.match(/RE-\d{4,}|Rechnung\s*[-#]?\s*(\d{4,})/i);return m?m[0]:''}); if(!invoiceNumber)console.error('E2EDIAG invoice number not matched, will rely on documents listing'); await waitText(tech,'Rechnung wurde an den Eigentümer gesendet');
await nav(owner, base+'/app/documents'); await waitText(owner,invoiceNumber);
const invoiceHref=await owner.locator(`a[href="/app/invoices/${invoiceId}"]`).first().getAttribute('href');
if(!invoiceHref)throw new Error('invoice link missing in documents');
// Dev-compile of this heavy route can race a plain click navigation; goto+retry is deterministic.
for(let attempt=0;attempt<2;attempt++){ await nav(owner, base+invoiceHref,{timeout:120000}); if(owner.url().includes('/app/invoices/'))break; console.error('E2EDIAG invoice goto retry',attempt,owner.url()); await owner.waitForTimeout(2000); }
await waitText(owner,'Rechnungsbetrag'); await waitText(owner,'Gartenbau Müller'); await assertNoOverflow(owner,'Mobile invoice');
await clickAndWaitUrl(owner,owner.getByRole('button',{name:'Rechnung bezahlen'}),/error=/); await waitText(owner,'Onlinezahlung ist gerade nicht verfügbar'); if(!(await owner.getByRole('button',{name:'Rechnung bezahlen'}).isVisible()))throw new Error('Unavailable payment path mutated invoice state');
await nav(tech, base+`/pro/jobs/${jobId}`); const documentSection=tech.locator('form').filter({has:tech.getByLabel('Datei')}).first(); await documentSection.waitFor(); await documentSection.getByLabel('Titel').fill('Leistungsnachweis Heckenschnitt'); await documentSection.getByLabel('Dokumenttyp').selectOption('report'); await documentSection.getByLabel('Datei').setInputFiles({name:'nachweis.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n% Einfach Hausen Test\n')}); await clickServerAction(tech,documentSection.getByRole('button',{name:'Dokument hochladen'}));
await nav(owner, base+'/app/messages'); await waitText(owner,'Wähle einen Bereich. Danach das passende Gewerk.'); await owner.locator('a[data-main-category="garten"]').first().waitFor(); { const firstLevel=await owner.locator('body').innerText(); if(firstLevel.includes('Thomas Weber'))throw new Error('contacts must not appear on the category first level'); } await nav(owner, base+'/app/messages?mode=manage'); await waitText(owner,'Alle Kontakte an einem Ort'); await waitText(owner,'Thomas Weber'); const docRow=owner.locator('a[href*="entry="]').filter({hasText:'Thomas Weber'}).first(); await docRow.click(); await waitText(owner,'Leistungen');
await nav(owner, base+'/app/documents'); await waitText(owner,'Leistungsnachweis Heckenschnitt');

// 7a) Notification Center: server-side read-state sync, per-item toggles, pagination chrome.
await nav(manager, base+'/notifications'); await manager.getByRole('heading',{level:1,name:'Updates'}).waitFor();
// The anchor used to be the title of a dispatch notification ("Angebote,
// Disposition") that no longer exists. What this block actually proves is the
// unread dispatch notification and its server-side read state, asserted right
// below; the anchor only has to establish that the center rendered.
const firstUnread=manager.locator('button[aria-label^="Als gelesen markieren"]').first();
if(await firstUnread.count()===0)throw new Error('Manager should have unread dispatch notifications by now');
// Read-state sync is server-rendered: the 'ungelesen' marker must disappear from the first row after marking read.
const firstUnreadTitle=(await firstUnread.getAttribute('aria-label'))||'';
await clickServerAction(manager,firstUnread);
await waitText(manager,'Alle gelesen');
await nav(manager, manager.url());
if(await manager.locator(`button[aria-label="Als gelesen markieren: ${firstUnreadTitle.replace('Als gelesen markieren: ','')}"]`).count())throw new Error('Read state did not persist across reload');
// Toggle back to unread keeps the center honest in both directions.
const unreadToggle=manager.locator('button[aria-label^="Als ungelesen markieren"]').first();
if(await unreadToggle.count()===0)throw new Error('No unread-toggle available to restore state');
await clickServerAction(manager,unreadToggle);
await manager.waitForFunction(()=>document.body.innerText.includes('ungelesen'),{timeout:10000});
await assertNoOverflow(manager,'Mobile notification center');

// 8) Hausakte und Tarife entsprechen dem Geschäftsmodell.
await nav(owner, base+'/app/home'); await waitText(owner,'Mein Haus'); await owner.locator('#hausprofil > summary').click(); await assertNoOverflow(owner,'Mobile house file'); await owner.getByLabel('Haustyp').selectOption('Einfamilienhaus'); await owner.getByLabel('Baujahr').fill('2004'); await owner.getByLabel('Wohnfläche (m²)').fill('145'); await owner.getByLabel('Grundstück (m²)').fill('620'); await clickServerAction(owner,owner.getByRole('button',{name:'Hausprofil speichern'}));
await owner.locator('#technik-anlegen > summary').click(); const assetForm=owner.locator('form').filter({has:owner.locator('select[name="kind"]')}).first(); await assetForm.getByLabel('Bereich').selectOption('pv'); await assetForm.locator('input[name="name"]').fill('PV-Anlage 10 kWp'); await clickServerAction(owner,assetForm.getByRole('button',{name:'Zur Hausakte hinzufügen'})); await waitText(owner,'PV-Anlage und Ertrag prüfen');
await nav(owner, base+'/app/home/history'); await owner.locator('#hist-category').selectOption({label:'Dach & Fassade'}); await owner.getByLabel('Datum').fill('2025-06-12'); await owner.getByLabel('Was wurde gemacht?').fill('Dachsanierung 2025'); await owner.getByLabel('Firma').fill('Gartenbau Müller'); await owner.getByLabel('E-Mail Handwerker').fill(providerEmail); await owner.getByLabel('Kosten €').fill('18500'); await clickServerAction(owner,owner.getByRole('button',{name:'In Hausakte speichern'})); await waitText(owner,'Dachsanierung 2025'); await waitText(owner,'Partner verbunden'); await assertNoOverflow(owner,'Mobile house history');
await nav(owner, base+'/app/messages?mode=manage'); await waitText(owner,'Thomas Weber'); const thomasRow=owner.locator('a[href*="entry="]').filter({hasText:'Thomas Weber'}).first(); await thomasRow.click(); await waitText(owner,'Leistungen'); await owner.getByRole('link',{name:'Zuordnung bearbeiten'}).click(); await waitText(owner,'Leistungen zuordnen'); await owner.getByRole('checkbox',{name:'Gärtner / Gartenpflege'}).check(); await clickServerAction(owner,owner.getByRole('button',{name:'Änderungen speichern'})); await waitText(owner,'Gespeichert'); await waitText(owner,'Gärtner / Gartenpflege');
await nav(owner, base+`/app/year?year=${new Date().getFullYear()+2}`); await waitText(owner,'Mein Jahr'); await waitText(owner,'PV-Anlage und Ertrag prüfen'); await assertNoOverflow(owner,'Mobile year plan');
// Eigentuemer haben keine Mitgliedschaft mehr: /app/plans ist eine
// Legacy-Route, die in die Einstellungen umleitet (Issue #132).
await nav(owner, base+'/app/plans'); await waitText(owner,'Einstellungen'); await assertNoOverflow(owner,'Mobile plans redirect');
await nav(owner, base+'/app/jobs?view=completed');
if(!owner.url().includes('view=completed'))throw new Error('completed view param lost');
{
  const completedBody=await owner.locator('body').innerText();
  if(completedBody.includes('Keine Aufträge in dieser Ansicht')){await waitText(owner,'Abgeschlossene Aufträge');}
  else{
    const completedList=owner.locator('ul[aria-label="Abgeschlossene Aufträge"]');
    await waitForDomStable(owner,'ul[aria-label="Abgeschlossene Aufträge"]');
    const listText=await completedList.innerText();
    if(/Angebot liegt vor|Angebote liegen vor|Angebotsstatus prüfen/.test(listText))throw new Error('Active quoted job leaked into completed view');
    await completedList.getByText('Erledigt').first().waitFor();
  }
}
await assertNoOverflow(owner,'Mobile completed jobs');
await nav(manager, base+'/pro/plans'); await waitText(manager,'0 % Provision'); for(const plan of ['Free','Start — 29 €/Monat','Pro (beliebt)','Premium — 199 €/Monat'])await manager.getByText(plan).first().waitFor();

// 9) Beratung und Notfall sind eigenständige, sehr einfache Einstiege.
await nav(owner, base+'/app/consultation'); await owner.getByLabel('Wobei brauchst du Rat?').fill('Ich möchte kurz wissen, wie ich einen stark wachsenden Baum am besten prüfen lasse.'); await owner.getByLabel('Foto oder Video').setInputFiles({name:'baum.mp4',mimeType:'video/mp4',buffer:Buffer.from('test-video')}); await clickAndWaitUrl(owner,owner.getByRole('button',{name:'Ansprechpartner finden'}),/\/app\/jobs\/\d+/); await waitText(owner,'noch kein Auftrag'); if(await owner.locator('video.hero-photo').count()!==1)throw new Error('Consultation video must render on the resulting contact request');
await nav(owner, base+'/app/emergency'); await owner.getByLabel('Notfall').selectOption('other'); await owner.getByLabel('Was ist passiert?').fill('Ein großer Ast ist nach einem Sturm abgebrochen und blockiert den Zugang zum Haus.'); await clickAndWaitUrl(owner,owner.getByRole('button',{name:'Jetzt Helfer suchen'}),/\/app\/jobs\/\d+/); await waitText(owner,'NOTFALL'); await waitText(owner,'Wir suchen jetzt verfügbare Hilfe'); await nav(manager, base+'/pro'); await waitText(manager,'Notfall');

// 10) Servicefall bleibt zentral unterstützbar, ohne den direkten Kontakt zu ersetzen.
await nav(owner, base+`/app/jobs/${jobId}`); await waitText(owner,'Wenn etwas nicht klappt'); await owner.getByPlaceholder('Beschreibe kurz, wo die Abstimmung festhängt.').fill('Die Ausführung soll von Einfach Hausen geprüft werden, weil noch eine Rückfrage zur Qualität offen ist.'); await clickServerAction(owner,owner.getByRole('button',{name:'Hausmeister einschalten'})); await waitText(owner,'Servicefall · Offen');
await nav(admin, base+'/admin'); const claimCard=admin.locator('fieldset').filter({has:admin.locator('legend',{hasText:'Rückfrage zur Qualität'})}).first(); await claimCard.getByLabel('Status').selectOption('resolved'); await claimCard.getByPlaceholder('Rückmeldung / Entscheidung').fill('Fall geprüft und mit Kunde und Ansprechpartner geklärt.'); await clickServerAction(admin,claimCard.getByRole('button',{name:'Fall aktualisieren'})); await claimCard.locator('span[data-status="success"]').waitFor();

// 11) CRM-Lifecycle ist im integrierten Produkt erreichbar und kennt den registrierten Partner.
await nav(admin, base+`/admin/crm?q=${encodeURIComponent('Gartenbau Müller')}`); await waitText(admin,'Leads & Outreach CRM'); await waitText(admin,'Gartenbau Müller'); await assertNoOverflow(admin,'Admin CRM');

const buyerCtx=await newE2EContext({viewport:{width:390,height:844}}); const buyer=await buyerCtx.newPage(); trackPage(buyer,'homeowner-buyer');
// 12a) First-run onboarding: guided steps, skippable optionals, resumable progress.
await nav(buyer, base+'/register?role=homeowner'); await buyer.locator('#btn-submit-register').waitFor(); await fillRegisterField(buyer,'firstName','Ben'); await fillRegisterField(buyer,'lastName','Käufer'); await fillRegisterField(buyer,'email',buyerEmail); await fillRegisterField(buyer,'password',password); await fillRegisterField(buyer,'postcode','46325'); await Promise.all([buyer.waitForURL('**/app/onboarding'),buyer.locator('#btn-submit-register').click()]);
await waitText(buyer,'Trag Straße und PLZ ein, damit Einfach Hausen Betriebe in deiner Region findet.');
await buyer.getByLabel('Straße und Hausnummer').fill('Kaistraße 7');
await clickAndWaitUrl(buyer,buyer.getByRole('button',{name:'Weiter'}),/\/app\/onboarding$/);
await waitText(buyer,'Wähle die Bereiche, die dich interessieren. Überspringen ist möglich.');
await nav(buyer, buyer.url()); await waitText(buyer,'Wähle die Bereiche, die dich interessieren. Überspringen ist möglich.');
await buyer.getByLabel(new RegExp('Garten')).check();
await clickAndWaitUrl(buyer,buyer.getByRole('button',{name:'Weiter'}),/\/app\/onboarding$/);
await waitText(buyer,'Sag, über welchen Weg wir dich am besten erreichen.');
await buyer.getByRole('button',{name:'Überspringen'}).click();
await Promise.all([buyer.waitForURL('**/app?onboarding=done'),buyer.waitForLoadState('load')]);
await waitText(buyer,'Was möchtest du für dein Zuhause klären?');
if(await buyer.getByText('Einrichtung unvollständig').count())throw new Error('Onboarding banner still shown after completion');
await nav(buyer, buyer.url()); if(await buyer.getByText('Einrichtung unvollständig').count())throw new Error('Onboarding state did not persist after reload');
// 12) Hausakte kann kontrolliert übergeben werden, private Vorgänge bleiben beim bisherigen Eigentümer.
await nav(owner, base+'/app/home/history'); await owner.getByLabel('E-Mail des Käufers').fill(buyerEmail); await clickAndWaitUrl(owner,owner.getByRole('button',{name:'Übergabe vorbereiten'}),/transfer=/); const transferToken=new URL(owner.url()).searchParams.get('transfer'); if(!transferToken)throw new Error('House transfer token missing');
await nav(buyer, base+'/app'); await waitText(buyer,'Was möchtest du für dein Zuhause klären?'); console.error('E2EDIAG buyer still authed before transfer accept');
await waitForDomStable(buyer,'#owner-main-content',1);
const buyerCookies=await buyerCtx.cookies(base+'/'); console.error('E2EDIAG buyer cookies:',JSON.stringify(buyerCookies.map(c=>c.name)));
await nav(buyer, base+`/transfer/${transferToken}`); await waitText(buyer,'Hausakte übernehmen');
await waitForDomStable(buyer,'#owner-main-content',1);
try{
  await clickAndWaitUrl(buyer,buyer.getByRole('button',{name:'Hausakte jetzt übernehmen'}),/\/app\/home\?transfer=accepted/);
}catch(error){
  const after=await buyerCtx.cookies(base+'/').catch(()=>[]);
  console.error('E2EDIAG transfer accept failed | url=',buyer.url(),'| cookies=',JSON.stringify(after.map(c=>c.name)));
  console.error('E2EDIAG serverLog tail:\n'+serverLog.slice(-40).join(''));
  throw error;
}
await nav(buyer, base+'/app/home/history'); await waitText(buyer,'Dachsanierung 2025'); await waitText(buyer,'Maria Test'); await waitText(buyer,'Ben Käufer'); await assertNoOverflow(buyer,'Transferred house history');
await nav(buyer, base+'/app/home'); await waitText(buyer,'PV-Anlage 10 kWp');
await nav(buyer, base+`/app/year?year=${new Date().getFullYear()+2}`); await waitText(buyer,'PV-Anlage und Ertrag prüfen');
await nav(buyer, base+'/app/messages'); const buyerMessages=await buyer.locator('body').innerText(); if(buyerMessages.includes('30 Minuten vorher')||buyerMessages.includes('bitte kurz Bescheid'))throw new Error('Private prior-owner messages leaked through house transfer');
await nav(buyer, base+'/app/documents'); const buyerDocuments=await buyer.locator('body').innerText(); const leakedInvoice=invoiceNumber!==''&&buyerDocuments.includes(invoiceNumber); const leakedDoc=buyerDocuments.includes('Leistungsnachweis Heckenschnitt'); if(leakedInvoice||leakedDoc){console.error('E2EDIAG leak: invoice='+leakedInvoice+' doc='+leakedDoc+' | body=' + buyerDocuments.slice(0,1200).replace(/\n+/g,' | '));throw new Error('Private prior-owner invoice/job documents leaked through house transfer');}
await nav(buyer, base+'/app/jobs?view=completed'); if((await buyer.locator('body').innerText()).includes('Heckenschnitt inkl.'))throw new Error('Private prior-owner completed job leaked through house transfer');
await nav(owner, base+'/app/documents'); await waitText(owner,invoiceNumber); await nav(owner, base+`/app/messages?contact=${encodeURIComponent(String(thomasValue))}`); await waitText(owner,'Thomas Weber'); await waitText(owner,'30 Minuten vorher');
await buyerCtx.close();

if(runtimeErrors.length)throw new Error(`Browser runtime errors:
${runtimeErrors.join('\n')}`);
const evidence={ok:true,jobId,checks:['isolated production build/server','public multipage 390/1320','PWA offline shell','keyboard focus','provider verification/contract','provider AN/AUS','contact-only to job conversion','matching/quote/booking/assignment','cross-role messaging','invoice + unavailable payment truth','house history + maintenance','consultation + emergency','admin claim + CRM','house transfer privacy','zero browser runtime errors'],vision:'house service + explicit consultation or job + categorized contacts + invoices + property history + quality matching + 0% commission'};
fs.writeFileSync(path.join(artifactsDir,'summary.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence,null,2));
} catch (fatalError) {
  console.error('E2E-FAILED:', fatalError && fatalError.message || fatalError);
  // Full failure evidence: per-page screenshot + body text + current URL.
  for(const {page,label} of trackedPages){
    try{
      if(page.isClosed?.())continue;
      await page.screenshot({path:path.join(artifactsDir,`failure-${label}.png`),fullPage:false}).catch(()=>{});
      const body=await page.locator('body').innerText().catch(()=>'(no body)');
      fs.writeFileSync(path.join(artifactsDir,`failure-${label}.txt`),`url=${page.url()}\nerror=${fatalError}\nbody=${body.slice(0,3000)}`);
    }catch{}
  }
  console.error('E2E-SERVERLOG tail:\n' + serverLog.slice(-50).join(''));
  throw fatalError;
} finally {
  try{await browser?.close();}catch{}
  try{ await deleteE2eIdentities(); }catch{}

  if(server&&!server.killed){server.kill('SIGTERM');await new Promise(resolve=>{const timer=setTimeout(resolve,3000);server.once('exit',()=>{clearTimeout(timer);resolve();});});if(server.exitCode===null)server.kill('SIGKILL');}
  if(!process.env.E2E_KEEP_TEMP)fs.rmSync(tempRoot,{recursive:true,force:true});else console.error('E2E-KEPT ' + tempRoot);
}
