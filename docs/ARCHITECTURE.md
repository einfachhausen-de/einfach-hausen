> **Aktueller Designvertrag · 2026-09-06:** Jerry hat Atelier 02 ausdrücklich freigegeben. Verbindlich sind DESIGN.md, packages/eh-design und der Skill SIN-EH-design. Eigenständige Änderungen am Markenstil sind verboten. Vollständige Übergabe: docs/brand/system/HANDOFF.md; kompletter Quelltext: docs/brand/system/SOURCE.md. Frühere Statusangaben zu noch offenen Stilentscheidungen sind historisch. Restmigration: EH-BRAND-05-WEB, -APPS, -CRM, -HUB. Unternehmensidentität bleibt docs/COMPANY_IDENTITY.md (Gina Inhaberin/Geschäftsführerin, Jeremy Entwickler).

# Einfach Hausen — Architektur-Grundsätze

Diese Datei beschreibt die langlebigen Produktbeziehungen hinter der bewusst einfachen Oberfläche.

## Oberstes Prinzip

Komplexität gehört in die Technik, nicht in die Benutzeroberfläche. Ein Eigentümer soll immer in Alltagssprache starten können: **Was möchtest du erledigen?** Ein professioneller Anbieter hat **ein Konto** und erweitert darin seine Tätigkeiten und Leistungen.

## Öffentliche Website-Architektur

Die Marketing-Website ist keine zweite Produktarchitektur. Sie erklärt die vorhandenen Produktpfade und führt anschließend in dieselben Owner-/Provider-Flows. Die Top-Level-Navigation bleibt bewusst kompakt; fachliche Tiefe liegt darunter:

- `Leistungen` → Megamenü / Mobile Disclosure → 12 kanonische Servicebereiche.
- `src/components/marketing/service-catalog.tsx` hält Slugs, Titel, Kurztexte, typische Situationen und SEO-Copy als zentrale Quelle.
- `src/app/leistungen/[slug]/page.tsx` und `ServiceDetailPage` bilden den gemeinsamen Service-Archetyp; `/leistungen/heizung` bleibt als kompatible statische Route im selben Archetyp.
- `/beratung`, `/notfall`, `/versicherung` und `/immobilienverkauf` sind öffentliche Erklärschichten für existierende App-Funktionen, keine separaten Workflows.
- Sitemap, Navigation und Visual Canonicals werden aus bzw. gegen diese öffentliche IA geprüft.

Die visuelle Grenze bleibt `DESIGN.md` + `--eh-*`. Website-Optimierung darf Komposition, Hierarchie, Typografie, Spacing, responsive Verhalten und Accessibility verbessern, aber keine zweite Designsprache oder Rebrand-Tokens einführen.

### Visuelle / Präsentations-Source-of-Truth

Für T-0165 gilt die Kette **Notion App Design → `DESIGN.md` → `docs/PRESENTATION_BRAND.md` → `presentation/premium/brand.config.json` → `presentation/premium/deck.html`**. Notion ist visuelle Evidence, nicht automatisch fachliche Produktspezifikation. Änderungen am App-Design müssen daher auch gegen Presentation Brand und Präsentation geprüft werden; Owner und Pro bleiben auf derselben hellen visuellen Foundation.

## Kernmodell

![Plattformarchitektur](diagrams/platform-architecture.svg)

[Interaktive Architektur öffnen](diagrams/platform-architecture.html)

Die Immobilie ist ein eigener Datensatz. Sie gehört nicht technisch für immer zu einem einzelnen User. `property_ownerships` bildet den zeitlichen Eigentumsverlauf ab.

## Eigentümer-Serviceflow

![Eigentümer-Serviceflow](diagrams/homeowner-service-flow.svg)

[Interaktiven Serviceflow öffnen](diagrams/homeowner-service-flow.html)

## Anbieter: ein Login, flexible Tätigkeiten

Professionelle Nutzer verwenden immer denselben Provider-Zugang. Tätigkeiten sind relationale Kategorien und keine getrennten Login-Typen:

- Handwerker
- Dienstleister
- Immobilienmakler
- Gutachter / Sachverständiger
- Energieberatung
- Hausverwaltung

Ein Unternehmen kann mehrere Kategorien gleichzeitig aktivieren und später ändern. Konkrete Handwerksleistungen liegen separat in `provider_service_offerings` und werden für das Matching verwendet.

## Hausakte und Historie

Hausbezogene Daten hängen nach Möglichkeit an `property_id`:

- Aufträge
- Hausanlagen
- Wartungen
- Haus-Historie
- hausbezogene Ansprechpartner
- Anbieter-Einladungen
- Eigentumsübergaben

Abgeschlossene Plattformaufträge werden automatisch in die Haus-Historie übernommen. Frühere Arbeiten können manuell mit Kosten, Garantie, Wartung, Ansprechpartner, Vorher-/Nachher-Fotos und privaten Dokumenten ergänzt werden.

## Eigentümerwechsel

Eine Übergabe erzeugt **keine neue Kopie des Hauses**. Die bestehende Immobilie bleibt erhalten:

1. bisherige aktive Eigentümerschaft wird beendet,
2. neue `property_ownerships`-Zeile wird angelegt,
3. Haus-Historie bleibt am selben `property_id`,
4. hausbezogene Anlagen, Wartungen und Ansprechpartner gehen mit,
5. private alte Nachrichten, Zahlungen und persönliche Kommunikation werden nicht übertragen.

## Zahlungs-Lifecycle

![Zahlungs-Lifecycle](diagrams/payment-lifecycle.svg)

