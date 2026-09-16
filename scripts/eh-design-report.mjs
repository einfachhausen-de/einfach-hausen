#!/usr/bin/env node
/**
 * Monatlicher Design-Report fuer Einfach Hausen.
 *
 * Erhebt elf Kennzahlen und schreibt sie nach design/design-report.json.
 *
 *   node scripts/eh-design-report.mjs            # Messen und Report schreiben
 *   node scripts/eh-design-report.mjs --check    # Gegen den gespeicherten Report
 *                                                # vergleichen; Exit 1 bei
 *                                                # Rueckschritt in einer Kennzahl
 *   node scripts/eh-design-report.mjs --markdown # Tabelle als Markdown auf
 *                                                # stdout (fuer $GITHUB_STEP_SUMMARY)
 *
 * Wurzel des Repos ist das Elternverzeichnis dieses Skripts, ueberschreibbar
 * mit EH_DESIGN_ROOT (wie in scripts/eh-design-check.mjs).
 *
 * Zwei Kennzahlen bleiben absichtlich null: deadCssRatio und cssBytesPerRoute.
 * Sie brauchen einen Browser bzw. einen gebauten Routen-Report und sind hier
 * nicht belegbar.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(process.env.EH_DESIGN_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), ".."));

const REPORT_FILE = "design/design-report.json";
const DEBT_FILE = "design/design-debt.json";
const DEADCSS_FILE = "design/design-deadcss.json";

// Die vier globalen Stylesheets. Nur sie tragen globale Selektoren, deshalb
// werden Duplikate und schichtfreie Regeln ausschliesslich hier gezaehlt.
const GLOBAL_CSS = [
  "src/app/globals.css",
  "src/app/design-system.css",
  "src/components/marketing/tokens.css",
  "src/components/auth-v2/auth-shell.css",
];

const SCAN_DIRS = ["src", "packages"];
const SOURCE_ALL_CSS = "postcss ueber src/**/*.css und packages/**/*.css";
const SOURCE_SRC_CSS = "postcss ueber src/**/*.css";
const NOT_MEASURED_NOTE = "nicht belegt";

const abs = (rel) => join(ROOT, rel);

