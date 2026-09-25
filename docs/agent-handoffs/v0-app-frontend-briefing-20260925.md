# Briefing an v0: App-Frontend + App-Design (Owner + Betrieb)

Stand: 2026-09-25, main `dd70208`. Adressat: v0 (Frontend/Design).
Ausführender danach: lokaler Subagent (Tests, Gates, Docs, Merge, Verifikation).
Operator-Wille: Das neue Website-Design ist erstklassig — dieselbe Qualität jetzt für die App.

## 1. Ziel

Owner-App (`/app/*`, Werkbank) und Betriebs-App (`/pro/*`) visuell und bedienungsseitig auf
das Niveau der neuen Website heben — innerhalb des Designsystems, ohne Backend-/Auth-/Daten-Umbau.

## 2. Was v0 gehört (Freiheit)

- Komposition, Dramaturgie, Dichte, Rhythmus der App-Seiten; Bausteine ausbauen;
  Beispiel-Motive und Leerzustände; Interaktionsdetails (Übergänge endlich + reduced-motion).
- Additive Tokens nach dem bewährten Muster (`tokens.json` ist der einzige Rohwert-Ort,
  `@theme`-Aliase in `globals.css`); was das Vokabular nicht hergibt, als Bedarf melden.
- Neue illustrative Motive nach R1-Regel (AGENTS.md): keine lesbaren Firmen-/Personennamen,
  Beispiele immer sichtbar als Beispiel kennzeichnen.

## 3. Was unverrückbar bleibt (Leitplanken mit Fundstellen)

- **Auth/Daten/Backend unantastbar:** `AuthContext` ist UI-State (T-0168); Server Components,
  Route Handler und Server Actions autorisieren serverseitig; Supabase-Subject ≠ App-User-ID
  ohne explizites Mapping. Keine Mockdaten im Produkt — Zahlen/Zeilen aus `jobs`, `quotes`,
  `appointments`, `provider_profiles`, `job_photos` (`docs/NEXT_AGENT.md`, AGENTS.md).
- **Freigegebene Kompositionen gelten weiter**, soweit nicht der Operator sie aufhebt:
  Owner-Dashboard 2026-09-11 (`DESIGN.md`), Owner-Aufträge 2026-09-11 (`DESIGN.md`),
  Ansprechpartner-Hierarchie Gina 2026-09-13 (`DESIGN.md`), Kopf-Menüleiste 2026-09-22
  (`DESIGN.md`), Hausakte-Referenz (`docs/brand/mature-reference/HANDOFF.md`).
- **Telefon zuerst (DESIGN.md §13):** 28/20/17/15 px, jedes Tippziel ≥ 44×44 px, 844-px-Rechnung.
- **App ist kein Dokument (DESIGN.md §14):** kein Marketingkopf mit 44-px-h1, kein Erklärtext
  unter der Überschrift, keine Kachelwand — Richtung A „Werkbank": Aufgaben zuerst, dichte
  Listen; Vorgangslisten in drei Ansichten (Liste/Karten/Chronik), Liste ist Standard.
- **Zustand in ARIA, nicht in Klassen** (DESIGN.md §15: `aria-current`, `aria-pressed`;
  keine `active`-Klassen). Die Guard-Wörter (`active`, `open`, …) gelten auch in
  Variablennamen im `className`-Kontext — siehe Fix `faq-explorer.tsx` (`active`→`expanded`).
- **Guard-Blindheit ist kein Freibrief:** Der Prüfer löst keine Tailwind-Klassen auf —
  Radien/Gewichte trotzdem nur aus dem Vokabular (6/8 px, Pille, Hauskante; 400/500/600/700).
- **Versiegelter Kern + Debt-Baseline** werden nicht angefasst und nicht neu versiegelt, um
  Checks zu bestehen. E2E-Anker (Startseiten-Anker, 404-Heading, Login-Fluss) bleiben grün
  oder werden nur mit Begründung + stärkerem Ersatz geändert.
- **Ehrlichkeit wie auf der Website:** keine absoluten Versprechen, Freigabe-Prinzip in jede
  Leistungsbeschreibung, Schätzungen als Schätzung mit Quelle.

## 4. Vorgehen

- Auf frischem Branch von `main` arbeiten, PR gegen `main` aufmachen. Kleine, reviewbare
  Commits (keine 100-Dateien-Würfe ohne Not).
- `design:check`, `tsc`, `eslint` vor jedem Push selbst laufen lassen; was rot ist, gehört
  ins PR-Handoff (wie bisher vorbildlich: `docs/agent-handoffs/v0-*.md`).
- E2E/Screenshots spart v0 wie vereinbart; Baselines/OCI-Gates + Merge macht der Subagent.

## 5. Abnahme (Reihenfolge)

1. Gates grün (Subagent, inkl. `test:e2e`, Visual-Baselines auf OCI-VM).
2. Visuelle Jeremy-Abnahme — Pflicht vor Deploy, keine Ausnahme.
3. Erst dann Deploy (Subagent, kanonischer OCI-Pfad).
