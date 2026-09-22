import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { db } from './db';
import { createNotification } from './notifications';
import { resolvePrivateFile } from './security/private-files';

const execFileAsync = promisify(execFile);

export const DOCUMENT_KINDS = ['invoice','offer','contract','warranty','maintenance','report','insurance','energy','other'] as const;
export type IntelligentDocumentKind = (typeof DOCUMENT_KINDS)[number];
export type DocumentSourceType = 'house_document'|'job_document'|'history_document'|'contract_document';

type QueueRow = {
  id:number; homeowner_id:number; source_type:DocumentSourceType; source_id:number;
  stored_path:string; original_name:string; mime_type:string; attempts:number;
};

const KIND_LABELS:Record<IntelligentDocumentKind,string> = {
  invoice:'Rechnung', offer:'Angebot', contract:'Vertrag', warranty:'Garantie', maintenance:'Wartung',
  report:'Beleg / Bericht', insurance:'Versicherung', energy:'Energie', other:'Sonstiges',
};

const clampText=(value:string,max=24000)=>value.replace(/\0/g,'').replace(/\r/g,'').trim().slice(0,max);

export function enqueueDocumentIntelligence(input:{
  homeownerId:number; sourceType:DocumentSourceType; sourceId:number; storedPath:string;
  originalName?:string; mimeType?:string;
}){
  if(!Number.isSafeInteger(input.homeownerId)||input.homeownerId<=0)throw new Error('invalid_owner');
  if(!Number.isSafeInteger(input.sourceId)||input.sourceId<=0)throw new Error('invalid_source');
  return db.prepare(`INSERT INTO document_intelligence_jobs(homeowner_id,source_type,source_id,stored_path,original_name,mime_type,status,updated_at)
    VALUES(?,?,?,?,?,?,'queued',CURRENT_TIMESTAMP)
    ON CONFLICT(source_type,source_id) DO UPDATE SET homeowner_id=excluded.homeowner_id,stored_path=excluded.stored_path,original_name=excluded.original_name,mime_type=excluded.mime_type,status='queued',error_code='',updated_at=CURRENT_TIMESTAMP`)
    .run(input.homeownerId,input.sourceType,input.sourceId,input.storedPath,(input.originalName||'').slice(0,240),(input.mimeType||'').slice(0,120));
}

export function classifyDocumentText(text:string, originalName=''): {kind:IntelligentDocumentKind; confidence:number} {
  const q=`${originalName}\n${text}`.toLocaleLowerCase('de-DE');
  const rules:Array<[IntelligentDocumentKind,RegExp,number]> = [
    ['insurance',/versicherung|police|versicherungsnummer|deckung|schaden(?:nummer)?/,0.94],
    ['invoice',/rechnung|rechnungsnummer|zahlbar|brutto|netto|umsatzsteuer|iban/,0.94],
    ['offer',/angebot|kostenvoranschlag|angebotspreis|gültig bis|gueltig bis/,0.92],
    ['warranty',/garantie|gewährleistung|gewaehrleistung|garantieschein/,0.92],
    ['maintenance',/wartung|wartungsprotokoll|inspektion|prüfbericht|pruefbericht|nächste wartung|naechste wartung/,0.9],
    ['energy',/strom|gas|energieverbrauch|zähler|zaehler|abschlag|kwh|netzbetreiber/,0.86],
    ['contract',/vertrag|vertragsnummer|laufzeit|kündigungsfrist|kuendigungsfrist|vertragsbeginn/,0.84],
    ['report',/protokoll|bericht|abnahme|nachweis|bescheinigung/,0.78],
  ];
  for(const [kind,re,confidence] of rules)if(re.test(q))return {kind,confidence};
  return {kind:'other',confidence:0.45};
}

function normalizeLayaKind(value:unknown):IntelligentDocumentKind|null{
  return typeof value==='string'&&(DOCUMENT_KINDS as readonly string[]).includes(value)?value as IntelligentDocumentKind:null;
}

