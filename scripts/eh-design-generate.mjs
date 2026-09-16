import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, "packages/eh-design/src");
const raw = readFileSync(resolve(dir, "tokens.json"), "utf8");
const data = JSON.parse(raw);

// --- Wortschatz-Obergrenze (Zukunftssicherung 1.4) -----------------------
// Der Generaator pruefte bisher nur, ob die Generaate zu tokens.json passen.
// Damit entsteht ein elfter Wert als Token und niemand diskutiert ihn. Zwei
// Grenzen: hoechstens MAX_FONT_SIZES Schriftgroessen, und keine neue Gruppe.
// "family" ist keine Groesse und zaehlt nicht mit.
export const MAX_FONT_SIZES = 8;
export const TOKEN_GROUPS = ["color","font","weight","leading","track","space","radius","shape","shadow","motion","slide"];
export function vocabularyErrors(data) {
  const errors = [];
  const sizes = Object.keys(data.font ?? {}).filter(key => key !== "family");
  if (sizes.length > MAX_FONT_SIZES)
    errors.push("tokens.font: " + sizes.length + " Schriftgroessen > " + MAX_FONT_SIZES + " erlaubt (" + sizes.join(", ") + ")");
  for (const group of Object.keys(data).filter(key => typeof data[key] === "object"))
    if (!TOKEN_GROUPS.includes(group))
      errors.push("neue Token-Gruppe \"" + group + "\" nicht freigegeben (erlaubt: " + TOKEN_GROUPS.join(", ") + ")");
  return errors;
}
const vocabulary = vocabularyErrors(data);
if (vocabulary.length) throw new Error("Token-Wortschatz verletzt: " + vocabulary.join("; "));

const css = "/* Generated from tokens.json. Run node scripts/eh-design-generate.mjs. */\n:root {\n" +
 Object.entries(data).filter(([,v]) => typeof v === "object").flatMap(([group, values]) =>
 Object.entries(values).filter(([,value])=>typeof value==="string").map(([key,value]) =>
 "  --eh-" + group + "-" + key.replace(/[A-Z]/g,m=>"-"+m.toLowerCase()) + ": " + value + ";")).join("\n") + "\n}\n";
const moduleCss = readFileSync(resolve(dir, "styles.module.css"), "utf8");
const htmlCss = moduleCss.replace(/\.([A-Za-z_][A-Za-z0-9_-]*)/g, ".eh-$1");
const font = readFileSync(resolve(root,"packages/eh-design/assets/inter-variable.woff2")).toString("base64");
const logo = readFileSync(resolve(root,"packages/eh-design/assets/logo-full.png")).toString("base64");
const htmlStyle = "// Generated canonical HTML adapter assets. Do not edit.\nexport const EHHtmlStyles=" + JSON.stringify('@font-face{font-family:Inter;src:url("data:font/woff2;base64,'+font+'") format("woff2");font-weight:100 900}html,body{margin:0}'+css+htmlCss) + ";\nexport const EHLogoData="+JSON.stringify("data:image/png;base64,"+logo)+";\n";
const ts = "// Generated from tokens.json. Do not edit.\nexport const EHTokens = " + JSON.stringify(data,null,2) + " as const;\n";
for (const [name, expected] of [["tokens.css",css],["tokens.ts",ts],["html.css",htmlCss],["html-style.mjs",htmlStyle]]) {
 const file=resolve(dir,name);
 if(process.argv.includes("--check")) {
  if(readFileSync(file,"utf8")!==expected) throw new Error("Token drift: "+name);
 } else writeFileSync(file,expected);
}
console.log("EH_TOKENS_VALID");
