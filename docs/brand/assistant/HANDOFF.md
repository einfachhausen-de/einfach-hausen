> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

> **Aktueller Folgeaudit:** REVIEW-20260910.md vor Integration lesen. Die UI-Tests dieser Lieferung sind keine Freigabe des bestehenden Auth-/KI-Backends.

# Kunden-Hausassistent · 2026-09-10

Expliziter Auftrag Jerry: dezenter Chat-Einstieg rechts unten mit eigenem Logo, passend zu DESIGN.md. OCI sin-supabase; /home/ubuntu/orca/workspaces/eh-assistant-20260910; Branch feat/eh-assistant-launcher-20260910; Basis e28a983. Laufende Login-Reparatur nicht anfassen. Keine fremde Arbeit löschen oder überschreiben.

## Umsetzung und Quelle

packages/eh-design/src/assistant.tsx exportiert EHAssistant, EHAssistantMessage und EHAssistantResult. Kanonische Gestaltung ausschließlich in styles.module.css; Original /brand/logo-full.png. Keine Arena-Assets, kein Roboter-Nachbau, keine externe Schrift, keine Autoöffnung oder Animation. Rechtwinkliger Panelradius und vorhandene Markentokens. HTML-Stilausgaben generiert. Nur fünf tatsächlich betroffene Paketpfade im Design-Lock aktualisiert; keine andere Datei neu versiegelt, keine Policy/Schuld/Baseline verändert.

src/components/house-assistant.tsx bindet vorhandenes POST /api/ki an. RootLayout mountet den Clientadapter einmal. Keine Backend-/Quota-/Authänderung. Anfrage ausschließlich nach Absenden, maximal4000Zeichen, letzte12Nachrichten;30sTimeout, Abort bei Unmount, Doppelsenden verhindert. Clientverlauf lebt nur in Komponentenstate und wird bei Routenwechsel verworfen. Kein localStorage und keine neue Persistenz. Bestehende serverseitige Anbieter-/Kontingentregeln gelten unverändert.

Native dialog-Fokusbindung, Escape, Schließen und Fokusrückgabe. Dialog liegt in der Browser-Top-Layer. Scrollen im Verlauf statt die Hintergrundseite. 16pxEingabe, mobile Safe-Area. Der geschlossene Einstieg sitzt auf Owner-App-Routen unter1000px oberhalb der Bottom-Navigation. Auth-/Provider-/Admin-/Payment-/Printseiten und bestehende Chatansichten sind im Consumer ausgeschlossen. Den tatsächlichen Ausschlusscode lesen, nicht von einer globalen Rollenfreigabe ausgehen.

401 führt zu ausdrücklichem Anmeldehinweis und Loginlink;402 zum Kontingenthinweis und Einstellungen;429/andere Fehler werden nicht als KI-Antwort in den Verlauf geschrieben. Eingabetext bleibt bei Fehler erhalten. Erfolgreiche Antworten werden als Text gerendert, nicht als unsicheres HTML. Kein Fake-KI-Fallback, keine bezahlten Aufrufe im Test. Das vorhandene API antwortet bei fehlender Gatewaykonfiguration teilweise mit HTTP200 und einem erklärenden Text; dessen Vertrag wurde nicht verändert.

Die historische /ki-chat-Seite bleibt unverändert; ihre Modernisierung ist nicht Teil dieser Lieferung. Der neue Einstieg öffnet den vollständigen hier gelieferten Dialog, nicht jene alte Seite. Kein Foto-/Sprachbutton ohne funktionierende Anbindung.

## Verifikation

ESLint der geänderten TSX und Reviewscripts, typecheck und eh-design-check PASS. Generator verwendet. Browserprüfung mit abgefangenen API-Antworten401/402/429/200 bei390/736/1536: keine automatische Anfrage, Fehler behalten Entwurf, Antwort erscheint, eine Sendesequenz pro Klick, Dialog passt in Viewport, kein horizontaler Überlauf,16pxEingabe, Escape und Rückfokus. Screenshots: design/assistant-preview/{launcher,open,reply}-{width}.png; evidence.json. Testantworten sind ausdrücklich Testdaten.

Vorschau verwendet bestehende Dependencykopie (Next16.3.1) und isolierte SQLite-Datei /tmp/eh-assistant-review.db. Keine produktiven Sessions verwendet. Keine vollständige Live-Auth-/Billing-/Gatewayabnahme; keine Veröffentlichung behaupten. Fullcode SOURCE.md plus source-manifest.json enthält vollständige Dateien und Binärhashes.

## Integration – nächster lokaler Agent

1. Eigenen aktuellen Status sichern; diesen Branch regulär integrieren. RootLayout-Zeile mit aktueller Login-/Shellarbeit zusammenführen. Keine kompletten Dateien blind aus Quellkapseln überschreiben.
2. npm ci mit aktuellem Lockfile, Build/typecheck/lint und Design-Guard ausführen. Für kanonischen Paketsync mit weiteren Repos den normalen Vendorprozess verwenden, keine handgeschriebenen Kopien.
3. Browserprüfung reproduzieren (Devserver127.0.0.1:4291, AUTH_MODE=local, separateDATABASE_PATH):

```bash
cd /home/ubuntu/orca/workspaces/eh-assistant-20260910
export PATH="/home/ubuntu/.nvm/versions/node/v22.23.0/bin:$PATH"
node scripts/eh-assistant-review.mjs
```

4. Zusätzlich reale Testkonten prüfen: Gast401, angemeldeter Owner mit echtem kontrollierten Gateway, Quota erschöpft, Netzwerkfehler/Timeout, lange Antwort, Tab/ShiftTab-Fokus, virtuelle mobile Tastatur, Cookie-/Hilfedialoge und Bottom-Navigation. Keine echten Kundenkonten oder kostenpflichtigen Modellaufrufe für automatisierte UI-Tests verwenden; gezielten Liveaufruf separat dokumentieren.
5. Ausgeblendete Routen einschließlich Login kontrollieren; das Widget darf die laufende Login-Reparatur nicht überlagern. Vorhandene Header-/Consent-Overlays dürfen nicht verdeckt werden. User muss aktiv öffnen.
6. Nach Integration normalen Releaseprozess nutzen und tatsächlichen Produktionscommit/Health dokumentieren. Task erst nach Integrations- und Liveabnahme abschließen. Keine Behauptung unbegrenzter oder anonymer Gratis-KI; bestehende Anmeldung/Quotas gelten.

GitNexus RootLayout impact ausgeführt: UNKNOWN/veralteter Index; deshalb echter RootLayout-/API-Consumer gelesen. RootLayout betrifft viele Seiten, Consumer begrenzt Sichtbarkeit. detect-changes mit registriertem Altindex ersetzt nicht den tatsächlichen Git-Diff.
