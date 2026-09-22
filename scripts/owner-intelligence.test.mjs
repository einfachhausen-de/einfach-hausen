import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'eh-owner-ai-'));
process.env.DATABASE_PATH=path.join(tmp,'test.db');
const {db}=await import('../src/lib/db.ts');
const mod=await import('../src/lib/owner-intelligence.ts');
const owner=(name)=>Number(db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES(?,'x','homeowner',?,'Test')").run(name+'@owner-ai.example',name).lastInsertRowid);
const a=owner('Anna'),b=owner('Ben');
for(const id of [a,b])db.prepare("INSERT INTO homeowner_profiles(user_id,postcode,address,onboarding_step) VALUES(?,'10115','Testweg 1','done')").run(id);
const partner={id:'approved-strom',name:'Test Partner',categories:['strom'],enabled:true,approvalRef:'test-approval-2026',targetUrl:'https://partner.example/compare',allowedHosts:['partner.example'],allowedPathPrefixes:['/compare'],publisherParams:{pub:'eh'},trackingMode:'none',untrackedAllowed:true};

test('tariff opportunities require an approved partner id and compute real delta only',()=>{
 db.prepare("INSERT INTO house_contracts(homeowner_id,kind,provider,tariff,cost_amount,cost_interval) VALUES(?,'strom','Altstrom','Basis',12000,'month')").run(a);
 db.prepare("INSERT INTO tariff_partner_offers(partner_id,category,provider_name,tariff_name,annual_cents,postcode_prefix,source_ref) VALUES('rogue','strom','Fake','Billig',10000,'101','x')").run();
 assert.equal(mod.tariffOpportunities(a,'strom',[partner]).length,0);
 db.prepare("INSERT INTO tariff_partner_offers(partner_id,category,provider_name,tariff_name,annual_cents,postcode_prefix,source_ref) VALUES('approved-strom','strom','Partner Strom','Fair',110000,'101','feed-1')").run();
 const rows=mod.tariffOpportunities(a,'strom',[partner]);
 assert.equal(rows.length,1);assert.equal(rows[0].currentAnnualCents,144000);assert.equal(rows[0].savingsAnnualCents,34000);
 assert.equal(mod.tariffOpportunities(b,'strom',[partner]).length,0);
});

test('partner offer import accepts only an approved partner and validates input before replace',()=>{
 assert.throws(()=>mod.replacePartnerTariffOffers({partnerId:'rogue',category:'strom',offers:[]},[partner]),/not_approved/);
 const result=mod.replacePartnerTariffOffers({partnerId:'approved-strom',category:'strom',offers:[{providerName:'Feed Strom',tariffName:'Online',annualCents:99000,postcodePrefix:'101',sourceRef:'feed-2026-09-22'}]},[partner]);
 assert.equal(result.replaced,1);
 assert.equal(db.prepare("SELECT COUNT(*) c FROM tariff_partner_offers WHERE partner_id='approved-strom' AND category='strom'").get().c,1);
 assert.throws(()=>mod.replacePartnerTariffOffers({partnerId:'approved-strom',category:'strom',offers:[{providerName:'Bad',tariffName:'Bad',annualCents:-1,sourceRef:'x'}]},[partner]),/price/);
 assert.equal(db.prepare("SELECT COUNT(*) c FROM tariff_partner_offers WHERE partner_id='approved-strom' AND category='strom'").get().c,1);
});

test('production comparison fails closed while no commercial affiliate is configured',()=>{
 const out=mod.compareOwnerTariffs(a,'Gibt es einen günstigeren Stromtarif?');
 assert.match(out.reply,/kein freigegebener Vergleichspartner|kein passender, verifizierter Preis/);
 assert.doesNotMatch(out.reply,/Fake|Partner Strom/);
});

test('attention notifications are idempotent until the underlying fact changes',()=>{
 const task=Number(db.prepare("INSERT INTO maintenance_tasks(homeowner_id,title,category,due_date) VALUES(?,'Filter wechseln','Heizung',date('now'))").run(a).lastInsertRowid);
 const first=mod.syncOwnerAttentionNotifications(a);
 const count1=db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND kind='assistant'").get(a).c;
 const second=mod.syncOwnerAttentionNotifications(a);
 const count2=db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND kind='assistant'").get(a).c;
 assert.ok(first.created>=1);assert.equal(second.created,0);assert.equal(count2,count1);
 db.prepare("UPDATE maintenance_tasks SET due_date=date('now','+10 days') WHERE id=?").run(task);
 const third=mod.syncOwnerAttentionNotifications(a);
 assert.ok(third.created>=1);
 assert.ok(db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND kind='assistant'").get(a).c>count2);
});

test.after(()=>{db.close();fs.rmSync(tmp,{recursive:true,force:true})});
