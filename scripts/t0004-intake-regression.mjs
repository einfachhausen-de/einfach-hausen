import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'eh-t0004-src-'));
const dbDir=fs.mkdtempSync(path.join(os.tmpdir(),'eh-t0004-db-'));
process.env.DATABASE_PATH=path.join(dbDir,'regression.db');
process.chdir(dbDir);
fs.symlinkSync(path.join(root,'node_modules'),path.join(scratch,'node_modules'),'dir');
for(const rel of tsClosure(root,['src/lib/db.ts','src/lib/request-ai.ts','src/lib/intake-media.ts','src/lib/whatsapp-media.ts'])){
  const src=fs.readFileSync(path.join(root,rel),'utf8');
  const stripped=stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g,(_m,a,s,b)=>`${a}${s}.mjs${b}`);
  const dest=path.join(scratch,rel.replace(/\.ts$/,'.mjs'));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,stripped);
}
let passed=0;const failures=[];
function check(name,condition,detail=''){if(condition){passed++;console.log(`  ok  ${name}`);}else{failures.push(`${name}${detail?` :: ${detail}`:''}`);console.error(`FAIL  ${name}${detail?` :: ${detail}`:''}`);}}
try{
  const {db}=await import(pathToFileURL(path.join(scratch,'src/lib/db.mjs')).href);
  const {parseRequest}=await import(pathToFileURL(path.join(scratch,'src/lib/request-ai.mjs')).href);
  const media=await import(pathToFileURL(path.join(scratch,'src/lib/intake-media.mjs')).href);
  const whatsapp=await import(pathToFileURL(path.join(scratch,'src/lib/whatsapp-media.mjs')).href);

  console.log('\n[Service catalog parity]');
  const services=db.prepare('SELECT slug,category FROM service_catalog WHERE active=1').all();
  const categories=new Set(services.map(row=>row.category));
  for(const [text,category] of [['Die Wand muss gestrichen werden','Maler & Ausbau'],['Wir brauchen Hilfe beim Umzug','Umzug & Transport'],['Fenster putzen lassen','Reinigung']]){
    const parsed=parseRequest(text); check(`${category} parses from “${text}”`,parsed.category===category,parsed.category);
    check(`${category} has an active service`,categories.has(parsed.category));
  }
  check('service catalog contains dedicated painter service',services.some(row=>row.slug==='maler'&&row.category==='Maler & Ausbau'));
  check('service catalog contains dedicated move service',services.some(row=>row.slug==='umzug'&&row.category==='Umzug & Transport'));
  check('service catalog contains dedicated window-cleaning service',services.some(row=>row.slug==='fensterreinigung'&&row.category==='Reinigung'));

  console.log('\n[Private intake media]');
  check('audio OGG normalizes with parameters',media.privateMediaRule('audio/ogg; codecs=opus')?.kind==='audio');
  check('unsupported executable media is denied',media.privateMediaRule('application/octet-stream')===null);
  check('audio path is rendered as audio',media.mediaKindFromPath('job-media/example.ogg')==='audio');
  check('video path is rendered as video',media.mediaKindFromPath('job-media/example.mp4')==='video');
  check('image path is rendered as image',media.mediaKindFromPath('job-media/example.jpg')==='image');

  console.log('\n[WhatsApp media contract]');
  check('image is explicitly supported',whatsapp.whatsappMediaType('image')==='image');
  check('audio is explicitly supported',whatsapp.whatsappMediaType('audio')==='audio');
  check('documents fail closed instead of being treated as intake',whatsapp.whatsappMediaType('document')===null);
  check('voice placeholder preserves caption without claiming a transcript',whatsapp.whatsappMediaPlaceholder('audio','Wasser tropft im Keller')==='Sprachnachricht: Wasser tropft im Keller');

  console.log('\n[Wiring invariants]');
  const composer=fs.readFileSync(path.join(root,'src/components/hausmeister-composer.tsx'),'utf8');
  check('app composer accepts audio uploads',composer.includes('audio/ogg')&&composer.includes('Sprachnachricht'));
  const action=fs.readFileSync(path.join(root,'src/app/actions.ts'),'utf8');
  check('app intake uses shared private-media writer',action.includes("from '@/lib/intake-media'")&&action.includes('savePrivateMediaUpload'));
  const wa=fs.readFileSync(path.join(root,'src/app/api/whatsapp/webhook/route.ts'),'utf8');
  check('WhatsApp verifies signature before handling media',wa.indexOf('verifyMetaSignature(rawBody')<wa.indexOf('downloadWhatsAppMedia(msg)'));
  check('WhatsApp answers first and requires an explicit intent',wa.includes("answerHausmeisterQuestion(user.id,body,'whatsapp',mediaPath)")&&wa.includes('const intent=explicitIntent(body)'));
  const mediaRoute=fs.readFileSync(path.join(root,'src/app/api/job-media/[id]/route.ts'),'utf8');
  check('private media route returns audio MIME types',mediaRoute.includes("ext==='.ogg'?'audio/ogg'")&&mediaRoute.includes("ext==='.mp3'?'audio/mpeg'"));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if(failures.length){console.error(failures.map(f=>` - ${f}`).join('\n'));process.exitCode=1;}
}finally{try{fs.rmSync(scratch,{recursive:true,force:true});}catch{}try{fs.rmSync(dbDir,{recursive:true,force:true});}catch{}}
