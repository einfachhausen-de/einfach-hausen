import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'eh-ai-'));
process.env.DATABASE_PATH=path.join(tmp,'test.db');
const {db}=await import('../src/lib/db.ts');
const mod=await import('../src/lib/ai-tools.ts').catch(()=>null);
const owner=(name,role='homeowner')=>Number(db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES(?,'x',?,?,'Test')").run(name+'@ai.example',role,name).lastInsertRowid);
const a=owner('Anna'),b=owner('Ben'),p=owner('Pro','provider');
const job=(u,title)=>Number(db.prepare("INSERT INTO jobs(homeowner_id,title,description,category,postcode) VALUES(?,?,'Test','Elektro','10115')").run(u,title).lastInsertRowid);
const ja=job(a,'Annas Steckdose'),jb=job(b,'Bens Geheimauftrag');
db.prepare("INSERT INTO house_contracts(homeowner_id,kind,provider,cost_amount) VALUES(?,'strom','Annas Anbieter',12345)").run(a);
db.prepare("INSERT INTO house_contracts(homeowner_id,kind,provider,cost_amount) VALUES(?,'strom','Bens Geheimanbieter',98765)").run(b);
db.prepare("INSERT INTO documents(job_id,kind,title,path) VALUES(?,'invoice',?,'secret-path')").run(ja,'Annas Beleg');
db.prepare("INSERT INTO documents(job_id,kind,title,path) VALUES(?,'invoice',?,'other-secret-path')").run(jb,'Bens Geheimbeleg');
test('executeAssistantTool exists',()=>assert.equal(typeof mod?.executeAssistantTool,'function'));
if(mod){
 test('reads only current owner jobs/contracts/documents, never file paths',()=>{
  for(const cap of ['jobs','contracts','documents']) {
   const result=mod.executeAssistantTool(a,cap,'Zeige meine Daten');
   assert.match(result.reply,/Anna/);assert.doesNotMatch(JSON.stringify(result),/Ben|secret-path/);
  }
 });
 test('foreign explicit id never leaks, arbitrary text cannot become SQL',()=>{
  const r=mod.executeAssistantTool(a,'jobs','Auftrag #'+jb);
  assert.doesNotMatch(r.reply,/Geheimauftrag/);
  assert.doesNotThrow(()=>mod.executeAssistantTool(a,'documents',"' OR 1=1 --"));
 });
 test('every capability returns a bounded useful result',()=>{
  for(const cap of ['jobs','quotes','contracts','documents','contacts','calendar','house','maintenance','next_actions','compare_quotes','house_check','house_event','find_provider','create_job','compare_tariffs','help','clarify']){
   const r=mod.executeAssistantTool(a,cap,'Meine Daten');
   assert.equal(typeof r.reply,'string');assert.ok(r.reply.length>10&&r.reply.length<16000);
  }
 });
 test('provider/unknown user cannot invoke owner tools',()=>{
  assert.throws(()=>mod.executeAssistantTool(p,'jobs',''),/forbidden/);
  assert.throws(()=>mod.executeAssistantTool(999999,'jobs',''),/forbidden/);
 });
 test('workflow suggestions never create jobs or contact others',()=>{
  const before=db.prepare('SELECT COUNT(*) c FROM jobs').get().c;
  for(const cap of ['create_job','find_provider','compare_tariffs','next_actions','compare_quotes','house_check','house_event'])mod.executeAssistantTool(a,cap,'Bitte jetzt abschicken');
  assert.equal(db.prepare('SELECT COUNT(*) c FROM jobs').get().c,before);
 });
}

test('create-job capability prepares the existing Hausmeister flow instead of mutating jobs',()=>{
 const before=db.prepare('SELECT COUNT(*) c FROM jobs WHERE homeowner_id=?').get(a).c;
 const out=mod.executeAssistantTool(a,'create_job','Meine Küchenarmatur tropft und soll repariert werden');
 assert.match(out.links[0].href,/^\/app\/hausmeister\?draft=/);
 assert.match(out.reply,/Entwurf|entwurf|Hausmeister/);
 assert.equal(db.prepare('SELECT COUNT(*) c FROM jobs WHERE homeowner_id=?').get(a).c,before);
});
test('owner next-actions stay tenant scoped and useful',()=>{
 db.prepare("INSERT INTO maintenance_tasks(homeowner_id,title,category,due_date) VALUES(?,'Annas Wartung','Heizung',date('now'))").run(a);
 db.prepare("INSERT INTO maintenance_tasks(homeowner_id,title,category,due_date) VALUES(?,'Bens Geheimwartung','Heizung',date('now'))").run(b);
 const out=mod.executeAssistantTool(a,'next_actions','Was braucht meine Aufmerksamkeit?');
 assert.match(out.reply,/Annas Wartung/);assert.doesNotMatch(out.reply,/Bens Geheimwartung/);
});

test('document lookup filters named document rather than returning unrelated latest files',()=>{
 const insert=db.prepare("INSERT INTO documents(job_id,kind,title,path) VALUES(?,'invoice',?,'private')");
 insert.run(ja,'Rechnung Müller');insert.run(ja,'Rechnung Meier');
 const out=mod.executeAssistantTool(a,'documents','Wo ist meine Rechnung von Müller?');
 assert.match(out.reply,/Müller/);assert.doesNotMatch(out.reply,/Meier|Annas Beleg/);
});
test('calendar excludes past ISO-T appointments from today',()=>{
 const future=job(a,'Zukunftstermin');
 db.prepare("INSERT INTO appointments(job_id,provider_id,homeowner_id,start_at) VALUES(?,?,?,date('now')||'T00:00:00Z')").run(ja,p,a);
 db.prepare("INSERT INTO appointments(job_id,provider_id,homeowner_id,start_at) VALUES(?,?,?,date('now','+1 day')||'T12:00:00Z')").run(future,p,a);
 const out=mod.executeAssistantTool(a,'calendar','Meine Termine');
 assert.doesNotMatch(out.reply,/Annas Steckdose/);assert.match(out.reply,/Zukunftstermin/);
});
test.after(()=>{db.close();fs.rmSync(tmp,{recursive:true,force:true})});
