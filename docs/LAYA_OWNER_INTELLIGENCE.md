# Laya Owner Intelligence

Stand: 2026-09-22

Diese Schicht macht Laya zum unsichtbaren Eigentümer-Assistenten, ohne aus der App ein zweites KI-System zu machen. Laya entscheidet nur, welche feste serverseitige Fähigkeit gebraucht wird. Datenzugriff, SQL, Berechtigungen und mutierende Aktionen bleiben in kontrolliertem Anwendungscode.

## Die 12 Eigentümer-Fähigkeiten

| # | Nutzen | Umsetzung |
|---|---|---|
| 1 | Auftrag vorbereiten | `create_job` übernimmt die Nutzerbeschreibung als Draft in den bestehenden Hausmeister-Flow. Es wird nicht automatisch beauftragt. |
| 2 | Hausakte automatisch organisieren | Allgemeiner privater Dokument-Upload, OCR/Textauslese, Laya-Klassifizierung und sichere Review-Fallbacks. |
| 3 | Was braucht Aufmerksamkeit? | `next_actions` plus idempotente In-App-Hinweise für Fristen, Wartung, Termine, Angebote und echte Tarifchancen. |
| 4 | Tarif-/Vertragschancen | Aktive Nutzerverträge werden nur mit Angeboten eines in `affiliate.ts` freigegebenen Partners verglichen. Keine erfundenen Preise. |
| 5 | Angebote vorsortieren | `compare_quotes` stellt reale Angebote nach Preis, Termin, Distanz und Bewertung gegenüber, ohne für den Eigentümer zu entscheiden. |
| 6 | Intelligente Suche | Dokumentensuche berücksichtigt Titel, Kategorie und lokal extrahierten OCR-Text, strikt tenant-scoped. |
| 7 | Passenden Ansprechpartner anzeigen | Gespeicherte Kontakte werden anhand der Anfrage priorisiert; externe Handwerkersuche bleibt ein expliziter nächster Schritt. |
| 8 | Vollständigkeit der Immobilie | `house_check` prüft Kern-Hausdaten und sinnvolle Ergänzungen wie Verträge, Anlagen, Kontakte und Hausgeschichte. |
| 9 | Erinnerungen aus Dokumenten | Fristen/Fälligkeiten werden nur in erkennbarem Kontext extrahiert und als prüfbarer Hinweis angezeigt; keine stille Vertragsänderung. |
| 10 | Aufträge organisieren | `jobs`/`ownerJobOverview` gruppiert Entscheidung nötig, laufend und wartend. |
| 11 | Nur nötige Rückfragen | Der vorhandene Hausmeister-Flow bleibt Source of Truth und fragt nur fehlende Angaben wie Ort, Termin oder konkretes Problem nach. |
| 12 | App-Intent-Routing | Der Router verbindet Hausakte, Aufträge, Verträge, Kontakte, Kalender, Wartung und Hilfeflüsse ohne generatives Modell. |

## Architektur

`Nutzeranfrage -> deterministische Fast-Path-Regeln / Laya -> Capability -> owner-scoped serverseitiges Tool -> UI/Link`

Generative Aufgaben bleiben außerhalb dieser Schicht. Jev bleibt ausschließlich Ausweichweg für die Laya-Verfügbarkeit. DeepSeek wird durch diese Funktionen nicht für normale Eigentümerdaten benötigt.

Proaktive Prüfungen und Dokumentverarbeitung laufen im bereits vorhandenen `einfach-hausen-dispatch.timer`. Es gibt keinen neuen Scheduler und keinen zweiten Worker-Dienst.

## Dokumente und OCR

`PDF/Bild -> private Ablage -> document_intelligence_jobs -> Textauslese -> Klassifikation -> Suchindex/Metadaten -> In-App-Hinweis`

- PDFs: zuerst `pdftotext`, damit digitaler Text ohne OCR gelesen wird.
- Scan-PDFs: bis zu sechs Seiten bounded über `pdftoppm`, danach Tesseract. Sehr große Scans blockieren dadurch nicht den gemeinsamen Worker.
- JPG/PNG/WebP/TIFF: Tesseract direkt.
- HEIC/HEIF: lokal mit `heif-convert` in ein temporäres PNG normalisieren und danach Tesseract; das private Original bleibt unverändert.
- Standardsprachen: `deu+eng` (`OCR_LANG` kann angepasst werden).
- Laya klassifiziert lokal in: Rechnung, Angebot, Vertrag, Garantie, Wartung, Bericht, Versicherung, Energie, Sonstiges.
- Bei niedriger Sicherheit bleibt die Datei erhalten und wird mit „Bitte prüfen“ markiert.
- Dokumenttext wird nicht als Teil dieser Pipeline an Jev oder einen generativen Cloud-Provider gesendet.
- Erfasste Fristen sind Hinweise, keine automatische Änderung rechtlich/finanziell relevanter Datensätze.

