# v0-Lieferung 2026-09-24: Website-Frontend zu Ende (Login, 404, Produktseiten)

Adressat: lokaler Subagent (Gates, Re-Seal, Tests, Merge, Verifikation).
Grundlage: v0-Chat `NcuvdFhxYXM` (abgebrochen bei globaler 404 + Login) und PR #174.

v0 hat hier **nur Design/Frontend** angefasst. Keine Tests, kein Re-Seal, kein E2E, kein Deploy.

## Umgesetzt

- **Login / Register / Register-Owner / Register-Pro:** gleiche `AuthShell`, gleiche IDs und `arena-`-Klassen. Nur `auth-shell.css`: Papier statt Verlauf, Kartenradius und Schatten aus Tokens, Lime-Pill als Hauptaktion (wie „Kostenlos starten“), Hauskante am Foto, fette Überschrift. Eine endliche Ankunft (`arena-arrive`, 0,55 s). `prefers-reduced-motion` stoppt Spinner und Ankunft.
- **Globale 404:** altes Teal-SVG/`nf-*` raus. `SiteShell` + Überschrift „Das gibt es hier nicht.“ und Link `href="/" ` bleiben (E2E-Anker). Lexikon-Pfade nutzen weiter die neue `LexikonNotFound`.
- **Produktseiten** `/beratung`, `/notfall`, `/versicherung`, `/immobilienverkauf`: nicht mehr dieselbe dunkle Karte ohne Bild. Eigene Fotos unter `public/images/site/story-*.png` (keine lesbaren Marken, keine Namen). Notfall zeigt die Notruf-Grenze **vor** dem Button. Versicherung und Verkauf zeigen die Freigabe-Grenze vor dem Button.
- **Leistungs-Unterseiten:** Titel ist der Leistungsname, nicht mehr der vierzeilige Schablonensatz.
- **ClosingCta:** `rounded-[2.5rem]` ersetzt durch die Hauskante (`houseEdgeClass`). G5 (übrige Radien) bleibt bei der Designautorität.
- **929px:** Versprechenleiste bricht nicht mehr um (unter `xl` nur das erste Versprechen plus „Für Handwerker“). Login/Register: das Formular ist die erste Ansicht, das Foto beginnt darunter statt als angeschnittener Streifen.
- **Hausmanager-Knopf:** auf der Website nur noch eine Lime-Ecke, nicht die breite Karte über Formular und Inhalt. Die Startseite hebt ihn nicht mehr an (dort gibt es keine untere App-Leiste). Werkbank und Werkzeugleiste unverändert.
- **Fehler- und Ladezustand** der öffentlichen Seite: Papier, Lime, Kartenradius aus Tokens statt Teal-Karte.
- **Leistungsseiten:** Hauskanten-Foto und der Satz, dass der Auftrag erst nach Bestätigung entsteht.

## Bewusst nicht Remotion

Remotion rendert Video. Eine Dauerschleife widerspricht DESIGN.md (keine permanente Bewegung) und hilft bei der Entscheidung nicht. Psychologisch sinnvoll ist die vorhandene Motion-Schicht (Reveal/Stagger, endlich, reduced-motion = Endzustand) plus die einmalige Ankunft auf dem Login. Nicht nachrüsten.

## Offen für den Subagenten

1. `design:check` / Re-Seal, falls `src/components/auth-v2/auth-shell.css`, `src/components/site/page/blocks.tsx` oder `packages/eh-design/src/{assistant.tsx,styles.module.css,html.css}` als geschützt gemeldet werden. Erwartet, kein Rückbau. Der schwebende Knopf ist absichtlich nur noch die Lime-Ecke.
2. `scripts/auth-edition-contract.mjs` sollte grün bleiben (Klassenfamilie `arena-`, IDs, keine Fremdklassen in TSX). Wenn rot: nur melden, nicht die Lime-Optik zurückdrehen.
3. `tsc`, eslint der geänderten Pfade, `test:public-site`, `test:public-nav`.
4. E2E-Anker 404: Heading „Das gibt es hier nicht.“, mindestens ein `a[href="/"]`, kein Overflow. Visuelle Baselines auf der OCI-VM aktualisieren, nicht lokal raten.
5. Alte Lexikon-Reste unter `src/components/marketing/lexikon/` werden nicht mehr importiert. Erst löschen, wenn ein Grep und die Lexikon-Verträge das bestätigen.
6. Nicht angefasst, weil keine Marketing-Website: App, Admin, `/transfer`, `/partner-invite`, `/pro/*`.
7. Jeremy-Abnahme bleibt Pflicht vor Deploy.
