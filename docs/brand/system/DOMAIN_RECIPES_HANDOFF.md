> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# EH-BRAND-04-R2 · Lokaler Übernahmeauftrag

Autorität: Jerry fordert fachliche Vorlagen, damit Folgeagenten nicht selbst gestalten. Codex hat die acht neuen Kompositionen vollständig aus dem bestehenden Atelier-02-System geschrieben. Die Datei enthält keinen neuen CSS-Stil und keine Geschäftslogik. Diese Übernahme ist keine Erlaubnis, das Design abzuändern.

## Exakte Quellen und Arbeitsorte

- Hauptrepo: https://github.com/Delqhi/einfach-hausen, Branch design/einfachhausen-brand-atelier-20260906, OCI /home/ubuntu/orca/workspaces/einfach-hausen-brand-atelier-20260906; Mac i9 /Users/jeremyschulze/orca/workspaces/einfach-hausen-brand-atelier-20260906.
- Skills: https://github.com/OpenSIN-Code/wow-my-zsh, Branch design/eh-brand-skills-v1-20260906, OCI /home/ubuntu/orca/workspaces/wow-my-zsh-eh-design-20260906; Mac i9 /Users/jeremyschulze/orca/workspaces/wow-my-zsh-eh-design-20260906.
- Generator: /home/ubuntu/orca/workspaces/einfachhausen-presentation-brand-20260906, PR einfachhausen-de/einfachhausen-presentation-generator#1.
- CRM: /home/ubuntu/orca/workspaces/einfach-hausen-crm-brand-20260906, PR einfachhausen-de/einfach-hausen-crm#3.
- Hub: /home/ubuntu/orca/workspaces/portalhub-brand-20260906, PR einfachhausen-de/portalhub#1.
- vollständiger neuer Code: packages/eh-design/src/domain-recipes.tsx; vollständiger Export: packages/eh-design/src/index.ts. Beide Dateien stehen vollständig unten. Alle übrigen Dateien der bisherigen Lieferung: docs/brand/system/SOURCE.md. Keine Auslassungen oder vom Agenten erfundenen Ergänzungen verwenden.

## Verbindliche Auswahl

| Anwendungsfall | Fertige Komposition | Gestaltung |
|---|---|---|
| Auftrag / Anfrage im Detail | EHJobDetailPage | Status, genau nächster Schritt, Register für Überblick/Verlauf/Unterlagen/Beteiligte |
| Termine | EHAppointmentsPage | Tagesagenda mit Zeit, Ort, Status; Zeitraumsteuerung; kein neu erfundener Monatskalender |
| Gespräch zu einem Vorgang | EHMessageThreadPage | chronologisches Nachrichtenregister, Autor/Zeit/Sendestatus, bestehender Composer; keine Chatblasen |
| Rechnungen / Belege | EHBillingPage | Tabellenregister mit formatierten Beträgen und Originaldokumenten; keine Finanz-KPI-Kacheln |
| Profil / Betrieb / Einstellungen | EHSettingsPage | fachlich gruppierte Felder, sichtbare Fehler/Quittung, getrennte sensible Aktion |
| Anmeldung / Registrierung / Wiederherstellung | EHAccessPage | schmale Formularspalte, vorhandene Auth-Felder, Hilfe und echte Rechtstexte |
| Lexikon-Unterseite | EHGlossaryEntryPage | Definition, Inhaltsverzeichnis, klar gegliederte Abschnitte, verwandte Begriffe |
| Notfall / Versicherung / Verkauf | EHSensitiveServicePage | verpflichtende Leistungsgrenze vor dem nächsten Schritt, Ablauf, FAQ, passende Weiterführung |

Die acht bisherigen Rezepte bleiben für Startseite, allgemeine Leistungen, Artikel, Übersichten, Kontakt, Preise, Owner- und Handwerker-Übersicht gültig. Zusammen 16 fachliche Seitenkompositionen. Die 49 bisherigen Basisbausteine bleiben unverändert.

## Zulässige Datenbindung – keine Gestaltungsfreiheit

