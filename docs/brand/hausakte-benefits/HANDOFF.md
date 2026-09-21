> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Hausakte: Nutzen verständlich machen
Host OCI sin-supabase. Basis 1005fb5; Branch fix/eh-hausakte-benefits-20260910.
Worktree /home/ubuntu/orca/workspaces/eh-hausakte-benefits-20260910.
Nutzerauftrag: /hausakte überzeugt neue Besucher nicht; Nutzen und optische Qualität verbessern.

## Befunde und Ziel
Vorher Funktionsliste, Miniaturansichten, doppelte Überschriften in Panels, unbelegte Aussagen („in einer Sekunde“, „ohne Limit“, vollautomatische Pflege/garantierter Hauswert).
Neu: konkrete Alltagssuche -> lesbare Produktbeispiele -> vorbereitete Reparaturanfrage -> Einstieg mit einer Anlage.
Nur eine Produktseite geändert, vorhandene kanonische EH-Komponenten. Keine Tokens, CSS, Backendfunktionen oder Navigation verändert.
Beispielakte ist ausdrücklich illustrativ, keine echte Kundengeschichte, kein scheinbar bedienbarer Screenshot.
Keine freie Altbeleg-Zuordnung versprechen: geprüftes /app/documents zeigt auftragsbezogene Unterlagen.
Metadaten stimmen mit sichtbaren belegbaren Aussagen überein.
Kostenloser CTA /register?role=homeowner; sekundär Beispielanker; Bestandskunden /app/home.
Versicherung, Verkauf, Datenschutz und Preise bleiben als relevante Vertiefung verlinkt.

## Nächste Aktion für lokalen Agenten
1. Branch-Diff relativ zur Basis prüfen, aktuelle parallele Änderungen erhalten. SOURCE.md enthält die ganze geänderte Seite mit Hash.
2. /hausakte bei 390/736/1536 im echten Browser abnehmen, FAQ öffnen, beide Hero-CTAs, Beispielanker und Abschluss prüfen.
3. Neuer Besucher muss ohne Vorwissen erklären können: was bringt mir die Hausakte, was muss ich zuerst tun, was kostet der Einstieg?
4. Inhalte gegen reale /app/home, /app/year, /app/documents und Ansprechpartner prüfen. Keine Behauptung einer automatisch vollständigen Hausakte hinzufügen.
5. Linkziele, Auth-Rückkehr des Bestandskunden-CTA und mobile Navigation prüfen; vorhandene Release-Gates.
6. Gemeinsam integrieren/deployen, Task Evidence aktualisieren, render + validate.
Kritischer Billing-Folgeauftrag EH-BILLING-CANCEL-TRUTH bleibt unabhängig erhalten. Nicht als durch diese Marketinglieferung erledigt behandeln.

## Prüfstand
TypeScript --noEmit --incremental false, gezieltes ESLint, git diff --check erfolgreich.
GitNexus impact für Page mit Dateipfad UNKNOWN; veralteter Index, keine belastbare vollständige Graphabnahme.
Öffentliche URL via Webabruf nicht lesbar; Codebefunde beziehen sich auf origin/main, kein vorgetäuschter Livevergleich.
Lokale Browsernachweise folgen im selben Ordner. Kein Produktionsdeploy durch diese Lieferung.
