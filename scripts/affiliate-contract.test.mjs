// Affiliate-Vertrag (Issue #128) — nicht-visuelle Kontrakttests.
// Prüft fail-closed-Verhalten, Weiterleitungs-URL-Aufbau, Ablehnung von
// Fehlkonfigurationen und Datenminimierung. Ausschliesslich Testkonfiguration,
// es wird kein Netzwerkzugriff und keine echte Weiterleitung ausgeführt.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AFFILIATE_CATEGORIES,
  AFFILIATE_PARTNERS,
  affiliateAvailability,
  affiliateDisclosure,
  affiliateEntryHref,
  buildAffiliateTarget,
  hasAnyAffiliatePartner,
  isAffiliateCategory,
  isAffiliateSource,
  isValidClickRef,
  resolveAffiliate,
  validateAffiliatePartner,
} from "../src/lib/affiliate.ts";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(repo, p), "utf8");
const CLICK_REF = "0f8c2b1a-4d3e-4a5b-8c7d-1e2f3a4b5c6d";

/** Vollständige, gültige Testkonfiguration. Nie Produktionskonfiguration. */
const partner = (over = {}) => ({
  id: "test-partner",
  name: "Testpartner",
  categories: ["strom"],
  enabled: true,
  approvalRef: "TEST-1",
  targetUrl: "https://partner.example/vergleich",
  allowedHosts: ["partner.example"],
  allowedPathPrefixes: ["/vergleich"],
  publisherParams: { pubid: "12345" },
  subIdParam: "subid",
  trackingMode: "click",
  untrackedAllowed: false,
  ...over,
});

// --- Fail-closed: Produktionskonfiguration leitet niemanden aus ---------------
test("Produktionskonfiguration ist leer und damit fail-closed", () => {
  assert.equal(AFFILIATE_PARTNERS.length, 0);
  assert.equal(hasAnyAffiliatePartner(), false);
  for (const category of AFFILIATE_CATEGORIES) {
    const result = resolveAffiliate(category, "vergleichsuebersicht");
    assert.equal(result.status, "unavailable", category);
    assert.equal(result.reason, "no-partner", category);
  }
});

test("buildAffiliateTarget verweigert ohne Partner jede Ausleitung", () => {
  for (const category of AFFILIATE_CATEGORIES) {
    const result = buildAffiliateTarget(category, { consent: true, clickRef: CLICK_REF });
    assert.equal(result.ok, false, category);
    assert.equal(result.reason, "unavailable", category);
  }
});

test("Unbekannte Kategorie wird nie zu einer Ausleitung", () => {
  assert.equal(isAffiliateCategory("heizung"), false);
  assert.equal(isAffiliateCategory("strom"), true);
  assert.equal(resolveAffiliate("heizung", "vergleichsuebersicht").status, "error");
  assert.equal(resolveAffiliate(null, "vergleichsuebersicht").status, "error");
  assert.equal(buildAffiliateTarget("heizung").ok, false);
});

// --- Verfügbarkeit mit freigegebenem Partner ---------------------------------
test("Freigegebener Partner wird in seiner Kategorie verfügbar", () => {
  const result = resolveAffiliate("strom", "sparcheck", { partners: [partner()] });
  assert.equal(result.status, "available");
  assert.equal(result.partnerName, "Testpartner");
  // Der Einstieg bleibt intern: keine externe Adresse in der Oberfläche.
  assert.equal(result.entryHref, "/api/affiliate/strom?source=sparcheck");
  assert.match(result.entryHref, /^\/api\/affiliate\//);
  // Ein messtender Partner muss die Zustimmung anbieten können.
  assert.equal(result.needsConsent, true);
  assert.equal(result.consentEntryHref, "/api/affiliate/strom?source=sparcheck&consent=1");
});

test("Trackingfreier Partner bietet keinen Zustimmungsweg an", () => {
  const result = resolveAffiliate("strom", "sparcheck", { partners: [partner({ trackingMode: "none" })] });
  assert.equal(result.status, "available");
  assert.equal(result.needsConsent, false);
  assert.equal(result.consentEntryHref, null);
});

test("Nicht freigegebene und deaktivierte Partner bleiben unavailable", () => {
  const disabled = resolveAffiliate("strom", "sparcheck", { partners: [partner({ enabled: false })] });
  assert.equal(disabled.status, "unavailable");
  assert.equal(disabled.reason, "disabled");

  const unapproved = resolveAffiliate("strom", "sparcheck", { partners: [partner({ approvalRef: "" })] });
  assert.equal(unapproved.status, "unavailable");
  assert.equal(unapproved.reason, "no-approval");
});

test("Fehlkonfiguration wird als error gemeldet, nicht als Ausleitung", () => {
  const broken = resolveAffiliate("strom", "sparcheck", {
    partners: [partner({ targetUrl: "https://fremd.example/vergleich" })],
  });
  assert.equal(broken.status, "error");
  assert.equal(broken.reason, "invalid-configuration");
});

test("Nur erlaubte Quellen werden übernommen", () => {
  assert.equal(isAffiliateSource("sparcheck"), true);
  assert.equal(isAffiliateSource("frei-erfunden"), false);
  const fallback = resolveAffiliate("strom", "frei-erfunden", { partners: [partner()] });
  assert.equal(fallback.status, "available");
  assert.equal(fallback.entryHref, "/api/affiliate/strom?source=vergleichsuebersicht");
  assert.equal(affiliateEntryHref("strom", "vertragskontext"), "/api/affiliate/strom?source=vertragskontext");
});

// --- Weiterleitungs-URL: Aufbau und Grenzen ----------------------------------
test("Weiterleitung baut HTTPS-Ziel mit freigegebenen Parametern", () => {
  const result = buildAffiliateTarget("strom", { partners: [partner()], consent: true, clickRef: CLICK_REF });
  assert.equal(result.ok, true);
  const url = new URL(result.href);
  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "partner.example");
  assert.equal(url.pathname, "/vergleich");
  assert.equal(url.searchParams.get("pubid"), "12345");
  assert.equal(url.searchParams.get("subid"), CLICK_REF);
  assert.equal(result.tracked, true);
});