[Interaktiven Zahlungs-Lifecycle öffnen](diagrams/payment-lifecycle.html)

## Rechnungen

Der ausführende Partner kann direkt am Auftrag eine Rechnung erstellen und senden. Rechnungen enthalten Rechnungsnummer, Leistungs-/Rechnungsdatum, Zahlungsziel, Rechnungssteller/-empfänger, Positionen, Netto, Umsatzsteuer und Brutto. Der Eigentümer erhält die Rechnung in seiner Dokumentenansicht. Bei eingerichtetem Stripe Connect ist direkte Zahlung möglich; Einfach Hausen behält **0 % Auftragsprovision**.

## Beratung und Notfall

Beratung und Auftrag sind getrennte Absichten. Eine Beratung verbindet zunächst nur mit einem passenden Menschen. Notfallanfragen berücksichtigen zusätzlich aktuelle Bereitschaft, Entfernung, Qualifikation, Bewertung und hinterlegten Notfallzuschlag. 24/7-Anbieter und Anbieter mit eigenen Notfallzeiten verwenden dasselbe Partnerkonto.

## Datenschutz-Dataflow

![Hausakte und Datenschutz](diagrams/property-privacy-dataflow.svg)

[Interaktiven Datenschutz-Dataflow öffnen](diagrams/property-privacy-dataflow.html)

## Datenschutz und Freigaben

Anbieter sehen nicht automatisch die Hausakte. Zweckgebundene Freigaben liegen in `property_shares` und enthalten:

- Immobilie
- Eigentümer
- Anbieter
- Zweck
- explizite Berechtigungen
- Freigabezeit
- Widerruf

Beispiel Verkauf: Ein Makler sieht den Eigentümerkontakt und eine begrenzte Objektzusammenfassung erst nach **Kontakt freigeben**. Rechnungen, Versicherungen, private Nachrichten, Zahlungsdaten und vollständige Dokumente bleiben gesperrt.

## Verkauf, Bewertung und Makler-Matching

Immobilienbewertungen sind eigene Datensätze in der Hausakte. Bei Verkaufsinteresse wird ein `sale_lead` erzeugt. Makler hinterlegen Suchprofile für Region, Immobilientyp, Kaufpreis, Wohn-/Grundstücksfläche, Wohnen/Gewerbe und Spezialisierungen. Matching erzeugt nachvollziehbare Passungswerte; Kontaktdaten werden erst nach Eigentümerfreigabe sichtbar.

Leadstatus sind messbar: vorgeschlagen → Kontakt freigegeben → Interesse → Besichtigung → Auftrag → verkauft bzw. abgelehnt/widerrufen.

## CRM- und Outreach-Grenze

Die Plattformanwendung und das Akquise-/Outreach-Control-Plane sind bewusst getrennt, aber arbeiten auf einem gemeinsamen fachlichen Lead-Lifecycle:

- `einfach-hausen` besitzt Nutzer/Provider-Konvertierung, plattforminterne CRM-Referenzen und den ursprünglichen SQLite-Leadbestand.
- `einfach-hausen-crm` besitzt die standalone Operator-/Agent-Oberfläche auf `crm.einfachhausen.de`, Cloudflare-D1-Queue, Dedupe, Lease-Claims, Contact-History, Inbox und Follow-ups.
- Generische Recherche-/Outreach-/Connectorlogik bleibt in den gemeinsamen SIN-Fähigkeiten und wird nicht in einem der beiden Produktrepos kopiert.
- Während der initialen D1-Konvergenz wird der bestehende Haupt-App-Leadbestand idempotent in D1 synchronisiert. Unbekannte Kontaktfreigabe bleibt unbekannt; `do_not_contact` bleibt fail-closed.

Agents dürfen daraus **keine zwei konkurrierenden CRMs** machen. Repository-Ziele und aktuelle Fortsetzung stehen jeweils in `docs/NEXT_AGENT.md` und dem kanonischen `.sin-gpt-web`-Taskplan des Repos.

## Technische Vervollständigung v2 (historischer Planungsstand)

Hinweis (2026-08-29): Dieser Abschnitt beschreibt den historischen v2/HA-Planungsstand (T-0100..T-0131, T-0166 Supabase-Migration, T-0167 Capacitor). Die Migrations-/Release-Tasks wurden nie ausgeführt und sind nicht Teil des aktuellen Taskplans; maßgeblich ist die kanonische `.sin-gpt-web`-Datenbank. Technische Grenzen des damaligen Plans:

- **Onboarding/account lifecycle:** homeowner and partner first-run journeys plus recovery/session revocation remain on the existing identity model.
- **Notification pipeline:** business transactions emit a durable, versioned outbox event; dispatch/retry/channel adapters and user-visible inbox state consume that event idempotently.
- **Matching quality:** the existing matcher gains privacy-safe decision traces, freshness/capacity rules and deterministic benchmark fixtures; monetization remains excluded from ranking quality.
- **Trust/reviews:** reviews are derived only from verified completed service relationships, with moderation/audit and truthful low-sample aggregates.
- **i18n/a11y/performance:** typed locale boundaries, WCAG-critical shared interaction rules and measurable CWV/server budgets become release gates rather than one-off audits.
- **Security/observability:** adversarial regression, supply-chain gates, structured redacted correlation and SLO probes reuse the current OCI/Next.js stack.
- **Feature flags/admin/privacy:** minimal server-authoritative flags, one restrained admin operations console, and authenticated export/request workflows avoid a second control plane.
- **Release proof:** T-0129 production-style browser E2E and T-0130 deterministic visual regression converge into T-0131 final technical completion.