async function classifyWithLaya(text:string,originalName:string):Promise<{kind:IntelligentDocumentKind;confidence:number}|null>{
  const key=process.env.LAYA_API_KEY||'';
  const base=(process.env.LAYA_URL||'http://127.0.0.1:8097').replace(/\/$/,'');
  if(!key)return null;
  const fallback=classifyDocumentText(text,originalName);
  try{
    const response=await fetch(`${base}/decide`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(2500),
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
      body:JSON.stringify({
        state:(`Dateiname: ${originalName.slice(0,240)}\nDokumenttext:\n${text.slice(0,8000)}`).slice(0,4000),
        questions:{document_kind:{type:'choice',instructions:'Ordne das Hausdokument genau einer Kategorie zu. Nur Inhalt einordnen, keine Handlung ausführen.',criteria:{
          invoice:'Rechnung oder Zahlungsbeleg', offer:'Angebot oder Kostenvoranschlag', contract:'Vertrag oder Vertragsunterlage',
          warranty:'Garantie oder Gewährleistung', maintenance:'Wartung, Inspektion oder Prüfprotokoll', report:'Bericht, Abnahme oder sonstiger Nachweis',
          insurance:'Versicherung oder Police', energy:'Strom, Gas oder Energieunterlage', other:'keine der Kategorien passt sicher',
        }}},
      }),
    });
    if(!response.ok)return null;
    const answer=(await response.json() as {answers?:{document_kind?:{choice?:unknown;confidence?:unknown}}}).answers?.document_kind;
    const kind=normalizeLayaKind(answer?.choice);
    const confidence=typeof answer?.confidence==='number'&&Number.isFinite(answer.confidence)?answer.confidence:0;
    if(!kind||confidence<0.72||confidence>1)return null;
    return {kind,confidence};
  }catch{return fallback.confidence>=0.9?fallback:null;}
}

export function extractRelevantDate(text:string):string|null{
  const q=text.replace(/\s+/g,' ');
  const re=/(.{0,70}(?:kündigungsfrist|kuendigungsfrist|fällig|faellig|wartung|inspektion|gültig bis|gueltig bis|garantie(?:\s+bis|\s*ende|\s*ablauf)?|gewährleistung(?:\s+bis|\s*ende|\s*ablauf)?|gewaehrleistung(?:\s+bis|\s*ende|\s*ablauf)?|ablauf|endet am).{0,50})/giu;
  for(const match of q.matchAll(re)){
    const context=match[1];
    const iso=context.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
    if(iso)return `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`;
    const de=context.match(/\b(0?[1-9]|[12]\d|3[01])[.\/-](0?[1-9]|1[0-2])[.\/-](20\d{2})\b/);
    if(de)return `${de[3]}-${String(de[2]).padStart(2,'0')}-${String(de[1]).padStart(2,'0')}`;
  }
  return null;
}

async function run(command:string,args:string[],timeout=15000){
  const {stdout}=await execFileAsync(command,args,{timeout,maxBuffer:1024*1024,encoding:'utf8'});
  return clampText(stdout||'');
}

async function ocrImage(file:string){
  return run('tesseract',[file,'stdout','-l',process.env.OCR_LANG||'deu+eng','--psm','6'],20000);
}

