// Schreibt design-debt.json neu aus dem Ist-Zustand.
//
// Das ist der EINZIGE Weg, die Baseline zu aendern (Zukunftssicherung 2.2).
// Weil die Datei ein geschuetzter Pfad ist, laeuft das nur mit Markenautoritaet
// auf main — ein gewoehnlicher PR scheitert an "Debt baseline is immutable".
//
// Wirkung: jede Bereinigung wird dauerhaft festgeschrieben. Wer fuenf Verstoesse
// aufraeumt, verliert den Spielraum und kann ihn nicht spaeter mit neuem
// Schaden fuellen.
import {writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {scan} from "./eh-design-check.mjs";

const root = resolve(process.env.EH_DESIGN_ROOT ?? dirname(fileURLToPath(import.meta.url)) + "/..");
const next = scan(root);
const sum = Object.values(next).reduce((a, c) => a + Object.values(c).reduce((x, y) => x + y, 0), 0);
writeFileSync(resolve(root, "design/design-debt.json"), JSON.stringify(next, null, 2) + "\n");
console.log("design-debt.json neu geschrieben: " + sum + " Schuldenpunkte in " + Object.keys(next).length + " Dateien");
