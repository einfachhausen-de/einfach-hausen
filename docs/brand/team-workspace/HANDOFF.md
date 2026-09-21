> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Teamseite und Formular-Vererbung · 2026-09-09

Fortsetzung von PR75 auf OCI sin-supabase, /home/ubuntu/orca/workspaces/eh-house-workspace-20260909, Branch fix/eh-house-workspace-20260909. Basis dieser Ergänzung f033dfc; gemeinsamer Task EH-BRAND-07-WORKSPACE. Der laufende lokale Agent behält Integration/Release.

## Konkret umgesetzt

/pro/team erhält EHWorkspaceGrid: Personen mit Kontaktdaten, Zugangsstatus und bestehenden Änderungsformularen im Hauptbereich; einspaltiges Formular für einen neuen Ansprechpartner und Rechteerklärung daneben. Mobil geordnet untereinander. Keine neue Rolle, keine geänderte Berechtigung, keine neue Server-Aktion. Firmenkonto bleibt geschützt. Kein Betrieb: jetzt ebenfalls eine klare h1. Ein zunächst verwendeter großflächiger IdentitySummary wurde nach echter Sichtprüfung verworfen, weil er Teamzeilen unnötig aufblähte.

Zwei belegte globale CSS-Vererbungsfehler wurden im kanonischen Paket korrigiert:
- .checkbox setzt flex-direction: row. Die alte globale label-Regel setzt column und trennte Checkbox und Text.
- .field label setzt display: block. Pflichtzusätze werden nicht mehr als eigene Flex-Zeile unter die Beschriftung gesetzt.

Dies ist eine gezielte Fehlerkorrektur am freigegebenen Stil aufgrund Jerrys Auftrag, verbleibende Frontendfehler zu beheben. Keine Palette, Typografie, Radien oder neue Stilfamilie. HTML-Ausgaben über eh-design-generate regeneriert. Ausschließlich die drei dadurch geänderten Paketdatei-Hashes im Lock aktualisiert. KEIN pauschales Neuversiegeln, KEINE Debt-/Policy-/Guardänderung. Der unabhängige bereits vorhandene design-system.css-Drift des lokalen Drawer-Fixes bleibt ausdrücklich unangetastet und im Guard sichtbar.

## Belege und Grenzen

Screenshots: design/workspace-preview/team/ bei390/736/1536. Eine h1, beschriftete16px-Controls, kein horizontaler Overflow, sämtliche Checkbox-Labels flex-direction row. Bestehende Haus-/Historienbilder nach gemeinsamer Labelkorrektur erneut erstellt. ESLint/Typecheck und Generatorcheck ausgeführt; Einzelresultate im PR. Rendering mit isolierter lokaler Datenbank, keine produktiven Zugänge geändert. Die vorhandene Dependencykopie enthält Next16.3.1; npm ci und Release mit aktuellem Lock bleiben beim Integrator.

GitNexus impact Team: UNKNOWN/veralteter Index; kein Aufrufernachweis. Team ist eine Route, native Actions direkt im Diff erhalten. detect-changes wird ausgeführt, kann den neuen Worktree über den alten Registryindex nicht zuverlässig prüfen. Keine ungeprüfte Gesamtabnahme.

## Lokaler Agent: genau nächste Schritte

1. Aktuellen PR75-Head regulär integrieren, nicht nur den früheren f033dfc-Stand. Fremde Änderungen erhalten; kein reset/clean/force. Ganze Lieferung einschließlich generierter HTML-Dateien und eng begrenzter Lockänderung prüfen.
2. Keine parallele Teamgestaltung oder lokalen Checkbox-Overrides bauen. Die kanonischen Komponenten direkt verwenden. Weitere vendorte EH-Pakete erhalten diese Korrektur erst über ihren normalen kontrollierten Paketsync, nicht durch Handarbeit an Vendor-CSS.
3. Mit npm ci den Releasekontext herstellen; build/typecheck/lint/Designguard und vorhandene E2E laufen lassen. Bereits vorhandenen Drawer-Guardfehler separat fachgerecht lösen; nicht durch Blanket-Seal verstecken.
4. In Wegwerfkonten Team mit/ohne Verwaltungsrecht prüfen: eigener/anderer Ansprechpartner, aktiver/inaktiver Zugang, Firmenkonto gesperrte Checkboxen, fehlender Betrieb, lange Namen/E-Mails, Formularfehler und Pending. Keine echten Konten sperren oder anlegen. Quelle der Rechte bleibt getProviderContext und bestehende Server-Actions.
5. Vor Deployment nochmals jüngste Main-Arbeit vergleichen und den normalen Releaseprozess ausführen. Diese Lieferung ist keine bereits erfolgte Veröffentlichung.

```bash
cd /home/ubuntu/orca/workspaces/eh-house-workspace-20260909
export PATH="/home/ubuntu/.nvm/versions/node/v22.23.0/bin:$PATH"
EH_REVIEW_FIXTURE=/tmp/eh-final-review-fixture.json node scripts/eh-team-visual-review.mjs
```

Nur eigener Devserver auf127.0.0.1:4199 mit AUTH_MODE=local und isolierter DATABASE_PATH. EH_REVIEW_FIXTURE enthält sessions.pro; keine echten Tokens committen. Vollständige Quelldateien und Asset-Hashes in SOURCE.md/source-manifest.json neben dieser Anleitung. Hausakte-Handoff bleibt als historische erste PR75-Lieferung erhalten; diese Ergänzung benennt ausdrücklich die zusätzlichen Paketänderungen.
