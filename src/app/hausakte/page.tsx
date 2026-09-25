import type { Metadata } from 'next';
import { CalendarClock, ClipboardCheck, Cpu } from 'lucide-react';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import {
  AsideLayout,
  ClosingCta,
  ExampleCard,
  FeatureCards,
  Heading,
  OWNER_ASSURANCES,
  PageHero,
  ProductScreenshot,
  Section,
} from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { Reveal } from '@/components/marketing/motion';
import { ButtonLink } from '@/design-system/site';

export const metadata: Metadata = {
  title: 'Digitale Hausakte – Hausdaten, Technik und Wartungen im Überblick',
  description: 'Dein Hauswissen an einem Ort: Anlagen erfassen, Wartungen überblicken und Unterlagen zu deinen Aufträgen wiederfinden.',
  alternates: { canonical: canonical('/hausakte') },
};

export default function Page() {
  return (
    <SiteShell>
      <PageHero
        tone="dark"
        layout="center"
        eyebrow="Die digitale Hausakte"
        title="Dein Hauswissen. An einem Ort."
        text="Technische Angaben, Wartungen und dokumentierte Arbeiten gehören zusammen. Mit deiner Hausakte findest du den Zusammenhang wieder – bei der nächsten Rückfrage, Reparatur oder Planung."
        actions={
          <>
            <ButtonLink href="/register?role=homeowner" size="lg" arrow>
              Hausakte kostenlos anlegen
            </ButtonLink>
            <ButtonLink href="#arbeitsbereich" variant="outline-dark" size="lg">
              Was drinsteht
            </ButtonLink>
          </>
        }
        assurances={OWNER_ASSURANCES}
      >
        <ProductScreenshot
          src="/images/marketing/house-workspace-reference.png"
          alt="Mein Haus: kompakte Hausdaten, Technik, nächste Wartungen und Bearbeitungsbereiche"
          width={1600}
          height={1000}
          priority
          caption="Echte Produktansicht „Mein Haus“ mit eigens angelegten Beispieldaten."
        />
      </PageHero>

      <Section id="arbeitsbereich">
        <Heading
          eyebrow="Was drinsteht"
          title="Für die Fragen, die am Haus immer wieder auftauchen."
          text="Kompakte Hausdaten, Technik, nächste Wartungen und die Bereiche, in denen du ergänzen kannst."
        />
        <FeatureCards
          variant="register"
          items={[
            { icon: Cpu, title: 'Welche Anlage ist eingebaut?', text: 'Hersteller, Modell und Installationsjahr erfasst du bei deiner Technik. So kannst du Angaben nachsehen, statt erneut nach Typenschildern zu suchen.' },
            { icon: ClipboardCheck, title: 'Was wurde bereits erledigt?', text: 'Hinterlegte Arbeiten und abgeschlossene Wartungen bleiben nachvollziehbar. Rechnungen und Nachweise findest du bei den zugehörigen Vorgängen.' },
            { icon: CalendarClock, title: 'Was steht als Nächstes an?', text: 'Dein Jahresplan zeigt erfasste Wartungsaufgaben. Du kannst Erledigtes bestätigen oder Hilfe für den nächsten Schritt anfragen.' },
          ]}
        />
      </Section>

      <Section tone="cream">
        <AsideLayout
          variant="media"
          aside={
            <ExampleCard
              tone="light"
              label="Beispiel · Heizung"
              title="Gas-Brennwerttherme, Baujahr 2016"
              rows={[
                { title: 'Letzte Wartung', text: 'Hinterlegt mit Protokoll und Rechnung des Betriebs.' },
                { title: 'Nächste Aufgabe', text: 'Jährliche Wartung im Jahresplan vorgemerkt.' },
                { title: 'Ansprechpartner', text: 'Der Betrieb, der die letzte Wartung durchgeführt hat.' },
              ]}
              note="Beispieldaten zur Veranschaulichung."
            />
          }
        >
            <Heading
              eyebrow="Der erste Eintrag"
              title="Mit einer Anlage anfangen."
              text="Du brauchst keine vollständige Bestandsaufnahme. Lege dein Hauskonto an, ergänze deine Hausdaten und erfasse zum Beispiel die Heizung. Weiteres kommt dazu, wenn du es brauchst."
            />
            <Reveal y={12} className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register?role=homeowner" variant="ink" arrow>
                Kostenlos starten
              </ButtonLink>
              <ButtonLink href="/app/home" variant="outline">
                Meine Hausakte öffnen
              </ButtonLink>
            </Reveal>
        </AsideLayout>
      </Section>

      <Section>
        <AsideLayout aside={<Heading eyebrow="Vor dem Start" title="Gut zu wissen." />}>
            <PageFaq
              tone="cream"
              items={[
                { q: 'Was kostet die Hausakte?', a: <>Sie gehört zum kostenlosen Hauskonto. Zusätzliche Betreuung und Handwerkerleistungen werden separat vereinbart. <a href="/preise">Preise ansehen</a>.</> },
                { q: 'Welche Daten sind bereits vorhanden?', a: 'Die Hausakte zeigt die tatsächlich erfassten Angaben und Vorgänge. Nicht hinterlegte Informationen und Unterlagen müssen ergänzt werden.' },
                { q: 'Wird aus einer Wartung automatisch ein Auftrag?', a: 'Nein. Eine Aufgabe im Jahresplan dient der Übersicht. Ob und welchen Betrieb du beauftragst, entscheidest du separat.' },
                { q: 'Kann das bei Schaden oder Verkauf helfen?', a: <>Vorhandene Angaben und Nachweise können die Vorbereitung erleichtern. Mehr zur <a href="/versicherung">Versicherungsunterstützung</a> und zum <a href="/immobilienverkauf">Immobilienverkauf</a>. Prüfe vor einer Freigabe Empfänger und Datenumfang.</> },
              ]}
            />
            <p className="text-meta text-body">
              Informationen zur Datenverarbeitung findest du in der{' '}
              <a href="/datenschutz" className="font-semibold text-brand underline underline-offset-4">
                Datenschutzerklärung
              </a>
              .
            </p>
        </AsideLayout>
      </Section>

      <ClosingCta
        title="Dein Haus bekommt ein Gedächtnis."
        text="Starte mit einer Anlage. Der Rest wächst mit jedem Vorgang."
        primary={{ href: '/register?role=homeowner', label: 'Hausakte kostenlos anlegen' }}
        secondary={{ href: '/so-funktionierts', label: 'So funktioniert’s' }}
      />
    </SiteShell>
  );
}
