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
process.chdir(dbDir);
fs.symlinkSync(path.join(root,'node_modules'),path.join(scratch,'node_modules'),'dir');
for(const rel of tsClosure(root,['src/lib/db.ts','src/lib/maintenance.ts','src/lib/geocode.ts','src/lib/matching.ts'])){
  const src=fs.readFileSync(path.join(root,rel),'utf8');
  const stripped=stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g,(_m,a,s,b)=>`${a}${s}.mjs${b}`);
  const dest=path.join(scratch,rel.replace(/\.ts$/,'.mjs'));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,stripped);
}
let passed=0;const failures=[];
function check(name,condition,detail=''){if(condition){passed++;console.log(`  ok  ${name}`);}else{failures.push(`${name}${detail?` :: ${detail}`:''}`);console.error(`FAIL  ${name}${detail?` :: ${detail}`:''}`);}}
try{
  const {db}=await import(pathToFileURL(path.join(scratch,'src/lib/db.mjs')).href);
  const maintenance=await import(pathToFileURL(path.join(scratch,'src/lib/maintenance.mjs')).href);
  const geo=await import(pathToFileURL(path.join(scratch,'src/lib/geocode.mjs')).href);
  const matching=await import(pathToFileURL(path.join(scratch,'src/lib/matching.mjs')).href);

  const userId=Number(db.prepare(`INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('owner@example.test','x','homeowner','Test','Owner')`).run().lastInsertRowid);
  const propertyId=Number(db.prepare(`INSERT INTO properties(address,postcode) VALUES('Testweg 1','46325')`).run().lastInsertRowid);

  console.log('\n[Maintenance recurrence + dedupe]');
  const heatingId=Number(db.prepare(`INSERT INTO house_assets(homeowner_id,kind,name,property_id) VALUES(?,?,?,?)`).run(userId,'heating','Wärmepumpe',propertyId).lastInsertRowid);
  const gardenId=Number(db.prepare(`INSERT INTO house_assets(homeowner_id,kind,name,property_id) VALUES(?,?,?,?)`).run(userId,'garden','Garten',propertyId).lastInsertRowid);
  const base=new Date('2026-01-15T12:00:00Z');
  const heat=maintenance.ensureAssetMaintenance(userId,propertyId,heatingId,'heating','Wärmepumpe',base);
  const heatAgain=maintenance.ensureAssetMaintenance(userId,propertyId,heatingId,'heating','Wärmepumpe',base);
  const garden=maintenance.ensureAssetMaintenance(userId,propertyId,gardenId,'garden','Garten',base);
  const heatRow=db.prepare('SELECT * FROM maintenance_tasks WHERE id=?').get(heat.id);
  const gardenRow=db.prepare('SELECT * FROM maintenance_tasks WHERE id=?').get(garden.id);
  check('heating schedules annually',heatRow.recurrence_months===12&&heatRow.due_date==='2027-01-15',`${heatRow.recurrence_months}/${heatRow.due_date}`);
  check('garden uses seasonal six-month cadence',gardenRow.recurrence_months===6&&gardenRow.due_date==='2026-07-15',`${gardenRow.recurrence_months}/${gardenRow.due_date}`);
  check('same asset maintenance is idempotent',heatAgain.created===false&&db.prepare('SELECT COUNT(*) c FROM maintenance_tasks WHERE asset_id=?').get(heatingId).c===1);
  const complete1=maintenance.completeMaintenanceAndScheduleNext(userId,propertyId,heat.id);
  const complete2=maintenance.completeMaintenanceAndScheduleNext(userId,propertyId,heat.id);
  check('completing open task schedules exactly one successor',complete1.completed&&complete1.nextCreated&&db.prepare("SELECT COUNT(*) c FROM maintenance_tasks WHERE asset_id=? AND status='open'").get(heatingId).c===1);
  check('repeating completion cannot duplicate successor',complete2.completed===false&&db.prepare('SELECT COUNT(*) c FROM maintenance_tasks WHERE asset_id=?').get(heatingId).c===2);

  console.log('\n[Completed work -> maintenance]');
  const first=maintenance.ensureCompletedWorkMaintenance(userId,propertyId,'Sanitär & Heizung','Wärmepumpe warten',base);
  const second=maintenance.ensureCompletedWorkMaintenance(userId,propertyId,'Sanitär & Heizung','Wärmepumpe warten',base);
  const workRow=db.prepare('SELECT * FROM maintenance_tasks WHERE id=?').get(first.id);
  check('supported completed work derives a future maintenance task',first?.created===true&&workRow?.recurrence_months===12&&workRow?.due_date==='2027-01-15');
  check('same completed work maintenance target deduplicates',second?.created===false);
  check('non-recurring cosmetic work does not invent maintenance',maintenance.maintenanceRuleForCompletedWork('Maler & Ausbau','Wohnzimmer gestrichen')===null);

  console.log('\n[Regional PLZ fallback]');
  const borken=geo.regionalPostcodeGeo('46325');
  const wesel=geo.regionalPostcodeGeo('46483');
  const berlin=geo.regionalPostcodeGeo('10115');
  check('pilot centroid exists without external geocoder',!!borken&&!!wesel&&!!berlin);
  check('nearby same-region postcodes remain matchable',geo.distanceKm(borken,wesel)<5,String(geo.distanceKm(borken,wesel)));
  check('distant regions stay distinguishable',geo.distanceKm(borken,berlin)>300,String(geo.distanceKm(borken,berlin)));
  db.prepare(`INSERT INTO postcode_geo(postcode,lat,lon) VALUES('46117',51.50,6.90)`).run();
  const cachedCentroid=geo.regionalPostcodeGeo('46999');
  check('cached regional observations override static centroid',Math.abs(cachedCentroid.lat-51.50)<0.001&&Math.abs(cachedCentroid.lon-6.90)<0.001,JSON.stringify(cachedCentroid));

  console.log('\n[Emergency response scoring]');
  const fastMeasured=matching.emergencyResponseScore({averageResponseMinutes:8,responseSamples:8,responseTargetMinutes:90,emergencyMode:'local'});
  const slow247=matching.emergencyResponseScore({averageResponseMinutes:70,responseSamples:8,responseTargetMinutes:5,emergencyMode:'24_7'});
  const declaredFast=matching.emergencyResponseScore({averageResponseMinutes:null,responseSamples:0,responseTargetMinutes:15,emergencyMode:'local'});
  const declaredSlow=matching.emergencyResponseScore({averageResponseMinutes:null,responseSamples:0,responseTargetMinutes:120,emergencyMode:'local'});
  check('measured fast response outranks static 24/7 label',fastMeasured>slow247,`${fastMeasured} <= ${slow247}`);
  check('declared response target is used when history is sparse',declaredFast>declaredSlow,`${declaredFast} <= ${declaredSlow}`);
  const orchestratorSource=fs.readFileSync(path.join(root,'src/lib/orchestrator.ts'),'utf8');
  const scoreLine=orchestratorSource.split('\n').find(line=>line.includes('const score='))||'';
  check('partner tariff is not part of ranking score',!scoreLine.includes('partner_plan')&&!scoreLine.includes('monthly_lead_limit'),scoreLine);
  check('emergency markup is not part of ranking score',!scoreLine.includes('emergency_markup'),scoreLine);
  check('coarse postcode prefix gate was removed',!orchestratorSource.includes("jobPostcode.slice(0,2)!==p.postcode.slice(0,2)"));
  check('redispatch no longer creates maintenance side effects',!orchestratorSource.includes('Follow-up:'));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if(failures.length){console.error(failures.map(f=>` - ${f}`).join('\n'));process.exitCode=1;}
}finally{try{fs.rmSync(scratch,{recursive:true,force:true});}catch{}try{fs.rmSync(dbDir,{recursive:true,force:true});}catch{}}
