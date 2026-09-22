import test from 'node:test';
import assert from 'node:assert/strict';
const mod = await import('../src/lib/ai-router.ts').catch(() => null);
test('DecisionRouter exists', () => assert.equal(typeof mod?.DecisionRouter, 'function'));
const answer = (choice='jobs', confidence=.96) => new Response(JSON.stringify({answers:{route:{choice,confidence,probabilities:{[choice]:confidence}}}}));
const config={layaUrl:'http://127.0.0.1:8097',layaKey:'test',jevKey:'test',timeoutMs:30,cooldownMs:30,maxJev:1};
if(mod) {
 test('Laya handles normal request without Jev', async()=> {
  const urls=[]; const r=new mod.DecisionRouter(config,async u=>{urls.push(u);return answer()});
  assert.deepEqual(await r.decide('Zeige meine Aufträge'),{capability:'jobs',provider:'laya',confidence:.96});
  assert.equal(urls.length,1);
 });
 test('busy Laya uses Jev, cooldown avoids storm, returns to Laya',async()=>{
  const urls=[];let busy=true;
  const r=new mod.DecisionRouter(config,async u=>{urls.push(u);return u.includes('8097')&&busy?new Response('',{status:503}):answer()});
  assert.equal((await r.decide('Aufträge')).provider,'jev');
  assert.equal((await r.decide('Aufträge')).provider,'jev');
  assert.equal(urls.filter(u=>u.includes('8097')).length,1);
  busy=false;await new Promise(r=>setTimeout(r,40));
  assert.equal((await r.decide('Aufträge')).provider,'laya');
 });
 test('uncertain/unknown/malformed decisions clarify, never call Jev',async()=>{
  for(const response of [answer('jobs',.2),answer('DELETE_ALL',1),new Response('{}'),answer('jobs',2)]){
   let calls=0;const r=new mod.DecisionRouter(config,async()=>{calls++;return response});
   assert.equal((await r.decide('Was jetzt?')).capability,'clarify');assert.equal(calls,1);
  }
 });
 test('aborted request never overflows',async()=>{
  let calls=0; const c=new AbortController();c.abort();
  const r=new mod.DecisionRouter(config,async()=>{calls++;return answer()});
  await assert.rejects(()=>r.decide('Hi',c.signal));assert.equal(calls,0);
 });
 test('timeout overflows once and missing Jev fails closed',async()=>{
  const f=async(u,init)=>u.includes('8097')?await new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(init.signal.reason),{once:true})):answer();
  const keepAlive=setTimeout(()=>{},200);
  const r=new mod.DecisionRouter(config,f);assert.equal((await r.decide('Hi')).provider,'jev');
  const missing=new mod.DecisionRouter({...config,jevKey:''},async()=>new Response('',{status:503}));
  await assert.rejects(()=>missing.decide('Hi'),/unavailable/);clearTimeout(keepAlive);
 });
 test('Jev concurrency is bounded',async()=>{
  let release;const wait=new Promise(r=>release=r);
  const r=new mod.DecisionRouter(config,async u=>u.includes('8097')?new Response('',{status:503}):(await wait,answer()));
  const pending=r.decide('Hi');await new Promise(r=>setTimeout(r,5));
  await assert.rejects(()=>r.decide('Hi'),/unavailable/);release();await pending;
 });
}
test('explicit product commands distinguish lookup, switch, help and generation',()=>{
 assert.equal(typeof mod?.explicitCapability,'function');
 for(const [question,expected] of [
 ['Was zahle ich für meinen Stromvertrag?','contracts'],
 ['Wann muss ich meinen DSL-Vertrag kündigen?','contracts'],
 ['Ich möchte meinen Gasanbieter wechseln.','compare_tariffs'],
 ['Gibt es einen günstigeren Stromtarif für mich?','compare_tariffs'],
 ['Vergleiche meine Angebote für Auftrag #12','compare_quotes'],
 ['Was braucht gerade meine Aufmerksamkeit?','next_actions'],
 ['Prüfe ob meine Hausakte vollständig ist','house_check'],
 ['Wo gehört diese Wartungsrechnung hin?','house_event'],
 ['Meine Heizung ist kaputt','create_job'],
 ['Wer ist mein Elektriker?','contacts'],
 ['Schreib eine freundliche Nachricht an meinen Handwerker.','generative'],
 ['Zeige meine offenen Aufträge','jobs'],
 ['Wie lade ich meine Rechnung hoch?','help'],
 ['Was ist mit ihm?',null],
 ['Ich will einen Handwerker beauftragen','create_job'],
 ])assert.equal(mod.explicitCapability(question),expected,question);
});
