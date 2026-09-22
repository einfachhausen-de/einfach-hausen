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

test.after(()=>{db.close();fs.rmSync(tmp,{recursive:true,force:true})});
