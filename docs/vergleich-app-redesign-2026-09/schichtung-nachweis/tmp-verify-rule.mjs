// Fangprobe: die sieben Faelle aus ZUKUNFTSSICHERUNG 1.2 muessen rot werden,
// erlaubter Code muss gruen bleiben.
import {violations} from "./scripts/eh-design-check.mjs";

const must_fail = [
  ["font-size:13px",        ".a{font-size:13px}",            "a.css"],
  ["font-weight:650",       ".a{font-weight:650}",           "a.css"],
  ["color:oklch(...)",      ".a{color:oklch(0.5 0 0)}",      "a.css"],
  ["box-shadow:#000",       ".a{box-shadow:0 1px 2px #000}", "a.css"],
  ["border-radius:999px",   ".a{border-radius:999px}",       "a.css"],
  ["style={{fontSize:13}}", "const A=()=><i style={{fontSize:13}}/>", "a.tsx"],
  ["line-height:1.4",       ".a{line-height:1.4}",           "a.css"],
];
const must_pass = [
  ["token",            ".a{font-size:var(--eh-font-body)}",        "a.css"],
  ["legacy var",       ".a{color:var(--green)}",                   "a.css"],
  ["currentColor",     ".a{color:currentColor}",                   "a.css"],
  ["transparent",      ".a{background:transparent}",               "a.css"],
  ["none/0",           ".a{box-shadow:none;border-radius:0}",      "a.css"],
  ["custom property",  ":root{--eh-color-primary:#fff}",           "a.css"],
  ["font-weight name", ".a{font-weight:bold}",                     "a.css"],
  ["aria-current",     "const A=()=><a aria-current=\"page\"/>",   "a.tsx"],
  ["className ohne Zustand", "const A=()=><a className=\"nav\"/>", "a.tsx"],
];

let ok = true;
for (const [name, src, file] of must_fail) {
  const hit = violations(file, src).some(v => v.rule === "raw-value" || v.rule === "no-important" || v.rule === "state-class");
  if (!hit) ok = false;
  console.log((hit ? "  rot  " : "FEHLT ") + name);
}
for (const [name, src, file] of must_pass) {
  const v = violations(file, src).filter(x => ["raw-value","state-class","no-important"].includes(x.rule));
  if (v.length) ok = false;
  console.log((v.length ? "FEHLALARM " : "  gruen ") + name + (v.length ? " -> " + v.map(x=>x.rule+":"+x.token).join(",") : ""));
}
console.log(ok ? "\nALLE PROBEN BESTANDEN" : "\nPROBE FEHLGESCHLAGEN");
