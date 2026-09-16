import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { check, sync, measure, counterErrors } from "./eh-design-deadcss.mjs";

// postcss liegt im Repo, nicht in der Fixture: der Waechter laedt es ueber den
// absoluten Pfad, im Test wird es direkt hereingereicht.
const postcss = (
  await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "postcss", "lib", "postcss.mjs")).href)
).default;

async function fixture(fn, sites = []) {
  const root = mkdtempSync(join(tmpdir(), "eh-deadcss-"));
  const put = (p, s) => {
    mkdirSync(join(root, p, ".."), { recursive: true });
    writeFileSync(join(root, p), s);
  };
  put("design/design-dynamic-classes.json", JSON.stringify({ version: 1, sites }));
  try {
    await fn({ root, put });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// Modulklassen sind hart geprueft (Zukunftssicherung §3A): der Build erzeugt
// den Hash selbst, also ist "greift diese Klasse je?" entscheidbar - ohne
// Altbestand und ohne --sync.
test("a dead module class fails, deleting it makes the gate green", () => fixture(async ({ root, put }) => {
  put("src/a.module.css", ".used{color:red}\n.dead{color:blue}\n");
  put("src/a.tsx", 'import styles from "./a.module.css";\nexport const A=()=><div className={styles.used}/>;\n');
  await sync(root, { postcss });
  const errors = await check(root, { postcss });
  assert.ok(errors.some((e) => e.includes('Klasse "dead" ist tot')), JSON.stringify(errors));
  assert.ok(!errors.some((e) => e.includes('"used"')), JSON.stringify(errors));
  put("src/a.module.css", ".used{color:red}\n");
  assert.deepEqual(await check(root, { postcss }), []);
}));

// :global(.x) bleibt ungehascht - das ist ein globaler Selektor und keine
// Modulklasse. Solche Regeln darf der Waechter nicht als tot melden.
test("a class inside :global() is not judged", () => fixture(async ({ root, put }) => {
  put("src/g.module.css", ".scope{color:red}\n.scope :global(.legacy-nav){color:blue}\n");
  put("src/g.tsx", 'import styles from "./g.module.css";\nexport const G=()=><div className={styles.scope}/>;\n');
  await sync(root, { postcss });
  assert.deepEqual(await check(root, { postcss }), []);
}));

test("a module whose classes are all referenced passes", () => fixture(async ({ root, put }) => {
  put("src/b.module.css", ".used{color:red}\n");
  put("src/b.tsx", 'import s from "./b.module.css";\nexport const B=()=><div className={s.used}/>;\n');
  await sync(root, { postcss });
  assert.deepEqual(await check(root, { postcss }), []);
}));

test("a destructured module import counts as usage", () => fixture(async ({ root, put }) => {
  put("src/c.module.css", ".root{color:red}\n.kid{color:blue}\n");
  put("src/c.tsx", 'import styles from "./c.module.css";\nconst {root, kid}=styles;\nexport const C=()=><div className={root+kid}/>;\n');
  await sync(root, { postcss });
  assert.deepEqual(await check(root, { postcss }), []);
}));

// composes bringt die Basis mit auf das Element: .btn ist benutzt, wenn
// .btnPrimary benutzt ist.
test("composes propagates usage to the composed base class", () => fixture(async ({ root, put }) => {
  put("src/e.module.css", ".btn{color:red}\n.btnPrimary{composes: btn; background:blue}\n");
  put("src/e.tsx", 'import styles from "./e.module.css";\nexport const E=()=><a className={styles.btnPrimary}/>;\n');
  await sync(root, { postcss });
  assert.deepEqual(await check(root, { postcss }), []);
}));

test("a new dead class in a global file fails", () => fixture(async ({ root, put }) => {
  put("src/app/globals.css", ".keep{color:red}\n");
  put("src/keep.tsx", 'export const K=()=><div className="keep"/>;\n');
  await sync(root, { postcss });
  assert.deepEqual(await check(root, { postcss }), []);
  put("src/app/globals.css", ".keep{color:red}\n.gone{color:blue}\n");
  const errors = await check(root, { postcss });
  assert.ok(errors.some((e) => e.includes("src/app/globals.css") && e.includes('neue tote Klasse "gone"')), JSON.stringify(errors));
}));

// Die Liste darf nur schrumpfen: wer Altbestand loescht, ist sofort gruen.
test("deleting a frozen dead class passes without rebaselining", () => fixture(async ({ root, put }) => {
  put("src/app/globals.css", ".keep{color:red}\n.gone{color:blue}\n");
  put("src/keep.tsx", 'export const K=()=><div className="keep"/>;\n');
  await sync(root, { postcss });
  put("src/app/globals.css", ".keep{color:red}\n");
  assert.deepEqual(await check(root, { postcss }), []);
}));

test("--sync lowers a counter, and raising it again fails", () => fixture(async ({ root, put }) => {
  put("src/x.css", ".a{color:red !important}\n.b{color:blue !important}\n");
  await sync(root, { postcss });
  assert.deepEqual(await check(root, { postcss }), []);
  put("src/x.css", ".a{color:red !important}\n");
  // Aufgeraeumt, aber nicht nachgezogen: die Ratsche verlangt --sync.
  const stale = await check(root, { postcss });
  assert.ok(stale.some((e) => e.includes("importantDeclarations") && e.includes("Budget ist veraltet")), JSON.stringify(stale));
  await sync(root, { postcss });
  assert.deepEqual(await check(root, { postcss }), []);
  put("src/x.css", ".a{color:red !important}\n.b{color:blue !important}\n");
  const rose = await check(root, { postcss });
  assert.ok(rose.some((e) => e.includes("importantDeclarations") && e.includes("darf nur sinken")), JSON.stringify(rose));
}));

test("state classes in markup are counted and ratcheted", () => fixture(async ({ root, put }) => {
  put("src/state.tsx", 'export const N=()=><nav className="nav active" aria-current="page">Nav</nav>;\n');
  await sync(root, { postcss });
  assert.equal((await measure(root, { postcss })).counters.stateClasses, 1);
  put("src/state.tsx", 'export const N=()=><nav className="nav" aria-current="page">Nav</nav>;\n');
  const errors = await check(root, { postcss });
  assert.ok(errors.some((e) => e.includes("stateClasses") && e.includes("Budget ist veraltet")), JSON.stringify(errors));
}));

// Dynamische Stelle: der Klassenname steht nicht als Wort im Quelltext.
test("a registered dynamic site exempts its value set", () => fixture(async ({ root, put }) => {
  put("src/dyn.module.css", ".sm{width:1px}\n.md{width:2px}\n.lg{width:3px}\n");
  put("src/dyn.tsx", 'import styles from "./dyn.module.css";\nexport const D=({size})=> <div className={styles[size]}/>;\n');
  await sync(root, { postcss });
  // sm und md sind eingetragen und damit frei; lg ist tot und beisst hart.
  const errors = await check(root, { postcss });
  assert.ok(errors.some((e) => e.includes('Klasse "lg" ist tot')), JSON.stringify(errors));
  assert.ok(!errors.some((e) => e.includes('"sm"') || e.includes('"md"')), JSON.stringify(errors));
  put("src/dyn.module.css", ".sm{width:1px}\n.md{width:2px}\n.xl{width:4px}\n");
  const more = await check(root, { postcss });
  assert.ok(more.some((e) => e.includes('Klasse "xl" ist tot')), JSON.stringify(more));
  assert.ok(!more.some((e) => e.includes('"sm"') || e.includes('"md"')), JSON.stringify(more));
}, [{ file: "src/dyn.tsx", line: 2, expression: "styles[size]", applies: "module", module: "src/dyn.module.css", values: ["sm", "md"] }]));

// Verschwindet die Stelle aus dem Quelltext, ist die geschuetzte Liste veraltet.
test("a dynamic site that no longer matches fails", () => fixture(async ({ root, put }) => {
  put("src/dyn.module.css", ".sm{width:1px}\n");
  put("src/dyn.tsx", 'import styles from "./dyn.module.css";\nexport const D=()=> <div className={styles.sm}/>;\n');
  const errors = await check(root, { postcss });
  assert.ok(errors.some((e) => e.includes("src/dyn.tsx:2") && e.includes("veraltet")), JSON.stringify(errors));
}, [{ file: "src/dyn.tsx", line: 2, expression: "styles[size]", applies: "module", module: "src/dyn.module.css", values: ["sm"] }]));

test("counterErrors demands a budget and rejects any increase", () => {
  assert.deepEqual(counterErrors({ a: 2 }, null), ["design/design-budgets.json: a fehlt - einmalig --sync ausfuehren"]);
  assert.deepEqual(counterErrors({ a: 2 }, { counters: { a: 2 } }), []);
  assert.ok(counterErrors({ a: 3 }, { counters: { a: 2 } })[0].includes("darf nur sinken"));
  assert.ok(counterErrors({ a: 1 }, { counters: { a: 2 } })[0].includes("--sync ausfuehren"));
});