Externe Blocker: siehe `docs/EXTERNAL-BLOCKERS.md` (nur verifizierte Fakten).

## Authentifizierungsarchitektur — Deep-Research-Konvergenz T-0168

Die Zielarchitektur für geschützte Owner-/Provider-Flächen ist serverautoritativ:

- **Supabase ist die einzige Produktions-Identity-Authority.** Browser-Sessionzustand darf UI steuern, aber keine Produktionsberechtigung erteilen.
- `currentUser()`, `requireUser()` und `requirePro()` müssen auf eine konsistente serverseitig verifizierte App-Identity konvergieren.
- `mh_session`/SQLite-Auth ist nur als **expliziter Local-Dev-Fallback** zulässig. Es gibt keinen stillen Fallback von Supabase auf lokal.
- Ein Local-Auth-Modus in Produktion muss **fail closed** enden.
- `AuthContext` ist UI-State und darf weder gültige Server-Autorisierung überschreiben noch geschützten Zugriff gewähren.
- Server Actions autorisieren vor jeder sensiblen Mutation erneut.
- Die Zuordnung zwischen Supabase-Subject und bestehendem Application-User ist explizit zu modellieren; `supabase user.id == app users.id` darf nicht ungeprüft angenommen werden.

```text
Production
  Supabase verified identity
    -> AppIdentity
    -> requireUser()/requirePro()
    -> protected Server Components / Route Handlers / Server Actions

Development
  AUTH_MODE=supabase    -> gleiche Semantik wie Produktion (Supabase Session, serverseitig verifiziert)
  AUTH_MODE=local       -> mh_session/SQLite nur wenn NODE_ENV != production

Production + AUTH_MODE=local -> fail closed
```

Die vollständigen Forschungs-, Test- und visuellen Acceptance-Regeln stehen in [`T0168_DEEP_RESEARCH.md`](T0168_DEEP_RESEARCH.md).

## Produktions-Infrastruktur — OCI + SIN Supabase OSS

Zielproduktion ist **Multi-User auf OCI**. Hochverfügbarkeit wird nur dort als verifiziert bezeichnet, wo Redundanz, Backup/Restore und Failover tatsächlich nachgewiesen sind (aktuell: nicht nachgewiesen):

- OCI-VM als Runtime hinter Cloudflare Tunnel
- **SIN Supabase OSS auf OCI** als Auth-Autorität (`AUTH_MODE=supabase`, serverseitige Session-Verifikation); Supabase Cloud ist nicht Teil der Zielarchitektur
- **App-Datenbank: SQLite + WAL via `better-sqlite3`** (`DATABASE_PATH`) — verifizierter Laufzeitstand in Produktion; ein Postgres-/Storage-Adapter existiert im Code nicht (Stand 2026-08-29)
- `private/`/`uploads/` als persistente lokale Verzeichnisse per Symlink
- Local-Auth in Produktion fail-closed
- Kestra für geplante Checks
- OmniRoute für optionale Assistenzfunktionen
- Stripe/Connect für Abos und Zahlungen

Der Code- und Agentenpfad ist nach dem Übergabe-Release **GitHub → OCI-VM**. Mac-M1 bleibt Source/Release/Recovery und ist nicht mehr der kanonische Worker-Host. Direkte Working-Tree-Kopien vom Mac nach OCI sind verboten.

Eine Migration SQLite → Supabase Postgres wurde geplant (T-0166), aber nie ausgeführt; der laufende Code kennt keinen Postgres-Adapter. Begriffe wie **HA**, **PITR** oder **Failover** gelten erst nach frischem OCI-Evidence für die tatsächlich betriebene Konfiguration.

<!-- SIN-GPT-WEB-HANDOVER:BEGIN -->
## SIN GPT Web completion / handover sync

