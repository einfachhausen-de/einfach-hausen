# Taskplan – Dokumenten-Dateibrowser 2026-09-21

## Ziel

Die Dokumentenseite soll sich wie eine professionelle Dateiverwaltung anfühlen: Werkbank-Sidebar links, Ordner und Dateien direkt in der mittleren Arbeitsfläche, breite Vorschau rechts, Listen- und Rasteransicht ohne Datenkopien.

## Status

- [x] Datenkatalog auf Eigentümer, aktive Hausakte und aktuelle Zahlungsbelege begrenzen.
- [x] Ordnerstruktur aus echten Dokumenten bilden.
- [x] Listenansicht mit Suche, Sortierung und Auswahl bauen.
- [x] Professionelle Rasteransicht ergänzen.
- [x] Breite Vorschau mit Details, Öffnen-Link, PDF-/Bild-Unterstützung und Fehlerzustand ergänzen.
- [x] Mobile Vorschau mit Fokusführung und ohne horizontalen Überlauf prüfen.
- [x] Private Dokument-Endpunkte nur same-origin framable machen.
- [x] Gezielte Tests und unabhängiges Review durchführen.
- [ ] Vollständigen Repo-Typecheck, Lint, Build und relevante Release-/E2E-Gates auf einem Online-Ausführungsrechner laufen lassen.
- [ ] Nach visueller Abnahme durch Jerry in main integrieren und deployen.

## Nächster Agent

Führe die vollständigen Repo-Gates im Branch aus und prüfe die authentifizierte Seite mit echten Daten. Falls die Gates grün sind, stelle Jerry die Browseransichten für Listen- und Rasteransicht vor. Kein Deployment und keine Baseline-Änderung ohne visuelle Freigabe.
