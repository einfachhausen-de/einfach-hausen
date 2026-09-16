import { AppShell } from '@/components/shell';
import { requireUser } from '@/lib/auth';
import { EHMetricsBar, EHPageHeader, EHList, EHTextLink, EHWorkflowStack } from '@/design-system';

const sections = [
  {
    title: 'Auftr\u00e4ge & Angebote',
    text: 'Hier l\u00e4uft dein Tagesgesch\u00e4ft: Anfragen pr\u00fcfen, Angebote schreiben und gebuchte Auftr\u00e4ge bis zur Fertigstellung begleiten. Jeder Vorgang zeigt dir den aktuellen Stand und den n\u00e4chsten sinnvollen Schritt.',
    links: [
      { href: '/pro/orders', label: 'Zu Auftr\u00e4ge & Kontakte' },
      { href: '/pro/jobs', label: 'Zu den Auftragsdetails' },
    ],
  },
  {
    title: 'Termine & Kalender',
    text: 'Alle best\u00e4tigten Kundentermine deines Betriebs in einer ruhigen Liste. Du siehst Auftrag, Kunde und Ansprechpartner auf einen Blick und springst direkt zum passenden Vorgang.',
    links: [{ href: '/pro/calendar', label: 'Zum Kalender' }],
  },
  {
    title: 'Nachrichten',
    text: 'Der direkte Draht zu deinen Kunden: Fragen kl\u00e4ren, Details abstimmen und Absprachen festhalten. Alles bleibt am jeweiligen Auftrag h\u00e4ngen, damit nichts verloren geht.',
    links: [{ href: '/pro/messages', label: 'Zu den Nachrichten' }],
  },
  {
    title: 'Team verwalten',
    text: 'Jeder Ansprechpartner bekommt einen eigenen Zugang mit klarer Zust\u00e4ndigkeit. Du legst fest, wer Auftr\u00e4ge verwalten darf und wer zugewiesene Arbeit betreut.',
    links: [{ href: '/pro/team', label: 'Zum Team' }],
  },
  {
    title: 'Rechnungen',
    text: 'Abgeschlossene Arbeit sauber abrechnen: Rechnungen erstellen, \u00fcberblicken und den Zahlungsstand verfolgen. So bleibt der Geldfluss deines Betriebs nachvollziehbar.',
    links: [{ href: '/pro/orders', label: 'Zu Rechnungen in den Aufträgen' }],
  },
  {
    title: 'F\u00e4higkeiten & Profil',
    text: 'Dein Aush\u00e4ngeschild beim Kunden: Leistungen, Arbeitsgebiet und Angaben zum Betrieb pflegen. Ein vollst\u00e4ndiges Profil hilft, passende Anfragen zu erhalten.',
    links: [{ href: '/pro/profile', label: 'Zum Profil' }],
  },
  {
    title: 'Mitgliedschaft',
    text: 'Planbar statt Provision: 100 % des Auftragswerts bleiben beim Betrieb. Hier w\u00e4hlst du den passenden Monatstarif \u2013 ein Tarif kauft niemals eine bessere Platzierung.',
    links: [{ href: '/pro/plans', label: 'Zu den Tarifen' }],
  },
  {
    title: 'Leads & Eingehende Anfragen',
    text: 'Neue Kundenkontakte landen hier: Anfragen prüfen, annehmen oder ablehnen und den Status pflegen. Nur freigegebene Kontakte werden mit allen Details angezeigt.',
    links: [{ href: '/pro/leads', label: 'Zu den Leads' }],
  },
  {
    title: 'Offene Anfragen',
    text: 'Alle passenden offenen Anfragen aus deinem Gebiet in einer Liste. Filtern nach Dringlichkeit und direkt zum Vorgang springen.',
    links: [{ href: '/anfragen-pro', label: 'Zu den offenen Anfragen' }],
  },
  {
    title: 'Onboarding',
    text: 'Neu dabei? In vier Schritten richtest du deinen Betrieb ein: Firmendaten, Leistungen, Arbeitsgebiet und abschlie\u00dfende Angaben. Jeder Schritt wird beim Weitergehen gespeichert.',
    links: [{ href: '/pro/onboarding', label: 'Zur Einrichtung' }],
  },
];

export default async function ProHilfe() {
  await requireUser('provider');
  const linkCount = sections.reduce((total, section) => total + section.links.length, 0);
  return (
    <AppShell role="provider" active="/pro/hilfe" title="Hilfe" subtitle="Anleitungen für den Partnerbereich">
      <EHWorkflowStack>
        <EHPageHeader title="Dein Betrieb. Einfach geregelt." context={`${sections.length} Themen · ${linkCount} Bereiche`} />
        <EHMetricsBar label="Hilfe" items={[
          { id: 'themen', label: 'Themen', value: sections.length },
          { id: 'bereiche', label: 'Verlinkte Bereiche', value: linkCount },
        ]} />
        <EHList label="Hilfethemen" items={sections.map((section) => ({
          id: section.title,
          title: section.title,
          text: section.text,
          href: section.links[0].href,
          action: <>{section.links.slice(1).map((link) => <EHTextLink key={link.href} href={link.href}>{link.label}</EHTextLink>)}</>,
        }))} />
      </EHWorkflowStack>
    </AppShell>
  );
}