- Last synchronized task: `T-0043`
- Canonical taskplan: `.sin-gpt-web/taskplan.sqlite3`
- Canonical repo goal: Einfach Hausen vollständig fertigstellen und vor allem App und Website auf Produktionsqualität verbessern
- Resume rule: product-completion v2 is T-0100..T-0131; continue the highest-priority eligible canonical task (currently T-0100) and do not create a competing roadmap.
- Taskplan sync: `pass`
- Synchronized at: `2026-08-26T03:34:55+00:00`
- Contract: `sin-gpt-web-completion-handover-v1`
<!-- SIN-GPT-WEB-HANDOVER:END -->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0100
updated: 2026-08-31T20:52:50+00:00
actor: local-agent
evidence-sha256: f42a70c09249785cee78d453593730b02e462563c2ea52dd3f96ff13d447e5a6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0101
updated: 2026-08-31T20:52:50+00:00
actor: local-agent
evidence-sha256: ad159f2cc950ebf498af6d9f88b455def41b635fe25d5b965a5a13b3ca89b222
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0102
updated: 2026-08-31T20:52:51+00:00
actor: local-agent
evidence-sha256: 2e7357efbd529ac1f58e185753fb74a4020585d1823d89156e4b2506b6f36dc2
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0103
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: 9f513f7079d3261f78b90b6bd9147004c81eee2c312db6be84f3df048cbcd64a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0104
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: baeb3b5cc21ca5732de76caf6600b1e9e796a5df3a459eb6ee6aa3c10927d7e1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0105
updated: 2026-08-31T20:53:01+00:00
actor: local-agent
evidence-sha256: 8f8c2cb7dbb63a32f95b7554a3432704679483f51eb02ca0a1876028014cadc5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0106
updated: 2026-08-31T20:53:02+00:00
actor: local-agent
evidence-sha256: 28e3a69bfc9528cee8757764023da67b82126fb41f50201e9db1a69ef64db976
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0107
updated: 2026-08-31T20:53:02+00:00
actor: local-agent
evidence-sha256: a4d0746af463ce97c8c6bfd1c870936634047e723fc48a76bca188862de4567d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0108
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: 8b95638cc3257cbeb6b6c700584c9d1c131e195a1a2cdb0831b6d5633cfb338f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0109
updated: 2026-08-31T20:53:03+00:00
actor: local-agent
evidence-sha256: b7ba6dde2f1cca415fa54b2d0c4f96699805deca3a08c09163dee092774c63f6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0110
updated: 2026-08-31T20:52:53+00:00
actor: local-agent
evidence-sha256: a73593c023c7d82fc6306ea2fce3f45eaac6fe94ff94c60589a048581736f648
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0164
updated: 2026-08-31T20:52:58+00:00
actor: local-agent
evidence-sha256: 6e808dd8296359a6ed71a9bc0233622843628ce933fabc8f2bd6be9c18a06087
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0165
updated: 2026-08-31T20:52:59+00:00
actor: local-agent
evidence-sha256: 35e2db2bb0dd5858f605cfd6057a51bd5a2cc1733437cbe03b37f501140d5259
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0167
updated: 2026-08-31T20:53:05+00:00
actor: local-agent
evidence-sha256: fbb81df390757352fa4b5eef8a9d588c872e51e967bf063af55523cd0790203a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0168
updated: 2026-08-31T20:53:05+00:00
actor: local-agent
evidence-sha256: cddef743ddcbea9daa1ac14e2f401c5e68470280862077bedb48542798d521e3
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0169
updated: 2026-08-31T20:53:06+00:00
actor: local-agent
evidence-sha256: 9e54c89cf783fdec3bfac2b296c5cf87812231375dc96e2f9f25c4b4aa627210
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0173
updated: 2026-08-31T20:53:06+00:00
actor: local-agent
evidence-sha256: 3b42e8e7560437f09e36c1c1afc42223cc10fc5140880d68b9edab0e386d9c4d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0170
updated: 2026-08-31T20:53:08+00:00
actor: local-agent
evidence-sha256: 3301600a2ffff136c37ca355c7a51268296d9f2959e02ab5de8480a77935685f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0171
updated: 2026-08-31T20:53:08+00:00
actor: local-agent
evidence-sha256: fd8973c6f65fbc9de171997c767818934e0bcd1b2dd47cb00d312955bb498efa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0140
updated: 2026-08-31T20:52:55+00:00
actor: local-agent
evidence-sha256: 9a98b49675963b2ea908a68a789931a1ce3a120c18862d3fba049bda0fb087c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0141
updated: 2026-08-31T20:52:55+00:00
actor: local-agent
evidence-sha256: d2ac93b376b977a7e8c1e97fa78f2e3cc4a6fa132413259427293fa43456d185
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0172
updated: 2026-09-09T01:36:03+00:00
actor: local-agent
evidence-sha256: daaa73300e8e73e245696aebf9a87df6fcda45e85b2000a58c1213f2145d5d71
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0174
updated: 2026-08-31T20:53:07+00:00
actor: local-agent
evidence-sha256: e1e1520308294faa680b6bcbe176f96dc1d6131f95d218cc19ab176a39d3e9e9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0175
updated: 2026-08-31T20:53:07+00:00
actor: local-agent
evidence-sha256: da531fc298590aed92dd381b806c51d629170dc0414b589bddcdb3ac7a92d208
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0176
updated: 2026-08-31T20:53:09+00:00
actor: local-agent
evidence-sha256: 48a6469d9986ed404e1e7aeabe1156491db410f54682f13015cd57bb8a212e48
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0177
updated: 2026-08-31T20:52:59+00:00
actor: local-agent
evidence-sha256: 9b8b11fb86f4f29f8111ff8159cfd63f0d8147ad9c9fe8172abe609087578c9e
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0148
updated: 2026-08-31T20:52:56+00:00
actor: local-agent
evidence-sha256: 4ef622af886af3eec0fcee15e0c9b6f3701562e2b54c557679f7865d0015c705
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0149
updated: 2026-08-31T20:52:56+00:00
actor: local-agent
evidence-sha256: ee7dd33a827a4186797e2e9fd11b46d1d34b100736afd7c3edb1ecccd9661465
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0150
updated: 2026-08-31T20:52:57+00:00
actor: local-agent
evidence-sha256: 8408674ed32c856ac5fa4c249f081c989efe634068d4e1c18a36080b76426a4d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0158
updated: 2026-08-31T20:52:57+00:00
actor: local-agent
evidence-sha256: 1334808461c1eefcd702dde2d78c41249acef0f3a9ad16fb200938bea3b44d16
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0159
updated: 2026-08-31T20:52:58+00:00
actor: local-agent
evidence-sha256: 4f805b7450d7a6291c49d70fbd741f091ce1c5cbd8e5e3de65e85b8daa1590aa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0135
updated: 2026-08-31T20:52:54+00:00
actor: local-agent
evidence-sha256: 8cc3663b0397c2fbcef390d333845930ad753ab448184830a67735e6b2b43ac0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0004
updated: 2026-08-22T16:24:18+00:00
actor: local-agent
evidence-sha256: 4aaa04f685e833bd81528668f15ce9ca3bd1e3e37227af5d8e2fb1df720a513a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0005
updated: 2026-08-22T17:06:16+00:00
actor: local-agent
evidence-sha256: fa183425e21f31b54cdc90edc511fb1218cf517590a404b9fb51fd05e56fb6da
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0200
updated: 2026-08-30T04:10:43+00:00
actor: local-agent
evidence-sha256: 425e861d61478080b23cc52ad6b64973eb901e909bbe35dd7fb24a555e299358
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0201
updated: 2026-08-30T04:29:48+00:00
actor: local-agent
evidence-sha256: c5758386de9a32943594941ee15b2faf7dd48bcd822565e0419448383e33c180
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0202
updated: 2026-08-30T04:39:54+00:00
actor: local-agent
evidence-sha256: 0bc75649da580b92e8c385c0ce01f150f9b48f18b1ac0d2c9ee40525373e504f
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0203
updated: 2026-08-30T04:59:52+00:00
actor: local-agent
evidence-sha256: b734c3298856af57db7cbd01c11010da44ffcc25472c8142ae1011378a1a4699
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0204
updated: 2026-08-30T12:37:24+00:00
actor: local-agent
evidence-sha256: 26d2c37b44b0e2ecdd412fa38e9987742b09de7fdb3d65324b840eee1997f5d8
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0205
updated: 2026-08-30T12:37:24+00:00
actor: local-agent
evidence-sha256: f1288185ef3bec19c87d3ccaf8e935f8a33480e8db7f734bae58d6874f3a4d43
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0042
updated: 2026-08-31T20:52:48+00:00
actor: local-agent
evidence-sha256: b0522c720f2d26ef171afa4f8b0bd77eb82cd987694ae7791144c8df2c9124fd
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0043
updated: 2026-08-31T20:52:48+00:00
actor: local-agent
evidence-sha256: 7690208a2287a2d7d24bc2b266c299ac0cdbdaac3e76839323fb142c4ea23138
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0049
updated: 2026-08-31T20:52:49+00:00
actor: local-agent
evidence-sha256: 0d6781d978ed15bc779a17b686785e5efe3810adb2563c2731c51acc8f2f82c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0157
updated: 2026-08-31T21:16:05+00:00
actor: local-agent
evidence-sha256: 7f99e3ef8bfd11d211e6dbda80fa766914a185971e4f6883515209aba957fb5f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0160
updated: 2026-08-31T22:25:51+00:00
actor: local-agent
evidence-sha256: a0374312071e4a6d50a86e2706a720cb563cff292dd03c20102c6c0ac8b63098
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0161
updated: 2026-08-31T22:54:54+00:00
actor: local-agent
evidence-sha256: 8347892ea96120456d7b66b9aba1440561a66d689fce427bda41928e3e8003b4
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0162
updated: 2026-08-31T22:54:54+00:00
actor: local-agent
evidence-sha256: ff5ccd0484ed2266c6ce264e4b9f21b41f1bd97f7e8c73ff4c98e9216edf19cd
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0163
updated: 2026-08-31T22:56:47+00:00
actor: local-agent
evidence-sha256: fb1882e2df32385413315728fdb2731a84376c39873250aa2cf0335a2c913c98
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0154
updated: 2026-09-01T00:56:58+00:00
actor: local-agent
evidence-sha256: 83e5ed487aff86dee8b825d9f06d859654d292349ec6538442ac1f725c3dbe1b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0152
updated: 2026-09-01T01:03:10+00:00
actor: local-agent
evidence-sha256: 75fc109f1509113951e589eae987093b5e6ae117d9fd29e758a6c673897685d3
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0153
updated: 2026-09-01T01:03:10+00:00
actor: local-agent
evidence-sha256: 08da5c23cd9a4bb84512af6dc432989154d9da35f011f18bf9ef15fb7a650193
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0155
updated: 2026-09-01T01:47:14+00:00
actor: local-agent
evidence-sha256: 02c7cb988ff4f3990fdd17d9a4772d50152245ab2becbbd66f768202ec391bc8
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0156
updated: 2026-09-01T03:30:24+00:00
actor: local-agent
evidence-sha256: 994ea2169cfa09d65fa7fa4e2b29c4f8e02de905c613b7d24ebd946ec7c7d4b0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0115
updated: 2026-09-01T03:30:25+00:00
actor: local-agent
evidence-sha256: ef7edcae3cf6bd3ad470c34205fa815916c109e4709b0298ac4f0a4068e48968
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0111
updated: 2026-09-01T12:44:55+00:00
actor: local-agent
evidence-sha256: 87e072d5e2c574dbf26ce3c530c85fb1d6a5a871034892d6adf8dc40ec8a3ae9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0112
updated: 2026-09-01T12:44:55+00:00
actor: local-agent
evidence-sha256: f193fa11049f920c888558209118f7b7592a95a4e86ace0c92274995b906db8d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0138
updated: 2026-09-01T13:24:20+00:00
actor: local-agent
evidence-sha256: 0ab111892a30d55ad46e7f6232b32f64656dee72cc4b9937613c3f2a3d9c925a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0142
updated: 2026-09-01T13:24:20+00:00
actor: local-agent
evidence-sha256: bceab63e963dd389c859027e3e4221a6a50386a99dfad656912ed9445f0038fe
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0113
updated: 2026-09-01T13:55:36+00:00
actor: local-agent
evidence-sha256: 07b6275707f950b590ed96ec928ab841e01791e4761d591f616d20f0fc5e80cc
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0114
updated: 2026-09-01T13:57:24+00:00
actor: local-agent
evidence-sha256: db6e60f478405d43372683fbf7d760ddb32ef5fb7c5c608ca152e3115cca052b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0116
updated: 2026-09-01T17:55:42+00:00
actor: local-agent
evidence-sha256: cfbef8fb88b67a309e81fa923357ecfc6f2a6808005e9d697e457401171f9ce5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0117
updated: 2026-09-01T17:55:42+00:00
actor: local-agent
evidence-sha256: 32b178026b6612aa0bc5ea8813b094a8e7b84293e8c9f8a5706a02435767ed03
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0136
updated: 2026-09-01T18:06:52+00:00
actor: local-agent
evidence-sha256: 766040d87c6e2dbae195442af395ea3b2fddc2c114f4fbe4a7963f3a4d6463ea
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0147
updated: 2026-09-01T19:19:57+00:00
actor: local-agent
evidence-sha256: 4149908d9dda7f1397ce06f9aadccce2ae5c038d469a1adeb8e1e3f02d0a2ff9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0118
updated: 2026-09-01T20:51:22+00:00
actor: local-agent
evidence-sha256: c55fee22cf93a7578d26053014ef8e42b4a7534775e5e1a5d1fd60053eb1d405
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0119
updated: 2026-09-01T22:14:14+00:00
actor: local-agent
evidence-sha256: 0acd76be267c23dd81333e674d9c0eee29d42c3f07154718697fae9f793a26b6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0210
updated: 2026-09-02T23:18:15+00:00
actor: local-agent
evidence-sha256: 80f9aad504a029dbe80faed7a0cf4c152de5bf88a4b1880edf60f754211dea51
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0211
updated: 2026-09-02T23:18:41+00:00
actor: local-agent
evidence-sha256: 60f232b4e4d8bb71c603011e8a96ba47b0b2b4f04b45106ed5ab759dbc9d69a0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0120
updated: 2026-09-02T23:49:07+00:00
actor: local-agent
evidence-sha256: 73903ba5ee89d8c893c1f1fd2a10d42aeeba247966ba2045494555aa353d28e5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0121
updated: 2026-09-02T23:56:26+00:00
actor: local-agent
evidence-sha256: 01f5f6cb64432cac1825787493c591f7d4d2c263eff4860738564f29f1259336
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0122
updated: 2026-09-03T00:15:44+00:00
actor: local-agent
evidence-sha256: dca081a3188c1676492cf6cfd60f6b5d044444af48a818ae6173c43636c209fb
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0131
updated: 2026-09-03T12:19:04+00:00
actor: local-agent
evidence-sha256: 95b14cf53c5f2030d04c08f2b5dd9dfbb343623139fc5ce9e720d09533c6be38
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0123
updated: 2026-09-03T00:23:19+00:00
actor: local-agent
evidence-sha256: d05fdcb413b5af3832a99bb11e2726eab2c7c3682e25b7c74203edb5e4bd3544
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0124
updated: 
actor: local-agent
evidence-sha256: 7b56927949e37e438aa734d75f4b3eed9bd85a667118aa51838decfaccecfcb7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0129
updated: 
actor: local-agent
evidence-sha256: a2028224c451c9d493976891e8e4061d8fbe7cbe6e5155f21be5f251a13b16be
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0130
updated: 
actor: local-agent
evidence-sha256: db4bfd0327fb8cd3dcc011d26631b8b064c1a6b0952880d4fbb8d34877b61b84
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0125
updated: 
actor: local-agent
evidence-sha256: 24ead3c1a5c517e9724996338b7426ad3e8e2c18cd519e08d1f683f72f4d788b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0126
updated: 
actor: local-agent
evidence-sha256: 1acbbc8c9d9ec3b87035c8d0521fa2c3622fa697e6d719310f61795b15fda6e8
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0127
updated: 
actor: local-agent
evidence-sha256: 0640af1175d4cd871685513652419379eec835cf543aed5dfc69b0bfcadc4a29
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0128
updated: 
actor: local-agent
evidence-sha256: 52a6748748dfe2d958322ba6584bcd9e8cd8284ed731054bf7f3d48948bf4d4a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0132
updated: 2026-09-03T13:48:49+00:00
actor: local-agent
evidence-sha256: 7e0b781bd511bf7c78d504be2551763dc8d69cb587488ebbb271c6ea9297cc0b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0134
updated: 2026-09-03T14:38:08+00:00
actor: local-agent
evidence-sha256: 3ad2590c9c31b9a8bcfe0e7212d85d446458c4690bf1ff152b848245aa2ab81c
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0137
updated: 2026-09-03T14:57:29+00:00
actor: local-agent
evidence-sha256: 73bd2d6844b5aeaef8c0a753fb3ffc143ba55ec8b8a6ea80d0937f17d8d01123
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0143
updated: 2026-09-03T15:20:03+00:00
actor: local-agent
evidence-sha256: d669bf8aeac2f37f703094ffd9db570e6d658293f99d7995729a5420ac2b89c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0144
updated: 2026-09-03T16:36:34+00:00
actor: local-agent
evidence-sha256: 765f10be899bb7edd6395df543b8cdc5f0d0ef9c4670d5dc185d848f11bbcb39
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-01
updated: 2026-09-06T00:46:30+00:00
actor: prime-agent
evidence-sha256: aa823be75191650b55367801543a3d6f9565f6acc4023427e89de00885b7ab9b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-02
updated: 2026-09-06T00:46:30+00:00
actor: prime-agent
evidence-sha256: aa823be75191650b55367801543a3d6f9565f6acc4023427e89de00885b7ab9b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-03
updated: 2026-09-06T08:05:25+00:00
actor: chatgpt-web
evidence-sha256: 4507a81925e57caf5947f5cf5489e0d59dc2921fba11a6902bf52d2baf09c4f4
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-04
updated: 2026-09-06T20:09:19+00:00
actor: chatgpt-web
evidence-sha256: 5114f14401e6e23ddd983775a51c5a8e1db89c2d6092a28b3304c59c45dd65ae
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-APP-COVERAGE
updated: 2026-09-06T22:40:19+00:00
actor: local-agent
evidence-sha256: 5ade9dc3a11113a69057f1a7fd3d37828c6dffa092c335a17ec41dc127fba1dc
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-04-R2
updated: 2026-09-06T22:58:55+00:00
actor: local-agent
evidence-sha256: 5297533580034decc51d043ff1cc0c19fd189e3b8666af8eca66a56d7fe78106
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-APPS
updated: 2026-09-07T09:46:06+00:00
actor: local-agent
evidence-sha256: aa25baaa016bcf64563c1194b16402bbf2f70099674c2fed3050e31cad982da5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0145
updated: 2026-09-07T15:40:44+00:00
actor: local-agent
evidence-sha256: 8a0d123d7986ce23d4b44a81962d5c80f660962912df8aa6ca3a80d4fb971ff1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-WEB
updated: 2026-09-07T15:42:00+00:00
actor: local-agent
evidence-sha256: 5d479d537dc1a308fb33c559a4ebed39b7d29eb42929fcec65af97e584a85625
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0133
updated: 2026-09-07T16:11:04+00:00
actor: local-agent
evidence-sha256: bf8f5935018f755d0889723675beae705dcbf68623bb749f02ea254b258714e1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0139
updated: 2026-09-07T16:22:19+00:00
actor: local-agent
evidence-sha256: 46135bd1f7765e7da6d9c33f49df38f730beb056f428a98d8d598e7ae3239275
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0146
updated: 2026-09-07T16:33:33+00:00
actor: local-agent
evidence-sha256: 1bc3466f4209a88e0e08b805d40e1ea395406db8d735bae99df68e6a25e4aae0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-HUB
updated: 2026-09-07T16:56:33+00:00
actor: local-agent
evidence-sha256: 904cd87db9d3e5092e50dc56992e8758987a4477a8153ade6eed0f1985389888
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0151
updated: 2026-09-07T17:11:32+00:00
actor: local-agent
evidence-sha256: 1aff41d46d74a7fadab58ab6f600da298c53f5177c45bb9dff7cd4b077055aaa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-CRM
updated: 2026-09-07T18:57:23+00:00
actor: local-agent
evidence-sha256: f05b5cb9a79e1d9a720fb63db01722b1fa2fb1103f5d916d9e79e42e72ba1567
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05
updated: 2026-09-07T18:57:39+00:00
actor: local-agent
evidence-sha256: 75d41828db93f7f1cf0319cb62b4555505145aa7e350e3f76b5e54e3998e980b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-06
updated: 2026-09-07T19:04:42+00:00
actor: local-agent
evidence-sha256: 5f22e53b7db61e188b5dc47f904485e0d6871007582380be638be5b78ce4a5ab
-->
=======
task: EH-01
updated: 2026-09-05T02:00:41+00:00
actor: chatgpt-web
evidence-sha256: 223ddabf850fcb56047dafd0834c4648fe0356286d14630d790002d451660459
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-02
updated: 2026-09-05T02:19:47+00:00
actor: chatgpt-web
evidence-sha256: d3169b9afa465be4ab22588b73903be33178b28010810633f5fb6546dc51f563
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-03
updated: 2026-09-05T04:33:10+00:00
actor: local-agent
evidence-sha256: b9300da9b1e348fc386da08fda11e75c105f6db589d60a0f190ae0af25041437
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-04
updated: 2026-09-05T06:26:03+00:00
actor: chatgpt-web
evidence-sha256: 0bf6db00102a87441e641b95f92d629df17ac5aa3144da80eeb67f83cab48460
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-05
updated: 2026-09-05T09:09:00+00:00
actor: chatgpt-web
evidence-sha256: e072648f313eb7d38b0daa3a917b5f8b9cfbee90f62754f8cef486aa6b258c03
-->