test("Ungültige Konfiguration wird beim URL-Aufbau abgelehnt", () => {
  const cases = [
    ["http statt https", { targetUrl: "http://partner.example/vergleich" }],
    ["fremder Host", { targetUrl: "https://boese.example/vergleich" }],
    ["nicht erlaubter Pfad", { targetUrl: "https://partner.example/anderes" }],
    ["Zugangsdaten in URL", { targetUrl: "https://u:p@partner.example/vergleich" }],
    ["unerwarteter Port", { targetUrl: "https://partner.example:8443/vergleich" }],
    ["kein Präfix", { allowedPathPrefixes: ["vergleich"] }],
    ["leerer Host", { allowedHosts: [] }],
    ["Sub-ID kollidiert", { publisherParams: { pubid: "12345", subid: "x" } }],
  ];
  for (const [label, over] of cases) {
    assert.equal(validateAffiliatePartner(partner(over)), "invalid-configuration", label);
    assert.equal(buildAffiliateTarget("strom", { partners: [partner(over)], consent: true, clickRef: CLICK_REF }).ok, false, label);
  }
});

test("Host-Vergleich ist exakt und kein Substring", () => {
  const sneaky = partner({ allowedHosts: ["partner.example"], targetUrl: "https://partner.example.boese.example/vergleich" });
  assert.equal(validateAffiliatePartner(sneaky), "invalid-configuration");
});

// --- Datenminimierung --------------------------------------------------------
test("Ohne Einwilligung wird nicht gemessen und nichts ausgeleitet", () => {
  const result = buildAffiliateTarget("strom", { partners: [partner()], clickRef: CLICK_REF });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "consent-required");
});

test("Ohne Einwilligung bleibt der Vergleich sichtbar-unverfügbar", () => {
  // Der Partner ist verfügbar, aber seine Route ist ausschliesslich messtend:
  // ohne Zustimmung darf der Endpunkt nicht ausleiten.
  const result = resolveAffiliate("strom", "vergleichsuebersicht", { partners: [partner()] });
  assert.equal(result.status, "available");
  assert.equal(result.needsConsent, true);
  assert.equal(result.untrackedAllowed, false);
  assert.equal(buildAffiliateTarget("strom", { partners: [partner()] }).reason, "consent-required");
});

test("Ohne Einwilligung wird bei erlaubtem trackingfreiem Weg nicht gemessen", () => {
  const untracked = partner({ untrackedAllowed: true });
  const target = buildAffiliateTarget("strom", { partners: [untracked], clickRef: CLICK_REF });
  assert.equal(target.ok, true);
  assert.equal(target.tracked, false);
  assert.equal(new URL(target.href).searchParams.get("subid"), null);
});

test("Freigegebener trackingfreier Weg erlaubt Vergleich ohne Messung", () => {
  const result = resolveAffiliate("strom", "vergleichsuebersicht", {
    partners: [partner({ trackingMode: "none", untrackedAllowed: true })],
  });
  assert.equal(result.status, "available");
  assert.equal(result.needsConsent, false);

  const target = buildAffiliateTarget("strom", { partners: [partner({ trackingMode: "none" })], clickRef: CLICK_REF });
  assert.equal(target.ok, true);
  assert.equal(target.tracked, false);
  assert.equal(new URL(target.href).searchParams.get("subid"), null);
});

