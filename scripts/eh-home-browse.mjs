import {chromium} from "playwright-core";
import {readFileSync,writeFileSync} from "node:fs";
const b=await chromium.launch({executablePath:process.env.EH_CHROMIUM_PATH,headless:true,args:["--no-sandbox"]});
const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
const errs=[];p.on("pageerror",e=>errs.push(e.message));
await p.goto("http://127.0.0.1:4203/",{waitUntil:"networkidle",timeout:90000});
const txt=await p.evaluate(()=>{const m=document.querySelector("#main-content");return (m?m.textContent:document.body.textContent);});
const need=["Kennst du das","Der Unterschied","Drei Schritte","Was du bekommst","Warum du uns vertrauen kannst","Wofür du uns fragen kannst","Pilotphase","Häufige Fragen","Dein nächster Schritt"];
const miss=need.filter(s=>!txt.includes(s));
if(miss.length)throw Error("missing: "+miss.join("|"));
console.log("content 9/9");
for(const w of [390,736,1440]){
 await p.setViewportSize({width:w,height:1000});
 await p.screenshot({path:"docs/brand/evidence/05-web/home-"+w+".png",fullPage:true});
 const m=await p.evaluate(()=>{const root=document.querySelector("#main-content")||document.body;const nodes=[...root.querySelectorAll("*")].filter(el=>el.getBoundingClientRect().width);return {overflow:document.documentElement.scrollWidth>innerWidth+1,small:nodes.filter(el=>parseFloat(getComputedStyle(el).fontSize)<12).map(el=>el.textContent.slice(0,50))};});
 await p.addScriptTag({content:readFileSync("node_modules/axe-core/axe.min.js","utf8")});
 const axe=await p.evaluate(async()=>{const root=document.querySelector("#main-content")||document.body;const r=await window.axe.run(root,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return r.violations.map(v=>v.id);});
 console.log(w,JSON.stringify({overflow:m.overflow,small:m.small.slice(0,6),axe}));
}
writeFileSync("docs/brand/evidence/05-web/home-check.json",JSON.stringify({errors:errs},null,2));
if(errs.length)throw Error(errs.join("|").slice(0,300));
console.log("HOME_OK");
await b.close();
