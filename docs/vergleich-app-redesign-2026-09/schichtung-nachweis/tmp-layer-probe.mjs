// Sondierung: ueberlebt eine @layer-Anweisung vor @import die Tailwind-Pipeline?
// Liest nur. Schreibt nur nach tmp-layer-out.css.
import {readFileSync, writeFileSync} from "node:fs";
import postcss from "./node_modules/postcss/lib/postcss.mjs";
import tw from "@tailwindcss/postcss";

const ROOT = "/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen";
const src = readFileSync(ROOT + "/src/app/globals.css", "utf8");

const DECL = "@layer eh-tokens, eh-reset, eh-base, eh-legacy, theme, base, components, utilities, eh-blocks, eh-pages;\n";
const withDecl = DECL + src;

const out = await postcss([tw()]).process(withDecl, { from: ROOT + "/src/app/globals.css" });
const css = out.css;

writeFileSync(ROOT + "/tmp-layer-out.css", css);

// Wo steht unsere Anweisung im Ergebnis?
const idxDecl = css.indexOf("@layer eh-tokens");
const idxTw = css.indexOf("@layer theme, base, components, utilities");
console.log("bytes:", css.length);
console.log("unsere @layer-Zeile bei Index:", idxDecl);
console.log("Tailwind-@layer-Zeile bei Index:", idxTw);
console.log("Reihenfolge OK (unsere zuerst):", idxDecl >= 0 && idxDecl < idxTw);
console.log("--- erste 400 Zeichen ---");
console.log(css.slice(0, 400));
