import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'eh-t0005-src-'));
const dbDir=fs.mkdtempSync(path.join(os.tmpdir(),'eh-t0005-db-'));
process.env.DATABASE_PATH=path.join(dbDir,'regression.db');
process.env.NODE_ENV='production';
process.chdir(dbDir);
fs.symlinkSync(path.join(root,'node_modules'),path.join(scratch,'node_modules'),'dir');
for(const rel of tsClosure(root,['src/lib/db.ts','src/lib/maintenance.ts','src/lib/geocode.ts','src/lib/matching.ts'])){
  const src=fs.readFileSync(path.join(root,rel),'utf8');
  const stripped=stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g,(_m,a,s,b)=>`${a}${s}.mjs${b}`);
  const dest=path.join(scratch,rel.replace(/\.ts$/,'.mjs'));
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,stripped);
}

let passed=0;
const failures=[];
function check(name,condition,detail=''){
  if(condition){passed++;console.log(`  ok  ${name}`);return;}
  failures.push(`${name}${detail?` :: ${detail}`:''}`);
  console.error(`FAIL  ${name}${detail?` :: ${detail}`:''}`);
}

try{
  const {db}=await import(pathToFileURL(path.join(scratch,'src/lib/db.mjs')).href);
  const maintenance=await import(pathToFileURL(path.join(scratch,'src/lib/maintenance.mjs')).href);
  const geocode=await import(pathToFileURL(path.join(scratch,'src/lib/geocode.mjs')).href);
  const matching=await import(pathToFileURL(path.join(scratch,'src/lib/matching.mjs')).href);

  const userId=Number(db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('t0005@example.invalid','x','homeowner','T','Five')").run().lastInsertRowid);
  db.prepare("INSERT INTO homeowner_profiles(user_id,postcode,address) VALUES(?,?,?)").run(userId,'46325','Pilot');
  const propertyId=Number(db.prepare("INSERT INTO properties(address,postcode) VALUES(?,?)").run('Pilot','46325').lastInsertRowid);
  db.prepare("INSERT INTO property_ownerships(property_id,homeowner_id,active) VALUES(?,?,1)").run(propertyId,userId);

  console.log('\n[Maintenance recurrence]');
  check('calendar-month recurrence clamps month end',maintenance.addMonthsIso('2026-01-31',1)==='2026-02-28',maintenance.addMonthsIso('2026-01-31',1));
  check('leap-day recurrence stays calendar-correct',maintenance.addMonthsIso('2024-02-29',12)==='2025-02-28',maintenance.addMonthsIso('2024-02-29',12));
  const assetId=Number(db.prepare("INSERT INTO house_assets(homeowner_id,kind,name,property_id) VALUES(?,?,?,?)").run(userId,'heating','Wärmepumpe',propertyId).lastInsertRowid);
  const firstAsset=maintenance.ensureAssetMaintenance(userId,propertyId,assetId,'heating','Wärmepumpe',new Date('2026-08-22T12:00:00Z'));
  const duplicateAsset=maintenance.ensureAssetMaintenance(userId,propertyId,assetId,'heating','Wärmepumpe',new Date('2026-08-22T12:00:00Z'));
  const assetRows=db.prepare('SELECT * FROM maintenance_tasks WHERE asset_id=?').all(assetId);
  check('supported asset creates one maintenance task',assetRows.length===1,String(assetRows.length));
  check('asset maintenance carries 12 month recurrence',assetRows[0]?.recurrence_months===12,String(assetRows[0]?.recurrence_months));
  check('asset duplicate is idempotent',firstAsset?.created===true&&duplicateAsset?.created===false,JSON.stringify({firstAsset,duplicateAsset}));

  const completed=maintenance.ensureCompletedWorkMaintenance(userId,propertyId,'Sanitär & Heizung','Wärmepumpe gewartet','2026-01-31');
  const completedAgain=maintenance.ensureCompletedWorkMaintenance(userId,propertyId,'Sanitär & Heizung','Wärmepumpe gewartet','2026-01-31');
  const completedTask=db.prepare("SELECT * FROM maintenance_tasks WHERE property_id=? AND title='Nächster Heizungs- / Wärmepumpencheck'").all(propertyId);
  check('completed supported work derives recurring task',completedTask.length===1&&completedTask[0].due_date==='2027-01-31'&&completedTask[0].recurrence_months===12,JSON.stringify(completedTask));
  check('completed work duplicate is idempotent',completed?.created===true&&completedAgain?.created===false,JSON.stringify({completed,completedAgain}));

  const explicit=maintenance.ensureCompletedWorkMaintenance(userId,propertyId,'Elektro','Wallbox geprüft','2026-02-01','2026-11-15');
  const explicitTask=db.prepare("SELECT * FROM maintenance_tasks WHERE id=?").get(explicit.id);
  check('declared first due date is preserved',explicitTask.due_date==='2026-11-15',explicitTask.due_date);
  check('declared first due date keeps inferred recurrence',explicitTask.recurrence_months===24,String(explicitTask.recurrence_months));
  const completedResult=maintenance.completeMaintenanceAndScheduleNext(userId,propertyId,explicit.id);
  const nextTask=db.prepare("SELECT * FROM maintenance_tasks WHERE property_id=? AND title=? AND status='open'").get(propertyId,explicitTask.title);
  check('completing recurring task schedules exactly one next occurrence',completedResult.completed===true&&completedResult.nextCreated===true&&nextTask?.due_date==='2028-11-15',JSON.stringify({completedResult,nextTask}));
  const completeAgain=maintenance.completeMaintenanceAndScheduleNext(userId,propertyId,explicit.id);
  check('re-completing task cannot duplicate next occurrence',completeAgain.completed===false&&db.prepare("SELECT COUNT(*) c FROM maintenance_tasks WHERE property_id=? AND title=? AND status='open'").get(propertyId,explicitTask.title).c===1,JSON.stringify(completeAgain));

  console.log('\n[Regional distance fallback]');
  db.prepare("INSERT INTO postcode_geo(postcode,lat,lon) VALUES('46325',51.8523425,6.8315543)").run();
  const exact=geocode.regionalPostcodeGeo('46325');
  const nearbyFallback=geocode.regionalPostcodeGeo('46342');
  const otherRegion=geocode.regionalPostcodeGeo('48143');
  check('exact cached postcode is preferred',Math.abs(exact.lat-51.8523425)<1e-8&&Math.abs(exact.lon-6.8315543)<1e-8,JSON.stringify(exact));
  check('same-region external-geocode failure still resolves deterministically',nearbyFallback!==null,JSON.stringify(nearbyFallback));
  check('different pilot region resolves to a deterministic centroid',otherRegion!==null,JSON.stringify(otherRegion));
  check('regional distance is numeric instead of prefix equality',Number.isFinite(geocode.distanceKm(nearbyFallback,otherRegion))&&geocode.distanceKm(nearbyFallback,otherRegion)>20,String(geocode.distanceKm(nearbyFallback,otherRegion)));

  console.log('\n[Emergency response fidelity]');
  const fastMeasured=matching.emergencyResponseScore({averageResponseMinutes:8,responseSamples:6,responseTargetMinutes:45,emergencyMode:'local'});
  const slowMeasured247=matching.emergencyResponseScore({averageResponseMinutes:42,responseSamples:6,responseTargetMinutes:10,emergencyMode:'24_7'});
  const declaredLocal=matching.emergencyResponseScore({averageResponseMinutes:4,responseSamples:2,responseTargetMinutes:20,emergencyMode:'local'});
  const declared247=matching.emergencyResponseScore({averageResponseMinutes:4,responseSamples:2,responseTargetMinutes:20,emergencyMode:'24_7'});
  check('measured behavior outranks static 24/7 label when materially faster',fastMeasured>slowMeasured247,JSON.stringify({fastMeasured,slowMeasured247}));
  check('insufficient samples fall back to declared response target',declaredLocal===16,String(declaredLocal));
  check('24/7 label is only a small availability confidence bonus',Math.abs((declared247-declaredLocal)-2)<1e-9,JSON.stringify({declaredLocal,declared247}));

  console.log('\n[Redispatch timing window]');
  const now=new Date('2026-08-22T10:00:00Z'); // 12:00 Europe/Berlin
  const inWindow=matching.preferredRequestWindow({preferredDate:'2026-08-24',preferredTime:'11:00',now});
  const outsideWindow=matching.preferredRequestWindow({preferredDate:'2026-08-24',preferredTime:'13:30',now});
  const expired=matching.preferredRequestWindow({preferredDate:'2026-08-21',preferredTime:'11:00',now});
  check('preferred time participates in 48h short-notice boundary',inWindow.shortNotice===true&&outsideWindow.shortNotice===false,JSON.stringify({inWindow,outsideWindow}));
  check('redispatch window marks service request expired only after 24h grace',expired.expired===true,JSON.stringify(expired));

  const orchestratorSource=fs.readFileSync(path.join(root,'src/lib/orchestrator.ts'),'utf8');
  check('orchestrator redispatch uses preferred time window',orchestratorSource.includes('preferredTime:job.preferred_time')&&orchestratorSource.includes("requestKind==='service'&&preferredRequestWindow"));
  check('emergency score is tariff-neutral in ranking expression',orchestratorSource.includes('emergencyResponseScore({')&&!/emergencyScore[^\n]*partner_plan/.test(orchestratorSource));
  check('regional matching no longer falls back to postcode prefix equality',!orchestratorSource.includes("slice(0,2)!==")&&orchestratorSource.includes('regionalPostcodeGeo'));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if(failures.length){console.error(failures.map(f=>` - ${f}`).join('\n'));process.exitCode=1;}
}finally{
  try{fs.rmSync(scratch,{recursive:true,force:true});}catch{}
  try{fs.rmSync(dbDir,{recursive:true,force:true});}catch{}
}
