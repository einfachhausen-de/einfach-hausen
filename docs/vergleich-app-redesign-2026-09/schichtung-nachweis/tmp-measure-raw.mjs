// Wie viele Verstoesse wuerde die Whitelist-Regel ausloesen? Zwei Varianten:
// (a) streng: nur var(--eh-...) erlaubt, wie in ZUKUNFTSSICHERUNG 1.2 geschrieben
// (b) weit: jedes var(--...) erlaubt
import {readFileSync, existsSync, readdirSync} from "node:fs";
import {resolve} from "node:path";

const ROOT = "/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen";
const PROPS = "font-size|font-weight|color|background|background-color|border-color|border-top-color|border-right-color|border-bottom-color|border-left-color|border-radius|box-shadow|letter-spacing|line-height";
const DECL = new RegExp("\\b(?:" + PROPS + ")\\s*:\\s*([^;}'\"`]+)", "g");
const JSX = /\b(?:fontSize|fontWeight|color|backgroundColor|borderRadius|boxShadow|letterSpacing|lineHeight)\s*:\s*['"`]?([^,'"`}\s]+)/g;
const OK = new Set(["inherit","initial","unset","revert","currentColor","transparent","none","0","auto","100%","normal","bold","bolder","lighter","0px","0%","1","50%"]);

function walk(dir, path = "src") {
  const d = resolve(ROOT, path); if (!existsSync(d)) return [];
  return readdirSync(d, {withFileTypes: true}).flatMap(e =>
    e.isDirectory() ? walk(ROOT, path + "/" + e.name)
    : /\.(?:css|tsx?|jsx?)$/.test(e.name) ? [path + "/" + e.name] : []);
}
const files = walk(ROOT);

function count(source, allowAllVars) {
  let n = 0; const samples = [];
  for (const re of [DECL, JSX]) {
    re.lastIndex = 0;
    for (const m of source.matchAll(re)) {
      const parts = m[1].trim().split(/\s+(?![^(]*\))/).filter(Boolean);
      const bad = parts.filter(p => {
        if (p.startsWith("var(")) return !(allowAllVars || p.startsWith("var(--eh-"));
        return !OK.has(p);
      });
      if (bad.length) { n++; if (samples.length < 4) samples.push(m[0].trim().slice(0, 70)); }
    }
  }
  return {n, samples};
}

for (const mode of [false, true]) {
  let total = 0; const per = {};
  for (const f of files) {
    const {n} = count(readFileSync(resolve(ROOT, f), "utf8"), mode);
    if (n) { total += n; per[f] = n; }
  }
  const top = Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log("\n=== Variante " + (mode ? "(b) jedes var() erlaubt" : "(a) nur var(--eh-...)") + " ===");
  console.log("Verstoesse gesamt: " + total + " in " + Object.keys(per).length + " Dateien");
  for (const [f, n] of top) console.log("   " + n.toString().padStart(6) + "  " + f);
}
