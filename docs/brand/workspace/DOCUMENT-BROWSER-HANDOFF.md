# Dokumentenablage – Handoff 2026-09-21

## Auftrag

Die Eigentümerseite /app/documents erhält eine echte Dateibrowser-Komposition: Die bestehende Werkbank-Sidebar bleibt links, der Inhaltsbereich enthält Ordner und Dateien gemeinsam, rechts steht eine breitere Vorschau mit verständlichen Details. Listen- und Rasteransicht verwenden denselben Datenbestand.

## Umsetzung

- src/app/app/documents/page.tsx lädt Eigentümerdaten über src/lib/document-catalog.ts und serialisiert nur sichtbare Metadaten sowie authentifizierte interne Endpunkte.
- src/lib/document-catalog.ts begrenzt Uploads/Rechnungen/Zahlungen auf den aktuellen Eigentümer. Haus-Historie-Dokumente erscheinen nur bei aktiver Eigentümerschaft. Zahlungsbelege entsprechen der bestehenden Belegroute und zeigen nur die jeweils letzte bezahlte Zahlung je Auftrag.
- packages/eh-design/src/document-browser.tsx enthält Suche, Ordnerpfad, Sortierung, Listen-/Rasterumschalter, Auswahl, Vorschau, Detailangaben und mobile Fokusführung.
- packages/eh-design/src/document-browser-model.ts enthält testbare Ordner-, Such-, Sortier- und Dateityplogik.
- packages/eh-design/src/styles.module.css enthält die kanonische tokenbasierte Browser-Komposition; keine neue Route-CSS-Datei.
- next.config.ts erlaubt das Framing ausschließlich für die beiden bereits geschützten privaten Dokument-Endpunkte. Die globale CSP bleibt frame-ancestors 'none'; die Endpunkte bleiben serverseitig authentifiziert, privat und no-store.

## Verifikation

Isolierte Checks im Arbeitsstand:

- node --experimental-strip-types --test scripts/document-browser.test.mjs scripts/document-catalog.test.mjs scripts/document-preview-headers.test.mjs → 6/6 bestanden.
- TypeScript-Prüfung der neuen TSX-/TS-Dateien → bestanden.
- Token-/Design-Guard-Prüfung des neuen CSS-Blocks → keine neuen Rohwertverstöße.
- Browserprüfung mit Chromium: Ordnernavigation, Listen-/Rasterwechsel, Suche, Rechnung öffnen, PDF-/Bild-/Fehlervorschau, leerer Zustand, fünf Breiten (390/736/1100/1280/1536), kein horizontaler Überlauf, Fokus hin/zurück → bestanden.
- Visuelle Belege liegen im lokalen Arbeitsstand unter evidence/; sie sind keine Produktionsassets.

## Noch auszuführen

Im GitHub-Branch nach dem Commit: npm ci, npm run typecheck, npm run lint, npm run build, relevante Release-/E2E-Prüfungen und eine authentifizierte Vorschau gegen eine echte Datenbank. Keine Baselines oder Deployments automatisch ändern.

## Auswirkungsprüfung

Der vorgeschriebene GitNexus-Index war in der Ausführungsumgebung nicht verfügbar; die verfügbaren Remote-Geräte waren offline. Jerry hat die direkte Quellcode-Auswirkungsprüfung als Ersatz ausdrücklich freigegeben. Geprüft wurden bestehende Dokumentenroute, Download-Endpunkte, private-Datei-Autorisierung, Werkbank-Shell, Designsystem-Exporte und die bestehende Zahlungsbelegabfrage.