- Fakten, Titel, Datums-/Uhrzeit-/Währungsdarstellung und Statusbeschriftungen stammen aus bestehenden APIs. Anzeigeformatierung bleibt in der bisherigen Daten-/Viewmodel-Schicht; keine erfundenen Summen oder Statuszuordnungen.
- Gruppen-IDs, Dokument-IDs und Nachrichten-IDs müssen echt und stabil sein. Termine sind mit der bestehenden Nutzerzeitzone vorformatiert. Keine clientseitigen erfundenen Termine.
- reply.onSubmit an den vorhandenen Nachrichten-Endpunkt anbinden und dessen Promise zurückgeben. pending/error mit echten Zuständen verbinden. Keine künstliche Erfolgsmeldung. EHComposer leert nach Erfolg aktuell NICHT automatisch; kein key auf lastMessageId setzen, das würde Eingaben bei eingehenden Nachrichten verlieren. Für fachlich nötiges Leeren einen konkreten Funktionsfix mit bestehendem Design und eigenem Verhaltenstest liefern, nicht die UI neu bauen.
- EHSettingsPage.onSubmit wird im bestehenden Client-Adapter gebunden: bestehende Validierung, CSRF, Berechtigungen und Speicheraktion erhalten. success ausschließlich nach bestätigter Speicherung setzen. Keine Speicherung allein durch einen Klick behaupten.
- fields und form sind Integrationsslots ausschließlich für EHField, EHInput, EHTextarea, EHSelect, EHCheckbox und EHButton samt existierenden fachlich nötigen Hidden-Inputs. Keine beliebigen Cards, Styles, Tailwind-Paletten oder kopierten Formdesigns einfügen.
- Anmeldung nutzt ausschließlich die vorhandenen Auth-Routen/Serveraktionen und verifizierten Rechtstexte. Keine Demo-Anmeldung oder neuen Login-Endpunkte.
- Sensible Leistungen müssen die aktuellen, bereits freigegebenen Einschränkungen aus der jeweiligen echten Route liefern. Keine garantierte Notfallbereitschaft, automatische Versicherungsmeldung oder automatische Datenfreigabe erfinden.
- Diese Komponenten ersetzen ausschließlich den jeweiligen Inhaltsbereich. Bestehende Menüs, Shell, Rollen und Navigation erhalten. Keine verschachtelten Hauptüberschriften oder neuen Menüpunkte.

## Erlaubte Arbeiten und Reihenfolge

1. Git-Status aller betroffenen eigenen Checkouts lesen. Fremde Änderungen nicht überschreiben. Bei Abweichungen isolierten Checkout anlegen, keine Bereinigung. Neueste oben genannte Branches lesen; keine Arbeit auf PR42.
2. Die untenstehenden Dateien sind bereits im kanonischen Hauptbranch enthalten. Nicht erneut anders implementieren. Export und vorhandene Bibliothek verwenden. Gesiegelte Dateien nicht ändern, Siegel nicht erneuern.
3. Auf Wunsch zunächst nur Bibliotheksansichten für diese acht Rezepte im bestehenden /design-system ergänzen. Beispiele sichtbar als Beispiele kennzeichnen. Daten/Handler aus vorhandenen Mustern verwenden; Demo sendet und speichert nichts.
4. Kanonische unveränderte Bibliothek mit dem vorhandenen Synchronisierer in die drei Consumer übertragen. Dortige Hash-Siegel werden dadurch erwartbar veraltet: NICHT als gewöhnlicher Agent neu versiegeln. Die autorisierte Änderung beschränkt sich auf identische Vendor-Dateien und aktualisiertes Herkunftsmanifest; einen getrennten Release-Patch mit exakten Hashänderungen zur Markenfreigabe dokumentieren. Keine Kernstiländerungen hinzufügen.
5. Aktualisierte Skills aus Git auf OCI und Mac i9 installieren. Der vorhandene Installer sichert Altversionen und kontrolliert die Kopie.
6. Produktmigration nur im zugewiesenen EH-BRAND-05-WEB/APPS/CRM/HUB-Auftrag durchführen. Native Worker-CRM verwendet weiter den vorhandenen HTML-Adapter, nicht diese React-Kompositionen.
7. Weitere Tests und Abnahme sind ausdrücklich deine Aufgabe: reale Imports typprüfen, Build, /design-system und betroffene echte Routen bei 390/736/1440 sowie Zoom prüfen, Formular-/Nachrichten-/Berechtigungszustände testen. Keine neuen externen Schreibvorgänge ausführen. Defekte konkret dokumentieren; keine eigene visuelle Ersatzlösung.
8. Task, NEXT_AGENT, Handoff, Quellcodepaket und Hashmanifest aktualisieren. Keine Behauptung von Merge, Deployment, Installation oder Pflichtschutz ohne Beleg. Public Pflichtcheck-Aktivierung bleibt EH-BRAND-06; private Free-Org-Einschränkung beachten.

## Befehle (OCI; der Mac nutzt dieselben Git-Quellen mit seinen oben genannten Pfaden)

