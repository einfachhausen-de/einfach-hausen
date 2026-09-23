// Wendet die Schichtung an. Vier globale CSS-Dateien, je in ihre Schicht.
// Kein Siegel, kein Commit — nur die Dateien.
import {readFileSync, writeFileSync} from "node:fs";

const ROOT = "/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen";
const DECL = "@layer eh-tokens, eh-reset, eh-base, eh-legacy, theme, base, components, utilities, eh-blocks, eh-pages;\n";

const read = (p) => readFileSync(ROOT + "/" + p, "utf8");
const write = (p, s) => { writeFileSync(ROOT + "/" + p, s); console.log("geschrieben: " + p); };

// --- 1. globals.css: Anweisung vor die @imports, Rest in eh-legacy ---
{
  const p = "src/app/globals.css";
  let src = read(p);
  if (src.startsWith(DECL)) { console.log(p + ": schon geschichtet, uebersprungen"); }
  else {
    // Ende des @theme-blocks finden: die Zeile, die auf "@theme inline {" folgt und "}" ist
    const marker = "@theme inline {";
    const at = src.indexOf(marker);
    if (at < 0) throw new Error("@theme-Block nicht gefunden");
    const close = src.indexOf("\n}", at);
    if (close < 0) throw new Error("@theme-Block nicht geschlossen");
    const head = src.slice(0, close + 2);   // inklusive "}"
    const rest = src.slice(close + 2);
    write(p, DECL + head + "\n\n@layer eh-legacy {\n" + rest.replace(/\s*$/, "\n") + "}\n");
  }
}

// --- 2. design-system.css: komplett in eh-legacy ---
{
  const p = "src/app/design-system.css";
  let src = read(p);
  if (src.includes("@layer eh-legacy")) { console.log(p + ": schon geschichtet, uebersprungen"); }
  else {
    if (src.includes("@import")) throw new Error(p + " enthaelt @import — darf nicht in eine Schicht");
    write(p, "@layer eh-legacy {\n" + src.replace(/\s*$/, "\n") + "}\n");
  }
}

// --- 3. marketing/tokens.css: in eh-tokens ---
{
  const p = "src/components/marketing/tokens.css";
  let src = read(p);
  if (src.includes("@layer eh-tokens")) { console.log(p + ": schon geschichtet, uebersprungen"); }
  else {
    if (src.includes("@import")) throw new Error(p + " enthaelt @import — darf nicht in eine Schicht");
    write(p, "@layer eh-tokens {\n" + src.replace(/\s*$/, "\n") + "}\n");
  }
}

// --- 4. auth-shell.css: in eh-legacy ---
{
  const p = "src/components/auth-v2/auth-shell.css";
  let src = read(p);
  if (src.includes("@layer eh-legacy")) { console.log(p + ": schon geschichtet, uebersprungen"); }
  else {
    if (src.includes("@import")) throw new Error(p + " enthaelt @import — darf nicht in eine Schicht");
    write(p, "@layer eh-legacy {\n" + src.replace(/\s*$/, "\n") + "}\n");
  }
}
