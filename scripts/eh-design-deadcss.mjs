#!/usr/bin/env node
/**
 * Waechter gegen totes CSS und gegen die drei Zaehler (Zukunftssicherung 1.3).
 *
 *   node scripts/eh-design-deadcss.mjs            # Pruefen; Exit 1 bei Befund
 *   node scripts/eh-design-deadcss.mjs --report   # Die vier Zahlen ausgeben
 *   node scripts/eh-design-deadcss.mjs --sync     # Die drei eingefrorenen
 *                                                 # Dateien neu schreiben
 *
 * Eigenes Skript statt einer Erweiterung von eh-design-check.mjs: dort sind die
 * Regeln absichtlich zeichenweise Regexe ohne CSS-Parser, damit die Datei als
 * vertrauenswuerdige Kopie aus der Basis geladen werden kann. Hier wird
 * dagegen geparst - eine Phantomklasse aus einem deutschen Kommentar (die
 * Rohtext-Suche hatte schon einmal eine erzeugt) ist damit ausgeschlossen.
 *
 * Vier Pruefungen:
 *   1. Keine neue tote Klasse in CSS Modules. Der Hash entsteht zur Buildzeit,
 *      deshalb ist die Frage "greift diese Klasse je?" statisch entscheidbar:
 *      sie greift genau dann, wenn der Quelltext sie ueber den Importnamen
 *      anspricht. Der Altbestand (757 Namen) steht eingefroren unter
 *      "modules" in design-deadcss.json und darf nur schrumpfen; eine neue
 *      tote Klasse ist ein harter Fehler. Nicht hart ab null, weil ZUKUNFTS-
 *      SICHERUNG.md §3 das Loeschen alter Klassen ausdruecklich hinter den
 *      Seitenumbau legt - bis dahin waere ein rotes Gate nur doppelte Arbeit.
 *   2. Die sechs bekannten dynamischen Stellen (design-dynamic-classes.json).
 *      Dort steht der Klassenname nicht als Wort im Quelltext. Eine siebte
 *      Stelle anzulegen heisst, diese geschuetzte Datei zu aendern.
 *   3. Keine neue tote Klasse in den vier globalen Dateien. Der Altbestand in
 *      design-deadcss.json darf nur schrumpfen.
 *   4. !important, doppelte Top-Level-Selektoren und Zustandsklassen als
 *      Ratsche: jeder Zaehler darf nur sinken (design-budgets.json).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { violations } from "./eh-design-check.mjs";

// Nur diese vier tragen globale Selektoren. Duplikate und schichtfreie Regeln
// werden ausschliesslich hier gezaehlt (wie in eh-design-report.mjs).
export const GLOBAL_CSS = [
  "src/app/globals.css",
  "src/app/design-system.css",
  "src/components/marketing/tokens.css",
  "src/components/auth-v2/auth-shell.css",
];

export const CORPUS_DIRS = ["src", "packages"];
export const CORPUS_EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
const MARKUP_EXT = [".tsx", ".jsx"];

export const DEADCSS_FILE = "design/design-deadcss.json";
export const DYNAMIC_FILE = "design/design-dynamic-classes.json";
export const BUDGETS_FILE = "design/design-budgets.json";

const CLASS_RE = /\.(-?[_a-zA-Z][\w-]*)/g;
// Ohne /g: match() mit /g liefert nur die Treffer, keine Gruppe.
const FIRST_CLASS_RE = /\.(-?[_a-zA-Z][\w-]*)/;
const IMPORT_RE = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]*\.module\.css)['"]/g;

const today = () => new Date().toISOString().slice(0, 10);
const esc = (name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const abs = (root, rel) => join(root, rel);

function readJson(root, rel) {
  const file = abs(root, rel);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function walk(root, dir, exts) {
  const out = [];
  const here = abs(root, dir);
  if (!existsSync(here)) return out;
  for (const entry of readdirSync(here, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(root, rel, exts));
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(rel);
  }
  return out;
}

// postcss liegt als ESM unter node_modules/postcss/lib/postcss.mjs. Ueber den
// Paketnamen zu importieren wuerde die Aufloesung dem Aufrufer ueberlassen.
export async function loadPostcss(root) {
  const file = abs(root, "node_modules/postcss/lib/postcss.mjs");
  if (!existsSync(file)) return null;
  const mod = await import(pathToFileURL(file).href);
  return mod.default ?? null;
}

function parseCache() {
  const cache = new Map();
  return (root, postcss, rel, parseErrors) => {
    if (!postcss) return null;
    if (cache.has(rel)) return cache.get(rel);
    let cssRoot = null;
    try {
      cssRoot = postcss.parse(readFileSync(abs(root, rel), "utf8"), { from: rel });
    } catch (error) {
      parseErrors.push(`${rel}: nicht parsebar (${error.message})`);
    }
    cache.set(rel, cssRoot);
    return cssRoot;
  };
}

// Klassennamen aus den Selektoren, mit Zeile und Regelmenge. Gezaehlt wird je
// Regel, nicht je Vorkommen im Text: `.a .a` in einer Regel ist eine Regel.
function collectClasses(cssRoot) {
  const map = new Map();
  cssRoot.walkRules((rule) => {
    const line = rule.source?.start?.line ?? 0;
    for (const match of rule.selector.matchAll(CLASS_RE)) {
      const name = match[1];
      let entry = map.get(name);
      if (!entry) {
        entry = { line, rules: new Set() };
        map.set(name, entry);
      }
      entry.rules.add(rule);
    }
  });
  return map;
}

// `composes: basis` bzw. `composes: basis from './other.module.css'` - wer
// eine Klasse composet, bringt sie zur Laufzeit mit auf das Element.
function collectComposes(cssRoot, file) {
  const map = new Map();
  cssRoot.walkRules((rule) => {
    const owner = rule.selector.match(FIRST_CLASS_RE)?.[1];
    if (!owner) return;
    rule.walkDecls((decl) => {
      if (decl.prop !== "composes") return;
      const from = decl.value.match(/from\s+['"]([^'"]+)['"]/);
      const target = from ? resolveSpec(from[1], file) : file;
      const list = map.get(owner) ?? [];
      for (const name of decl.value.replace(/from\s+['"][^'"]+['"]/, "").split(/\s+/).filter(Boolean)) {
        list.push([target, name]);
      }
      map.set(owner, list);
    });
  });
  return map;
}

export function resolveSpec(spec, fromFile) {
  if (spec.startsWith(".")) return posix.normalize(posix.join(posix.dirname(fromFile), spec));
  if (spec.startsWith("@/")) return `src/${spec.slice(2)}`;
  return null;
}

// Ein Modul ist genau dann erreichbar, wenn eine Datei es unter irgendeinem
// Namen importiert. styles und s sind die haeufigsten, premium und auth
// kommen vor - deshalb wird der Name aus dem Import gelesen und nicht geraten.
function collectImporters(corpusTexts) {
  const byModule = new Map();
  for (const [file, text] of corpusTexts) {
    for (const match of text.matchAll(IMPORT_RE)) {
      const target = resolveSpec(match[2], file);
      if (!target) continue;
      const list = byModule.get(target) ?? [];
      list.push({ file, alias: match[1] });
      byModule.set(target, list);
    }
  }
  return byModule;
}

function usedInImporters(classes, importers) {
  const used = new Set();
  for (const { alias, text } of importers) {
    if (!text) continue;
    for (const name of classes.keys()) {
      if (used.has(name)) continue;
      const escaped = esc(name);
      const member = new RegExp(`\\b${alias}\\s*\\.\\s*${escaped}\\b`);
      const bracket = new RegExp(`\\b${alias}\\s*\\[\\s*['"\`]${escaped}['"\`]\\s*\\]`);
      if (member.test(text) || bracket.test(text)) used.add(name);
    }
    // Destrukturiert: const { root, kopf: head } = styles;
    for (const match of text.matchAll(new RegExp(`(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${alias}\\b`, "gs"))) {
      for (const part of match[1].split(",")) {
        // { kopf } und { kopf: lokal } - der Schluessel ist der Klassenname.
        const name = part.trim().split(/[:=]/)[0].trim();
        if (classes.has(name)) used.add(name);
      }
    }
  }
  return used;
}

/**
 * Die sechs Stellen, an denen ein Klassenname nicht als Wort im Quelltext
 * steht. Die Liste ist geschuetzt: eine siebte Stelle bedeutet, sie hier
 * einzutragen - und das ist eine Aenderung an einem geschuetzten Pfad.
 */