Produktionsabhängigkeiten auf dem Host:

```text
poppler-utils      # pdftotext, pdftoppm
tesseract-ocr
tesseract-ocr-deu
libheif-examples    # heif-convert für iPhone-HEIC/HEIF
```

## Tarifpartner

`AFFILIATE_PARTNERS` in `src/lib/affiliate.ts` bleibt die einzige Freigabequelle. Die Angebotsdatenbank `tariff_partner_offers` darf keinen neuen Partner aktivieren. Ein Angebot wird nur berücksichtigt, wenn dessen `partner_id` für die Kategorie tatsächlich freigegeben ist.

Aktuell ist die Produktions-Partnerliste absichtlich leer. Deshalb meldet Laya momentan transparent, dass kein verifiziertes Partnerangebot vorhanden ist. Es wird kein Preis simuliert.

Sobald ein kommerziell freigegebener Partner vorhanden ist, kann dessen normalisierter Feed atomar importiert werden:

```bash
npm run tariffs:import -- /secure/path/offers.json
```

Beispielstruktur:

```json
{
  "partnerId": "approved-partner-id",
  "category": "strom",
  "offers": [
    {
      "providerName": "Anbieter",
      "tariffName": "Tarif",
      "annualCents": 109900,
      "postcodePrefix": "10",
      "sourceRef": "partner-feed-2026-09-22",
      "validFrom": "2026-09-22",
      "validUntil": "2026-10-31"
    }
  ]
}
```

Der Import validiert Partnerfreigabe, Kategorie, Preis, Postleitzahl-Präfix, Datumsfenster und Quellenreferenz vor dem atomaren Austausch. Ein fehlerhafter Feed löscht den vorherigen Datenstand nicht.

## Hintergrundlauf und Skalierung

Der bestehende Dispatcher führt zusätzlich aus:

- `syncOwnerAttentionBatch` — Standard `80` Eigentümer pro Lauf, konfigurierbar über `OWNER_AI_SCAN_BATCH`.
- `processDocumentIntelligenceBatch` — Standard `12` Dokumente pro Lauf, konfigurierbar über `DOCUMENT_AI_SCAN_BATCH`.

Ein Insight erzeugt nur dann eine neue Benachrichtigung, wenn sich sein Fingerprint ändert. Dadurch entstehen bei jedem 5-Minuten-Lauf keine wiederholten identischen Hinweise.

## Datenschutz und Sicherheit

- Alle Abfragen sind an die eingeloggte Eigentümer-ID gebunden.
- Private Dokumente werden ausschließlich über autorisierte API-Routen ausgeliefert.
- OCR-Text ist personenbezogener Inhalt und ist deshalb im DSGVO-Export enthalten und wird bei Kontolöschung entfernt.
- Allgemeine Hausdokumente sind Teil von BYOS/Archiv und folgen bei einer Hausübergabe der Immobilie.
- Laya erhält keine freie SQL- oder Mutationsfähigkeit.
- Aufträge, Tarifwechsel und Handwerkerkontakte werden nicht autonom ausgelöst.

## Produktionsnachweis 2026-09-22

- Laya-Service-Validator: genau eine benannte Choice-Frage; `route` und `document_kind` erlaubt, Mehrfachfragen fail-closed.
- Echter `document_kind`-Request am residenten Laya-Dienst: HTTP 200, Wartung korrekt, Confidence 1.0.
- Wegwerf-Smoke ohne Produktionsnutzerdaten: digitales PDF als Rechnung + Fälligkeit, PNG-OCR als Wartung + Wartungsdatum, echtes macOS/iPhone-HEIC als Garantie + Garantieende.
- Bei den Dokument-Smokes stieg `/health.completed` exakt pro Laya-Aufruf; damit ist nicht nur der lokale Fallback, sondern OCR/Text → Laya belegt.
- `npm run test:ai`: 35/35 grün; `services/laya/test_server.py`: 3/3 grün; Release-Gate 17/17; öffentlicher Smoke 18/18.
- Auf der OCI-VM sind `pdftotext`, `pdftoppm`, Tesseract und `heif-convert` installiert. `einfach-hausen.service`, `einfach-hausen-laya.service` und `einfach-hausen-dispatch.timer` laufen aktiv.

## Wichtige Dateien

- `src/lib/owner-intelligence.ts`
- `src/lib/document-intelligence.ts`
- `src/lib/ai-router.ts`
- `src/lib/ai-tools.ts`
- `src/app/app/documents/page.tsx`
- `scripts/dispatch-notifications.mjs`
- `scripts/import-tariff-offers.mjs`
- `scripts/owner-intelligence.test.mjs`
- `scripts/document-intelligence.test.mjs`
