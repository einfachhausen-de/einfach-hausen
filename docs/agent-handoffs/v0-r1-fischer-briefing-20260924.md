# Briefing an v0: R1 Fischer-Avatare tauschen (+ Rollenteilung)

Stand: 2026-09-24, main `acc5437` (PR #172 gemergt). Adressat: v0 (Frontend/Design).
Ausführender danach: lokaler Subagent (Tests, Gates, Docs, Merge, Verifikation).

## 1. Ausgangslage: noch nicht gelauncht

Einfach Hausen ist **noch nicht gelauncht**. Was jetzt an Ehrlichkeits-Fehlern in die
Öffentlichkeit geht, wird zum Launch-Vertrauensthema. Darum gilt die harte Regel aus
`docs/agent-handoffs/v0-frontend-audit-20260924.md` (dort: Befund R1) ab sofort als
Auftrag — nicht als Vorschlag.

## 2. Auftrag R1: erfundene Handwerker-Firma entfernen

Die drei Porträts unter `public/images/site/` zeigen erfundene Personen mit lesbarer
erfundener Firma und sind neben „geprüfte Betriebe"-Claims platziert:

- `avatar-heizung.png`: Stickerei „FISCHER HEIZUNGSTECHNIK – MEISTERBETRIEB"
- `avatar-elektro.png`: Stickerei „FISCHER ELEKTROTECHNIK" + Schild „Sarah F. – Elektrikerin"
- `avatar-dach.png`: Stickerei „FISCHER DACHDECKER MEISTERBETRIEB"

Verwendung: `src/components/site/home/hero.tsx` (neben „3 geprüfte Betriebe in der Nähe",
ohne Beispiel-Kennzeichnung), `app-bento.tsx` (Avatar-Stapel), `craftsmen-feature.tsx`
(Karten, dort unter abweichenden Fantasienamen „Bauer Haustechnik" etc.),
`owner-app-screen.tsx` („Meine Handwerker").

**Gefordert (eine der beiden Varianten, kein Mix aus Ausreden):**

- Variante A (bevorzugt): neutrale Motive — Werkzeug, Transporter, Hände bei der Arbeit,
  Rückenansicht. Keine Gesichter, keine lesbaren Marken, keine Namen.
- Variante B: gesichtslose Platzhalter (Initialen-/Icon-Avatare aus dem Token-System) plus
  überall sichtbare „Beispiel"-Kennzeichnung (Komponente `ExampleNote` /
  „Beispielansicht"-Badge existiert in `src/design-system/site.tsx` bzw.
  `craftsmen-feature.tsx:68`).

**Nicht erlaubt:** neue Fantasienamen, neue Sterne-Ratings, Bildtext ≠ Kartentext,
Beispiel-Kennzeichnung nur für Screenreader. Kartentexte in `craftsmen-feature.tsx`
(„Bauer Haustechnik" etc.) bei der Gelegenheit auf Beispiel-Konsistenz prüfen.

## 3. Rollenteilung (verbindlich, Operator-Order 2026-09-24)

- **v0:** Frontend, Design, Designsystem-Verbesserungen. Komposition, Dramaturgie,
  Dichte, Interaktion, Bausteine, Beispiel-Motive. Tokens nur additiv über
  `packages/eh-design/src/tokens.json` (so wie bisher vorbildlich); was das Vokabular
  nicht hergibt, als Bedarf melden statt selbst erfinden.
- **Lokaler Subagent:** übernimmt anschließend alles andere — Tests, Gates
  (`design:check`, tsc, eslint, test:ai, public-site/nav, build), Docs
  (NEXT_AGENT, Handoffs), Merge nach main, Push, Branch-Cleanup, Verifikation.
  Kein Deploy ohne visuelle Jeremy-Abnahme.

## 4. Abnahme

- `npm run design:check` grün (nach Token-/Lock-Änderung neu versiegeln lassen —
  das macht der Subagent, nicht v0).
- Kein lesbarer Firmen-/Personenname auf Beispielbildern (Review per Sichtprüfung).
- Sichtbare Beispiel-Kennzeichnung überall dort, wo Beispiele gezeigt werden.
- Danach: Subagent verifiziert, mergt, dokumentiert.