## EH-BRAND — Operator-Auftrag vom 06.09.2026

Die Markenstudie liegt unter design/brand-study/ und ist unabhängig von Next-App-Routen, Auth und Backend. Ein Node-Server bindet nur 127.0.0.1 und liefert ausschließlich explizit erlaubte Studien-/Logo-/Font-/Bilddateien. Keine Freigabe des Repository-Verzeichnisses per allgemeinem Dateiserver. Kanonischer Taskplan bleibt die bestehende SIN-Datenbank in /home/ubuntu/dev/einfach-hausen; Dokumente und Issues sind Verweise, keine neuen Statusautoritäten.

- Spezifikation: `docs/superpowers/specs/2026-09-06-einfachhausen-brand-system-design.md`
- Ausführungsplan: `docs/superpowers/plans/2026-09-06-einfachhausen-brand-system.md`
- Handoff: `docs/brand/HANDOFF.md`
- Vollständiger Zielquelltext: `docs/brand/SOURCE_PACKET.md`
- Tasks: EH-BRAND-01 bis EH-BRAND-06; vorhandenes T-0151 und Issue #33 berücksichtigen.
- Ausführung: `/home/ubuntu/orca/workspaces/einfach-hausen-brand-system-20260906`, Branch `design/einfachhausen-brand-system-20260906`, Node 22.23.0.