function readJson(rel) {
  const file = abs(rel);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function walkCss(dirRel) {
  const out = [];
  const dir = abs(dirRel);
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = `${dirRel}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walkCss(rel));
    else if (entry.name.endsWith(".css")) out.push(rel);
  }
  return out;
}

// postcss liegt als ESM unter node_modules/postcss/lib/postcss.mjs. Ueber den
// Paketnamen zu importieren wuerde die Auflösung dem Aufrufer ueberlassen; der
// absolute Pfad macht den Report unabhaengig davon, wo er gestartet wird.
async function loadPostcss() {
  const file = abs("node_modules/postcss/lib/postcss.mjs");
  if (!existsSync(file)) return null;
  const mod = await import(pathToFileURL(file).href);
  return mod.default ?? null;
}

const parseErrors = [];

function parseCss(postcss, rel) {
  try {
    return postcss.parse(readFileSync(abs(rel), "utf8"), { from: rel });
  } catch (error) {
    parseErrors.push({ file: rel, message: error.message });
    return null;
  }
}

function hasAncestor(node, matches) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (matches(parent)) return true;
  }
  return false;
}

const isRule = (node) => node.type === "rule";
const isLayer = (node) => node.type === "atrule" && node.name === "layer";

/* ---------------------------------------------------------------- Kennzahlen */

function debtMetrics() {
  const debt = readJson(DEBT_FILE);
  if (!debt || typeof debt !== "object") {
    const missing = { value: null, note: NOT_MEASURED_NOTE, reason: `${DEBT_FILE} fehlt oder ist unlesbar`, source: DEBT_FILE };
    return { debtPoints: { ...missing, target: 0, alarm: "steigt" }, debtFiles: { ...missing, target: 0, alarm: "steigt" } };
  }
  let points = 0;
  let files = 0;
  for (const entries of Object.values(debt)) {
    if (!entries || typeof entries !== "object") continue;
    let filePoints = 0;
    for (const count of Object.values(entries)) filePoints += Number(count) || 0;
    points += filePoints;
    if (filePoints > 0) files += 1;
  }
  return {
    debtPoints: { value: points, target: 0, alarm: "steigt", source: DEBT_FILE },
    debtFiles: { value: files, target: 0, alarm: "steigt", source: DEBT_FILE },
  };
}

function typeMetrics(postcss, files) {
  const sizes = new Set();
  const weights = new Set();
  let important = 0;
  if (!postcss) {
    const missing = { value: null, note: NOT_MEASURED_NOTE, reason: "postcss nicht verfuegbar (node_modules/postcss fehlt)" };
    return {
      fontSizes: { ...missing, alarm: "steigt", source: SOURCE_ALL_CSS },
      fontWeights: { ...missing, alarm: "steigt", source: SOURCE_ALL_CSS },
      importantDeclarations: { ...missing, target: 0, alarm: "steigt", source: SOURCE_SRC_CSS },
    };
  }
  for (const rel of files) {
    const root = parseCss(postcss, rel);
    if (!root) continue;
    root.walkDecls((decl) => {
      if (decl.prop === "font-size") sizes.add(decl.value.trim());
      else if (decl.prop === "font-weight") weights.add(decl.value.trim());
      if (decl.important && rel.startsWith("src/")) important += 1;
    });
  }
  return {
    fontSizes: { value: sizes.size, alarm: "steigt", source: SOURCE_ALL_CSS },
    fontWeights: { value: weights.size, alarm: "steigt", source: SOURCE_ALL_CSS },
    importantDeclarations: { value: important, target: 0, alarm: "steigt", source: SOURCE_SRC_CSS },
  };
}

// Ein Selektor gilt als Top-Level, wenn er nicht in einer anderen Regel
// geschachtelt ist (Regeln in @media/@layer zaehlen mit). Gezaehlt werden
// Selektoren, die in mindestens zwei der vier globalen Dateien stehen - sie
// sind die Stellen, an denen die Reihenfolge der Stylesheets entscheidet.
function duplicateSelectorMetric(postcss) {
  const perFile = new Map();
  const filesSeen = [];
  if (postcss) {
    for (const rel of GLOBAL_CSS) {
      if (!existsSync(abs(rel))) continue;
      const root = parseCss(postcss, rel);
      if (!root) continue;
      const selectors = new Set();
      root.walkRules((rule) => {
        if (hasAncestor(rule, isRule)) return;
        for (const part of rule.selector.split(",")) {
          const selector = part.trim();
          if (selector) selectors.add(selector);
        }
      });
      perFile.set(rel, selectors);
      filesSeen.push(rel);
    }
  }
  if (filesSeen.length === 0) {
    return {
      value: null,
      note: NOT_MEASURED_NOTE,
      reason: "keine der vier globalen CSS-Dateien lesbar",
      alarm: "steigt",
      source: GLOBAL_CSS.join(", "),
    };
  }
  const seen = new Map();
  for (const selectors of perFile.values()) {
    for (const selector of selectors) seen.set(selector, (seen.get(selector) ?? 0) + 1);
  }
  const duplicated = [...seen.values()].filter((count) => count >= 2).length;
  return {
    value: duplicated,
    target: 0,
    alarm: "steigt",
    source: `postcss ueber ${filesSeen.length} globale CSS-Dateien`,
    byFile: Object.fromEntries([...perFile].map(([file, selectors]) => [file, selectors.size])),
  };
}

function unreferencedClassesMetric() {
  const dead = readJson(DEADCSS_FILE);
  const entries = dead?.files;
  if (!entries || typeof entries !== "object") {
    return {
      value: null,
      note: NOT_MEASURED_NOTE,
      reason: `${DEADCSS_FILE} fehlt oder ist unlesbar`,
      target: 0,
      alarm: "steigt",
      source: DEADCSS_FILE,
    };
  }
  let total = 0;
  const byFile = {};
  for (const [file, list] of Object.entries(entries)) {
    const count = Array.isArray(list) ? list.filter((entry) => entry && entry.class).length : 0;
    if (count) byFile[file] = count;
    total += count;
  }
  return {
    value: total,
    target: 0,
    alarm: "steigt",
    source: DEADCSS_FILE,
    byFile,
  };
}

// Regeln, die in keinem @layer stehen, gewinnen gegen jede Tailwind-Utility.
// Getrennt gezaehlt pro globaler Datei, damit der Rueckschritt zuordenbar ist.
function layerlessRulesMetric(postcss) {
  const byFile = {};
  let total = 0;
  let read = 0;
  if (postcss) {
    for (const rel of GLOBAL_CSS) {
      if (!existsSync(abs(rel))) continue;
      const root = parseCss(postcss, rel);
      if (!root) continue;
      let count = 0;
      root.walkRules((rule) => {
        if (!hasAncestor(rule, isLayer)) count += 1;
      });
      byFile[rel] = count;
      total += count;
      read += 1;
    }
  }
  if (read === 0) {
    return {
      value: null,
      note: NOT_MEASURED_NOTE,
      reason: "postcss nicht verfuegbar oder keine globale CSS-Datei lesbar",
      target: 0,
      alarm: "steigt",
      source: GLOBAL_CSS.join(", "),
    };
  }
  return {
    value: total,
    target: 0,
    alarm: "steigt",
    source: "postcss ueber die vier globalen CSS-Dateien",
    byFile,
  };
}

// Wie quality.yml/eh-design.yml: Befehl als argv-Array, damit keine Shell
// zwischen dem Aufruf und git sitzt. --format= unterdrueckt die Commit-Koepfe.
function newGlobalCssFilesMetric() {
  let files = null;
  try {
    const out = execFileSync(
      "git",
      ["log", "--since=1 month ago", "--diff-filter=A", "--name-only", "--format=", "--", "*.css"],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    files = [...new Set(out.split("\n").map((line) => line.trim()).filter(Boolean))].filter(
      (file) => file.endsWith(".css") && !file.endsWith(".module.css"),
    );
  } catch {
    files = null;
  }
  if (!files) {
    return {
      value: null,
      note: NOT_MEASURED_NOTE,
      reason: "git-Verlauf nicht lesbar (flacher Clone oder kein git)",
      target: 0,
      alarm: "steigt",
      source: 'git log --since="1 month ago" --diff-filter=A --name-only',
    };
  }
  return {
    value: files.length,
    target: 0,
    alarm: "steigt",
    source: 'git log --since="1 month ago" --diff-filter=A --name-only',
    files,
  };
}

const postcss = await loadPostcss();
const cssFiles = SCAN_DIRS.flatMap((dir) => walkCss(dir)).sort();

const metrics = {
  ...debtMetrics(),
  ...typeMetrics(postcss, cssFiles),
  duplicateTopLevelSelectors: duplicateSelectorMetric(postcss),
  unreferencedClassNames: unreferencedClassesMetric(),
  layerlessRules: layerlessRulesMetric(postcss),
  newGlobalCssFiles: newGlobalCssFilesMetric(),
  deadCssRatio: {
    value: null,
    note: NOT_MEASURED_NOTE,
    reason: "braucht eine Messung im Browser (document.styleSheets gegen das gerenderte DOM)",
    target: 0,
    source: "nicht messbar ohne Browser",
  },
  cssBytesPerRoute: {
    value: null,
    note: NOT_MEASURED_NOTE,
    reason: "braucht einen Produktions-Build und einen Browser, der die Route laedt",
    alarm: "steigt",
    source: "nicht messbar ohne Build und Browser",
  },
};

const report = {
  generated: new Date().toISOString().slice(0, 10),
  metrics,
  notMeasured: Object.entries(metrics)
    .filter(([, metric]) => metric.value === null)
    .map(([key]) => key),
  scannedCssFiles: cssFiles.length,
  parseErrors,
};

/* --------------------------------------------------------------- Ausgabe */

const METRIC_ORDER = Object.keys(metrics);

function formatValue(metric) {
  return metric.value === null ? NOT_MEASURED_NOTE : String(metric.value);
}

function textTable() {
  const width = Math.max(...METRIC_ORDER.map((key) => key.length));
  return METRIC_ORDER.map(
    (key) => `  ${key.padEnd(width)}  ${formatValue(metrics[key])}`,
  ).join("\n");
}

function markdownTable() {
  const rows = METRIC_ORDER.map((key) => {
    const metric = metrics[key];
    const goal =
      metric.value === null ? "-" : metric.target === undefined ? (metric.alarm ?? "-") : `${metric.target} (${metric.alarm ?? "Ziel"})`;
    return `| ${key} | ${formatValue(metric)} | ${goal} | ${metric.source ?? "-"} |`;
  });
  return [
    `## EH Design-Report ${report.generated}`,
    "",
    "| Kennzahl | Wert | Ziel/Alarm | Quelle |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    `${report.notMeasured.length} Kennzahl(en) nicht belegt: ${report.notMeasured.join(", ") || "-"}.`,
    `${report.scannedCssFiles} CSS-Dateien gelesen, ${parseErrors.length} Parse-Fehler.`,
    "",
  ].join("\n");
}

