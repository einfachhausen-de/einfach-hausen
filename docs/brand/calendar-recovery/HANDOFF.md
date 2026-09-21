> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Partner-Kalender: Folgekorrektur

Host OCI sin-supabase. Task EH-PRO-CALENDAR-FOLLOWUP.
Basis 390d7e1; Branch fix/eh-calendar-recovery-20260910.
Worktree /home/ubuntu/orca/workspaces/eh-calendar-recovery-20260910.

## Geliefert
src/app/pro/calendar/page.tsx:
- Kein return null bei fehlendem/deaktiviertem Provider-Kontext: bestehende Shell, Seitenüberschrift und ProviderState erklären die fehlende Zuordnung/deaktivierten Zugang, Hilfe-Link /pro/hilfe.
- Keine Terminabfrage im Zustand ohne Kontext; Rechtefilter unverändert.
- Kalenderblatt und ausführliches Datum verwenden gemeinsam Europe/Berlin; Uhrzeit, Jahr und Zeitzonenname sichtbar.
- Ungenutzten EHStatus-Import entfernt. Keine Design-Tokens, CSS oder Backendlogik geändert.

## Prüfung und Grenzen
TypeScript --noEmit --incremental false, gezieltes ESLint und git diff --check erfolgreich.
Dependencies aus /srv verlinkt, lokale next/image-Typdeklaration unversioniert.
GitNexus impact UNKNOWN, veralteter Index; detect-changes am kanonischen anderen Worktree kein tatsächlicher Diff-Nachweis.
Kein Browserlauf, kein Build, kein Deploy durch diesen Branch. Kein Gesamtabschluss.

## Genau nächste Aktion
Lokaler Agent integriert diese Korrektur und prüft in isolierter Fixture:
1. Aktiver Manager sieht Betriebstermine; Teammitglied nur zugewiesene Termine.
2. Provider ohne Zuordnung und deaktiviertes Teammitglied sehen verständlichen Zugangszustand, keine Termindaten.
3. /pro/hilfe tatsächlich erreichbar; Keyboard-Fokus sichtbar.
4. ISO-Termine mit Offset/Z um Mitternacht sowie Sommer-/Winterzeit: Blattdatum entspricht ausführlichem Datum; deutsche Ortszeit.
5. Screenshot 390/736/1536, lange Datumszeile ohne Überlauf.
6. Release-Gates, gemeinsamer Merge/Deploy, Evidence und Taskplan render + validate.
SOURCE.md enthält vollständige geänderte Datei mit Hash; bevorzugt Branch-Diff übernehmen, keine fremde Arbeit überschreiben.

## Separater offener Befund
Altes src/app/ki-chat/page.tsx: automatische Prompt-Anfrage beim Mount, Foto-/Sprachbuttons ohne Handler, eigene Fehlerbehandlung ohne HTTP-ok-Prüfung.
Nicht blind nach /app/hausmeister weiterleiten: dort wird prompt/q derzeit nicht als Entwurf angenommen. Bei Migration Eingabe erhalten, niemals automatisch senden; bestehende Hausmeister-Komposition verwenden, kein drittes Chat-System.
Diese Änderung erledigt den alten Chat ausdrücklich nicht.
