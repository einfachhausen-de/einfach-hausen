// Risikomessung fuer die Schichtung: welche Custom Properties definieren wir selbst
// UND Tailwind in seinem @layer theme? Genau die wuerden ihre Prioritaet verlieren.
import {readFileSync} from "node:fs";

const ROOT = "/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen";
const compiled = readFileSync(ROOT + "/tmp-layer-out.css", "utf8");

// Tailwinds Theme-Block: alles zwischen "@layer theme {" und dem schliessenden Klammerpaar
function layerBlock(css, name) {
  const start = css.indexOf("@layer " + name + " {");
  if (start < 0) return "";
  let i = css.indexOf("{", start), depth = 0;
  for (let j = i; j < css.length; j++) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}") { depth--; if (depth === 0) return css.slice(i + 1, j); }
  }
  return "";
}

const vars = (s) => new Set([...s.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map(m => m[1]));
const twTheme = vars(layerBlock(compiled, "theme"));

const own = (path) => {
  const src = readFileSync(ROOT + "/" + path, "utf8");
  const out = new Set();
  for (const m of src.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const v of m[1].matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) out.add(v[1]);
  }
  return out;
};

for (const f of ["src/app/globals.css", "src/app/design-system.css", "src/components/marketing/tokens.css"]) {
  const mine = own(f);
  const clash = [...mine].filter(v => twTheme.has(v));
  console.log(f + ": " + mine.size + " eigene Custom Properties, davon Kollision mit Tailwind-Theme: " + clash.length);
  if (clash.length) console.log("   " + clash.join(", "));
}
console.log("Tailwind-Theme definiert insgesamt: " + twTheme.size + " Custom Properties");
