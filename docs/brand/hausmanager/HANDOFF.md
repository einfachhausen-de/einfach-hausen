> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. Die damalige Free/Abo-Sperre des Angebotsvergleichs ist keine heutige Zielvorgabe: Angebotsvergleich gehört zum kostenlosen Eigentümer-Kern. Bestehendes Verhalten vor einer Änderung prüfen; hier wurde keine Sperre technisch entfernt.

# KI-Hausmanager - Handoff 2026-09-12

## Auftrag (Pi-Session 20260912, Nutzer + Schwester/Boss freigegeben)
- KI-Chat wirkte billig/isoliert, nicht wie ein Hausmanager mit Hausbezug.
- Zwei freigegebene Entwuerfe: Chat als Hausmanager (Popup) + eigene Hausmanager-Seite (ruhig, nicht ueberfordernd).
- Eigene Seite fuer alte Gespraeche, Aufgaben, Automatisierungen (vorkonfiguriert, Free/Abo ehrlich gekennzeichnet).

## Umsetzung (PR #97, main 2227015, deployed)
- Neue Seite `/app/hausmanager` (echte Daten, keine Mocks):
  - `EHManagerHero` mit Name + Adresse, `EHManagerAttention` (faellige Wartungen + offene Angebote).
  - Letzte 3 Gespraeche (`assistant_threads`/`assistant_messages`), anstehende Aufgaben (offene Wartungen + `quoted`-Jobs mit Pending-Angeboten).
  - 3 Automatisierungen: Wartungserinnerung (free/an), Heiz-Check Herbst (free/an), Angebotsvergleich (abo/aus + deaktiviert). Schalter nur free schreibbar (`setAutomationPrefs` filtert abo ehrlich heraus, kein Fake-Enforcement).
- Widget retitelt: Hausassistent -> Hausmanager (Launcher, Dialog-Titel, Autorenzeile). Untertitel "Kennt dein Zuhause".
- Einstiegspunkte: Link in `/app/more` (eigener Eintrag mit Sparkles-Icon) + Absatz-Link auf `/app/hausmeister`.
- Speicherung: `user_settings.automation_prefs` (JSON, addColumnIfMissing-Migration, korrupt -> Defaults). Server-Action `updateAutomationPrefsAction` mit Redirect `?prefs=saved`.
- Backend-Formen: keine neuen Tabellen, keine Subscription-Enforcement, keine Abo-Sperren erfunden.

## Korrekturen beim Rebase (main 53b725a)
- Konflikt `packages/eh-design/src/index.ts`: `workspace-sidebar` + `workspace-hausmanager` beide exportiert.
- Bug aus Pi-Session: Seite nutzte globale `managerGrid`/`managerWide` (CSS-Modul haette nie gegriffen) -> neue Wrapper `EHManagerGrid`/`EHManagerWide` im Designsystem.
- Mehr-Gruppierung: slice(0,5)/slice(5), "Dein Haus organisieren" traegt Hausmanager als 2. Eintrag.

## Abnahme (alle gruen)
- Gates hier: typecheck 0, lint 0 Fehler (38 Warnungen, Bestand), build 0 (Route `/app/hausmanager` im Build).
- Prod Release-Gate: 15/15 (A11y, Visuals, Perf inkl. CLS 0.0).
- Deploy: `/srv @2227015`, Health ready (Node v22.23.0), Migration `automation_prefs` live belegt (DEFAULT '{}').
- Live-Login-Test (Playwright, Demo-Kunde kunde/admin, 1672px): 1-Klick-Login -> direkt `/app/hausmanager`; Marker KI-Hausmanager/Automatisierungen/Letzte Gespraeche/Anstehende Aufgaben/alle 3 Starter; null Pageerrors; Checkbox speichert (`?prefs=saved` + Erfolgsmeldung); Mehr-Link vorhanden. Shots: `/tmp/hm-live-owner-1672.png`, `/tmp/hm-live-owner-saved-1672.png` (Prod-Host).

## Grenzen / Folgearbeit
- Provider hat keine Hausmanager-Seite (Owner-only, wie beauftragt).
- `angebotsvergleich` (Abo) ist Anzeige + deaktiviert; echtes Abo-Gating ist eigene Aufgabe.
- Pi-Session-Branch `origin/eh-hausmanager-20260912` bleibt als Backup (Basis 6f17ac1, ohne Rebase-Fixes).
- Kontaminierter Worktree `eh-datelabel-20260912` (fremde auth-v2-Konflikte) bewusst unberuehrt; Audit-Nachtrag steht in Release-Kopie + main.
