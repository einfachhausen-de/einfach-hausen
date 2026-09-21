# Frontend · Arbeitsnachweis 21.09.2026

Fortsetzung des bestehenden App-/Workspace-Auftrags; keine neue Produkt-Roadmap.
Operator: „baue im frontend apps was noch fehlt“, ausdrücklich ohne Tests/Backend-Arbeit.
Basis: `c3a2e35de246794da4cb7ebec45fa5d57f3a6197`. Branch: `feat/app-frontend-completion-20260921`.
Implementierung: [`04348fb`](https://github.com/einfachhausen-de/einfach-hausen/commit/04348fb0a9ad8eb46b883fc5cce82a271e55e20d).

## Taskplan

- [x] Aktuellen main und lokale Übergabe abgleichen; bereits erledigte App-Kompositionen erhalten.
- [x] Optionale Suche im vorhandenen EHRecordViews ergänzen: Trefferzahl, Zurücksetzen, Fokus zurück zum Suchfeld, eigener Keine-Treffer-Zustand; Liste/Karten/Chronik teilen denselben gefilterten Bestand.
- [x] Suche für Verträge, Haus-Historie, Jahresplan, Partner-Anfragen, Partner-Aufträge/Kontakte und Partner-Termine anbinden.
- [x] Alle bereits geladenen Partner-Anfragen anzeigen statt nur fünf; bestehendes Serverlimit von 30 sichtbar benennen; Anfragen-Links auf den tatsächlichen Bereich führen.
- [x] EHFileInput: onChange weiterreichen, mehrere Dateinamen anzeigen, Beschriftung bei nativem bzw. erfolgreichem Formular-Reset zurücksetzen.
- [x] Angebotsfeld mit Cent-Schritten und Dezimaltastatur; bestehender Mindestbetrag bleibt.
- [x] Partner-Kalender: fehlendes Datum darstellen statt Formatierungsfehler; ISO-Tagesdatum für die Chronik. Maklerstatus auf Deutsch anzeigen.
- [x] Vollständige Quellen versioniert; Handoff und NEXT_AGENT aktualisieren.
- [ ] Lokaler Agent: Branch in den aktuellen Stand integrieren und die vorhandene Übernahme durchführen. Kein neuer Testauftrag für den Frontend-Agenten.

## Umfang und Grenzen

Kein Backend, keine Auth-/Datenbankänderung, keine Tests, keine CI- oder Design-Lock-Änderung.
Kein Build, keine Tests und keine Browserabnahme in dieser Lieferung; kein Merge/Deploy behauptet.
Die Suche gilt nur für den bereits geladenen Bestand der jeweiligen Liste; Kennzahlen bleiben Gesamtzahlen.
SQLite-Taskplan/GitNexus sind hier nicht verfügbar. Die bereits vom Operator erlaubte Markdown-Übergabe und direkte Quellprüfung wurden verwendet; kein kanonischer SQLite-Status wurde vorgetäuscht.

[Konkrete Übergabe mit allen Quelldateien](brand/workspace/FRONTEND-HANDOFF-20260921.md).

## Betreiberkorrektur: Kerngeschäft vor Zusatzfunktionen

Jerry hat nach der Frontend-Lieferung die bisherige Produktpriorität korrigiert. Dieser Abschnitt steuert denselben Auftrag; die zuvor gelieferten Such-/Uploadfunktionen sind keine Abnahme der App-Benutzerfreundlichkeit.

- [x] PRODUCT_VISION.md und PRODUCT_POSITIONING.md auf Handwerkervermittlung und Affiliate-Tarife ausrichten.
- [x] Kostenloser Eigentümer-Kern, Partnerabo und ergänzende Hausakte eindeutig festhalten.
- [x] Widersprechende Hauptanweisung in AGENTS.md ersetzen und NEXT_AGENT/Handoff synchronisieren.
- [ ] Nächste Frontend-Arbeit: Eigentümer-Einstieg mit „Auftrag einstellen“, „Tarife vergleichen“ und aktuellen Angeboten vereinfachen.
- [ ] Anschließend bestehenden Partner-Ablauf Anfrage → Angebot/Kostenvoranschlag → Auftrag → Rechnung vereinfachen.

Noch keine Umsetzung dieser neuen Priorisierung in den Screens behaupten. Keine neuen Preise oder Änderungen an Abrechnung/Berechtigungen ableiten. Vorhandene Aboregeln einschließlich Partner-FREE/Trial sind als separate fachliche Bestandsabweichung dokumentiert; dieser Frontend-/Dokumentationsauftrag ändert sie nicht.
