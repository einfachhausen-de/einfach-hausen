import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {execFileSync} from "node:child_process";
import {check,scan,hash,violations} from "./eh-design-check.mjs";
function fixture(fn) {
 const root=mkdtempSync(join(tmpdir(),"eh-design-guard-"));const put=(p,s)=>{mkdirSync(join(root,p,".."),{recursive:true});writeFileSync(join(root,p),s);};
 const git=(...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
 put("src/existing.tsx",'export const x=<p style={{color:"#123456"}}>Existing debt</p>;\n');
 put("packages/eh-design/core.ts","export const approved=true;\n");
 put("design/design-policy.json",JSON.stringify({protected:["packages/eh-design/","design/","scripts/eh-design-check.mjs",".github/workflows/eh-design.yml"],ownedStyleFiles:[]}));
 put("scripts/eh-design-check.mjs","trusted guard");put(".github/workflows/eh-design.yml","trusted workflow");
 put("design/design-debt.json",JSON.stringify(scan(root)));
 put("design/design-lock.json",JSON.stringify({files:{"packages/eh-design/core.ts":hash("export const approved=true;\n")}}));
 git("init","-q");git("add",".");git("-c","user.name=Guard Test","-c","user.email=guard@example.invalid","commit","-qm","fixture");const base=git("rev-parse","HEAD");
 try{fn({root,put,base,git});}finally{rmSync(root,{recursive:true,force:true});}
}
test("unchanged debt and semantic canonical composition pass",()=>fixture(({root,put,base,git})=>{
 put("src/page.tsx",'import {EHHeading} from "@/design-system"; export default function Page(){return <EHHeading>Content</EHHeading>;}');
 git("add","src/page.tsx");assert.deepEqual(check(root,{base}),[]);
}));
test("new literal, too-small type and foreign font fail",()=>fixture(({root,put})=>{
 put("src/new.css",'.x { color:#ff0011;font-size:11px;font-family:Manrope; }');
 const errors=check(root);assert(errors.some(e=>e.includes("literal-color")));assert(errors.some(e=>e.includes("small-type")));assert(errors.some(e=>e.includes("foreign-font")));
}));
test("moving lines cannot increase a debt allowance",()=>fixture(({root,put})=>{
 put("src/existing.tsx",'\n\nexport const x=<p style={{color:"#123456",background:"#123456"}}>More debt</p>;');
 assert(check(root).some(e=>e.includes("literal-color")));
}));
test("debt removal without rebaselining is a stale baseline",()=>fixture(({root,put})=>{
 // Baseline mit doppelter Zaehlung: eine Instanz wird aufgeraeumt, die Datei
 // bleibt aber verschuldet. Ohne Nachziehen muss die Ratsche anschlagen.
 const debt=scan(root);for(const key of Object.keys(debt["src/existing.tsx"]))debt["src/existing.tsx"][key]=2;
 put("design/design-debt.json",JSON.stringify(debt));
 put("src/existing.tsx",'export const x=<p style={{color:"#123456"}}>Less debt</p>;');
 const errors=check(root);
 assert(errors.some(e=>e.includes("debt baseline is stale for literal-color")));
 assert(errors.some(e=>e.includes("debt baseline is stale for raw-value")));
 assert(!errors.some(e=>e.includes("new ")));
}));
test("editing core and resealing still fails trusted-base comparison",()=>fixture(({root,put,base})=>{
 const s="export const approved=false;\n";put("packages/eh-design/core.ts",s);put("design/design-lock.json",JSON.stringify({files:{"packages/eh-design/core.ts":hash(s)}}));
 assert(check(root,{base}).some(e=>e.includes("Brand authority required")));
}));
test("weakening guard, workflow or baseline fails",()=>fixture(({root,put,base})=>{
 put("scripts/eh-design-check.mjs","bypass");put(".github/workflows/eh-design.yml","skip all");put("design/design-debt.json","{}");
 const errors=check(root,{base});for(const path of ["scripts/eh-design-check.mjs",".github/workflows/eh-design.yml","design/design-debt.json"])assert(errors.some(e=>e.includes(path)));
}));
test("new CSS and disconnected UI fail even without suspicious literals",()=>fixture(({root,put,base,git})=>{
 put("src/rogue.css",".rogue { display:grid; }");put("src/rogue.tsx","export const Rogue=()=> <button>Invented component</button>;");
 git("add","src");const errors=check(root,{base});assert(errors.some(e=>e.includes("New page styling forbidden")));assert(errors.some(e=>e.includes("New UI must consume")));
}));
const raw=(path,source)=>violations(path,source).filter(v=>v.rule==="raw-value").map(v=>v.token);
test("raw-value catches raw values that no blacklist rule sees",()=>{
 assert.deepEqual(raw("src/raw.css","a{font-size:13px;font-weight:650;color:oklch(0.5 0 0);box-shadow:0 1px 2px #000;border-radius:999px}"),
  ["font-size:13px","font-weight:650","color:oklch(0.5 0 0)","box-shadow:0 1px 2px #000","border-radius:999px"]);
 assert.deepEqual(raw("src/raw.tsx",'export const x=<p style={{fontSize:13}}>Small</p>;'),["fontSize:13"]);
});
test("raw-value allows indirection, resets and custom property definitions",()=>{
 assert.deepEqual(raw("src/ok.css",":root{--eh-color-primary:#fff} a{font-size:var(--eh-font-body);color:var(--green)} b{color:currentColor;background:transparent;box-shadow:none;border-radius:0;font-weight:bold}"),[]);
 assert.deepEqual(violations("src/ok.tsx",'export const x=<nav className="nav" aria-current="page">Content</nav>;'),[]);
});
test("no-important is counted in CSS only",()=>fixture(({root,put})=>{
 put("src/imp.css",".x{color:var(--eh-color-ink) !important}");
 assert(check(root).some(e=>e.includes("new no-important")));
 assert.deepEqual(violations("src/imp.tsx",'export const x=<p style={{color:"var(--eh-c)"}}>!important</p>;').filter(v=>v.rule==="no-important"),[]);
}));
test("state-class rejects state words in class attributes",()=>fixture(({root,put})=>{
 put("src/state.tsx",'export const N=()=> <nav className="nav active" aria-current="page">Nav</nav>;');
 assert(check(root).some(e=>e.includes("new state-class")));
}));
test("state-class trusts aria-current and plain class names",()=>fixture(({root,put})=>{
 put("src/state.tsx",'export const N=()=> <nav className="nav" aria-current="page">Nav</nav>;');
 assert.deepEqual(check(root),[]);
}));
const capPolicy=(put,steps)=>put("design/design-policy.json",JSON.stringify({protected:["design/"],ownedStyleFiles:[],debtCap:steps}));
test("missing debtCap disables the ceiling",()=>fixture(({root,put})=>{
 capPolicy(put,undefined);assert.deepEqual(check(root),[]);
}));
test("debt cap passes below the ceiling and fails above it",()=>fixture(({root,put})=>{
 capPolicy(put,[{until:"2099-12-31",max:99}]);assert.deepEqual(check(root),[]);
 capPolicy(put,[{until:"2099-12-31",max:2}]);assert(check(root).some(e=>e.includes("Debt cap exceeded")));
}));
test("debt cap uses the first step covering today and the last once all are past",()=>fixture(({root,put})=>{
 capPolicy(put,[{until:"2099-12-31",max:99},{until:"2100-12-31",max:1}]);assert.deepEqual(check(root),[]);
 capPolicy(put,[{until:"2020-01-01",max:99},{until:"2021-01-01",max:1}]);assert(check(root).some(e=>e.includes("Debt cap exceeded")));
}));