export function dynamicSites(root) {
  const data = readJson(root, DYNAMIC_FILE);
  return { data, sites: Array.isArray(data?.sites) ? data.sites : [] };
}

function checkDynamicSites(root, sites) {
  const errors = [];
  const allowed = { module: new Map(), global: new Set() };
  for (const site of sites) {
    const file = site?.file;
    if (typeof file !== "string" || !existsSync(abs(root, file))) {
      errors.push(`${DYNAMIC_FILE}: ${file ?? "<ohne Datei>"} existiert nicht`);
      continue;
    }
    const lines = readFileSync(abs(root, file), "utf8").split("\n");
    const line = Number(site.line);
    const text = lines[line - 1];
    if (!Number.isInteger(line) || line < 1 || text === undefined) {
      errors.push(`${file}:${site.line}: Zeile existiert nicht - ${DYNAMIC_FILE} ist veraltet`);
      continue;
    }
    if (typeof site.expression !== "string" || !text.includes(site.expression)) {
      errors.push(`${file}:${line}: enthaelt nicht mehr "${site.expression ?? ""}" - ${DYNAMIC_FILE} ist veraltet`);
      continue;
    }
    const values = Array.isArray(site.values) ? site.values : [];
    if (site.applies === "module") {
      const target = site.module ?? null;
      const set = allowed.module.get(target) ?? new Set();
      for (const value of values) set.add(value);
      allowed.module.set(target, set);
    } else {
      for (const value of values) allowed.global.add(value);
    }
  }
  return { errors, allowed };
}

