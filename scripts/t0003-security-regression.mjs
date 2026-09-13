import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHmac,randomBytes } from 'node:crypto';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'eh-t0003-src-'));
const dbDir=fs.mkdtempSync(path.join(os.tmpdir(),'eh-t0003-db-'));
process.env.DATABASE_PATH=path.join(dbDir,'regression.db');
process.chdir(dbDir);
fs.symlinkSync(path.join(root,'node_modules'),path.join(scratch,'node_modules'),'dir');

const sources=['src/lib/db.ts','src/lib/contact-directory-schema.ts','src/lib/contact-directory-taxonomy.ts','src/lib/security/webhooks.ts','src/lib/security/private-files.ts'];
for(const rel of sources){
  const src=fs.readFileSync(path.join(root,rel),'utf8');
  const stripped=stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g,(_m,a,s,b)=>`${a}${s}.mjs${b}`);
  const dest=path.join(scratch,rel.replace(/\.ts$/,'.mjs'));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,stripped);
}

let passed=0;const failures=[];
function check(name,condition,detail=''){if(condition){passed++;console.log(`  ok  ${name}`);}else{failures.push(`${name}${detail?` :: ${detail}`:''}`);console.error(`FAIL  ${name}${detail?` :: ${detail}`:''}`);}}

try{
  const {db}=await import(pathToFileURL(path.join(scratch,'src/lib/db.mjs')).href);
  const hooks=await import(pathToFileURL(path.join(scratch,'src/lib/security/webhooks.mjs')).href);
  const files=await import(pathToFileURL(path.join(scratch,'src/lib/security/private-files.mjs')).href);

  console.log('\n[WhatsApp signature + no-state-change]');
  const raw=JSON.stringify({entry:[{changes:[{value:{messages:[{id:'wamid.1',from:'491234',type:'text',text:{body:'Hallo'}}]}}]}]});
  const secret=randomBytes(24).toString('hex');
  const good=`sha256=${createHmac('sha256',secret).update(raw).digest('hex')}`;
  const before=db.prepare('SELECT COUNT(*) c FROM webhook_events').get().c;
  check('missing Meta signature rejected',hooks.verifyMetaSignature(raw,null,secret)===false);
  check('bad Meta signature rejected',hooks.verifyMetaSignature(raw,'sha256='+'00'.repeat(32),secret)===false);
  check('malformed Meta signature rejected',hooks.verifyMetaSignature(raw,'sha256=xyz',secret)===false);
  check('valid Meta HMAC accepted',hooks.verifyMetaSignature(raw,good,secret)===true);
  const afterRejected=db.prepare('SELECT COUNT(*) c FROM webhook_events').get().c;
  check('signature rejection itself causes no DB state change',before===afterRejected);
  check('first WhatsApp message claim succeeds',hooks.claimWebhookEvent('whatsapp','wamid.1')===true);
  check('WhatsApp replay claim is denied',hooks.claimWebhookEvent('whatsapp','wamid.1')===false);
  hooks.completeWebhookEvent('whatsapp','wamid.1');
  check('WhatsApp claim persisted processed state',db.prepare("SELECT status FROM webhook_events WHERE source='whatsapp' AND event_id='wamid.1'").get()?.status==='processed');


  console.log('\n[WhatsApp collision-safe account resolution]');
  const waSource=fs.readFileSync(path.join(root,'src/app/api/whatsapp/webhook/route.ts'),'utf8');
  const helperMatch=waSource.match(/function normalizePhone[\s\S]*?function resolveWhatsAppUser[\s\S]*?\n}\n/);
  if(!helperMatch)throw new Error('WhatsApp phone resolver source not found');
  const helperModule=stripTypeScriptTypes(`${helperMatch[0]}\nexport { resolveWhatsAppUser };`);
  const helperPath=path.join(scratch,'whatsapp-resolver.mjs');fs.writeFileSync(helperPath,helperModule);
  const {resolveWhatsAppUser}=await import(pathToFileURL(helperPath).href);
  const users=[
    {id:1,role:'homeowner',phone:'+49 151 12345678'},
    {id:2,role:'homeowner',phone:'+43 151 12345678'},
    {id:3,role:'provider',phone:'+49 170 22223333'},
  ];
  check('exact normalized WhatsApp phone resolves uniquely',resolveWhatsAppUser(users,'004915112345678')?.id===1);
  check('ambiguous 10-digit suffix fails closed',resolveWhatsAppUser(users,'15112345678')===null);
  check('short incoming phone fails closed',resolveWhatsAppUser(users,'1234567')===null);
  check('duplicate exact stored phone fails closed',resolveWhatsAppUser([...users,{id:4,role:'homeowner',phone:'+49 151 12345678'}],'4915112345678')===null);
  check('unique provider phone still resolves for role separation',resolveWhatsAppUser(users,'4917022223333')?.id===3);

  console.log('\n[Stripe authoritative replay idempotency]');
  db.exec(`CREATE TABLE mutation_probe(id INTEGER PRIMARY KEY,value INTEGER NOT NULL); INSERT INTO mutation_probe(id,value) VALUES(1,0);`);
  function applyStripeFixture(eventId){if(!hooks.claimWebhookEvent('stripe',eventId))return false;db.prepare('UPDATE mutation_probe SET value=value+1 WHERE id=1').run();hooks.completeWebhookEvent('stripe',eventId);return true;}
  check('first Stripe event mutates',applyStripeFixture('evt_fixture_1')===true);
  check('same Stripe event replay is ignored',applyStripeFixture('evt_fixture_1')===false);
  check('Stripe replay produces exactly one mutation',db.prepare('SELECT value FROM mutation_probe WHERE id=1').get().value===1);
  check('failed processing claim can be released',hooks.claimWebhookEvent('stripe','evt_retry')===true);
  hooks.releaseWebhookEvent('stripe','evt_retry');
  check('released Stripe event can be retried',hooks.claimWebhookEvent('stripe','evt_retry')===true);

  console.log('\n[Private path containment]');
  const safe=files.resolvePrivatePath('documents/abc.pdf');
  check('normal private path resolves inside root',typeof safe==='string'&&safe.startsWith(files.privateRoot()+path.sep));
  check('parent traversal denied',files.resolvePrivatePath('../outside.txt')===null);
  check('nested parent traversal denied',files.resolvePrivatePath('documents/../../outside.txt')===null);
  check('absolute path denied',files.resolvePrivatePath('/etc/passwd')===null);
  check('empty/root path denied',files.resolvePrivatePath('')===null);
  check('NUL-bearing path denied',files.resolvePrivatePath('documents/a\0.pdf')===null);

  console.log('\n[Cross-user private media authorization]');
  const owner={id:10,role:'homeowner'};const other={id:11,role:'homeowner'};const provider={id:20,role:'provider'};
  check('owner can read own job media',files.canReadJobMedia(owner,10,false,false)===true);
  check('different homeowner denied',files.canReadJobMedia(other,10,false,false)===false);
  check('unrelated provider denied',files.canReadJobMedia(provider,10,false,false)===false);
  check('authorized provider allowed',files.canReadJobMedia(provider,10,true,false)===true);
  check('unauthenticated user denied',files.canReadJobMedia(null,10,false,false)===false);
  check('admin allowed explicitly',files.canReadJobMedia(null,10,false,true)===true);

  console.log('\n[Route/source authority invariants]');
  const wa=waSource;
  check('WhatsApp reads raw body before JSON parse',wa.indexOf('await req.text()')<wa.indexOf('JSON.parse(rawBody)'));
  check('WhatsApp verifies signature before message iteration',wa.indexOf('verifyMetaSignature')<wa.indexOf('for(const entry'));
  const stripeRoute=fs.readFileSync(path.join(root,'src/app/api/stripe/webhook/route.ts'),'utf8');
  check('Stripe event is claimed before payment mutation branch',stripeRoute.indexOf("claimWebhookEvent('stripe',event.id)")<stripeRoute.indexOf("if(event.type==='checkout.session.completed'"));
  for(const rel of ['src/app/api/packages/success/route.ts','src/app/api/payments/success/route.ts','src/app/api/memberships/success/route.ts','src/app/api/partner-memberships/success/route.ts']){
    const source=fs.readFileSync(path.join(root,rel),'utf8');
    check(`${rel} has no authoritative payment mutation`,!/(markPaymentPaid|activatePackageOrder|INSERT INTO subscriptions|UPDATE subscriptions|INSERT INTO partner_subscriptions|UPDATE partner_subscriptions)/.test(source));
    check(`${rel} exposes configured/unconfigured outcome`,source.includes('configured')&&source.includes('unavailable'));
  }
  const actions=fs.readFileSync(path.join(root,'src/app/actions.ts'),'utf8');
  const intakeMedia=fs.readFileSync(path.join(root,'src/lib/intake-media.ts'),'utf8');
  check('new job media is stored below data/private',actions.includes("from '@/lib/intake-media'")&&actions.includes('savePrivateMediaUpload')&&intakeMedia.includes("'data', 'private', 'job-media'")&&!actions.includes('saveUpload(photo'));
  const jobMedia=fs.readFileSync(path.join(root,'src/app/api/job-media/[id]/route.ts'),'utf8');
  check('job media route authenticates and fails cross-user closed',jobMedia.includes('getCurrentUser')&&jobMedia.includes('canReadJobMedia')&&jobMedia.includes('return notFound()')&&jobMedia.includes('resolvePrivateFile'));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if(failures.length){console.error(failures.map(f=>` - ${f}`).join('\n'));process.exitCode=1;}
}finally{
  try{fs.rmSync(scratch,{recursive:true,force:true});}catch{}
  try{fs.rmSync(dbDir,{recursive:true,force:true});}catch{}
}