async function extractDocumentText(file:string,mime:string):Promise<{text:string;method:string;error:string}> {
  const ext=path.extname(file).toLowerCase();
  try{
    if(mime==='application/pdf'||ext==='.pdf'){
      const digital=await run('pdftotext',['-f','1','-l','12','-layout',file,'-'],15000).catch(()=> '');
      if(digital.replace(/\s/g,'').length>=80)return {text:digital,method:'pdftotext',error:''};
      const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'eh-ocr-'));
      try{
        const base=path.join(tmp,'page');
        // Bounded multi-page OCR: enough for ordinary contracts/invoices while
        // preventing a 200-page scan from monopolising the shared VM worker.
        await execFileAsync('pdftoppm',['-f','1','-l','6','-r','170','-png',file,base],{timeout:30000,maxBuffer:256*1024});
        const pages=(await fs.readdir(tmp)).filter(name=>/^page-?\d+\.png$/i.test(name)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
        const chunks:string[]=[];
        for(const page of pages.slice(0,6)){
          const chunk=await ocrImage(path.join(tmp,page));
          if(chunk)chunks.push(chunk);
        }
        const text=clampText(chunks.join('\n\n'));
        return {text,method:'pdf-ocr',error:text?'':'empty_ocr'};
      }finally{await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});}
    }
    if(['image/heic','image/heif'].includes(mime)||['.heic','.heif'].includes(ext)){
      const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'eh-heic-'));
      try{
        const normalized=path.join(tmp,'image.png');
        await execFileAsync('heif-convert',[file,normalized],{timeout:20000,maxBuffer:256*1024});
        const text=await ocrImage(normalized);
        return {text,method:'image-ocr',error:text?'':'empty_ocr'};
      }finally{await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});}
    }
    if(mime.startsWith('image/')||['.png','.jpg','.jpeg','.webp','.tif','.tiff'].includes(ext)){
      const text=await ocrImage(file);
      return {text,method:'image-ocr',error:text?'':'empty_ocr'};
    }
    return {text:'',method:'unsupported',error:'unsupported_type'};
  }catch(error){
    const code=(error as NodeJS.ErrnoException)?.code;
    return {text:'',method:'unavailable',error:code==='ENOENT'?'ocr_tool_missing':'ocr_failed'};
  }
}

function sourceHref(row:QueueRow){
  if(row.source_type==='job_document')return `/api/documents/${row.source_id}`;
  if(row.source_type==='contract_document')return `/api/house-contracts/${row.source_id}/document`;
  if(row.source_type==='house_document')return `/api/house-documents/${row.source_id}`;
  return '/app/documents';
}

