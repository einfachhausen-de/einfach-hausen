import type { Metadata } from 'next';
import { BadgeCheck, Eye, FileCheck2, FolderLock, Handshake, LockKeyhole, ShieldCheck, ShieldOff, UserCheck, Users } from 'lucide-react';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { AlertPanel, ClosingCta, ExampleCard, FeatureCards, Heading, HonestLimits, LegalNav, PageHero, Section } from '@/components/site/page/blocks';
import { Reveal } from '@/components/marketing/motion';
import { PRINCIPLES } from '@/components/marketing/content';
import { ButtonLink } from '@/design-system/site';

export const metadata: Metadata = {
  title: 'Sicherheit & Daten',
  description: 'Wie Einfach Hausen deine Daten, Freigaben und Entscheidungen schützt. Überprüfbare Prinzipien statt Siegel ohne Beleg.',
  alternates: { canonical: canonical('/sicherheit') },
};

const PRINCIPLE_ICONS = [UserCheck, Users, Handshake, FolderLock] as const;

export default function Page() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Sicherheit & Daten"
        title="Nichts passiert mit deinem Haus oder deinen Daten ohne dich."
        text="Einfach Hausen trennt private Daten, bewusste Freigaben und technische Sicherheitsgrenzen. Hier stehen überprüfbare Produktprinzipien und vorhandene Schutzmechanismen – keine externe Zertifizierung und keine Garantie, die wir nicht belegen können."
        actions={
          <>
            <ButtonLink href="/register?role=homeowner" size="lg" arrow>
              Hauskonto kostenlos anlegen
            </ButtonLink>
            <ButtonLink href="/datenschutz" variant="outline" size="lg">
              Datenschutzerklärung
            </ButtonLink>
          </>
        }
        aside={
          <ExampleCard
            label="Freigabe-Prinzip"
            title="Bevor Daten weitergehen, fragen wir dich."
            rows={[
              { title: 'Konkreter Vorgang', text: 'Freigaben gelten nur für das Anliegen, um das es gerade geht.' },
              { title: 'Konkreter Betrieb', text: 'Nur der Partner, den du bestätigst – nicht pauschal alle.' },
              { title: 'Deine Bestätigung', text: 'Ohne deine aktive Zustimmung passiert nichts.' },
            ]}
          />
        }
      />

      <Section>
        <Heading eyebrow="Vier Regeln" title="Woran du uns messen kannst." />
        <FeatureCards columns={2} items={PRINCIPLES.map((principle, index) => ({ ...principle, icon: PRINCIPLE_ICONS[index] }))} />
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Deine Entscheidung" title="Was nie ohne dich passiert." />
        <FeatureCards
          items={[
            { icon: UserCheck, title: 'Keine automatische Beauftragung', text: 'Eine Frage oder Kontaktanfrage wird nicht stillschweigend zu einem kostenpflichtigen Auftrag. Du bestätigst jeden Termin selbst.' },
            { icon: Eye, title: 'Zweckgebundene Freigaben', text: 'Haus- und Kontaktdaten gehen nur an den Partner, den du für einen konkreten Vorgang bestätigst. Nicht pauschal an alle.' },
            { icon: LockKeyhole, title: 'Private Bereiche bleiben getrennt', text: 'Nachrichten, Zahlungen und nicht freigegebene Dokumente gehören nicht automatisch zu einer Hausübergabe oder Partnerfreigabe.' },
          ]}
        />
      </Section>

      <Section tone="dark">
        <Heading tone="dark" eyebrow="Technische Schutzmechanismen" title="Was die Plattform technisch absichert." />
        <FeatureCards
          tone="dark"
          items={[
            { icon: LockKeyhole, title: 'Geschützte Sitzungen', text: 'Anmeldung und Sitzungen nutzen serverseitige Session-Kontrollen. Produktions-Cookies sind für geschützte Übertragung und serverseitigen Zugriff ausgelegt.' },
            { icon: FileCheck2, title: 'Private Dateien', text: 'Dokument- und Medienrouten prüfen Pfadgrenzen und Berechtigungen, bevor Inhalte ausgeliefert werden.' },
            { icon: ShieldCheck, title: 'Signierte Integrationen', text: 'Eingehende Webhooks für Kommunikations- und Zahlungsflüsse werden vor jeder Zustandsänderung auf ihre Signatur geprüft.' },
          ]}
        />
        <Reveal y={12}>
          <AlertPanel icon={ShieldOff} title="Kein Zertifizierungsclaim">
            Aus diesen Kontrollen folgt keine Behauptung über ISO-, TÜV-, BSI- oder andere externe Zertifizierungen. Ein Siegel veröffentlichen wir nur mit
            dokumentarischem Nachweis, gültigem Umfang und freigegebener Formulierung.
          </AlertPanel>
        </Reveal>
      </Section>

      <Section>
        <Heading
          eyebrow="Partnervertrauen"
          title="Wie wir Partnerbetriebe prüfen."
          text="Der Prüfstandard ist ein Produktstandard, kein pauschales Zertifikat. Ob ein konkreter Betrieb aktiv ist, ergibt sich aus seinem realen Verifizierungs- und Vertragsstatus."
        />
        <FeatureCards
          items={[
            { icon: BadgeCheck, title: 'Unternehmen & Qualifikation', text: 'Unternehmensdaten, erforderliche Qualifikationen beziehungsweise Zulassungen und der vertragliche Partnerstatus.' },
            { icon: ShieldCheck, title: 'Versicherung & Qualität', text: 'Betriebshaftpflicht, Referenzen beziehungsweise Bewertungen und der laufende Qualitätsstatus.' },
            { icon: Users, title: 'Region, Kapazität & Kommunikation', text: 'Einsatzgebiet, verfügbare Kapazität und Kommunikationsqualität sind Teil des Partner- und Matchingmodells.' },
          ]}
        />
      </Section>

      <Section tone="cream">
        <HonestLimits
          title="Was wir nicht versprechen."
          items={[
            'Keine monetäre Garantie und keine feste Entschädigung.',
            'Keine garantierte Reaktionszeit – Verfügbarkeit hängt vom regionalen Partnernetz ab.',
            'Kein externes Qualitätssiegel ohne dokumentierten Nachweis.',
            'Solche Zusagen brauchen vorher dokumentierte Bedingungen, einen realen operativen Prozess und die erforderliche rechtliche Freigabe.',
          ]}
        />
        <LegalNav
          items={[
            { href: '/datenschutz', label: 'Datenschutz' },
            { href: '/impressum', label: 'Impressum' },
            { href: '/kontakt', label: 'Kontakt' },
          ]}
        />
      </Section>

      <ClosingCta
        title="Kontrolle behalten – von der ersten Frage bis zum erledigten Auftrag."
        text="Starte kostenlos und entscheide bei jedem Schritt selbst, was mit deinen Daten und deinem Haus passiert."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/#anliegen', label: 'Anliegen beschreiben' }}
      />
    </SiteShell>
  );
}
