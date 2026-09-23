import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'eh-doc-ai-'));
process.env.DATABASE_PATH=path.join(tmp,'test.db');
process.env.PRIVATE_ROOT=path.join(tmp,'private');
const {db}=await import('../src/lib/db.ts');
const mod=await import('../src/lib/document-intelligence.ts');
const {recordHausmeisterDocumentUpload}=await import('../src/lib/orchestrator.ts');
const owner=(name)=>Number(db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES(?,'x','homeowner',?,'Test')").run(name+'@doc.example',name).lastInsertRowid);
const a=owner('Anna'),b=owner('Ben');

test('document classifier uses conservative deterministic categories',()=>{
 assert.equal(mod.classifyDocumentText('Rechnung Nr. 44 Brutto 129,00 EUR').kind,'invoice');
 assert.equal(mod.classifyDocumentText('Gebäudeversicherung Police 123').kind,'insurance');
 assert.equal(mod.classifyDocumentText('Wartungsprotokoll nächste Wartung 12.10.2027').kind,'maintenance');
 assert.equal(mod.classifyDocumentText('Hallo Welt').kind,'other');
});

test('relevant date requires deadline/maintenance context',()=>{
 assert.equal(mod.extractRelevantDate('Nächste Wartung: 12.10.2027'),'2027-10-12');
 assert.equal(mod.extractRelevantDate('Garantie bis: 20.12.2028'),'2028-12-20');
 assert.equal(mod.extractRelevantDate('Gewährleistung endet am 03.04.2029'),'2029-04-03');
 assert.equal(mod.extractRelevantDate('Erstellt am 12.10.2027'),null);
});

test('queue is idempotent per source and owner search never crosses tenants',()=>{
 fs.mkdirSync(process.env.PRIVATE_ROOT,{recursive:true});
 const fa='house-documents/a.pdf',fb='house-documents/b.pdf';
 fs.mkdirSync(path.join(process.env.PRIVATE_ROOT,'house-documents'),{recursive:true});
 fs.writeFileSync(path.join(process.env.PRIVATE_ROOT,fa),'dummy');fs.writeFileSync(path.join(process.env.PRIVATE_ROOT,fb),'dummy');
 const ha=Number(db.prepare("INSERT INTO house_documents(homeowner_id,title,path,kind) VALUES(?,'Heizungsrechnung',?,'invoice')").run(a,fa).lastInsertRowid);
 const hb=Number(db.prepare("INSERT INTO house_documents(homeowner_id,title,path,kind) VALUES(?,'Geheimversicherung',?,'insurance')").run(b,fb).lastInsertRowid);
 mod.enqueueDocumentIntelligence({homeownerId:a,sourceType:'house_document',sourceId:ha,storedPath:fa,originalName:'Heizungsrechnung.pdf',mimeType:'application/pdf'});
 mod.enqueueDocumentIntelligence({homeownerId:a,sourceType:'house_document',sourceId:ha,storedPath:fa,originalName:'Heizungsrechnung.pdf',mimeType:'application/pdf'});
 mod.enqueueDocumentIntelligence({homeownerId:b,sourceType:'house_document',sourceId:hb,storedPath:fb,originalName:'Geheimversicherung.pdf',mimeType:'application/pdf'});
 assert.equal(db.prepare("SELECT COUNT(*) c FROM document_intelligence_jobs WHERE homeowner_id=?").get(a).c,1);
 db.prepare("UPDATE document_intelligence_jobs SET status='done',document_kind='invoice',search_text='Heizung Wartung Rechnung Müller' WHERE homeowner_id=?").run(a);
 db.prepare("UPDATE document_intelligence_jobs SET status='done',document_kind='insurance',search_text='Geheim Police' WHERE homeowner_id=?").run(b);
 const found=mod.searchIntelligentDocuments(a,'Wo ist die Rechnung zur Heizung?');
 assert.equal(found.length,1);assert.match(found[0].title,/Heizung/);assert.doesNotMatch(JSON.stringify(found),/Geheim/);
});

test('chat document upload records the owner message and assistant result without cloud AI',()=>{
 const before=db.prepare('SELECT COUNT(*) c FROM assistant_messages').get().c;
 const result=recordHausmeisterDocumentUpload(a,{documentId:4711,name:'Heizungsrechnung.pdf',reply:'Dokument erkannt und gespeichert.'});
 assert.ok(result.threadId>0);
 const rows=db.prepare('SELECT role,body,metadata_json FROM assistant_messages WHERE thread_id=? ORDER BY id').all(result.threadId);
 assert.equal(rows.length,2);
 assert.equal(rows[0].role,'user');
 assert.match(rows[0].body,/Heizungsrechnung/);
 assert.equal(JSON.parse(rows[0].metadata_json).houseDocument,true);
 assert.equal(rows[1].role,'assistant');
 assert.equal(JSON.parse(rows[1].metadata_json).documentProcessed,true);
 assert.equal(db.prepare('SELECT COUNT(*) c FROM assistant_messages').get().c,before+2);
});

test('all owner AI chat surfaces expose the document-upload entry',()=>{
 const full=fs.readFileSync(path.join(process.cwd(),'src/components/homeowner/homeowner-hausmeister-composer.tsx'),'utf8');
 const compact=fs.readFileSync(path.join(process.cwd(),'src/components/house-assistant.tsx'),'utf8');
 const action=fs.readFileSync(path.join(process.cwd(),'src/app/actions.ts'),'utf8');
 assert.match(full,/name=\"document\"/);
 assert.match(full,/application\/pdf,image\/\*/);
 assert.match(compact,/\/app\/hausmeister#hausmeister-composer/);
 assert.match(action,/storeAssistantDocument/);
});

test.after(()=>{db.close();fs.rmSync(tmp,{recursive:true,force:true})});