test("Sub-ID wird nur in strikter UUID-Form weitergereicht", () => {
  assert.equal(isValidClickRef(CLICK_REF), true);
  assert.equal(isValidClickRef("123"), false);
  assert.equal(isValidClickRef("vertrag-42"), false);
  assert.equal(isValidClickRef(""), false);
  assert.equal(isValidClickRef(null), false);

  // Vertrags-ID, Postleitzahl oder E-Mail dürfen nie als Referenz durchgehen.
  for (const leak of ["42", "12345", "max@example.de", "  " + CLICK_REF]) {
    const target = buildAffiliateTarget("strom", { partners: [partner()], consent: true, clickRef: leak });
    assert.equal(target.ok, true, leak);
    assert.equal(new URL(target.href).searchParams.get("subid"), null, leak);
  }
});

test("Ausgehende URL enthält ausschliesslich freigegebene Parameter", () => {
  const result = buildAffiliateTarget("strom", { partners: [partner()], consent: true, clickRef: CLICK_REF });
  const keys = [...new URL(result.href).searchParams.keys()].sort();
  assert.deepEqual(keys, ["pubid", "subid"]);
});

test("Eingeschleuste Anfrageparameter landen nicht in der Ziel-URL", () => {
  // Der Endpunkt übergibt bewusst nur Kategorie, Quelle, Einwilligung, Referenz.
  const result = buildAffiliateTarget("strom", {
    partners: [partner({ targetUrl: "https://partner.example/vergleich?pubid=12345&utm_source=eigen" })],
    consent: true,
    clickRef: CLICK_REF,
  });
  assert.equal(result.ok, true);
  const keys = [...new URL(result.href).searchParams.keys()].sort();
  assert.deepEqual(keys, ["pubid", "subid", "utm_source"]);
  assert.equal(new URL(result.href).searchParams.get("utm_source"), "eigen");
});

test("Offenlegungstext nennt den Partner", () => {
  assert.equal(affiliateDisclosure("Testpartner"), "Vergleich bei Testpartner. Bei einem Abschluss können wir eine Vergütung erhalten.");
  assert.doesNotMatch(affiliateDisclosure("Testpartner"), /\{partner\}/);
});

test("affiliateAvailability liefert genau die fünf Kategorien", () => {
  const rows = affiliateAvailability("vergleichsuebersicht");
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((r) => r.category), [...AFFILIATE_CATEGORIES]);
});

// --- Strukturwächter: eine Quelle, kein zweiter Linkpfad ---------------------
test("Es gibt genau eine Partnerliste im Quelltext", () => {
  const lib = read("src/lib/affiliate.ts");
  assert.match(lib, /export const AFFILIATE_PARTNERS/);
  // Der alte, leere Stub in contracts.ts darf nicht zurückkehren.
  assert.doesNotMatch(read("src/lib/contracts.ts"), /AFFILIATE_LINKS|affiliateLink/);
});

test("Der Endpunkt nimmt nie ein Ziel vom Client entgegen", () => {
  const route = read("src/app/api/affiliate/[category]/route.ts");
  assert.match(route, /buildAffiliateTarget/);
  // Kein Durchreichen einer Client-URL, kein Kopieren der Anfrage-Query.
  assert.doesNotMatch(route, /searchParams\.get\(['"]url['"]/);
  assert.doesNotMatch(route, /searchParams\.toString\(\)/);
  // Erlaubt sind genau zwei Ziele: die geprüfte Partner-URL und der intern
  // aufgebaute Rücksprung in die App. Nichts aus der Anfrage direkt.
  assert.doesNotMatch(route, /NextResponse\.redirect\((?!target\.href\b|url\b)/);
  assert.match(route, /NextResponse\.redirect\(target\.href/);
  // Keine Fremdskripte oder Pixel vor der bewussten Ausleitung.
  assert.doesNotMatch(route, /<script|pixel|preconnect/i);
  // Referrer wird nicht an den Partner weitergegeben.
  assert.match(route, /Referrer-Policy/);
});

test("Oberflächenseiten definieren keine Partner-URL", () => {
  for (const file of ["src/app/app/contracts/page.tsx", "src/app/app/insurance/page.tsx"]) {
    const source = read(file);
    assert.doesNotMatch(source, /https?:\/\//, file);
    assert.doesNotMatch(source, /AFFILIATE_PARTNERS/, file);
  }
});

test("Freigabedokumentation ist vorhanden", () => {
  const doc = read("docs/affiliate-partner-config.md");
  assert.match(doc, /approvalRef/);
  assert.match(doc, /AFFILIATE_PARTNERS/);
});