## EH-BRAND — Korrektur: Atelier 02 (2026-09-06)

Der Nutzer hat die drei Stilproben aus PR #40 ausdrücklich verworfen. Deren technische 27/27-Prüfung ist keine visuelle Freigabe. Root Codex gestaltet und implementiert die neue Richtung persönlich; keinen weiteren Prime/bai-Dispatch aus alten Abschnitten ableiten. Neuer Arbeitsstand: `design/einfachhausen-brand-atelier-20260906`, Workspace `/home/ubuntu/orca/workspaces/einfach-hausen-brand-atelier-20260906`. Konzept, vollständige Nutzerkorrektur und Plan: `docs/brand/ATELIER_02.md`; aktuelle Übergabe: `docs/brand/HANDOFF.md`; vollständige Quellen: `docs/brand/ATELIER_02_SOURCE.md`; bedienbare Vollansicht: `design/brand-atelier/preview.html`. EH-BRAND-03 bleibt in Arbeit, die neue Richtung wurde noch nicht vom Nutzer bewertet. Genau nächste Markenaktion: diese neue Vollansicht besprechen und tatsächliches Nutzerfeedback dokumentieren. EH-BRAND-04..06 folgen erst der Richtungsentscheidung; kein Merge/Deploy. Ältere Empfehlungen/Dispatch-Anweisungen sind für diese Markenwelle historisch. Andere laufende Arbeitswellen bleiben erhalten.

