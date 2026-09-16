import {readFileSync,existsSync,readdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
export const hash=data=>createHash("sha256").update(data).digest("hex");

// --- Whitelist statt Blacklist (Zukunftssicherung 1.2) -----------------
// Fuer diese Eigenschaften ist nur erlaubt, was in RAW_OK steht oder eine
// Custom Property ist. Eine Blacklist kann nicht funktionieren, weil die
// Liste der Rohwerte offen ist: small-type greift nur bei px, literal-color
// sieht oklch( nicht, decorative-effect matcht rounded-full aber nicht
// border-radius:999px. Die Whitelist schliesst alle vier Luecken auf einmal.
const RAW_PROPS="font-size|font-weight|color|background|background-color|border-color|border-top-color|border-right-color|border-bottom-color|border-left-color|border-radius|box-shadow|letter-spacing|line-height";
const RAW_DECL=new RegExp("(?<![\\w-])(?:"+RAW_PROPS+")\\s*:\\s*([^;}'\"`]+)","g");
const RAW_JSX=/\b(?:fontSize|fontWeight|color|backgroundColor|borderRadius|boxShadow|letterSpacing|lineHeight)\s*:\s*['"`]?([^,'"`}\s]+)/g;
const RAW_OK=new Set(["inherit","initial","unset","revert","currentColor","currentcolor","transparent","none","0","0px","0%","auto","100%","normal","bold","bolder","lighter"]);
// Zustand reist in ARIA, nicht in eine Klasse (Zukunftssicherung 5.3).
const STATE_CLASS=/\bclass(?:Name)?\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/g;
const STATE_WORDS=/\b(?:active|selected|is-active|current|open)\b/;

function rawValueTokens(value) {
  // Wert in Bestandteile zerlegen, aber Klammern zusammenhalten.
  return value.replace(/!important/g,"").trim().split(/\s+(?![^(]*\))/).filter(Boolean);
}
function isAllowed(part) {
  if(part.startsWith("var(--"))return true;   // Indirektion, kein Rohwert
  return RAW_OK.has(part);
}
export function violations(path,source) {
  const results=[];
  const rules=[
    ["literal-color", /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g],
    ["foreign-font", /\b(?:Manrope|Poppins|Geist|Roboto|Montserrat|Playfair|DM Sans)\b/g],
    ["small-type", /font-size\s*:\s*(?:[0-9]|1[0-2])(?:\.\d+)?px\b|fontSize\s*:\s*(?:[0-9]|1[0-2])\b|text-(?:xs|\[(?:[0-9]|1[0-2])px\])/g],
    ["unowned-style", /\bstyle\s*=\s*\{/g],
    ["decorative-effect", /(?:linear|radial|conic)-gradient\s*\(|backdrop-filter\s*:\s*blur|\b(?:shadow-(?:xl|2xl)|rounded-full|backdrop-blur|bg-gradient-)\b/g],
    ["visual-utility", /\b(?:bg|text|border|ring)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g],
    ["no-important", /!important/g],
  ];
  const isCss=/\.css$/.test(path);
  const isMarkup=/\.(?:tsx|jsx)$/.test(path);
  for(const [rule,pattern] of rules) {
    if(rule==="no-important"&&!isCss)continue;
    for(const match of source.matchAll(pattern)) results.push({rule,token:match[0],key:rule+"\u0000"+match[0]});
  }
  if(isCss||isMarkup) {
    for(const match of source.matchAll(isCss?RAW_DECL:RAW_JSX)) {
      const value=match[1]??"";
      if(!value)continue;
      const bad=rawValueTokens(value).filter(p=>!isAllowed(p));
      if(bad.length)results.push({rule:"raw-value",token:match[0].trim(),key:"raw-value\u0000"+match[0].trim()});
    }
  }
  if(isMarkup) for(const match of source.matchAll(STATE_CLASS)) {
    const word=(match[0].match(STATE_WORDS)||[])[0];
    if(word)results.push({rule:"state-class",token:word,key:"state-class\u0000"+word});
  }
  return results;
}
function walk(root,path="src") {
  const dir=resolve(root,path);if(!existsSync(dir))return [];
  return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(root,path+"/"+e.name):/\.(?:css|tsx?|jsx?)$/.test(e.name)?[path+"/"+e.name]:[]);
}
export function scan(root) {
  const baseline={};
  for(const path of walk(root)) {
    const counts={};for(const v of violations(path,readFileSync(resolve(root,path),"utf8")))counts[v.key]=(counts[v.key]??0)+1;
    if(Object.keys(counts).length)baseline[path]=counts;
  }
  return baseline;
}
export function check(root,{base,checkSeal=true}={}) {
  const errors=[];const policy=JSON.parse(readFileSync(resolve(root,"design/design-policy.json"),"utf8"));
  const baseline=JSON.parse(readFileSync(resolve(root,"design/design-debt.json"),"utf8"));
  const current=scan(root);
  const flat=b=>{const m=new Map();for(const [p,c] of Object.entries(b))for(const [k,v] of Object.entries(c))m.set(p+"\u0000"+k,v);return m;};
  const cur=flat(current),bas=flat(baseline);
  for(const [key,count] of cur) {
    const [path,ruleKey]=key.split("\u0000");const rule=(ruleKey??"").split("\u0000")[0];
    const allowed=bas.get(key)??0;
    if(count>allowed)errors.push(path+": new "+rule+" ("+count+" > "+allowed+")");
    // Die Ratsche: wer aufraeumt, muss nachziehen. Sonst behaelt er den alten
    // Spielraum und kann ihn spaeter mit neuem Schaden fuellen (Zukunftss. 2.2).
    else if(count<allowed)errors.push(path+": debt baseline is stale for "+rule+" ("+count+" < "+allowed+"); run design:debt:sync");
  }
  // Ein auf null gebrachter Verstoess verschwindet aus dem Scan und wuerde
  // sonst unbemerkt wieder auferstehen duerfen.
  for(const [key,allowed] of bas) if(!cur.has(key)) {
    const [path,ruleKey]=key.split("\u0000");
    errors.push(path+": debt baseline is stale for "+(ruleKey??"").split("\u0000")[0]+" (0 < "+allowed+"); run design:debt:sync");
  }
  const steps=(policy.debtCap??[]).slice().sort((a,b)=>a.until.localeCompare(b.until));
  if(steps.length) {
    const today=new Date().toISOString().slice(0,10);
    const active=steps.find(s=>s.until>=today)??steps[steps.length-1];
    const total=Object.values(current).reduce((a,c)=>a+Object.values(c).reduce((x,y)=>x+y,0),0);
    if(total>active.max)errors.push("Debt cap exceeded: "+total+" > "+active.max+" (Stufe bis "+active.until+")");
  }
  if(checkSeal) {
    const lock=JSON.parse(readFileSync(resolve(root,"design/design-lock.json"),"utf8"));
    for(const [path,expected] of Object.entries(lock.files)) {
      const file=resolve(root,path);if(!existsSync(file)||hash(readFileSync(file))!==expected)errors.push("Protected design file changed: "+path);
    }
  }
  if(base) {
    // Base is an exact commit from the PR event. Never run PR-controlled shell text.
    if(!/^[0-9a-f]{40}$/.test(base))throw new Error("Expected full base commit SHA");
    const show=path=>{try{return execFileSync("git",["show",base+":"+path],{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"]});}catch{return null;}};
    const previous=show("design/design-policy.json");
    if(previous) {
      const trusted=JSON.parse(previous);
      const changed=execFileSync("git",["diff","--name-only",base,"--"],{cwd:root,encoding:"utf8"}).trim().split("\n").filter(Boolean);
      for(const path of changed) if(trusted.protected.some(p=>p.endsWith("/")?path.startsWith(p):path===p))errors.push("Brand authority required; protected path differs from trusted base: "+path);
      const oldDebt=show("design/design-debt.json");if(oldDebt && readFileSync(resolve(root,"design/design-debt.json"),"utf8")!==oldDebt)errors.push("Debt baseline is immutable in ordinary PRs");
    }
    const added=execFileSync("git",["diff","--name-only","--diff-filter=A",base,"--","src"],{cwd:root,encoding:"utf8"}).trim().split("\n").filter(Boolean);
    for(const path of added) {
      if(path.endsWith(".css") && !policy.ownedStyleFiles.includes(path))errors.push("New page styling forbidden; compose canonical components: "+path);
      if(path.endsWith(".tsx") && !path.startsWith("src/app/api/") && !path.startsWith("src/design-system/")) {
        const source=readFileSync(resolve(root,path),"utf8");
        if(/<[A-Za-z]/.test(source) && !/from\s+["'][^"']*(?:design-system|eh-design|components\/marketing\/ui)(?:\/[^"']*)?["']/.test(source))errors.push("New UI must consume the canonical library: "+path);
      }
    }
  }
  return errors;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=resolve(process.env.EH_DESIGN_ROOT??dirname(fileURLToPath(import.meta.url))+"/..");
  const arg=process.argv.indexOf("--base");const errors=check(root,{base:arg>=0?process.argv[arg+1]:undefined});
  if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}else console.log("EH_DESIGN_CONSISTENT");
}
