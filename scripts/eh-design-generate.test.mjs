import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { vocabularyErrors, MAX_FONT_SIZES, TOKEN_GROUPS } from "./eh-design-generate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const live = () => JSON.parse(readFileSync(resolve(root, "packages/eh-design/src/tokens.json"), "utf8"));
const withFont = sizes => ({ ...live(), font: Object.fromEntries([["family", "Inter"], ...sizes.map((s, i) => ["size" + i, "1rem"])]) });

test("der lebende Wortschatz ist freigegeben", () => {
  assert.deepEqual(vocabularyErrors(live()), []);
});

test("acht Schriftgroessen sind erlaubt, die neunte nicht", () => {
  assert.deepEqual(vocabularyErrors(withFont(Array(MAX_FONT_SIZES).fill("1rem"))), []);
  const errors = vocabularyErrors(withFont(Array(MAX_FONT_SIZES + 1).fill("1rem")));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /tokens\.font: 9 Schriftgroessen > 8 erlaubt/);
});

test("family zaehlt nicht als Schriftgroesse", () => {
  const data = live();
  assert.equal(Object.keys(data.font).filter(k => k !== "family").length, MAX_FONT_SIZES);
  // Eine neunte Groesse faellt auf, family hin oder her.
  assert.equal(vocabularyErrors({ ...data, font: { ...data.font, groesse9: "1rem" } }).length, 1);
  assert.deepEqual(vocabularyErrors({ ...data, font: { family: "Inter" } }), []);
});

test("eine neue Gruppe ist nicht freigegeben", () => {
  const errors = vocabularyErrors({ ...live(), border: { thin: "1px" } });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /neue Token-Gruppe "border" nicht freigegeben/);
});

test("jede freigegebene Gruppe ist erlaubt", () => {
  for (const group of TOKEN_GROUPS) assert.deepEqual(vocabularyErrors({ ...live(), [group]: {} }), [], group);
});

test("einfache Werte auf der obersten Ebene sind keine Gruppe", () => {
  assert.deepEqual(vocabularyErrors({ ...live(), version: "2.0.0", note: "kein Token" }), []);
});

test("die fuenf nachgezogenen Gruppen sind vollstaendig", () => {
  const data = live();
  assert.deepEqual(Object.keys(data.weight), ["regular", "medium", "semibold", "bold"]);
  assert.deepEqual(Object.keys(data.shadow), ["none", "panel", "card"]);
  assert.deepEqual(Object.keys(data.radius), ["control", "panel", "pill", "cut"]);
  assert.deepEqual(Object.keys(data.leading), ["tight", "normal", "loose"]);
  assert.deepEqual(Object.keys(data.track), ["normal", "wide"]);
});

test("die neue Gruppe steht auch im erzeugten CSS", () => {
  const css = readFileSync(resolve(root, "packages/eh-design/src/tokens.css"), "utf8");
  for (const name of ["--eh-weight-semibold: 600", "--eh-shadow-card:", "--eh-radius-pill:", "--eh-leading-loose:", "--eh-track-wide:"])
    assert.ok(css.includes(name), name);
});

test("--check ist gruen: keine Abweichung, kein Wortschatzverstoss", () => {
  const out = execFileSync(process.execPath, [resolve(root, "scripts/eh-design-generate.mjs"), "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(out.trim(), "EH_TOKENS_VALID");
});