<!-- SIN-GPT-WEB-HANDOVER
task: T-0007
updated: 2026-08-29T20:22:56+00:00
actor: local-agent
evidence-sha256: 9fced8fc1fea3a24766fb348dd92b1dafe1ce6cbdbc5e0178ebdaade6dd01a05
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0207
updated: 2026-08-31T05:02:48+00:00
actor: local-agent
evidence-sha256: 1017a920b7cf8fe652672b1af34f77f91dc83e95bebdfd52e9a57ff31d931235
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0006
updated: 2026-08-30T19:51:22+00:00
actor: local-agent
evidence-sha256: c06a0c08dd4aed8815e9506b2ece8b5ac94fae69f2372ca33649c3a92f9bbed0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0206
updated: 2026-08-31T03:37:41+00:00
actor: local-agent
evidence-sha256: 027117d24fef4b17a77dddd236c195d9b40586c3bc282dfd5c0aec2f9b5e54ee
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0208
updated: 2026-08-31T15:17:38+00:00
actor: local-agent
evidence-sha256: 3c5ff2bd506025e42f53ea35964b6be662f201604fdd2d490f55ac7573da8fcb
-->


## Owner-Dashboard-Komposition

Die Eigentümer-Startseite `/app` verwendet eine eigene kanonische Dashboard-Komposition innerhalb des gemeinsamen Einfachhausen-Designsystems.