function isExempt(allowed, file, name) {
  if (allowed.global.has(name)) return true;
  const set = allowed.module.get(file) ?? allowed.module.get(null);
  return set ? set.has(name) : false;
}

/**
 * Ein Zaehler darf nur sinken. Wer aufraeumt, muss mit --sync nachziehen,
 * sonst behielte er den alten Spielraum und koennte ihn spaeter mit neuem
 * Schaden fuellen (dieselbe Ratsche wie bei der Schulden-Baseline).
 */
export function counterErrors(counters, budgets) {
  const errors = [];
  for (const [key, value] of Object.entries(counters)) {
    const allowed = budgets?.counters?.[key];
    if (typeof allowed !== "number") {
      errors.push(`${BUDGETS_FILE}: ${key} fehlt - einmalig --sync ausfuehren`);
      continue;
    }
    if (value > allowed) errors.push(`${key}: ${value} > ${allowed} - der Zaehler darf nur sinken`);
    else if (value < allowed) errors.push(`${key}: Budget ist veraltet (${value} < ${allowed}) - --sync ausfuehren`);
  }
  return errors;
}

export async function measure(root, { postcss: injected } = {}) {
  const parseErrors = [];
  const parse = parseCache();
  const postcss = injected ?? (await loadPostcss(root));
  const corpusTexts = new Map(CORPUS_DIRS.flatMap((dir) => walk(root, dir, CORPUS_EXT)).map((file) => [file, readFileSync(abs(root, file), "utf8")]));
  // Einmal tokenisieren statt je Klasse eine Regex ueber den ganzen Korpus zu
  // jagen: 641 Klassen x 10 MB waeren der grosse Teil der Laufzeit.
  const corpusWords = new Set();
  for (const text of corpusTexts.values()) {
    // Ohne $ in der Fortsetzung: in `className={`foo${x}`} folgt das $ direkt
    // auf den Namen, der Name bliebe sonst unerkannt.
    for (const token of text.match(/[A-Za-z_][\w-]*/g) ?? []) corpusWords.add(token);
  }
  if (!postcss) parseErrors.push("postcss nicht verfuegbar (node_modules/postcss/lib/postcss.mjs fehlt) - keine Aussage moeglich");
  const { sites } = dynamicSites(root);
  const dynamic = checkDynamicSites(root, sites);

  /* 1. CSS Modules: hart, ohne Baseline. */
  const moduleFiles = walk(root, "src", [".module.css"]);
  const importers = collectImporters(corpusTexts);
  const classesByFile = new Map();
  const composesByFile = new Map();
  const usedByFile = new Map();
  for (const file of moduleFiles) {
    const cssRoot = parse(root, postcss, file, parseErrors);
    if (!cssRoot) continue;
    const classes = collectClasses(cssRoot);
    const composes = collectComposes(cssRoot, file);
    classesByFile.set(file, classes);
    composesByFile.set(file, composes);
    const found = importers.get(file) ?? [];
    for (const imp of found) imp.text = corpusTexts.get(imp.file) ?? "";
    usedByFile.set(file, usedInImporters(classes, found));
  }
  // composes zieht nach: ist .btnPrimary benutzt, ist .btn es auch.
  let changed = true;
  while (changed) {
    changed = false;
    for (const [file, composes] of composesByFile) {
      const used = usedByFile.get(file);
      if (!used) continue;
      for (const [owner, deps] of composes) {
        if (!used.has(owner)) continue;
        for (const [target, name] of deps) {
          const targetUsed = usedByFile.get(target);
          if (targetUsed && !targetUsed.has(name)) {
            targetUsed.add(name);
            changed = true;
          }
        }
      }
    }
  }
  const moduleDead = [];
  for (const [file, classes] of classesByFile) {
    const used = usedByFile.get(file) ?? new Set();
    for (const [name, entry] of classes) {
      if (used.has(name) || isExempt(dynamic.allowed, file, name)) continue;
      moduleDead.push({ file, class: name, line: entry.line, count: entry.rules.size });
    }
  }
  moduleDead.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.class.localeCompare(b.class));

  /* 3. Globale Dateien: nur Altbestand darf tot sein. */
  const globalDead = {};
  for (const file of GLOBAL_CSS) {
    if (!existsSync(abs(root, file))) continue;
    const cssRoot = parse(root, postcss, file, parseErrors);
    if (!cssRoot) continue;
    const list = [];
    for (const [name, entry] of collectClasses(cssRoot)) {
      if (isExempt(dynamic.allowed, file, name)) continue;
      if (corpusWords.has(name)) continue;
      list.push({ class: name, line: entry.line, count: entry.rules.size });
    }
    list.sort((a, b) => a.line - b.line || a.class.localeCompare(b.class));
    globalDead[file] = list;
  }

  /* 4. Die drei Zaehler. */
  let important = 0;
  for (const file of walk(root, "src", [".css"])) {
    const cssRoot = parse(root, postcss, file, parseErrors);
    if (!cssRoot) continue;
    cssRoot.walkDecls((decl) => {
      if (decl.important) important += 1;
    });
  }
  const perFileSelectors = new Map();
  for (const file of GLOBAL_CSS) {
    if (!existsSync(abs(root, file))) continue;
    const cssRoot = parse(root, postcss, file, parseErrors);
    if (!cssRoot) continue;
    const selectors = new Set();
    const isRule = (node) => node.type === "rule";
    cssRoot.walkRules((rule) => {
      for (let parent = rule.parent; parent; parent = parent.parent) if (isRule(parent)) return;
      for (const part of rule.selector.split(",")) {
        const selector = part.trim();
        if (selector) selectors.add(selector);
      }
    });
    perFileSelectors.set(file, selectors);
  }
  const seen = new Map();
  for (const selectors of perFileSelectors.values()) {
    for (const selector of selectors) seen.set(selector, (seen.get(selector) ?? 0) + 1);
  }
  const duplicates = [...seen.values()].filter((count) => count >= 2).length;

  let stateClasses = 0;
  for (const file of walk(root, "src", MARKUP_EXT)) {
    for (const hit of violations(file, readFileSync(abs(root, file), "utf8"))) {
      if (hit.rule === "state-class") stateClasses += 1;
    }
  }

  return {
    moduleDead,
    globalDead,
    counters: {
      importantDeclarations: important,
      duplicateTopLevelSelectors: duplicates,
      stateClasses,
    },
    dynamic,
    parseErrors,
  };
}

