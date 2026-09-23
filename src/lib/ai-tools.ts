import { db } from './db';
import { cancellationDeadline, currentTermEnd, formatDate, contractKindLabel, costIntervalLabel } from './contracts';
import { euroExact, statusLabel } from './format';
import { createContactDirectoryStore } from './contact-directory-store';
import type { Capability } from './ai-router';
import {
  classifyHouseEvent, compareOwnerQuotes, compareOwnerTariffs, ownerHouseCheck,
  ownerJobOverview, ownerNextActions, prepareOwnerJobDraft,
} from './owner-intelligence';
import { searchIntelligentDocuments } from './document-intelligence';

export type ToolResult = { reply: string; links: Array<{ label: string; href: string }> };
type Row = Record<string, string | number | null>;
const text = (value: unknown) => String(value ?? '').replace(/[\r\n]+/g, ' ').slice(0, 250);
const list = (label: string, rows: string[], href: string): ToolResult => ({
  reply: rows.length ? label + ':\n' + rows.map(r => '• ' + r).join('\n') + '\nMehr findest du unter „' + label + '“.' : 'Unter „' + label + '“ sind dafür noch keine Einträge hinterlegt.',
  links: [{ label, href }],
});
export function requireAssistantOwner(userId: number) {
  if (!Number.isSafeInteger(userId) || userId <= 0 || !db.prepare("SELECT id FROM users WHERE id=? AND role='homeowner'").get(userId)) throw new Error('assistant_forbidden');
}
export function executeAssistantTool(userId: number, capability: Capability, question: string): ToolResult {
  requireAssistantOwner(userId);
  const id = Number(question.match(/(?:#|(?:Auftrag|Angebot|Vertrag|Dokument|Rechnung)\s*(?:Nr\.?\s*)?)(\d+)\b/i)?.[1]) || null;
  const result = (sql: string, ...args: Array<string | number | null>) => db.prepare(sql).all(...args) as Row[];
  switch (capability) {
    case 'jobs': {
      if (/organis|überblick|ueberblick|status|was läuft|was laeuft|entscheidung/i.test(question)) return ownerJobOverview(userId);
      const open = /offen|laufend|aktuell|unerledigt/i.test(question);
      const rows = result("SELECT id,title,status FROM jobs WHERE homeowner_id=? AND (? IS NULL OR id=?) AND (?=0 OR status IN ('open','quoted','accepted','in_progress')) ORDER BY updated_at DESC LIMIT 10",userId,id,id,Number(open));
      return list('Aufträge', rows.map(r => '#' + r.id + ' ' + text(r.title) + ' – ' + statusLabel(String(r.status))), '/app/jobs');
    }
    case 'quotes':
      if (/vergleich|gegenüber|gegenueber|welches angebot|prüf|pruef/i.test(question)) return compareOwnerQuotes(userId, question);
      return list('Angebote',result("SELECT q.id,q.amount,q.available_at,j.title,p.business_name FROM quotes q JOIN jobs j ON j.id=q.job_id JOIN provider_profiles p ON p.user_id=q.provider_id WHERE j.homeowner_id=? AND (? IS NULL OR q.id=?) AND q.status!='withdrawn' ORDER BY q.created_at DESC LIMIT 10",userId,id,id).map(r=>text(r.business_name)+' · '+text(r.title)+' · '+euroExact(Number(r.amount))+(r.available_at?' · '+text(r.available_at):'')),'/app/jobs');
    case 'contracts': {
      const kind = /strom/i.test(question)?'strom':/\bgas\b/i.test(question)?'gas':/dsl|internet/i.test(question)?'dsl':null;
      const rows = result("SELECT id,kind,provider,tariff,cost_amount,cost_interval,started_at,term_months,renewal_months,cancellation_days,cancellation_deadline,status FROM house_contracts WHERE homeowner_id=? AND (? IS NULL OR id=?) AND (? IS NULL OR kind=?) ORDER BY status='active' DESC,updated_at DESC LIMIT 10",userId,id,id,kind,kind);
      return list('Verträge',rows.map(r=>{
        const dates = r as unknown as Parameters<typeof cancellationDeadline>[0];
        return contractKindLabel(String(r.kind))+' · '+text(r.provider)+' · '+text(r.tariff)
          +' · '+(r.cost_amount===null?'Kosten nicht hinterlegt':euroExact(Number(r.cost_amount))+' / '+costIntervalLabel(String(r.cost_interval)))
          +' · Laufzeitende: '+formatDate(currentTermEnd(dates))
          +' · Kündigen bis: '+formatDate(cancellationDeadline(dates));
      }),'/app/contracts');
    }
    case 'documents': {
      const named = question.match(/(?:von|bei)\s+([\p{L}\p{N}][\p{L}\p{N} .'&-]{0,79})/iu)?.[1]?.trim().replace(/[.!]+$/, '');
      const search = named && !/^(mir|uns|heute|gestern|letzte)/i.test(named) ? '%' + named + '%' : null;
      const kind = /rechnung/i.test(question) ? 'invoice' : /angebot/i.test(question) ? 'offer' : null;
      const rows = result("SELECT d.title,d.kind FROM documents d JOIN jobs j ON j.id=d.job_id LEFT JOIN provider_profiles p ON p.user_id=d.provider_id WHERE j.homeowner_id=? AND (? IS NULL OR d.id=?) AND (? IS NULL OR d.kind=?) AND (? IS NULL OR d.title LIKE ? OR p.business_name LIKE ?) ORDER BY d.created_at DESC,d.id DESC LIMIT 10",userId,id,id,kind,kind,search,search,search);
      const invoices = kind === 'offer' ? [] : result("SELECT i.invoice_number,i.total_gross,i.status FROM invoices i LEFT JOIN provider_profiles p ON p.user_id=i.provider_id WHERE i.homeowner_id=? AND (? IS NULL OR i.id=?) AND (? IS NULL OR i.invoice_number LIKE ? OR p.business_name LIKE ?) ORDER BY i.created_at DESC LIMIT 10",userId,id,id,search,search,search);
      const intelligent = searchIntelligentDocuments(userId, question);
      const combined = [...intelligent.map(d=>`${text(d.title)} · ${text(d.kind)}${d.relevantDate?` · relevantes Datum ${text(d.relevantDate)}`:''}`),...rows.map(r=>text(r.title)),...invoices.map(r=>'Rechnung '+text(r.invoice_number)+' · '+euroExact(Number(r.total_gross))+' · '+text(r.status))];
      return list('Dokumente', [...new Set(combined)].slice(0,12),'/app/documents');
    }
    case 'contacts': {
      const contacts = createContactDirectoryStore(db).list(userId);
      const all = contacts.ok ? contacts.value : [];
      const query = question.toLocaleLowerCase('de-DE');
      const tokens = query.split(/[^\p{L}\p{N}]+/u).filter(v => v.length >= 4 && !['meine','mein','einen','eine','zeige','finde','suche','ansprechpartner','kontakt'].includes(v));
      const ranked = all.map(contact => {
        const haystack = [contact.name, contact.company, contact.legacyCategory, ...contact.subcategoryIds].join(' ').toLocaleLowerCase('de-DE');
        return { contact, score: tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0) + (contact.isPinned ? .25 : 0) };
      }).filter(entry => !/notfall/i.test(question) || entry.contact.isEmergency).sort((a,b)=>b.score-a.score);
      const matched = ranked.some(entry=>entry.score>=1) ? ranked.filter(entry=>entry.score>=1) : ranked;
      return list('Ansprechpartner',matched.slice(0,10).map(({contact:c})=>[c.name,c.company,c.phone,c.email].filter(Boolean).map(text).join(' · ')),'/app/partners');
    }
    case 'calendar': return list('Termine',result("SELECT j.title,a.start_at FROM appointments a JOIN jobs j ON j.id=a.job_id WHERE a.homeowner_id=? AND j.homeowner_id=? AND a.status='confirmed' AND datetime(a.start_at)>=datetime('now') ORDER BY datetime(a.start_at) LIMIT 10",userId,userId).map(r=>text(r.title)+' · '+text(r.start_at)),'/app/calendar');
    case 'house': {
      const houses=result("SELECT address,postcode,property_type,build_year,living_area FROM properties p WHERE EXISTS (SELECT 1 FROM property_ownerships o WHERE o.property_id=p.id AND o.homeowner_id=? AND o.active=1 AND o.ended_at IS NULL) LIMIT 5",userId);
      const assets=result("SELECT name,kind,installed_year FROM house_assets WHERE homeowner_id=? ORDER BY created_at DESC LIMIT 8",userId);
      return list('Hausakte',[...houses.map(r=>[r.address,r.postcode,r.property_type,r.build_year?'Baujahr '+r.build_year:null,r.living_area?r.living_area+' m²':null].filter(Boolean).map(text).join(' · ')),...assets.map(r=>text(r.name)+' · '+text(r.kind))],'/app/home');
    }
    case 'maintenance': return list('Pflege',result("SELECT title,due_date FROM maintenance_tasks WHERE homeowner_id=? AND status='open' ORDER BY due_date LIMIT 10",userId).map(r=>text(r.title)+' · fällig '+text(r.due_date)),'/app/year');
    case 'search_house': {
      // Ein Suchschritt ueber die gesamte eigene Hausakte: es buendeln nur die
      // bereits vorhandenen Tenant-sicheren Lesefunktionen, keine neue Suche.
      const terms=question.toLocaleLowerCase('de-DE').split(/[^\p{L}\p{N}]+/u).filter(v=>v.length>=3).slice(0,8);
      const treffer:{label:string;zeile:string;href:string}[]=[];
      const nimm=(label:string,zeile:string,href:string)=>{if(zeile&&treffer.length<12&&!treffer.some(v=>v.zeile===zeile))treffer.push({label,zeile,href})};
      const suche=(hay:string,label:string,zeile:string,href:string)=>{if(terms.length===0||terms.some(t=>hay.toLocaleLowerCase('de-DE').includes(t)))nimm(label,zeile,href)};
      for(const d of searchIntelligentDocuments(userId,question))nimm('Dokument',`${d.title} · ${d.kind}${d.relevantDate?` · relevantes Datum ${text(d.relevantDate)}`:''}`,d.href);
      for(const r of result("SELECT c.kind,c.provider,c.tariff,c.document_title FROM house_contracts c WHERE c.homeowner_id=? ORDER BY c.updated_at DESC LIMIT 12",userId))suche(String(r.tariff)+' '+String(r.provider)+' '+String(r.document_title),'Vertrag',`${contractKindLabel(String(r.kind))} · ${text(r.provider)}${r.tariff?' · '+text(r.tariff):''}`,'/app/contracts');
      for(const r of result("SELECT d.title,d.kind,p.business_name FROM documents d JOIN jobs j ON j.id=d.job_id LEFT JOIN provider_profiles p ON p.user_id=d.provider_id WHERE j.homeowner_id=? ORDER BY d.created_at DESC LIMIT 12",userId))suche(String(r.title)+' '+(r.business_name||''),'Dokument',`${text(r.title)}${r.business_name?' · '+text(r.business_name):''}`,'/app/documents');
      for(const r of result("SELECT a.name,a.kind FROM house_assets a WHERE a.homeowner_id=? ORDER BY a.created_at DESC LIMIT 10",userId))suche(String(r.name),'Anlage',`${text(r.name)} · ${text(r.kind)}`,'/app/home');
      for(const r of result("SELECT m.title,m.due_date FROM maintenance_tasks m WHERE m.homeowner_id=? AND m.status='open' ORDER BY m.due_date LIMIT 10",userId))suche(String(r.title),'Wartung',`${text(r.title)} · fällig ${text(r.due_date)}`,'/app/year');
      for(const r of result("SELECT p.address,p.build_year,p.living_area FROM properties p WHERE EXISTS (SELECT 1 FROM property_ownerships o WHERE o.property_id=p.id AND o.homeowner_id=? AND o.active=1 AND o.ended_at IS NULL) LIMIT 5",userId))suche(String(r.address),'Hausdaten',[r.address,r.build_year?'Baujahr '+text(r.build_year):null,r.living_area?text(r.living_area)+' m²':null].filter(Boolean).join(' · '),'/app/home');
      const contacts=createContactDirectoryStore(db).list(userId);
      if(contacts.ok)for(const c of contacts.value.slice(0,10))suche(c.name+' '+(c.company||''),'Ansprechpartner',[c.name,c.company].filter(Boolean).map(text).join(' · '),'/app/partners');
      if(!treffer.length)return {reply:'Ich habe in deiner Hausakte – Dokumente, Hausdaten, Verträge, Anlagen, Wartungen und Ansprechpartner – nichts zu „'+text(question).slice(0,80)+'“ gefunden. Du kannst ein Dokument hochladen oder den Hauscheck starten, der zeigt, was noch fehlt.',links:[{label:'Dokumente',href:'/app/documents'},{label:'Hauscheck',href:'/app/hausmeister'}]};
      const sektionen=[...new Set(treffer.map(t=>t.label))];
      return {reply:'Treffer in deiner Hausakte'+(terms.length?' zu „'+text(question).slice(0,60)+'“':'')+' ('+sektionen.join(', ')+'):\n'+treffer.map(t=>'• '+t.label+': '+t.zeile).join('\n')+'\nÖffne den Bereich, um alles im Detail zu sehen.',links:sektionen.map(label=>({label,href:treffer.find(t=>t.label===label)!.href}))};
    }
    case 'create_report': {
      // Berichte laufen im Dienst ueber den Generativ-Pfad; hier nur der
      // Fallback, falls jemand das Tool direkt ausfuehrt.
      return {reply:'Für deinen Bericht sammle ich zuerst die passenden Einträge aus deiner Hausakte und formuliere daraus eine kurze Zusammenfassung. Schick die Frage einfach über den Hausmanager ab.',links:[{label:'Hausakte',href:'/app/home'},{label:'Aufträge',href:'/app/jobs'}]};
    }
    case 'find_provider': return {reply:'Ich kann zuerst deine gespeicherten Ansprechpartner nutzen. Wenn dort niemand passt, startest du über den Hausmeister eine gezielte regionale Suche – ohne dass automatisch jemand beauftragt wird.',links:[{label:'Ansprechpartner',href:'/app/partners'},{label:'Passenden Handwerker suchen',href:`/app/hausmeister?draft=${encodeURIComponent(question)}`}]};
    case 'create_job': return prepareOwnerJobDraft(userId, question);
    case 'compare_tariffs': return compareOwnerTariffs(userId, question);
    case 'next_actions': return ownerNextActions(userId);
    case 'compare_quotes': return compareOwnerQuotes(userId, question);
    case 'house_check': return ownerHouseCheck(userId);
    case 'house_event': return classifyHouseEvent(question);
    case 'help': {
      const reply=/adresse|profil/i.test(question)?'Deine Adresse und persönlichen Angaben kannst du unter „Profil“ bearbeiten.'
        :/hochlad|dokument|rechnung/i.test(question)?'Dokumente zu einem Auftrag findest du beim jeweiligen Auftrag. Öffne dessen Details, um die verfügbaren Dokumentaktionen zu nutzen. Alle vorhandenen Belege findest du unter „Dokumente“.'
        :'In „Hilfe & Kontakt“ findest du Unterstützung. Deine Einstellungen öffnest du über dein Profilmenü unten links.';
      return {reply,links:[{label:'Profil',href:'/app/profile'},{label:'Hilfe & Kontakt',href:'/app/hilfe'}]};
    }
    default: return {reply:'Geht es um einen Auftrag, einen Vertrag, ein Dokument oder möchtest du etwas erklärt bekommen?',links:[]};
  }
}
