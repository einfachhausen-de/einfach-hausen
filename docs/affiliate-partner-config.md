# Affiliate-Vergleichspartner – Konfiguration und Freigabe

Diese Datei beschreibt, was erfüllt sein muss, bevor eine Vergleichskategorie in
der Owner-App einen Partner ausleitet. Verbindliche technische Quelle ist
`src/lib/affiliate.ts`.

## Warum die Liste leer startet

`AFFILIATE_PARTNERS` ist bewusst leer. Solange kein Partner freigegeben ist,
zeigt die App in `/app/contracts?tab=vergleichen` alle fünf Kategorien mit
Kontext aus dem erfassten Vertrag, aber **keinen** ausgehenden Link. Es gibt
keine eigenen Tarifdaten, keine Rangliste und keine Ersatz-Empfehlung.

Fail-closed heißt: ein fehlender, deaktivierter oder unvollständig
konfigurierter Partner führt nie zu einem Link – auch nicht auf eine
Partner-Startseite.

## Freigabe je Partner

Erst eintragen, wenn für diesen Partner dokumentiert vorliegt:

| Angabe | Feld | Anforderung |
| --- | --- | --- |
| Interne Kennung | `id` | Stabil, nicht aus Nutzerdaten |
| Anzeigename | `name` | Freigegebene Schreibweise |
| Kategorien | `categories` | Nur aus `AFFILIATE_CATEGORIES` |
| Freigabe-Beleg | `approvalRef` | Vertrag/Ticket/Datum, nachvollziehbar |
| Ziel-URL | `targetUrl` | Absolutes HTTPS |
| Erlaubte Hosts | `allowedHosts` | Exakte Hostnamen, kein Substring |
| Erlaubte Pfade | `allowedPathPrefixes` | Mindestens ein Präfix mit `/` |
| Publisher-Parameter | `publisherParams` | Fest und freigegeben |
| Sub-ID-Parameter | `subIdParam` | Pflicht bei `trackingMode: 'click'` |
| Messmodus | `trackingMode` | `none` oder `click` |
| Ohne Einwilligung nutzbar | `untrackedAllowed` | Nur bei ausdrücklich freigegebenem trackingfreien Weg |

Zusätzlich zu klären, bevor `enabled: true` gesetzt wird:

- **Freigabe-Beleg** (`approvalRef`) liegt vor und ist einer realen Zusage zuordenbar.
- **Ziel-URLs** und erlaubte Platzierungen sind konkret benannt, nicht nur die Domain.
- **Transparenz**: Die Offenlegung (`affiliateDisclosure`) passt zum Partner.
- **Messmodus**: nur `click`, wenn die datenschutzrechtliche Bewertung vorliegt. `none` ist der konservative Standard.
- **Werbliche Kennzeichnung** in der App ist mit dem Designvertrag abgestimmt.
- **Beendigung**: Was passiert bei Kündigung der Partnerschaft (Partner deaktivieren, nicht löschen).

## Datenminimierung

Der ausgehende Link besteht ausschließlich aus geprüfter Serverkonfiguration plus
optional einer zufälligen Klickreferenz (UUID v4, nicht aus Nutzerdaten
abgeleitet).

Niemals in Ziel-URL, Sub-ID, Ereignis oder Klick-Log:

- Nutzer-, Haus-, Vertrags-, Auftrags- oder Dokument-IDs
- Name, E-Mail, Telefonnummer, Anschrift oder Postleitzahl
- Vertragsnummer, Kostenbeträge oder Tarifnamen
- interne Pfade, `referer` oder die ursprüngliche Anfrage-URL

Der Weiterleitungs-Endpunkt `GET /api/affiliate/[category]` verwirft
`source`-Werte außerhalb der festen Liste und akzeptiert eine Klickreferenz nur
in strikter UUID-Form. Eine Anfrage-Query wird nie an den Partner
weitergereicht. Der Redirect setzt `Referrer-Policy: no-referrer` und
`Cache-Control: no-store`.

Ohne Einwilligung wird nichts gemessen. Existiert kein freigegebener
trackingfreier Weg, bleibt der Vergleich sichtbar-unverfügbar, statt still
messend auszuleiten.

## Serverseitige Durchsetzung

Die Oberfläche und der Endpunkt lesen dieselbe Konfiguration. Ein im Browser
verändertes Ziel ist wirkungslos, weil:

1. der Client nur eine Kategorie nennt, nie eine URL,
2. der Endpunkt `buildAffiliateTarget` erneut aufruft und die Konfiguration
   erneut prüft (HTTPS, exakter Host, erlaubter Pfad, keine Zugangsdaten),
3. die zusammengesetzte URL vor dem Redirect ein zweites Mal gegen denselben
   Vertrag validiert wird.

## Klickmessung

Tabelle `affiliate_clicks` (siehe `db/migrations/0001-baseline.sql` und
`src/lib/db.ts`): Kategorie, Partner, feste Quelle, zufällige Klickreferenz,
Zeitpunkt. `UNIQUE(partner_id, click_ref)` zählt jeden Klick genau einmal. Ein
Fehler bei der Messung blockiert eine freigegebene Weiterleitung nicht.

Aufbewahrung: `AFFILIATE_CLICK_RETENTION_DAYS` (90 Tage). Die Löschung erfolgt
über die reguläre Datenpflege; es werden keine Rohdaten dauerhaft aufbewahrt.

## Prüfen

`npm run typecheck`, `npm run lint`, `npm run build` und
`npm run release-gate`. Der Vertragstext in der App und die tatsächliche
Konfiguration müssen zusammenpassen: eine Kategorie ohne Partner darf in der
Oberfläche nicht wie ein verfügbarer Vergleich aussehen.