export async function check(root, options = {}) {
  const report = await measure(root, options);
  const errors = [...report.parseErrors, ...report.dynamic.errors];

  const frozen = readJson(root, DEADCSS_FILE);
  if (!frozen?.files && !frozen?.modules) errors.push(`${DEADCSS_FILE} fehlt oder ist unlesbar - einmalig --sync ausfuehren`);
  else {
    for (const [file, list] of Object.entries(report.globalDead)) {
      const known = new Set((frozen.files?.[file] ?? []).map((entry) => entry.class));
      for (const entry of list) {
        if (!known.has(entry.class)) errors.push(`${file}:${entry.line}: neue tote Klasse "${entry.class}" - Altbestand darf nur schrumpfen`);
      }
    }
    // Dieselbe Regel fuer CSS Modules: Altbestand eingefroren, Neuzugang hart.
    for (const entry of report.moduleDead) {
      const known = new Set((frozen.modules?.[entry.file] ?? []).map((item) => item.class));
      if (known.has(entry.class)) continue;
      errors.push(`${entry.file}:${entry.line}: neue tote Modul-Klasse "${entry.class}" - im Quelltext keine Referenz ueber den Modul-Import; Altbestand darf nur schrumpfen`);
    }
  }

  const budgets = readJson(root, BUDGETS_FILE);
  errors.push(...counterErrors(report.counters, budgets));
  return errors;
}

