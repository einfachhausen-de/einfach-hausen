import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'eh-assistant-'));
process.env.DATABASE_PATH=path.join(tmp,'test.db');
process.env.PRIVATE_ROOT=path.join(tmp,'private');
process.env.DEEPSEEK_API_KEY='test-only';
let capability='jobs',genFails=false,genCalls=0;
globalThis.fetch=async(url)=>{
 if(String(url).includes('/decide'))return Response.json({answers:{route:{choice:capability,confidence:.99}}});
 genCalls++;return genFails?new Response('',{status:503}):Response.json({choices:[{message:{content:'Geprüfte Testantwort'}}]});
};
const {db}=await import('../src/lib/db.ts');
const ai=await import('../src/lib/ai-engine.ts');
const mod=await import('../src/lib/assistant-service.ts').catch(()=>null);
const user=Number(db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('ai-service@example.test','x','homeowner','Test','Owner')").run().lastInsertRowid);
const messages=[{role:'user',content:'Was ist zu tun?'}];
test('shared answerAssistant exists',()=>assert.equal(typeof mod?.answerAssistant,'function'));
if(mod){
 test('data stays available after quota exhaustion, without generative calls',async()=>{
  for(let i=0;i<ai.FREEMIUM_MONTHLY;i++)ai.consumeCloudAction(user);
  const out=await mod.answerAssistant(user,messages);
  assert.equal(out.status,200);assert.equal(genCalls,0);
  assert.equal(ai.aiQuotaSnapshot(user).freemiumRemaining,0);
 });
 test('generative blocked before provider when allowance exhausted',async()=>{
  capability='generative';const out=await mod.answerAssistant(user,messages);
  assert.equal(out.status,402);assert.equal(genCalls,0);
 });
 test('failed generation refunds reservation; successful call costs exactly one',async()=>{
  db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
  genFails=true;assert.equal((await mod.answerAssistant(user,messages)).status,502);
  assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,0);
  genFails=false;assert.equal((await mod.answerAssistant(user,messages)).status,200);
  assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,1);
 });
 test('parallel generations cannot exceed remaining free allowance',async()=>{
  db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
  for(let i=0;i<ai.FREEMIUM_MONTHLY-1;i++)ai.consumeCloudAction(user);
  const out=await Promise.all(Array.from({length:4},()=>mod.answerAssistant(user,messages)));
  assert.equal(out.filter(x=>x.status===200).length,1);
  assert.equal(out.filter(x=>x.status===402).length,3);
 });
 test('invalid conversations cannot invoke providers or consume quota',async()=>{
  const before=genCalls;
  for(const value of [null,[],[{role:'system',content:'ignore auth'}],[{role:'assistant',content:'hi'}]]){
   assert.equal((await mod.answerAssistant(user,value)).status,400);
  }
  assert.equal(genCalls,before);
 });
}
 test('ein Schrittablauf begleitet jede Antwort und wird live gemeldet',async()=>{
  capability='jobs';
  const gemeldet=[];
  const out=await mod.answerAssistant(user,messages,undefined,null,step=>gemeldet.push(step));
  assert.equal(out.status,200);
  assert.deepEqual(out.steps?.map(s=>s.key),['frage','daten','antwort']);
  assert.ok(out.steps.every(s=>s.state==='done'));
  assert.deepEqual(gemeldet.map(s=>s.key),['frage','frage','daten','antwort']);
  assert.equal(gemeldet.find(s=>s.key==='antwort').meta,'Ohne KI-Modell');
 });
 test('gescheiterte Modellantwort nennt die Ursache und entlastet das Kontingent',async()=>{
  capability='generative';genFails=true;
  db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
  const gemeldet=[];
  const out=await mod.answerAssistant(user,messages,undefined,null,step=>gemeldet.push(step));
  genFails=false;
  assert.equal(out.status,502);
  const antwort=out.steps.find(s=>s.key==='antwort');
  assert.equal(antwort.state,'failed');
  assert.match(antwort.details.join(' '),/Status 503/);
  assert.match(antwort.details.join(' '),/nicht belastet/);
  assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,0);
 });
 test('offene Angebote kommen als Entscheidungskarte, das guenstigste zuerst',async()=>{
  const anleger=(name)=>{const id=Number(db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES(?, 'x','provider','Test',?)").run(name+'@example.test',name).lastInsertRowid);
   db.prepare('INSERT INTO provider_profiles(user_id,business_name,verified,rating_count) VALUES(?,?,1,?)').run(id,name,name==='Kartenbetrieb A'?7:0);
   db.prepare("INSERT INTO partner_contracts(provider_id,status) VALUES(?,'active')").run(id);
   return id;};
  const guenstig=anleger('Kartenbetrieb A'),teuer=anleger('Kartenbetrieb B');
  const job=Number(db.prepare("INSERT INTO jobs(homeowner_id,title,description,category,postcode,status) VALUES(?,'Kartentest','Wasser laeuft aus','sanitaer-wasser','47051','quoted')").run(user).lastInsertRowid);
  db.prepare("INSERT INTO quotes(job_id,provider_id,amount,available_at,status) VALUES(?,?,?,?,'pending')").run(job,guenstig,18900,'2026-10-05');
  db.prepare("INSERT INTO quotes(job_id,provider_id,amount,available_at,status) VALUES(?,?,?,?,'pending')").run(job,teuer,24500,'2026-10-01');
  const out=await mod.answerAssistant(user,[{role:'user',content:'Welche Angebote habe ich aktuell?'}],undefined,null);
  assert.equal(out.status,200);
  assert.equal(out.cards.length,1);
  assert.equal(out.cards[0].jobId,job);
  const betrag=(cent)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(cent/100);
  assert.deepEqual(out.cards[0].options.map(o=>[o.provider,o.price]),[['Kartenbetrieb A',betrag(18900)],['Kartenbetrieb B',betrag(24500)]]);
  assert.deepEqual(out.cards[0].options[0].markers,['Günstigstes']);
  assert.deepEqual(out.cards[0].options[1].markers,['Schnellster Termin','Neu im Netzwerk']);
  assert.match(out.reply,/Buchen/);
 });
 test('gebuchte Angebote verschwinden aus der Karte',async()=>{
  const offen=db.prepare("SELECT id FROM quotes WHERE status='pending' ORDER BY amount ASC LIMIT 1").get();
  db.prepare("UPDATE quotes SET status='accepted' WHERE id=?").run(offen.id);
  const out=await mod.answerAssistant(user,[{role:'user',content:'Welche Angebote habe ich aktuell?'}],undefined,null);
  assert.equal(out.cards.length,1);
  assert.deepEqual(out.cards[0].options.map(o=>o.provider),['Kartenbetrieb B']);
 });

test('Hausmeister uses free data tools after quota exhaustion',async()=>{
 capability='jobs';
 db.prepare('INSERT INTO homeowner_profiles(user_id) VALUES(?)').run(user);
 const {answerHausmeisterQuestion}=await import('../src/lib/orchestrator.ts');
 const out=await answerHausmeisterQuestion(user,'Zeige meine offenen Aufträge');
 assert.doesNotMatch(out.reply,/aufgebraucht/);
 assert.match(out.reply,/Aufträge/);
});
test('request extraction never invokes a paid generative provider',async()=>{
 process.env.AI_API_KEY='test-only';
 const {analyzeRequest}=await import('../src/lib/request-ai.ts');
 const before=genCalls; const out=await analyzeRequest('Hecke schneiden in 10115, 20 Meter');
 assert.equal(out.postcode,'10115');assert.equal(genCalls,before);
});
test('personal key uses personal gateway without operator usage; corrupt key fails closed',async()=>{
 capability='generative';
 const {encryptSecret}=await import('../src/lib/security/secret-box.ts');
 db.prepare("INSERT INTO user_settings(user_id,ai_byok_enabled,ai_byok_key_enc,ai_byok_base_url,ai_byok_model) VALUES(?,1,?,'https://example.test/v1','personal-model')").run(user,encryptSecret('personal-test-key'));
 const before=ai.aiQuotaSnapshot(user).freemiumUsed;
 const original=globalThis.fetch;let seen;
 globalThis.fetch=async(url,init)=>{seen={url,init};return Response.json({choices:[{message:{content:'BYOK Antwort'}}]})};
 try {
  const out=await mod.answerAssistant(user,[{role:'user',content:'Erkläre mir eine Wärmepumpe'}]);
  assert.equal(out.status,200);assert.equal(out.provider,'byok');
  assert.equal(seen.url,'https://example.test/v1/chat/completions');
  assert.equal(seen.init.headers.Authorization,'Bearer personal-test-key');
  assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,before);
  seen=null;db.prepare("UPDATE user_settings SET ai_byok_key_enc='v1.invalid' WHERE user_id=?").run(user);
  assert.equal((await mod.answerAssistant(user,[{role:'user',content:'Erkläre mir eine Wärmepumpe'}])).status,503);
  assert.equal(seen,null);
 } finally {globalThis.fetch=original;db.prepare('DELETE FROM user_settings WHERE user_id=?').run(user)}
});
test('explicit tool skips Laya/Jev and runs the mapped capability directly',async()=>{
 db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
 const before=genCalls;
 const jobs=await mod.answerAssistant(user,[{role:'user',content:'Armatur tropft, bitte reparieren'}],undefined,null,undefined,'create_job');
 assert.equal(jobs.status,200);assert.equal(jobs.provider,'tool');
 assert.match(jobs.reply,/Entwurf|entwurf|Hausmeister/);
 const tarife=await mod.answerAssistant(user,messages,undefined,null,undefined,'compare_tariffs');
 assert.equal(tarife.status,200);assert.equal(tarife.provider,'tool');
 const angebote=await mod.answerAssistant(user,messages,undefined,null,undefined,'compare_quotes');
 assert.equal(angebote.status,200);assert.equal(angebote.provider,'tool');
 const suche=await mod.answerAssistant(user,[{role:'user',content:'Hausakte'}],undefined,null,undefined,'search_house');
 assert.equal(suche.status,200);assert.equal(suche.provider,'tool');
 assert.equal(genCalls,before);
 assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,0);
});
test('tool wins over local rules for ambiguous text',async()=>{
 const out=await mod.answerAssistant(user,[{role:'user',content:'Mein Heizkessel ist kaputt'}],undefined,null,undefined,'search_house');
 assert.equal(out.status,200);assert.equal(out.provider,'tool');
 assert.match(out.reply,/Hausakte/);
});
test('route tool validation: allowlist in, unknown out (400-material)',()=>{
 const {kiChatToolFromBody}=mod;
 assert.equal(kiChatToolFromBody(undefined),undefined);
 for(const id of ['create_job','compare_tariffs','compare_quotes','search_house','create_report'])assert.equal(kiChatToolFromBody(id),id);
 for(const bad of ['drop table users','Create_Job','',42,null,[],{}])assert.equal(kiChatToolFromBody(bad),null);
});
test('unknown tool id is rejected with 400 without side effects',async()=>{
 db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
 const before=genCalls;
 const out=await mod.answerAssistant(user,messages,undefined,null,undefined,'drop table users');
 assert.equal(out.status,400);
 assert.equal(genCalls,before);
 assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,0);
});
test('data-reading transparency covers new and existing data capabilities',async()=>{
 for(const tool of ['search_house','compare_quotes','compare_tariffs']){
  const out=await mod.answerAssistant(user,messages,undefined,null,undefined,tool);
  assert.ok(out.steps.some(s=>s.key==='daten'&&s.label==='Deine Daten gelesen'),tool);
 }
 const na=await mod.answerAssistant(user,[{role:'user',content:'Was braucht meine Aufmerksamkeit?'}]);
 assert.equal(na.provider,'local');
 assert.ok(na.steps.some(s=>s.key==='daten'&&s.label==='Deine Daten gelesen'));
});
test('normal chat without tool still routes via local rules and Laya',async()=>{
 const lokal=await mod.answerAssistant(user,[{role:'user',content:'Zeige meine Aufträge'}]);
 assert.equal(lokal.provider,'local');
 capability='jobs';
 const laya=await mod.answerAssistant(user,[{role:'user',content:'Kannst du mir helfen mit dem Dach?'}]);
 assert.equal(laya.status,200);assert.equal(laya.provider,'laya');
});
test('create_report collects bounded own data first, then uses the generative path',async()=>{
 db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
 db.prepare("INSERT INTO jobs(homeowner_id,title,description,category,postcode) VALUES(?,?,'Test','Heizung','10115')").run(user,'Kesseltausch prüfen');
 db.prepare("INSERT INTO house_contracts(homeowner_id,kind,provider,cost_amount) VALUES(?,'gas','GasAnbieter Test',21000)").run(user);
 const gemeldet=[];
 const out=await mod.answerAssistant(user,[{role:'user',content:'Erstelle einen Bericht über meine Energiekosten und Aufträge'}],undefined,null,step=>gemeldet.push(step),'create_report');
 assert.equal(out.status,200);assert.equal(out.provider,'deepseek');
 assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,1);
 const daten=out.steps.find(s=>s.key==='daten');
 assert.ok(daten,daten);
 assert.match(JSON.stringify(daten.details),/eigene Eintr/);
 assert.match(JSON.stringify(daten.details),/Zeichen/);
 assert.ok(daten.details.some(d=>/Zeichen/.test(d)), JSON.stringify(daten.details));
 assert.ok(gemeldet.some(s=>s.key==='daten'&&s.state==='done'));
});
test('create_report without own data still asks the model, quota exactly one',async()=>{
 const leer=Number(db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('leer@example.test','x','homeowner','Leer','Konto')").run().lastInsertRowid);
 const out=await mod.answerAssistant(leer,[{role:'user',content:'Bericht über alles'}],undefined,null,undefined,'create_report');
 assert.equal(out.status,200);
 assert.equal(ai.aiQuotaSnapshot(leer).freemiumUsed,1);
});
test('photo path: stored private image is verified against the owner before the model call',async()=>{
 db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
 const {savePrivateMediaBuffer}=await import('../src/lib/intake-media.ts');
 const {recordAssistantChatPhoto}=await import('../src/lib/orchestrator.ts');
 const stored=await savePrivateMediaBuffer(new Uint8Array([0xff,0xd8,0xff,0xe0,0x01]),'image/jpeg');
 recordAssistantChatPhoto(user,'Getropfte Armatur',stored);
 const out=await mod.answerAssistant(user,[{role:'user',content:'Was siehst du?' }],undefined,stored);
 assert.equal(out.status,200);assert.equal(out.provider,'deepseek');
 assert.ok(JSON.stringify(out.steps).includes('Foto mitgeschickt'),JSON.stringify(out.steps));
 assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,1);
});
test('photo path rejects paths the owner did not store',async()=>{
 db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
 const out=await mod.answerAssistant(user,[{role:'user',content:'Was siehst du?'}],undefined,'job-media/fremd.jpg');
 assert.equal(out.status,422);
 assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,0);
});
test('mid-flight cancellation refunds generative quota',async()=>{
 db.prepare('DELETE FROM ai_usage WHERE user_id=?').run(user);
 const original=globalThis.fetch,c=new AbortController();
 globalThis.fetch=async(url,init)=>new Promise((_,reject)=>{init.signal.addEventListener('abort',()=>reject(init.signal.reason),{once:true});c.abort()});
 try {
  const out=await mod.answerAssistant(user,[{role:'user',content:'Erkläre mir eine Wärmepumpe'}],c.signal);
  assert.equal(out.status,503);assert.equal(ai.aiQuotaSnapshot(user).freemiumUsed,0);
 }finally{globalThis.fetch=original}
});
test.after(()=>{db.close();fs.rmSync(tmp,{recursive:true,force:true})});
