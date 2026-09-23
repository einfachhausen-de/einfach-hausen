// Endgueltiger Beweis an der echten, jetzt geschichteten globals.css.
// Ein Baustein aus eh-blocks muss eine echte Regel aus globals.css schlagen koennen.
import {readFileSync} from "node:fs";
import postcss from "./node_modules/postcss/lib/postcss.mjs";
import tw from "@tailwindcss/postcss";
import { chromium } from "playwright-core";

const ROOT = "/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen";
const raw = readFileSync(ROOT + "/src/app/globals.css", "utf8");

const out = await postcss([tw()]).process(raw, { from: ROOT + "/src/app/globals.css" });
const css = out.css;
console.log("globals.css kompiliert ohne Fehler: " + css.length + " Bytes");
console.log("Schichtanweisung erhalten: " + css.includes("@layer eh-tokens, eh-reset, eh-base, eh-legacy"));

// Sollwert aus globals.css, Zeile 13: .brand-icon b{font-size:10px}
const override = "@layer eh-blocks{ .brand-icon b{font-size:99px} }";
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${css}
${override}
</style></head><body><div class="brand-icon"><b id="t">x</b></div></body></html>`;

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const p = await browser.newPage();
await p.setContent(html, { waitUntil: "load" });
const size = await p.$eval("#t", (el) => getComputedStyle(el).fontSize);
await browser.close();

console.log(".brand-icon b font-size nach eh-blocks-Override: " + size);
console.log(size === "99px"
  ? "BELEG: Ein neuer Baustein schlaegt globals.css. Vorher unmoeglich."
  : "FEHLGESCHLAGEN: globals.css gewinnt weiterhin — Schichtung greift nicht.");
