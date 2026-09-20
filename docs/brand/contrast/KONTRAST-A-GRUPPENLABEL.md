# Kontrast A - Gruppenlabel in Secondary 4b5b60, Block K (ses_f40d79)

Basis: main @ b12f657. Freigabe: A und loeschen (Issue 124).
Betrifft Gruppenlabel der App-Seitenleiste (Navigation, Konto).

## Aenderung
Datei src/components/ui/sidebar.tsx, Komponente SidebarGroupLabel (data-sidebar group-label):
vorher Klasse text-sidebar-foreground/70,
nachher Inline-Style color var(--eh-color-secondary, 4b5b60).
Kanonischer Token: packages/eh-design/src/tokens.css Zeile 7 (--eh-color-secondary 4b5b60).

## Messung (rechnerische sRGB-Luminanz, Methode wie DECISION.md)
- Hintergrund: Sidebar-Variable light = oklch(0.985 0 0) = fafafa.
- Vorher: oklch(0.145 0 0) zu 70 Prozent ueber fafafa = effektiv 525252 -> 7.4816 zu 1 (AA PASS).
- Nachher: 4b5b60 auf fafafa -> 6.7847 zu 1 (AA PASS).
- App ist light-only (kein Dark-Mode-Toggle; dark-Block ungenutzt).

## Bewertung
Markenvereinheitlichung (neutrales Grau -> kanonisches Secondary) ohne Kontrast-Regression:
beide Zustaende erfuellen AA fuer normalen Text (mindestens 4.5 zu 1).
Einziger beabsichtigter visueller Diff (Issue 124).