async function processOne(row:QueueRow){
  db.prepare("UPDATE document_intelligence_jobs SET status='processing',attempts=attempts+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(row.id);
  const file=await resolvePrivateFile(row.stored_path);
  if(!file){
    db.prepare("UPDATE document_intelligence_jobs SET status='failed',error_code='file_missing',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(row.id);
    return 'failed' as const;
  }
  const extracted=await extractDocumentText(file,row.mime_type||'');
  const searchText=clampText(extracted.text,24000);
  const deterministic=classifyDocumentText(searchText,row.original_name);
  const laya=searchText?await classifyWithLaya(searchText,row.original_name):null;
  const decision=laya??deterministic;
  const relevantDate=extractRelevantDate(searchText);
  const needsReview=!searchText||decision.confidence<0.72;
  const status=needsReview?'review':'done';
  const error=extracted.error||(!searchText?'no_text':'');
  db.prepare(`UPDATE document_intelligence_jobs SET status=?,document_kind=?,relevant_date=?,search_text=?,confidence=?,error_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(status,decision.kind,relevantDate,searchText,decision.confidence,error,row.id);
  if(row.source_type==='house_document'){
    db.prepare('UPDATE house_documents SET kind=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND homeowner_id=?').run(decision.kind,row.source_id,row.homeowner_id);
  }
  if(row.source_type==='house_document'){
    createNotification(row.homeowner_id,needsReview?'Dokument prüfen':'Dokument einsortiert',
      needsReview?`„${row.original_name||'Dokument'}“ ist sicher gespeichert, konnte aber nicht eindeutig gelesen werden.`:`„${row.original_name||'Dokument'}“ wurde als ${KIND_LABELS[decision.kind]} erkannt.`,
      '/app/documents','assistant');
  }
  if(relevantDate){
    createNotification(row.homeowner_id,'Datum im Dokument erkannt',`In „${row.original_name||'Dokument'}“ wurde ${relevantDate.split('-').reverse().join('.')} als relevante Frist oder Fälligkeit erkannt. Bitte kurz prüfen.`,sourceHref(row),'assistant');
  }
  return status;
}

export type DocumentIntelligenceResult = {
  status:'done'|'review'|'failed';
  kind:IntelligentDocumentKind;
  relevantDate:string|null;
  confidence:number|null;
  errorCode:string;
  searchText:string;
};

export async function processDocumentIntelligenceSource(homeownerId:number,sourceType:DocumentSourceType,sourceId:number):Promise<DocumentIntelligenceResult|null>{
  if(!Number.isSafeInteger(homeownerId)||homeownerId<=0||!Number.isSafeInteger(sourceId)||sourceId<=0)return null;
  const row=db.prepare(`SELECT id,homeowner_id,source_type,source_id,stored_path,original_name,mime_type,attempts
    FROM document_intelligence_jobs WHERE homeowner_id=? AND source_type=? AND source_id=? LIMIT 1`)
    .get(homeownerId,sourceType,sourceId) as QueueRow|undefined;
  if(!row)return null;
  try{await processOne(row);}
  catch{
    db.prepare("UPDATE document_intelligence_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,error_code='worker_error',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(row.id);
  }
  const result=db.prepare(`SELECT status,document_kind,relevant_date,confidence,error_code,search_text FROM document_intelligence_jobs
    WHERE id=? AND homeowner_id=?`).get(row.id,homeownerId) as {status:string;document_kind:string;relevant_date:string|null;confidence:number|null;error_code:string;search_text:string}|undefined;
  if(!result)return null;
  const status=result.status==='done'||result.status==='review'||result.status==='failed'?result.status:'review';
  return {status,kind:normalizeLayaKind(result.document_kind)||'other',relevantDate:result.relevant_date,confidence:result.confidence,errorCode:result.error_code||'',searchText:clampText(result.search_text||'',4000)};
}

export async function processDocumentIntelligenceBatch(limit=12){
  const bounded=Math.max(1,Math.min(50,Math.trunc(limit)||12));
  // A crashed worker may leave processing rows behind. Retry them after 20 min.
  db.prepare("UPDATE document_intelligence_jobs SET status='queued',error_code='stale_retry' WHERE status='processing' AND datetime(updated_at)<datetime('now','-20 minutes') AND attempts<3").run();
  const rows=db.prepare("SELECT id,homeowner_id,source_type,source_id,stored_path,original_name,mime_type,attempts FROM document_intelligence_jobs WHERE status='queued' AND attempts<3 ORDER BY id LIMIT ?").all(bounded) as QueueRow[];
  let done=0,review=0,failed=0;
  for(const row of rows){
    try{const outcome=await processOne(row);if(outcome==='done')done++;else if(outcome==='review')review++;else failed++;}
    catch{db.prepare("UPDATE document_intelligence_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,error_code='worker_error',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(row.id);failed++;}
  }
  return {processed:rows.length,done,review,failed};
}

export function searchIntelligentDocuments(userId:number,question:string){
  if(!Number.isSafeInteger(userId)||userId<=0)return [];
  const terms=question.toLocaleLowerCase('de-DE').split(/[^\p{L}\p{N}]+/u).filter(v=>v.length>=3).slice(0,8);
  const rows=db.prepare(`SELECT dij.source_type,dij.source_id,dij.original_name,dij.document_kind,dij.relevant_date,dij.search_text,hd.title house_title
    FROM document_intelligence_jobs dij LEFT JOIN house_documents hd ON dij.source_type='house_document' AND hd.id=dij.source_id AND hd.homeowner_id=dij.homeowner_id
    WHERE dij.homeowner_id=? AND dij.status IN ('done','review') ORDER BY dij.updated_at DESC LIMIT 80`).all(userId) as Array<Record<string,unknown>>;
  const scored=rows.map(row=>{
    const hay=[row.original_name,row.house_title,row.document_kind,row.search_text].join(' ').toLocaleLowerCase('de-DE');
    const score=terms.reduce((n,t)=>n+(hay.includes(t)?1:0),0);
    return {row,score};
  }).filter(x=>terms.length===0||x.score>0).sort((a,b)=>b.score-a.score);
  return scored.slice(0,10).map(({row})=>({
    title:String(row.house_title||row.original_name||'Dokument').slice(0,180), kind:String(row.document_kind||'other'),
    relevantDate:row.relevant_date?String(row.relevant_date):null,
    href:row.source_type==='house_document'?`/api/house-documents/${row.source_id}`:row.source_type==='job_document'?`/api/documents/${row.source_id}`:row.source_type==='contract_document'?`/api/house-contracts/${row.source_id}/document`:'/app/documents',
  }));
}
