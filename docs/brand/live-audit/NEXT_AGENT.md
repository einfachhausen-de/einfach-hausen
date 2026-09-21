> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Designreview des laufenden Agenten · 2026-09-07

Geprüfter Remote-App-Stand: c6494c3; neue Auftragsdetail-Migration 5d36982. Das aktive Arbeitsverzeichnis enthält fremde Änderungen und wurde nicht bearbeitet. Unveröffentlichte Änderungen können weiter fortgeschritten sein; vor Umsetzung erneut vergleichen.

## Bestätigte Befunde und zuständige Tasks
EH-BRAND-05-APPS / Issue44:
- PR49 ist noch nicht integriert. src/components/shell.tsx enthält CenterLogo-Nachzeichnung, src/components/owner-menu.tsx ebenfalls; Wizard und Team verwenden noch den Vorgänger. Das ist eine Integrationslücke, keine belegte Löschung durch den Agenten. Zuerst PR49 dreiwegeintegrieren.
- src/app/pro/jobs/[id]/page.tsx: Zeilen 139–185 und 219–249 enthalten alte Kontakt-/Angebots-/Zuweisungsformulare; 316–337 alten Chat inklusive nacktem Input. Neue EH-Überschrift und EHPanel reichen nicht für Status fertig. InvoiceForm und Dokumentbereiche sind separat weiter zu prüfen.
- Team-/Wizard-Lücken werden durch PR49 abgedeckt, nicht nochmals neu bauen.
EH-BRAND-06 / Issue39:
- Quellenprüfung und Live-Abnahme getrennt dokumentieren. Website-main besitzt die korrigierten EHProblemNotes/EHComparison/EHProcess-Kompositionen. HTTP-Abrufe von /, /so-funktionierts, /login, /app und /pro liefern aus dieser Laufzeit 403 (http-evidence.json). Das beweist weder einen Produktdefekt noch Erreichbarkeit für normale Nutzer.
- Browserstart scheitert auf OCI an snap-confine/cap_dac_override. Keine Rechte aufgeweicht. Vollformat-Browserprüfung bei 390/736/1440 und echte angemeldete Rollenansichten stehen aus.
- GitNexus impact-Aufruf zunächst mehrdeutig; mit Repo-Pfad Timeout nach 15s. Kein verlässlicher Graph-Nachweis für neue Komponenten. Bestehende Workflow-Funktionen unverändert; drei neue Exporte, noch keine Consumer-Migration.

## Vollständige neue Vorlagen
packages/eh-design/src/job-forms.tsx exportiert EHQuoteForm, EHAssignmentForm und EHJobMessageForm. Gestaltung ausschließlich durch vorhandene kanonische Komponenten, keine neuen CSS-Regeln. Quellkapsel SOURCE.md enthält alle geänderten Dateien vollständig.

## Exakte Übernahme
1. PR49 integrieren, aktuelle main-Website-Exporte und CSS vollständig erhalten. Danach diese Ergänzung übernehmen. Keinen alten SOURCE-Snapshot über aktuellen Code kopieren.
2. In src/app/pro/jobs/[id]/page.tsx EHQuoteForm innerhalb DERSELBEN bestehenden Berechtigungsbedingung einsetzen: action=submitQuoteAction.bind(null,access.id), id="provider-quote", amountCents=quote?.amount, availableAt=quote?.available_at || "", message=quote?.message || "", updating=Boolean(quote). Server erhält weiterhin amount in Euro, availableAt, message. Keine Änderung an Währungskonvertierung oder Servervalidierung.
3. EHAssignmentForm: exakt die bislang angezeigten aktiven Ansprechpartner auf {id: user_id,label: vollständiger Name plus bisherige Funktionsbezeichnung} abbilden. Keine neue Benutzerliste. action und selectedId von bisherigem Formular übernehmen. mode="accept-contact" bei acceptContactRequestAction, "assign" beim ersten assignJobContactAction und "reassign" bei vorhandener Zuweisung. Bestehende Rollen- und Auftragsbedingungen außen erhalten. Leere Liste ergibt expliziten Leerzustand.
4. EHJobMessageForm: id="provider-job-message"; action bleibt isContact ? sendSavedContactMessageAction.bind(null,u.id,access.homeowner_id) : sendMessageAction.bind(null,access.id,access.homeowner_id). Feldname body bleibt. Nur Eingabeformular ersetzt; Nachrichtenverlauf, private Daten, Kontaktfreigaben und Anhänge nicht löschen. Dieser Baustein behauptet keine vollständige Chat-Migration.
5. Ablehnen/Starten/Abschließen bleiben echte separate Aktionen. Passende EHSubmitButton-Formulare verwenden, keine generische Action mit geratenen Parametern. Rechnung und Upload nicht durch Attrappen ersetzen.
6. Pro Route Restliste erstellen: Shell, Überschriften, Formulare, Listen/Chat, Feedback, Dialoge, Druck, Berechtigungen. Erst nach echter Ansicht und Funktionsnachweis vollständig migriert nennen. Nicht passende neue Masken mit konkreten Daten/Zuständen an Designautorität melden.

Validiert: TypeScript --noEmit und kanonischer Design-Check bestanden. Nicht validiert: vollständige Browser-/Rollen-/Formularflüsse, neue Komponenten visuell. Kein Merge oder Deployment.
