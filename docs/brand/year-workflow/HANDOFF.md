> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Jahresplan – gezielte Nachbesserung, 2026-09-10

Host: OCI sin-supabase. Task: EH-SWEEP-OWNER (bestehender kanonischer Task).
Basis: 4fef0f470efaf0b284f0d34dbd98472a82a81545.
Branch: fix/eh-year-20260910.
Worktree: /home/ubuntu/orca/workspaces/eh-year-20260910.

## Geliefert
Nur src/app/app/year/page.tsx geändert. Bestehende EH-Komponenten, keine neue Stilfamilie.
- Jahresnavigation und validierter Jahresparameter; Plan/Historie erhalten die Auswahl.
- Wartungen und Aufträge auf gewähltes Jahr begrenzt; kein stilles 40-Einträge-Limit.
- Erledigte Wartungen erscheinen nach Fälligkeitsjahr. Kein erfundenes Abschlussdatum.
- Alle offenen Wartungen im gewählten Jahr direkt abschließbar, bestehende autorisierte Server Action samt Wiederholung.
- Überfällig wird pro Request anhand Europe/Berlin bestimmt, nicht bei Modulinitialisierung.
- Überfällige Einträge werden nicht zusätzlich unter weitere Wartungen dupliziert.
- Aufträge behalten Detail-Links und erhalten Zugang zur vollständigen Übersicht.

## Datenlimits
maintenance_tasks hat KEIN completed_at. Historie benennt Fälligkeitsdatum ausdrücklich.
Job-Historie verwendet weiterhin updated_at und bezeichnet dies ehrlich als letzte Aktualisierung.
Keine Datenmigration oder neue Backendlogik. Jahresplan zeigt nur gewähltes Jahr, auch bei Überfälligkeit.

## Nächste Aktion: lokal integrieren und den Jahresplan abnehmen
1. Laufende Arbeit erhalten; Branch-Diff gegen obige Basis prüfen, nicht Produktionsdateien blind ersetzen.
2. Vollständiger Zielcode steht in SOURCE.md. Git-Branch bevorzugen; Quellkapsel ist nachvollziehbare Referenz.
3. In isolierter Testdatenbank je offene/erledigte Wartung und Auftrag in zwei Jahren anlegen.
4. /app/year?year=2026 und ?view=history&year=2026 prüfen: keine Einträge aus 2025/2027.
5. Wartung abschließen: aus Plan verschwunden, in Historie sichtbar, Wiederholung nur einmal angelegt; Fremdnutzer darf sie nicht abschließen.
6. Vor-/Folgejahr, aktuelles Jahr, ungültige/mehrfache Querywerte prüfen.
7. Browser 390/736/1536: volle Labels, keine horizontale Überbreite, Tastatur, Pending-Zustand; Screenshots dauerhaft im Repo hinterlegen.
8. Bestehende Release-Gates ausführen, danach normaler gemeinsamer Merge/Deploy. Kein paralleler Deploy durch diesen Branch.
9. Task EH-SWEEP-OWNER mit tatsächlichen Belegen aktualisieren, render + validate. Erst dann als erledigt melden.

## Weitere Codebefunde – getrennt bearbeiten
- src/app/pro/calendar/page.tsx: fehlender Provider-Kontext liefert null statt verständlicher Wiederherstellung/Einrichtung. Aktuellen Kontextvertrag prüfen, vorhandenen ProviderState verwenden.
- src/app/ki-chat/page.tsx: alte separate KI-Seite hat Foto-/Sprachbuttons ohne Handler. Bestehenden KI-Einstieg vereinheitlichen oder ehrlich deaktivieren; kein drittes Chat-System bauen. Vor Patch aktuellen Stand erneut lesen.
- KiCard: q/prompt-Abweichung nur bei tatsächlich genutztem Einstieg beheben; zuvor kein Consumer gefunden, daher kein bewiesener aktiver Nutzerfehler.
- AGENTS.md enthält historische Konfliktmarker/überholte Handoffs. Regeln konsolidieren, gültige Designautorität und laufende Tasks erhalten.
- Alte /tmp-Berichte sind keine dauerhafte Abnahme. Zwei ältere genannte Reports waren beim Audit nicht vorhanden; daraus folgt NICHT, dass alle Gates fehlgeschlagen sind.

Keine Aussage, dass Gesamtprodukt oder Produktion hiermit vollständig abgenommen ist.

## Tatsächlich geprüft
TypeScript --noEmit --incremental false: erfolgreich (lokale next/image Typdeklaration ergänzt, unversioniert). ESLint der geänderten Seite: erfolgreich. git diff --check: erfolgreich. Abhängigkeiten unverändert aus /srv verlinkt. GitNexus impact UNKNOWN, Index 192/247 Commits veraltet; detect-changes meldet am kanonischen Fremdworktree keine Änderungen und ist für diesen Diff kein Beleg. Manueller Scope: eine Routenkomponente plus Dokumentation. Browser, vollständiger Build, echte Interaktion und Deployment ausdrücklich NICHT geprüft/ausgeführt.
