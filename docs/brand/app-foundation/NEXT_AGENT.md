> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Verbindliche App-Vorgaben · 2026-09-07

Status: implementierte Integrationsvorlage, TypeScript geprüft; kein Deployment und keine visuelle Abnahme echter Rollenansichten.
Basis: a90d411, feat/eh-brand-05-apps. Übernahmebranch: design/eh-app-foundation-20260907.

## Zuständigkeit und Übernahme
Der lokale Agent integriert und prüft. Atelier 02 bleibt verbindlich. Keine eigene Palette, Typografie, Logozeichnung, Abstände oder Ersatzkomponenten entwerfen. Keine vorhandenen Agentenänderungen überschreiben. Branch per Dreiwege-Merge/Cherry-pick übernehmen; SOURCE.md ist vollständige Referenz, kein blindes Überschreibeskript. Bei Konflikten mit main alle bereits vorhandenen Website-Kompositionen, Exporte und CSS erhalten. Keine geschützten Prüfungen abschalten oder einen neuen Schuld-Baseline erzeugen.

## Festgelegte Komponenten
packages/eh-design/src/workflow-layouts.tsx: EHWorkflowStack (24px), EHWorkflowForm (32px), EHFormSection (fieldset/legend), EHFieldGrid (2 Spalten, unter 760px eine), EHFormFeedback (Fehler/Erfolg/Info), EHStepProgress (vier Schritte; mobil zwei Spalten), EHWorkflowHeading (h2).
packages/eh-design/src/submit-button.tsx: EHSubmitButton benutzt useFormStatus im echten Serverformular. Pending verhindert Doppelklicks; keine simulierte Erfolgsmeldung.
Alle visuellen Regeln ausschließlich in packages/eh-design/src/styles.module.css. EHField-Hinweise müssen am tatsächlichen Input per aria-describedby verbunden sein. Genau eine h1 pro vollständiger Inhaltsansicht. Formulartext nicht zur Platzersparnis verkleinern. Kein zusätzlicher Seitenkopf um eine Vorlage, die bereits EHAppHeader enthält.

## App-Shell
src/components/shell.tsx: EHScope app und EHLogo; bestehende Navigation, Authentifizierung, Rollen und Zähler bleiben erhalten. src/components/owner-menu.tsx ersetzt die nachgezeichnete Marke durch EHLogo. Dies ist eine Marken-Integration in die bestehende Shell, keine vollständige Migration aller alten Navigations-CSS. AppShell hat mindestens 30 direkte Verbraucher; GitNexus meldete CRITICAL, der Index war teilweise veraltet. Fehlende Graph-Treffer sind kein Beweis fehlender Nutzung.

## Provider-Onboarding: src/app/pro/onboarding/page.tsx
Vier konkrete Zustände: firmendaten, leistungen, arbeitsgebiet, abschluss. Ein einziges Formular benutzt unverändert saveWizardStepAction aus der vorhandenen actions.ts. Feldnamen, gespeicherte Werte, Service-Slugs und Besitzerprüfung beibehalten.
Telefon wird vom Wizard-Backend nicht gespeichert: deshalb Profil-Link statt wirkungslosem Telefonfeld. Sonstige Leistungen ergänzt die Beschreibung nur, wenn diese leer ist. Abschluss beendet Einrichtung, löst keine Prüfungsanfrage aus. Verlassen ohne Speichern wird ausdrücklich so bezeichnet. Keine neue Backend-Wirkung suggerieren. Bei leerem Servicekatalog nicht durch Absenden die bisherige Auswahl löschen. Schrittanzeige beschreibt Reihenfolge, behauptet keine serverseitig bestätigte Vollständigkeit vorheriger Schritte.

## Provider-Team: src/app/pro/team/page.tsx
Vorhandene addProviderMemberAction und updateProviderMemberAction aus src/app/actions.ts bleiben unverändert. canManageJobs bestimmt Bearbeitbarkeit und Sichtbarkeit des Anlageformulars. Firmenkonto bleibt laut Server immer aktiv und verwaltungsberechtigt; entsprechende Schalter sind gesperrt. Der Schutz des letzten Verwalters bleibt serverseitig bestehen.
Bearbeiten: jobTitle, canManageJobs, active; action an member.user_id binden. Anlegen: firstName, lastName, jobTitle, email, phone, password (mindestens 8 Zeichen), canManageJobs. Checkbox-Namen nicht umbenennen. Erfolgszustand nur aus vorhandener Rückmeldung; keine künstliche Erfolgsmeldung für Updates hinzufügen. Read-only, fehlende Betriebszuordnung, leeres Team und Serverfehler sind gestaltet.

## Next agent: verbindliche verbleibende Arbeit
1. Laufenden App-Branch und main lesen, eigene Änderungen sichern und dreiwegeintegrieren. Keine komplette ältere Design-Paketkopie über den neuen main legen.
2. Echte Ansichten bei 390, 736 und 1440px mit Besitzer, Verwalter und eingeschränktem Mitarbeiter prüfen: Logo, Text, Formularbreiten, kein horizontaler Overflow, keine doppelte h1, Fokus/Tastatur, Pending und lange Inhalte. Reale Serverabläufe testen, insbesondere letztes Verwaltungsrecht, gesperrtes Firmenkonto, Fehler und Wizard-Speicherung. Keine bloße Farbprüfung als visuelle Abnahme ausgeben.
3. Build, bestehende Gates und gezielte Funktionstests lokal ausführen. Diese Lieferung hat nur tsc --noEmit bestanden. Kein Merge/Deployment aus dieser Anleitung ableiten; normale Release-Vorgaben beachten.
4. Weitere Vorlagen bleiben offen: Auftragsdetails einschließlich Angebot/Disposition, Nachrichten mit Anhängen, Hausakte/Dokumente, Termine, Rechnungen, Profil/Einstellungen, Authentifizierung, Admin und Präsentationsgenerator. Vor Migration pro Workflow echte Daten/Aktionen/Zustände inventarisieren und fehlende Vorlage bei Design-Verantwortlichen anfordern. Funktionierenden Altbestand erhalten, keinen nächstähnlichen Baustein zur erfundenen Komplettlösung erklären.
5. EH-BRAND-05-APPS bleibt in Arbeit. Coverage-Belege sind Inventar, keine bewiesenen unabhängigen Fehler. Fortschritt mit Commit und Screenshots dokumentieren.

Vollständiger Code jeder geänderten Textdatei: SOURCE.md; Integrität: source-manifest.json. Laufender Quellcode ist maßgeblich; veraltete Codepakete nie als aktuell übernehmen.