Daten- und Zustandsverantwortung bleibt in `src/app/app/page.tsx`:
- authentifizierter Owner über `requireUser('homeowner')`
- Objektkontext aus `homeowner_profiles` und `primaryProperty`
- bestätigte Termine aus `appointments`
- offene Angebotsentscheidung aus `jobs` und `quotes`
- fällige Wartung aus `maintenance_tasks`

Darstellung liegt im versiegelten Designpaket:
- `EHOwnerDashboardHeader`
- `EHOwnerDashboardTopGrid`
- `EHOwnerDashboardStatus`
- `EHOwnerDashboardOverview`
- `EHOwnerDashboardComposer`
- `EHOwnerDashboardUtilityGrid`

Der bestehende `HomeownerHausmeisterComposer` bleibt Consumer des Dashboards. Seine Draft-Persistenz, Medienaufnahme, Spracheingabe, Offline-Erkennung und `sendHausmeisterAction` werden nicht in das Designpaket verschoben.

Damit bleibt die Trennung erhalten:
Server Component / Datenbeschaffung → kanonische Dashboard-Komposition → bestehende interaktive Client-Komponenten.

Das Dashboard führt keine neue Farb-, Typografie-, Radius- oder Motion-Quelle ein. Alle Werte stammen weiterhin aus `packages/eh-design/src/tokens.json`.


## Owner-Auftragsübersicht

`/app/jobs` bleibt eine authentifizierte Server-Component-Route.

Datenquellen:

- `jobs`
- `quotes`
- `appointments`
- `provider_profiles`
- `job_photos`
- `homeowner_profiles`
- `primaryProperty`

Die Route löscht oder transformiert keine Auftragsdaten.

Für die visuelle Übersicht werden ausschließlich Service-Aufträge berücksichtigt:

`jobs.request_kind = 'service'`

Kontaktvorgänge bleiben weiterhin im bestehenden Ansprechpartner-/Nachrichtenmodell erhalten.

Auftragsbilder bleiben privat. Die Liste greift nie direkt auf Dateipfade zu, sondern ausschließlich auf den vorhandenen authentifizierten Endpunkt:

`/api/job-media/[id]`

Die fachliche Route hält Datenbeschaffung und Filterung. Die gemeinsamen Designkomponenten befinden sich in `packages/eh-design/src/workspace-records.tsx`.

Rahmen ist die WerkbankShell auf Sidebar-07-Stand (`SidebarProvider` + `AppSidebar` + `SidebarInset`, Kopfzeile nur Werkzeuge: Trigger, Breadcrumb, Suche, Glocke, Avatar — `src/components/werkbank-shell.tsx`) und bleibt unabhängig von dieser Seitenkomposition.