const args = process.argv.slice(2);

if (args.includes("--markdown")) {
  process.stdout.write(markdownTable());
} else if (args.includes("--check")) {
  const previous = readJson(REPORT_FILE);
  if (!previous?.metrics) {
    console.log(`Kein gespeicherter Report unter ${REPORT_FILE} - kein Vergleich moeglich.`);
    console.log(textTable());
  } else {
    const regressions = [];
    const warnings = [];
    for (const key of METRIC_ORDER) {
      const before = previous.metrics[key]?.value;
      const after = metrics[key].value;
      if (typeof before !== "number") continue;
      if (typeof after !== "number") {
        warnings.push(`${key}: frueher ${before}, jetzt nicht belegt`);
      } else if (after > before) {
        regressions.push(`${key}: ${before} -> ${after}`);
      }
    }
    console.log(textTable());
    for (const warning of warnings) console.log(`  WARNUNG  ${warning}`);
    if (regressions.length) {
      console.error(`RUECKSCHRITT in ${regressions.length} Kennzahl(en):`);
      for (const regression of regressions) console.error(`  ${regression}`);
      process.exitCode = 1;
    } else {
      console.log("Kein Rueckschritt.");
    }
  }
} else {
  const file = abs(REPORT_FILE);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${REPORT_FILE} geschrieben (${report.generated}).`);
  console.log(textTable());
  if (parseErrors.length) console.log(`  ACHTUNG: ${parseErrors.length} CSS-Datei(en) nicht parsebar.`);
  if (report.notMeasured.length) console.log(`  nicht belegt: ${report.notMeasured.join(", ")}`);
}
