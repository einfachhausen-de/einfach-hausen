> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Reifere Produktkomposition – Referenzkandidat, 2026-09-11

Host: OCI sin-supabase. Worktree: /home/ubuntu/orca/workspaces/eh-mature-reference-20260911. Branch: design/eh-mature-reference-20260911. Basis: e620e5b.

## Auftrag und Status
Jerry beanstandet kindliche Komposition trotz bestandener Token-Gates. Diese Lieferung überarbeitet /hausakte und /app/home als Referenz. Keine neue Marke, kein Backendumbau. Noch keine visuelle Freigabe durch Jerry, kein Deploy. Historische abgeschlossene Aufgaben bleiben abgeschlossen.

## Umsetzung
EHPropertyOverview zeigt Gebäudedaten als kompakte Fakten. EHDetailDisclosure hält bestehende Formulare erreichbar, aber standardmäßig geschlossen. EHProductIntroduction begrenzt die öffentliche Einleitung auf eine sachliche Zweispaltenkomposition. Alle vier Komponenten sind kanonische, opt-in Bausteine in packages/eh-design/src/property-overview.tsx; Stile in styles.module.css, HTML-Adapter generiert. EHProductScreenshot bildet Oberflächen ohne Foto-Cropping ab. Nur fünf betroffene Core-Dateien im Lock nachgeführt; keine pauschale Neuversiegelung oder Gateabschwächung.

/app/home: großer Aktenumschlag und doppelte Wartungsliste entfernt, Stammdaten kompakt, Technik und nächste Wartungen im Arbeitsbereich, Jahresplan erreichbar. Bestehende FormData-Verträge und Server-Actions unverändert. /hausakte: kürzerer Einstieg, echte Produktaufnahme mit ausschließlich fiktiven Beispieldaten, konkrete Informationsfragen, Einstieg und FAQ. Screenshot ist kein interaktives Produkt und wird entsprechend bezeichnet.

## Verbindliche Kompositionsregeln für diese Referenz
- Markenfarben, Inter und Original-Logo beibehalten. Keine neuen Farbpaletten, beliebigen Rundungen oder dekorativen Mini-Dashboards.
- Datenübersichten zeigen Fakten vor Formularen. Bearbeitung bei Bedarf öffnen; Eingabefehler bleiben innerhalb des geöffneten Formulars.
- Wartung, Termin und Dokument nicht als austauschbare Werbekacheln darstellen. Kein zweites identisches Wartungsmodul auf derselben Seite.
- Produktabbildungen nur aus real gerenderten Oberflächen mit fiktiven Daten. Keine echten Kundendaten oder Sessionwerte in Git.
- Diese Referenz nicht ungeprüft auf sämtliche Apps übertragen. Jerry erhält zuerst Screenshots. Token-Compliance allein ist keine Gestaltungsabnahme.

## Nächster lokaler Agent
1. Eigenen Integrationsworktree vom aktuellen origin/main erstellen. Laufende WIP in /srv und im kanonischen Clone erhalten; kein reset/stash auf fremden Änderungen.
2. Diesen Branch und SOURCE.md prüfen. Vollständige Textdateien stehen in Codeblöcken, Binärdateien mit Hash im Manifest. Dateien nicht aus diesem Dokument zusammenraten.
3. Screenshots app/web bei 390, 736 und 1536 px ansehen und Jerry zur konkreten visuellen Beurteilung zeigen. Noch nicht als endgültig freigegeben ausrollen.
4. Speichern beider Formulare, Validierungsfehler, Wartung erledigen und Jahresplan-Link mit isolierten Testdaten prüfen. Backend bleibt unverändert; Integrationstests und Produktionsbuild lokal durchführen.
5. Kernkomponentenänderung als autorisierte Design-Release prüfen; bestehende geschützte Baseline nicht umgehen. Nur genehmigte Änderungen integrieren.
6. Anschließend Navigation prüfen: Hausakte unter Mehr ist schlecht auffindbar. Eigenen klaren Hausakte-Einstieg planen, aktive Zustände und Mobilnavigation mitprüfen. Chat-Launcher verdeckt Inhalte: kompakte, markentreue Darstellung und kollisionsfreie Platzierung ausarbeiten, Chatfunktion erhalten. Nicht mittels globalem display:none lösen.
7. Provider-Arbeitsbereich, Rechnungseditor und Detailseiten sind durch diese Lieferung NICHT neu abgenommen. Eigene Workflow-Kompositionen und reale Zustände separat prüfen. Offenen Live-Stripe-Erfolgstest aus bestehendem Handoff erhalten.

## Vorschau
Nur lokale Next-Entwicklung auf 127.0.0.1:4321; isolierte SQLite-Datei /tmp/eh-mature-preview-20260911.db. Auth-Fixture ausschließlich lokal, keine Änderung produktiver Anmeldung. Session nach initialer Datenbankinitialisierung neu angelegt. Vorschautoken nicht weitergeben oder committen.

Browsernachweise: 390/736/1536 px, beide Routen je genau eine H1, kein horizontaler Überlauf, beide Formulare geöffnet und Eingabefelder sichtbar. Speichern/Backend nicht neu getestet. GitNexus-Index ist veraltet; Impact-Analyse löst die neuen Symbole nicht auf.

Technische Prüfung: TypeScript erfolgreich; gezieltes ESLint ohne Fehler (unnötigen Kommentar danach entfernt); EH_DESIGN_CONSISTENT und git diff --check erfolgreich. Für die eingebettete Produktaufnahme wurden nur schwebender Chatlauncher und Next-Entwicklungsindikator während der Aufnahme ausgeblendet, damit kein zweiter Chat im Bild entsteht; echte App-Screenshots enthalten die unveränderte Oberfläche. Footerlogo-Kontrast bleibt globaler Folgebefund.