export async function sync(root, options = {}) {
  const report = await measure(root, options);
  const generated = today();
  const modules = {};
  for (const entry of report.moduleDead) {
    (modules[entry.file] ??= []).push({ class: entry.class, line: entry.line, count: entry.count });
  }
  const dead = {
    version: 1,
    generated,
    corpus: { dirs: CORPUS_DIRS, extensions: CORPUS_EXT },
    // Eine Liste, zwei Schluessel: "files" sind die vier globalen Dateien,
    // "modules" die CSS Modules. Beide duerfen nur schrumpfen.
    files: report.globalDead,
    modules,
  };
  const budgets = { version: 1, generated, counters: report.counters };
  const { data } = dynamicSites(root);
  const dynamic = {
    version: 1,
    generated,
    note: "Geschuetzte Liste. Eine neue dynamische Stelle heisst: hier eintragen, sonst wird die Klasse als tot gemeldet.",
    sites: Array.isArray(data?.sites) ? data.sites : [],
  };
  for (const [rel, payload] of [[DEADCSS_FILE, dead], [BUDGETS_FILE, budgets], [DYNAMIC_FILE, dynamic]]) {
    const file = abs(root, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  }
  return report;
}

export function reportText(report) {
  const rows = [
    ["unreferenced global classes", Object.values(report.globalDead).reduce((sum, list) => sum + list.length, 0)],
    ["importantDeclarations", report.counters.importantDeclarations],
    ["duplicateTopLevelSelectors", report.counters.duplicateTopLevelSelectors],
    ["stateClasses", report.counters.stateClasses],
  ];
  const width = Math.max(...rows.map(([key]) => key.length));
  const lines = rows.map(([key, value]) => `  ${key.padEnd(width)}  ${value}`);
  lines.push(`  tote Modul-Klassen          ${report.moduleDead.length} (eingefroren)`);
  return lines.join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.env.EH_DESIGN_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
  const args = process.argv.slice(2);
  if (args.includes("--sync")) {
    const report = await sync(root);
    console.log(`${DEADCSS_FILE}, ${BUDGETS_FILE} und ${DYNAMIC_FILE} neu geschrieben (${today()}).`);
    console.log(reportText(report));
  } else if (args.includes("--report")) {
    const report = await measure(root);
    console.log(reportText(report));
    if (report.parseErrors.length) console.log(`  ACHTUNG: ${report.parseErrors.length} Datei(en) nicht parsebar.`);
  } else {
    const errors = await check(root);
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("EH_DESIGN_DEADCSS_CLEAN");
    }
  }
}
