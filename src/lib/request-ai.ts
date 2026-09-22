const CATEGORY_RULES:Array<[string,RegExp]>=[
  ['Garten & Außenbereich',/hecke|rasen|garten|baum|bäume|beet|laub|zaun|terrasse/i],
  ['Reinigung',/reinig|putz|fenster|treppenhaus|glas|grundreinigung/i],
  ['Elektro',/strom|steckdose|elektr|lampe|licht|sicherung|wallbox/i],
  ['Sanitär & Heizung',/wasser|hahn|toilette|wc|heizung|therme|rohr|abfluss|wärmepumpe/i],
  ['Maler & Ausbau',/maler|streichen|tapete|wand|decke|trockenbau/i],
  ['Montage & Reparatur',/montage|reparatur|tür|schloss|möbel|schrank|regal|bohren/i],
  ['Dach & Fassade',/dach|rinne|fassade|ziegel/i],
  ['Umzug & Transport',/umzug|transport|tragen|möbeltransport|entrümpel/i],
  ['Energie & Smart Home',/pv|photovoltaik|solar|speicher|wallbox|smart home|energie/i],
];

const TITLE_RULES:Array<[string,RegExp]>=[
  ['Heckenschnitt',/hecke.{0,20}(schneid|schnitt)|heckenschnitt/i],
  ['Rasenpflege',/rasen.{0,20}(mäh|pflege)|rasenmähen/i],
  ['Terrassenreinigung',/terrass.{0,20}reinig/i],
  ['Fensterreinigung',/fenster.{0,20}(reinig|putz)/i],
  ['Elektroreparatur',/strom|steckdose|sicherung|elektr/i],
  ['Sanitärreparatur',/abfluss|wasserhahn|toilette|wc|rohr/i],
  ['Malerarbeiten',/streichen|maler|tapete/i],
  ['Montage & Reparatur',/montage|reparatur|tür|schloss|regal|schrank/i],
  ['Dach-/Dachrinnenarbeit',/dach|dachrinne|rinne/i],
  ['Energie-/Haustechnik',/pv|photovoltaik|wallbox|wärmepumpe|smart home/i],
];

const DAY_INDEX:Record<string,number>={sonntag:0,montag:1,dienstag:2,mittwoch:3,donnerstag:4,freitag:5,samstag:6};
const WEEKDAY_INDEX:Record<string,number>={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};

function berlinToday(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(now);
  const value=(type:string)=>String(parts.find(part=>part.type===type)?.value||'');
  return {year:Number(value('year')),month:Number(value('month')),day:Number(value('day')),weekday:WEEKDAY_INDEX[value('weekday')]??0};
}

function isoDate(year:number,month:number,day:number){
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function addCalendarDays(base:{year:number;month:number;day:number},days:number){
  const date=new Date(Date.UTC(base.year,base.month-1,base.day+days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
}

function nextWeekday(name:string,now=new Date()){
  const target=DAY_INDEX[name.toLowerCase()];
  if(target===undefined)return null;
  const today=berlinToday(now);
  let delta=(target-today.weekday+7)%7;
  if(delta===0)delta=7;
  return addCalendarDays(today,delta);
}

function extractPostcode(text:string){
  for(const match of text.matchAll(/\b\d{5}\b/g)){
    const index=match.index??0;
    const before=text.slice(Math.max(0,index-20),index).toLowerCase();
    const after=text.slice(index+5,index+16).toLowerCase();
    if(/(?:budget|max(?:imal)?|höchstens|bis)\s*[:=]?\s*$/.test(before))continue;
    if(/^\s*(?:€|eur\b)/i.test(after))continue;
    if(match[0]!=='00000')return match[0];
  }
  return null;
}

function preferredDateFromText(text:string,now=new Date()){
  const today=berlinToday(now);
  if(/\bübermorgen\b/i.test(text))return addCalendarDays(today,2);
  if(/\bmorgen\b/i.test(text))return addCalendarDays(today,1);
  if(/\bheute\b/i.test(text))return addCalendarDays(today,0);
  const weekday=text.match(/\b(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\b/i)?.[1];
  if(weekday)return nextWeekday(weekday,now);
  const explicit=text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})?\b/);
  if(!explicit)return null;
  let year=explicit[3]?Number(explicit[3]):today.year;
  let resolved=isoDate(year,Number(explicit[2]),Number(explicit[1]));
  if(!resolved)return null;
  const todayIso=addCalendarDays(today,0);
  if(!explicit[3]&&resolved<todayIso){year+=1;resolved=isoDate(year,Number(explicit[2]),Number(explicit[1]));}
  return resolved;
}

export type ParsedRequest={category:string;title:string;postcode:string|null;preferredDate:string|null;preferredTime:string|null;budgetMin:number|null;budgetMax:number|null};

export function parseRequest(text:string,now=new Date()):ParsedRequest{
  const category=CATEGORY_RULES.find(([,re])=>re.test(text))?.[0]??'Hausmeister & Sonstiges';
  const fallbackTitles:Record<string,string>={'Garten & Außenbereich':'Gartenarbeit','Reinigung':'Reinigung','Elektro':'Elektroarbeit','Sanitär & Heizung':'Sanitär-/Heizungsarbeit','Maler & Ausbau':'Maler-/Ausbauarbeit','Montage & Reparatur':'Montage oder Reparatur','Dach & Fassade':'Dach-/Fassadenarbeit','Umzug & Transport':'Transportauftrag','Energie & Smart Home':'Energie-/Haustechnik','Hausmeister & Sonstiges':'Hausservice'};
  const title=TITLE_RULES.find(([,re])=>re.test(text))?.[0]??fallbackTitles[category];
  const budget=text.match(/(?:budget|max(?:imal)?|höchstens)[^0-9]{0,8}(\d{2,6})(?:[,.]\d{1,2})?\s*(?:€|eur)?/i);
  const range=text.match(/(\d{2,6})(?:[,.]\d{1,2})?\s*(?:€|eur)?\s*(?:-|–|bis)\s*(\d{2,6})(?:[,.]\d{1,2})?\s*(?:€|eur)/i);
  const postcode=extractPostcode(text);
  const timeMatch=text.match(/\b(?:um|ab)\s*(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?\b/i);
  const hour=timeMatch?Number(timeMatch[1]):-1,minute=timeMatch?Number(timeMatch[2]??'00'):-1;
  const preferredTime=timeMatch&&hour>=0&&hour<=23&&minute>=0&&minute<=59?`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`:null;
  const preferredDate=preferredDateFromText(text,now);
  return {category,title,postcode,preferredDate,preferredTime,budgetMin:range?Number(range[1]):null,budgetMax:range?Number(range[2]):budget?Number(budget[1]):null};
}

// Extraction is a deterministic product operation, never a paid chat call.
// Keep this async public interface for existing intake/emergency callers.
export async function analyzeRequest(text:string):Promise<ParsedRequest>{
  return parseRequest(text);
}
