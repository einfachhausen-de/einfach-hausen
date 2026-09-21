> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](PRODUCT_VISION.md) und [Positionierung](PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. Ein damaliger DONE-/100%-Status ist keine Abnahme des am 21.09.2026 korrigierten Produktziels.

# UI & Frontend Convergence Status — historisch, Stand September 2026

Stand: September 2026 (historische Momentaufnahme, Einordnung 2026-09-10)

## 1. Erledigte Meilensteine

- **PR #18 & PR #19 erfolgreich gemerged:**
  - **P0 Ladezustände:** Entfernung irreführender Vorbereitungs-Overlays.
  - **Kanonische Design-Tokens:** `src/components/marketing/tokens.css` definiert die verbindlichen Werte für Farben (Teal-Skala, warmes Canvas `#faf8f4`, Ink `#10222a`), Radien, Rhythmus und Schatten.
  - **Eigentümer-App (`/app`):** Neuordnung der Startseite: Der KI-Hausmeister-Composer steht ganz oben als dominante Hauptaktion; Termine/Wartungen folgen unter „Als Nächstes“; FAB entfernt.
  - **Handwerker-App (`/pro`):** Reduzierung des ERP-artigen 4er-KPI-Blocks auf eine saubere Arbeits-Zusammenfassungsleiste mit Fokus auf den nächsten Arbeitsschritt.
  - **Admin & CRM (`/admin`, `/admin/crm`):** Einheitlicher visueller Standard für Listen, KPIs und Formulare.
  - **Seiten-Archetypen:** Differenzierung von `/leistungen`, `/preise`, `/hausakte`, `/partner`, `/sicherheit` und `/so-funktionierts`.

## 2. Nächste Schritte

1. **Visuelle Regression & Baselines:**
   - Neue Snapshots aufnehmen für `/app`, `/pro` und überarbeitete Marketing-Seiten (`npm run test:visual:update` bzw. `npm run test:visual:apps:update`).
2. **CSS-Konsolidierung:**
   - Schrittweises Ablösen redundanter Klassen aus `design-system.css` zugunsten von CSS-Modulen.
