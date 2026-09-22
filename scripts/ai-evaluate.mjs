// Opt-in local-model evaluation. Never calls Jev or DeepSeek.
import { decisionQuestions, explicitCapability } from '../src/lib/ai-router.ts';
const samples=[
 ['Welche Aufträge sind noch offen?','jobs'],
 ['Zeig mir meine laufenden Aufträge.','jobs'],
 ['Welche Angebote habe ich bekommen?','quotes'],
 ['Was zahle ich für meinen Stromvertrag?','contracts'],
 ['Wann muss ich meinen DSL-Vertrag kündigen?','contracts'],
 ['Wo finde ich meine Rechnungen?','documents'],
 ['Zeige meine gespeicherten Ansprechpartner.','contacts'],
 ['Welche Termine habe ich als Nächstes?','calendar'],
 ['Welches Baujahr hat mein Haus?','house'],
 ['Welche Wartungen sind fällig?','maintenance'],
 ['Ich suche einen Elektriker.','find_provider'],
 ['Ich möchte einen Auftrag für Heckenschnitt erstellen.','create_job'],
 ['Ich möchte meinen Gasanbieter wechseln.','compare_tariffs'],
 ['Wie ändere ich meine Adresse in der App?','help'],
 ['Erkläre mir die Vor- und Nachteile einer Wärmepumpe.','generative'],
 ['Vergleiche diese Angebote ausführlich und begründe deine Empfehlung.','generative'],
 ['Schreib eine freundliche Nachricht an meinen Handwerker.','generative'],
 ['Mach das bitte so.','clarify'],
];
let correct=0,confidentWrong=0,accepted=0;
const modelOnly = process.argv.includes('--model-only');
for(const [question,expected] of samples){
 const explicit = modelOnly ? null : explicitCapability(question);
 if (explicit) { correct+=Number(explicit===expected); accepted++; confidentWrong+=Number(explicit!==expected && explicit!=='clarify'); console.log(JSON.stringify({question,expected,choice:explicit,provider:'local'})); continue; }
 const start=performance.now();
 const response=await fetch((process.env.LAYA_URL||'http://127.0.0.1:8097')+'/decide',{
  method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.LAYA_API_KEY},
  body:JSON.stringify({state:'user: '+question,questions:decisionQuestions()}),signal:AbortSignal.timeout(15000),
 });
 if(!response.ok)throw new Error('Laya HTTP '+response.status);
 const result=await response.json();const a=result.answers.route;
 correct+=Number(a.choice===expected);accepted+=Number(a.confidence>=.9);
 confidentWrong+=Number(a.confidence>=.9&&a.choice!==expected&&a.choice!=='clarify');
 console.log(JSON.stringify({question,expected,choice:a.choice,confidence:a.confidence,ms:Math.round(performance.now()-start)}));
}
console.log(JSON.stringify({total:samples.length,correct,accepted,confidentWrong}));
if(confidentWrong>0)process.exitCode=1;
