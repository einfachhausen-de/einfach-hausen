> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

> Zusätzliche verbindliche Restabnahme und Skill-Regeln: AGENT-ACCEPTANCE.md. Quellübergaben nur aus expliziten Git-Commits; keine unversionierten Agentendateien.

> Aktueller Stand 2026-09-09: Detail-/Upload-/Rechnungsintegration siehe DETAIL-INTEGRATION.md. Ältere Aussagen unten zu ausschließlich unverbundenen Vorschauen sind für InvoiceForm und DocumentForm überholt.

# App-Komposition neu aufbauen · 2026-09-08

Jerry hat die bisherige Shell/Owner-/Pro-Komposition ausdrücklich gestalterisch zurückgewiesen. Historische technische Gates bleiben Nachweise für Technik, nicht für Produktgestaltung. Basis: 7eabe4a. Branch: design/eh-workspace-20260908. Kein Deployment.

## Implementiert
packages/eh-design/src/workspace.tsx: EHWorkspaceFrame, EHWorkspaceNavItem, EHWorkspaceGrid, EHWorkSection, EHPriorityAction, EHWorkMetrics, EHServiceDirectory, EHRequestList. Stile im kanonischen styles.module.css, vorhandene Markenfarben/Inter/Logo bleiben. Keine neue Palette.
248px Sidebar, bis 1240px tatsächlicher Inhalt, genau eine sichtbare Brand-Zone je Viewport, 22px Navigationsicons, deutlicher Petrol-Aktivzustand, Konto unten. Topbar ist globaler Kontext und Benachrichtigung; Seitenh1 ausschließlich im Inhalt. Mobile bestehende Menü- und BottomNav-Funktionen erhalten.
Owner /app: Entscheidung priorisiert, tatsächlicher Hausmeister-Composer neben nächsten Ereignissen, thematische Servicezugänge. /app/more: alle sieben vorhandenen Ziele mit ursprünglichen Icons in Haus/Konto gruppiert. Keine Mitgliedschaft oder Zustände erfunden.
Pro /pro: große Arbeitskennzahlen, Petrol-Prioritätsaktion, eigenständige Anfragezeilen mit vollständiger Beschreibung, Ort, Zeit, Preis und klarer Aktion; Termine daneben. Vorhandene Datenabfragen und Berechtigungsgrenzen bleiben. Vorschau von zwei Terminen wird nicht als Gesamtanzahl ausgegeben; Anfragezahl als geladene Teilmenge bezeichnet. Behauptung vollständiger Angebotsinformationen entfernt.

## Gestalterische Abnahme: noch NICHT bestanden
Implementierter Kandidat, kein abgeschlossenes Premium-Urteil. TypeScript bestanden. Isolierte Komponenten-Vorschau 390/736/1536: eine h1, ein sichtbares Logo, kein horizontaler Overflow. Desktop-Vorschau gesichtet. Die Vorschau benutzt Beispieldaten und ersetzt keine echte App-Ansicht; nicht als Produktion screenshotten oder als Kundennachweis verwenden. App-Mobile-Menü, Composer, bestehende globale Styles und echte Rollenflüsse wurden dort nicht geprüft.
GitNexus impact versucht für AppShell/Dashboard/More/Pro: Timeouts und defekte npx-Installation; kein aktueller Graphnachweis. AppShell aus vorherigem Index kritisch mit mindestens30 Verbrauchern. Vor Integration umfassend gegen bestehende Seiten prüfen.

## Nächster Agent
1. Aktuellen main und laufende Änderungen dreiwegeintegrieren; keine fremde Arbeit überschreiben. Dieser Branch ersetzt sichtbare Komposition, nicht Backend/Auth/Nav-Ziele.
2. Tatsächliche Owner-/Pro-Konten verwenden. Alle drei geänderten Seiten und repräsentative Shell-Verbraucher (Detail, Formular, Docs, Profil) bei390/736/1536 mit Inter prüfen. Mobile Drawer, BottomNav, Touch, Fokus, Benachrichtigungen und Composer wirklich bedienen. Fehlende Daten, sehr lange Titel und viele Anfragen zeigen.
3. Fehlende Fachkompositionen für Terminagenda, Dokumente, Wartung, Profile, Rechnungen gesondert inventarisieren. Kein EHPanel-für-alles. Keine neuen Funktionen erfinden. Nicht alle App-Seiten als fertig deklarieren.
4. Neue visuelle Baselines erst nach gestalteter Ansicht und Betreiberreview akzeptieren. Qualitätsmatrix muss Hierarchie, Arbeitsbreite, Dichte, Priorität und fachliche Unterschiede explizit bewerten; reine Token-/Overflow-/A11y-Ergebnisse reichen nicht.
5. Erst nach echter integrierter Prüfung normalen Merge-/Releaseprozess durchführen. Keine Guards abschwächen. Vollständige geänderte Dateien: SOURCE.md und source-manifest.json.

