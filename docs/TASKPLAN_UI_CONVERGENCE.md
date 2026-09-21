> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](PRODUCT_VISION.md) und [Positionierung](PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. Ein damaliger DONE-/100%-Status ist keine Abnahme des am 21.09.2026 korrigierten Produktziels.

# Taskplan: UI Convergence & CSS Consolidation (100% Status — historisch, Stand September 2026)

## Status: Abgeschlossen & Konvergiert (September 2026)

### Phase 1: P0 & Marketing-Archetypen (DONE)
- [x] P0 Loading-State Overlay neutralisiert (`src/app/loading.tsx`).
- [x] Differenzierung der Seiten:
  - `/leistungen` -> Typografischer Leistungsindex.
  - `/preise` -> Saubere Vergleichstabelle mit Tabellenziffern.
  - `/hausakte` -> Lebenszyklus-Rail.
  - `/partner` -> Strukturierte Konditionen.
  - `/sicherheit` & `/so-funktionierts` -> Kachel-Redundanz eliminiert.

### Phase 2: App & CRM Konvergenz (DONE - PR #19)
- [x] Eigentümer-Startseite neu priorisiert: Composer oben, Termine danach, FAB entfernt.
- [x] Handwerker-Startseite entschlackt: KPI-Wand ersetzt durch Statusleiste + 1 Next Action.
- [x] Admin & Lead-CRM harmonisiert (`#faf8f4`, `#105258`, `#e4e2dc`).

### Phase 3: Dokumentation, Handoff & Konsolidierung (DONE - PR #20 & #21)
- [x] `DESIGN.md` auf aktuellen Stand gebracht.
- [x] `docs/NEXT_AGENT.md` aktualisiert (Handoff & Handback).
- [x] `design-system.css` Altlasten und ungenutzte Overrides konsolidiert.
