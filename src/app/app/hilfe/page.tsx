import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import {
  EHAppHeader,
  EHButton,
  EHDetailDisclosure,
  EHList,
  EHPanel,
  EHWorkspaceGrid,
  EHWorkSection,
} from '@/design-system';

export default async function HilfePage() {
  await requireUser('homeowner');

  return (
    <AppShell role="homeowner" active="/app/more" title="Hilfe" subtitle="Orientierung und persönliche Unterstützung" breadcrumbs={crumbs(null,'Hilfe & Kontakt')}>
      <EHAppHeader
        eyebrow="Hilfe & Orientierung"
        title="Was möchtest du klären?"
        text="Finde den passenden Bereich für dein Anliegen oder öffne deine Ansprechpartner."
        actions={<EHButton href="/app/messages" variant="secondary">Zu deinen Ansprechpartnern</EHButton>}
      />
      <EHWorkspaceGrid
        main={
          <EHWorkSection title="Dein nächster Schritt">
            <EHList label="Schnelle Hilfe" items={[
              { id: 'request', title: 'Ein Anliegen rund ums Haus beschreiben', text: 'Starte beim Hausmeister und kläre, was als Nächstes nötig ist.', href: '/app/hausmeister' },
              { id: 'order', title: 'Einen bestehenden Auftrag prüfen', text: 'Öffne den Auftrag für Status und zugehörige Informationen.', href: '/app/jobs' },
              { id: 'appointment', title: 'Einen Termin nachsehen', text: 'Prüfe Datum, Uhrzeit und den angezeigten Terminstatus.', href: '/app/calendar' },
              { id: 'contact', title: 'Eine Absprache wiederfinden', text: 'Öffne deine Ansprechpartner und die zugehörige Unterhaltung.', href: '/app/messages' },
            ]} />
          </EHWorkSection>
        }
        aside={
          <EHPanel title="Wenn es dringend ist" footer={{ href: '/app/emergency', text: 'Zum Notfallbereich' }}>
            <p>Bei Lebensgefahr, Brand oder Gasgeruch rufe zuerst die 112 an.</p>
            <p>Für dringende Probleme am Haus findest du Hinweise im Notfallbereich. Eine Betreuung rund um die Uhr ist nicht zugesichert.</p>
          </EHPanel>
        }
      />
      <EHWorkSection title="Die App einfach erklärt">
        <EHDetailDisclosure id="hilfe-haus" title="Dein Haus & deine Unterlagen" description="Hausdaten, Dokumente und der Überblick über dein Jahr.">
          <EHList label="Haus und Unterlagen" items={[
            { id: 'home', title: 'Mein Haus', text: 'Adresse, Ausstattung und Hausdaten. Hier findest du auch Historie und Hauspass.', href: '/app/home' },
            { id: 'documents', title: 'Dokumente & Rechnungen', text: 'Sammle Rechnungen, Nachweise und Belege zu deinem Zuhause.', href: '/app/documents' },
            { id: 'year', title: 'Mein Jahr', text: 'Verschaffe dir einen Überblick über Wartungen, Termine und erledigte Arbeiten.', href: '/app/year' },
          ]} />
        </EHDetailDisclosure>
        <EHDetailDisclosure id="hilfe-organisieren" title="Anliegen & Zusammenarbeit" description="Aufträge, Termine und die Menschen, die dir weiterhelfen.">
          <EHList label="Anliegen und Zusammenarbeit" items={[
            { id: 'manager', title: 'Hausmeister', text: 'Beschreibe dein Anliegen und kläre einen nächsten Schritt. Der Assistent ersetzt keine fachliche Prüfung vor Ort.', href: '/app/hausmeister' },
            { id: 'jobs', title: 'Aufträge', text: 'Verfolge deine Anfrage und den weiteren Ablauf im zugehörigen Auftrag.', href: '/app/jobs' },
            { id: 'calendar', title: 'Termine', text: 'Hier findest du die gespeicherten Termine und ihren aktuellen Status.', href: '/app/calendar' },
            { id: 'messages', title: 'Ansprechpartner & Nachrichten', text: 'Finde deine Kontakte und halte Absprachen in der zugehörigen Unterhaltung fest.', href: '/app/messages' },
            { id: 'partners', title: 'Partner', text: 'Informiere dich über die angebotenen Partner und ihre Leistungen.', href: '/app/partners' },
          ]} />
        </EHDetailDisclosure>
        <EHDetailDisclosure id="hilfe-entscheidungen" title="Beratung, Schaden & Hausverkauf" description="Unterstützung bei besonderen Fragen rund um dein Zuhause.">
          <EHList label="Besondere Anliegen" items={[
            { id: 'consultation', title: 'Beratung', text: 'Schildere deine Frage. Daraus entsteht nicht automatisch ein Auftrag oder ein Preis.', href: '/app/consultation' },
            { id: 'insurance', title: 'Versicherung', text: 'Bereite Fotos, Belege und Informationen zu einem Schaden vor. Deine Versicherung wird nicht automatisch kontaktiert.', href: '/app/insurance' },
            { id: 'sale', title: 'Hausverkauf', text: 'Informiere dich über den Ablauf. Du entscheidest, ob du Kontaktdaten weitergibst.', href: '/app/home/sale' },
          ]} />
        </EHDetailDisclosure>
        <EHDetailDisclosure id="hilfe-konto" title="Dein Profil & deine App" description="Persönliche Angaben, Mitgliedschaft und App-Funktionen.">
          <EHList label="Profil und App" items={[
            { id: 'profile', title: 'Profileinstellungen', text: 'Prüfe und bearbeite deine persönlichen Angaben und deine Adresse.', href: '/app/profile' },
            { id: 'settings', title: 'Einstellungen', text: 'Informationen zu Installation, Benachrichtigungen, Assistent und Kontodaten.', href: '/app/settings' },
            { id: 'plans', title: 'Mitgliedschaft & Pakete', text: 'Sieh nach, welche Leistungen deine Mitgliedschaft enthält.', href: '/app/plans' },
          ]} />
        </EHDetailDisclosure>
      </EHWorkSection>
    </AppShell>
  );
}