Aktueller Design-Check: FEHLGESCHLAGEN wegen bereits in Basis7eabe4a vorhandenen literal-color/unowned-style in src/app/docs-internal/{page.tsx,layout.tsx,[doc]/page.tsx}. Diese Dateien sind im Workspace-Branch unverändert. Nicht Baseline/Guard abschwächen; separate Docs-Korrektur nötig.


## Frontend-Erweiterung auf ausdrücklichen Auftrag 2026-09-08
Backend-Anbindungen, Tests und Release übernimmt ausdrücklich der lokale Agent. In dieser Erweiterung KEINE Tests/Builds durchgeführt und keine neue Backend-Logik implementiert.

Neue kanonische Datei packages/eh-design/src/workspace-records.tsx: EHRouteTabs, EHScheduleList, EHDossierList, EHOrderList, EHIdentitySummary. CSS ausschließlich styles.module.css. Vollständige Verbraucher: src/app/app/calendar/page.tsx, src/app/app/documents/page.tsx, src/app/app/year/page.tsx, src/app/app/profile/page.tsx, src/app/pro/orders/page.tsx.

Kalender: Monatsgruppen bleiben, jeder Termin erhält Datumskachel und ausgeschriebenen Status. Alte Termine bleiben separat. Keine neue Terminbearbeitung. Dokumente: Rechnungen, Nachweise, Zahlungsbelege erhalten eigene sichtbare Bereiche und Datei-/Betragsstruktur; originale geschützte Links bleiben. Jahresplan: echte Plan-/Historie-Links bleiben, Datumskacheln statt Textzeilen, Überfälligkeit bleibt. Pro-Aufträge: Art, Status, Kontakt, Preis und tatsächliche nächste Aktion einzeln dargestellt; rollenabhängige Datenabfragen unverändert. Profil: vollständig sichtbares, gruppiertes Formular plus Identitätsbereich; dieselben Feldnamen und Aktionen, alle Installations-/WhatsApp-/Privatsphäre-Hinweise bleiben.

GitNexus impact dieser fünf Routensymbole: UNKNOWN, keine aufgelösten Aufrufer; kein Beweis fehlender Risiken. Keine technischen oder visuellen Testergebnisse für diese neue Erweiterung behaupten. Lokaler Agent prüft Syntax/Typen/Build, echte Inhalte und alle bisherigen Funktionen und belegt mobile Ansichten. Auch die Kalender-Datumsinterpretation bleibt aus dem Backend übernommen und muss fachlich geprüft werden.

Noch keine Komplettabnahme aller App-Flächen. Offene Gestaltungskandidaten außerhalb dieser Welle: echte Nachrichten-/Anhangsansichten, Detailseiten, Rechnungseditor, Provider-Profil, Haus-Technik und Spezialabläufe. Keine generischen Ersatzformulare einsetzen. Vorhandene Funktionen erhalten und konkrete Designlücken sammeln. Nicht alleine durch einen kanonischen Import fertig melden.


### Weitere Frontendflächen derselben Lieferung
Zusätzlich src/app/app/jobs/page.tsx, src/app/pro/calendar/page.tsx, src/app/app/messages/page.tsx, src/app/pro/messages/page.tsx neu komponiert. Neue workspace-conversation.tsx: EHInbox, EHContactGroup, EHConversation. Beide Nachrichtenansichten besitzen getrennte Kontakt-/Gesprächsbereiche, aktiven Kontakt, eigene/fremde Nachrichten, Telefonlink, Fehl-/Leerzustand. Bestehende OwnerMessageComposer/ProviderMessageComposer samt Parametern unverändert; der lokale Agent prüft insbesondere ihre DOM-Abhängigkeiten nach dem Layoutwechsel. data-message-thread bleibt am Gespräch, keine Lesestatus- oder Sende-API geändert. Quellenauflistung direkter/auftragsbezogener Nachrichten erhalten.
Owner-Aufträge nutzen vorhandene aktive/geplante/abgeschlossene Filter und bestehende Ziele; Budget ausdrücklich als Budget, nicht Angebot. Pro-Kalender zeigt alle gelieferten Termine mit Status statt fälschlich alle als bestätigt/bevorstehend zu bezeichnen; doppelter Leerzustand entfernt. Keine Query-Änderungen.

Korrektur der vorigen Restliste: Beide Nachrichten-Hauptansichten gehören jetzt zum implementierten Frontendumfang. Anhänge, Client-Composer-Interna, Detailseiten, Rechnungseditor und übrige Fachseiten sind damit nicht automatisch fertig. Tests, Build, reale Datenanbindung, Rollen- und Browserprüfung bleiben wie von Jerry beauftragt beim lokalen Agenten. Keine neue visuelle Komplettabnahme behaupten.
