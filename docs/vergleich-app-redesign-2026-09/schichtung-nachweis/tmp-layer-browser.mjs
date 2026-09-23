// Kaskaden-Beweis im echten Browser: gewinnt Neues gegen das Alte?
// Vorher: Legacy ist ungeschichtet -> gewinnt immer.
// Nachher: Legacy liegt in @layer eh-legacy -> verliert gegen eh-blocks.
import {readFileSync, writeFileSync} from "node:fs";
import { chromium } from "playwright-core";

const ROOT = "/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen";
const compiled = readFileSync(ROOT + "/tmp-layer-out.css", "utf8");

const PROBE_LEGACY_UNLAYERED = ".eh-probe{color:rgb(1,2,3)}";
const PROBE_LEGACY_LAYERED   = "@layer eh-legacy{.eh-probe{color:rgb(1,2,3)}}";
const PROBE_NEW              = "@layer eh-blocks{.eh-probe{color:rgb(4,5,6)}}";

const page = (css) => `<!doctype html><html><head><meta charset="utf-8">
<style>${css}</style></head><body><div class="eh-probe" id="p">x</div></body></html>`;

const before = page(compiled + "\n" + PROBE_LEGACY_UNLAYERED + "\n" + PROBE_NEW);
const after  = page(compiled + "\n" + PROBE_LEGACY_LAYERED   + "\n" + PROBE_NEW);

writeFileSync(ROOT + "/tmp-layer-before.html", before);
writeFileSync(ROOT + "/tmp-layer-after.html", after);

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
for (const [name, html] of [["vorher", before], ["nachher", after]]) {
  const p = await browser.newPage();
  await p.setContent(html, { waitUntil: "load" });
  const c = await p.$eval("#p", (el) => getComputedStyle(el).color);
  console.log(name + ": " + c);
  await p.close();
}
await browser.close();