```bash
export PATH=/home/ubuntu/.nvm/versions/node/v22.23.0/bin:/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin
cd /home/ubuntu/orca/workspaces/einfach-hausen-brand-atelier-20260906
git status --short
git fetch origin design/einfachhausen-brand-atelier-20260906
# Nur bei sauberem eigenem Checkout auf diesem Branch:
git merge --ff-only origin/design/einfachhausen-brand-atelier-20260906
node scripts/eh-design-sync.mjs --target /home/ubuntu/orca/workspaces/einfachhausen-presentation-brand-20260906
node scripts/eh-design-sync.mjs --target /home/ubuntu/orca/workspaces/einfach-hausen-crm-brand-20260906
node scripts/eh-design-sync.mjs --target /home/ubuntu/orca/workspaces/portalhub-brand-20260906
cd /home/ubuntu/orca/workspaces/wow-my-zsh-eh-design-20260906
git status --short
git fetch origin design/eh-brand-skills-v1-20260906
git merge --ff-only origin/design/eh-brand-skills-v1-20260906
python3 scripts/install-eh-design-skills.py
```

Die Sync-Befehle brechen bei lokalen Vendor-Abweichungen absichtlich ab. Dann den konkreten Pfad/Hash melden; nichts löschen und keine Schutzprüfung abschalten. Auf Mac ist der Marken-Review-Checkout detached: nach sauberem Status gezielt auf den freigegebenen Commit wechseln, nicht blind mergen.

## Abnahmestatus

Diese acht Kompositionen sind von Codex geschrieben. Ihre neue Rendering-/Verhaltensprüfung ist auf ausdrücklichen Nutzerwunsch an lokale Agenten delegiert. Keine neue visuelle Abnahme behaupten. Die bislang installierten Skills und Consumer sind Edition 1; Edition 2 wird mit diesem Auftrag übernommen.

## Vollständige Datei: packages/eh-design/src/domain-recipes.tsx

`````tsx
import type {ComponentProps, FormEventHandler, ReactNode} from "react";
import {EHScope, EHContainer, EHSection, EHHeading, EHText, EHEyebrow, EHButton, EHStatus, EHActions, EHTextLink, EHDivider, type EHButtonProps} from "./primitives";
import {EHPanel, EHProse, EHTimeline, EHCallout, EHArticleHeader, EHArticleLayout, EHRelated, EHPageHero, EHSteps, EHFAQ, EHClosing} from "./blocks";
import {EHAppHeader, EHTabs, EHList, EHDocumentList, EHDataTable, EHEmptyState, EHErrorState, EHComposer, type EHDocument} from "./app";

type Status = ComponentProps<typeof EHStatus>["tone"];
type Action = {label: string; href: string};
type Fact = {label: string; value: string};
type ListItem = ComponentProps<typeof EHList>["items"][number];
type Timeline = ComponentProps<typeof EHTimeline>["items"];
type FAQ = ComponentProps<typeof EHFAQ>["items"];

/** Approved compositions only: no new stylesheet, palette, navigation or business API. */
export function EHJobDetailPage({title, reference, summary, status, facts, nextStep, history, documents, contacts}: {
  title: string; reference: string; summary: string;
  status: {label: string; tone: Status}; facts: Fact[];
  nextStep: {title: string; text: string; action?: Action};
  history: Timeline; documents: EHDocument[]; contacts: ListItem[];
}) {
  return <EHScope app>
    <EHSection compact>
      <EHAppHeader eyebrow={reference} title={title} text={summary} actions={<EHStatus tone={status.tone}>{status.label}</EHStatus>}/>
      <EHCallout title={nextStep.title}><EHText>{nextStep.text}</EHText>{nextStep.action && <EHButton href={nextStep.action.href} arrow>{nextStep.action.label}</EHButton>}</EHCallout>
    </EHSection>
    <EHSection compact tone="white">
      <EHTabs label="Auftragsdetails" tabs={[
        {id: "details", label: "Überblick", content: <EHList label="Auftragsdaten" items={facts.map(f => ({id:f.label, title:f.label, text:f.value}))}/>},
        {id: "history", label: "Verlauf", content: history.length ? <EHTimeline items={history}/> : <EHEmptyState title="Noch kein Verlauf" text="Bestätigte Änderungen erscheinen hier."/>},
        {id: "documents", label: "Unterlagen", content: <EHDocumentList documents={documents}/>},
        {id: "contacts", label: "Beteiligte", content: contacts.length ? <EHList label="Beteiligte" items={contacts}/> : <EHEmptyState title="Noch niemand zugeordnet" text="Zugeordnete Kontakte erscheinen hier."/>}
      ]}/>
    </EHSection>
  </EHScope>;
}

export function EHAppointmentsPage({title = "Deine Termine", period, groups, navigation, primaryAction}: {
  title?: string; period: string;
  groups: {id: string; dateLabel: string; appointments: {id: string; time: string; title: string; location: string; href: string; status?: {label:string; tone:Status}}[]}[];
  navigation: {previous?: Action; next?: Action; today?: Action};
  primaryAction?: Action;
}) {
  return <EHScope app><EHSection compact>
    <EHAppHeader eyebrow="Gut vorbereitet" title={title} text={period} actions={primaryAction && <EHButton href={primaryAction.href}>{primaryAction.label}</EHButton>}/>
    <nav aria-label="Zeitraum wählen"><EHActions>{[navigation.previous,navigation.today,navigation.next].filter((a): a is Action => Boolean(a)).map(a => <EHButton key={a.href+a.label} href={a.href} variant="secondary" size="small">{a.label}</EHButton>)}</EHActions></nav>
  </EHSection><EHSection compact tone="white">
    {groups.some(g=>g.appointments.length) ? groups.filter(g=>g.appointments.length).map(g=><EHPanel key={g.id} title={g.dateLabel}>
      <EHList label={"Termine am "+g.dateLabel} items={g.appointments.map(a=>({id:a.id,title:a.time+" · "+a.title,text:a.location,href:a.href,meta:a.status && <EHStatus tone={a.status.tone}>{a.status.label}</EHStatus>}))}/>
    </EHPanel>) : <EHEmptyState title="Für diesen Zeitraum ist nichts eingetragen." text="Bestätigte Termine erscheinen hier."/>}
  </EHSection></EHScope>;
}

export function EHMessageThreadPage({title, context, back, messages, reply, readOnlyReason}: {
  title: string; context: string; back: Action;
  messages: {id: string; author: string; sentAt: string; body: string; delivery?: {label: string; tone: Status}}[];
  reply?: ComponentProps<typeof EHComposer>; readOnlyReason?: string;
}) {
  return <EHScope app><EHSection compact>
    <EHTextLink href={back.href}>{back.label}</EHTextLink>
    <EHAppHeader eyebrow="Im Gespräch" title={title} text={context}/>
    <div role="log" aria-label="Nachrichtenverlauf" aria-live="polite" aria-relevant="additions">
      {messages.length ? messages.map(m=><EHPanel key={m.id} label={m.sentAt} title={m.author}>
        {m.body.split(/\r?\n/).map((line,i)=>line ? <EHText key={i}>{line}</EHText> : null)}
        {m.delivery && <EHStatus tone={m.delivery.tone}>{m.delivery.label}</EHStatus>}
      </EHPanel>) : <EHEmptyState title="Hier beginnt euer Gespräch." text="Nachrichten zu diesem Vorgang bleiben hier nachvollziehbar."/>}
    </div>
  </EHSection><EHSection compact tone="white">
    {reply && !readOnlyReason ? <EHComposer {...reply} label="Deine Nachricht" hint="Die Nachricht gehört zu diesem Gespräch." submitLabel="Nachricht senden"/> :
      <EHCallout title="Dieses Gespräch ist schreibgeschützt"><EHText>{readOnlyReason ?? "Du hast aktuell keine Berechtigung, hier zu schreiben."}</EHText></EHCallout>}
  </EHSection></EHScope>;
}

export function EHBillingPage({title = "Rechnungen & Belege", text, rows, note, action}: {
  title?: string; text: string; note: string; action?: Action;
  rows: {id:string; number:string; party:string; date:string; amount:string; status:{label:string;tone:Status}; document?:Action}[];
}) {
  return <EHScope app><EHSection compact>
    <EHAppHeader eyebrow="Nachvollziehbar abgelegt" title={title} text={text} actions={action && <EHButton href={action.href}>{action.label}</EHButton>}/>
    <EHCallout title="Zur Einordnung"><EHText>{note}</EHText></EHCallout>
  </EHSection><EHSection compact tone="white">
    <EHDataTable caption="Rechnungen und Belege" columns={[
      {key:"number",label:"Beleg"},{key:"party",label:"Beteiligte"},{key:"date",label:"Datum"},
      {key:"amount",label:"Betrag",numeric:true},{key:"status",label:"Status"},{key:"document",label:"Dokument"}
    ]} rows={rows.map(r=>({id:r.id,cells:{
      number:r.number,party:r.party,date:r.date,amount:r.amount,
      status:<EHStatus tone={r.status.tone}>{r.status.label}</EHStatus>,
      document:r.document ? <EHTextLink href={r.document.href}>{r.document.label}</EHTextLink> : "Noch kein Dokument"
    }}))}/>
  </EHSection></EHScope>;
}

export function EHSettingsPage({title = "Deine Einstellungen", text, groups, onSubmit, pending, error, success, saveLabel = "Änderungen speichern", securityAction}: {
  title?:string; text:string;
  groups:{id:string;title:string;description:string;fields:ReactNode}[];
  onSubmit:FormEventHandler<HTMLFormElement>; pending:boolean; error?:string; success?:string; saveLabel?:string;
  securityAction?:{title:string;text:string;button:EHButtonProps};
}) {
  return <EHScope app><EHSection compact><EHAppHeader eyebrow="So passt es für dich" title={title} text={text}/></EHSection>
    <EHSection compact tone="white"><form onSubmit={onSubmit} aria-busy={pending}>
      {groups.map(g=><EHPanel key={g.id} title={g.title}><EHText muted>{g.description}</EHText>{g.fields}</EHPanel>)}
      {error && <EHErrorState text={error}/>}
      {success && <p role="status"><EHStatus tone="success">{success}</EHStatus></p>}
      <EHActions><EHButton type="submit" disabled={pending}>{pending ? "Wird gespeichert …" : saveLabel}</EHButton></EHActions>
    </form></EHSection>
    {securityAction && <EHSection compact><EHCallout title={securityAction.title}><EHText>{securityAction.text}</EHText><EHButton {...securityAction.button} variant="danger"/></EHCallout></EHSection>}
  </EHScope>;
}

export function EHAccessPage({title, text, eyebrow, form, help, legal}: {
  title:string; text:string; eyebrow:string; form:ReactNode; help:Action[]; legal:ReactNode;
}) {
  return <EHScope><EHSection compact><EHContainer narrow><EHEyebrow>{eyebrow}</EHEyebrow>
    <EHHeading as="h1" scale="page">{title}</EHHeading><EHText size="lead">{text}</EHText></EHContainer>
  </EHSection><EHSection compact tone="white"><EHContainer narrow>
    <EHPanel>{form}</EHPanel>
    <nav aria-label="Weitere Möglichkeiten"><EHActions>{help.map(a=><EHTextLink key={a.href} href={a.href}>{a.label}</EHTextLink>)}</EHActions></nav>
    <EHDivider/><EHProse>{legal}</EHProse></EHContainer>
  </EHSection></EHScope>;
}

export function EHGlossaryEntryPage({term, category, definition, sections, related, date}: {
  term:string; category:string; definition:string; date?:string;
  sections:{id:string;title:string;paragraphs:string[]}[];
  related:ComponentProps<typeof EHRelated>["items"];
}) {
  return <EHScope><EHSection>
    <EHArticleHeader category={category} title={term} description={definition} date={date}/>
    <EHArticleLayout contents={sections.map(s=>({id:s.id,title:s.title}))}>
      {sections.map(s=><section key={s.id} id={s.id}><EHHeading>{s.title}</EHHeading>{s.paragraphs.map((text,i)=><EHText key={i}>{text}</EHText>)}</section>)}
    </EHArticleLayout>
  </EHSection><EHSection tone="white"><EHRelated title="Verwandte Begriffe und passende Ratgeber" items={related}/></EHSection></EHScope>;
}

export function EHSensitiveServicePage({kind, title, text, scopeNotice, nextStep, steps, faq, more}: {
  kind:"notfall"|"versicherung"|"immobilienverkauf";
  title:string;text:string;scopeNotice:{title:string;text:string};
  nextStep:Action; steps:ComponentProps<typeof EHSteps>["items"]; faq:FAQ;
  more:ComponentProps<typeof EHRelated>["items"];
}) {
  const labels={notfall:"Dringendes Anliegen",versicherung:"Versicherung & Unterlagen",immobilienverkauf:"Immobilie & nächste Schritte"};
  return <EHScope><EHPageHero eyebrow={labels[kind]} title={title} text={text}/>
    <EHSection compact><EHCallout title={scopeNotice.title}><EHText>{scopeNotice.text}</EHText></EHCallout></EHSection>
    <EHSection tone="white"><EHHeading>So gehst du weiter vor.</EHHeading><EHSteps items={steps}/></EHSection>
    <EHSection><EHFAQ items={faq}/><EHRelated title="Weiterführende Informationen" items={more}/></EHSection>
    <EHClosing title={nextStep.label} text={scopeNotice.text} href={nextStep.href} label={nextStep.label}/>
  </EHScope>;
}
`````

## Vollständige Datei: packages/eh-design/src/index.ts

`````ts
export * from "./tokens";
export * from "./primitives";
export * from "./blocks";
export * from "./app";
export * from "./domain-recipes";
`````
