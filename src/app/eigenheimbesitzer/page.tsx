import type { Metadata } from 'next';
import { BellRing, FileText, FolderSearch, Home, PhoneCall, Siren, Sparkles, Tag, UserRound, Wallet } from 'lucide-react';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, FactStrip, FeatureCards, Heading, ImageSplit, LinkCards, PageHero, Section, SituationCards } from '@/components/site/page/blocks';
import { OwnerAppScreen } from '@/components/site/home/owner-app-screen';
import { Reveal, Stagger } from '@/components/marketing/motion';
import { FACTS } from '@/components/marketing/content';
import { ButtonLink, CheckList, PhoneFrame, SectionHeading } from '@/design-system/site';

export const metadata: Metadata = {
  title: 'Für Eigenheimbesitzer',
  description: 'Weniger im Kopf, mehr im Griff: ein Ort für Anliegen, Ansprechpartner, Erinnerungen und die Geschichte deines Hauses.',
  alternates: { canonical: canonical('/eigenheimbesitzer') },
};

const SITUATIONS = [
  { tag: 'Sonntagabend', text: 'Ich müsste mich mal um die Heizung kümmern. Nächste Woche. Bestimmt.' },
  { tag: 'Beim Verkauf', text: 'Der Makler fragt nach Rechnungen und Garantien. Ich habe zwei von zwölf gefunden.' },
  { tag: 'Nach dem Umzug', text: 'Welcher Betrieb hat damals das Dach gemacht? Keine Ahnung. Die Vorbesitzer auch nicht.' },
] as const;

const HOUSE_MEMORY = [
  { icon: Home, title: 'Technik & Ausstattung', text: 'Heizung, PV, Wallbox, Dach, Fenster: strukturiert am Haus geführt, mit Garantien und Ansprechpartnern.' },
  { icon: FileText, title: 'Arbeiten & Wartung', text: 'Erledigte Arbeiten, Kosten, Hinweise und zukünftige Aufgaben in einer Historie.' },
  { icon: UserRound, title: 'Beziehungen', text: 'Bewährte Betriebe und konkrete Menschen bleiben Teil deines Hauswissens.' },
  { icon: Wallet, title: 'Wert beim Verkauf', text: 'Eine gepflegte Hausakte ist beim Verkauf ein Argument, das Käufer und Makler verstehen.' },
] as const;

export default function Page() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Für Eigenheimbesitzer"
        title="Dein Haus hat viele Themen. Du brauchst nur eine Eingangstür."
        text="Ein Haus zu besitzen heißt, ständig Dinge im Kopf zu haben: Wartungen, Betriebe, Termine, Rechnungen. Einfach Hausen nimmt dir die Koordination ab und bewahrt das Wissen, das sonst verloren geht."
        actions={
          <>
            <ButtonLink href="/register?role=homeowner" size="lg" arrow>
              Hauskonto kostenlos anlegen
            </ButtonLink>
            <ButtonLink href="/#anliegen" variant="outline" size="lg">
              Anliegen beschreiben
            </ButtonLink>
          </>
        }
        aside={
          <div className="flex justify-center pt-4">
            <PhoneFrame>
              <OwnerAppScreen />
            </PhoneFrame>
          </div>
        }
      />

      <Section>
        <Heading
          eyebrow="Kennst du das?"
          title="Nicht die Reparatur ist das Problem. Das Drumherum ist es."
          text="Die meisten Dinge am Haus sind lösbar. Anstrengend ist, dass alles an dir hängt: erinnern, suchen, anrufen, dranbleiben, aufheben."
        />
        <SituationCards items={SITUATIONS} />
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Was sich ändert" title="Drei Dinge, die du nicht mehr allein stemmen musst." />
        <FeatureCards
          items={[
            { icon: PhoneCall, title: 'Wissen, wen man anruft.', text: 'Du musst weder Gewerk noch Fachbegriff kennen. Beschreib, was du siehst. Wir ordnen ein und suchen einen passenden geprüften Betrieb aus deiner Region.' },
            { icon: BellRing, title: 'Rechtzeitig dran denken.', text: 'Heizungswartung, Dachrinnen, Rauchmelder, Garantiefristen: Du wirst erinnert, bevor es teuer wird, und entscheidest selbst, ob du Hilfe anfragst.' },
            { icon: FolderSearch, title: 'Nichts mehr suchen.', text: 'Rechnungen, Garantien, Protokolle und Fotos liegen beim richtigen Vorgang und am richtigen Bauteil – statt verteilt in Ordnern und Postfächern.' },
          ]}
        />
        <Reveal y={12} className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/so-funktionierts" variant="outline" arrow>
            So läuft ein Vorgang ab
          </ButtonLink>
          <ButtonLink href="/hausakte" variant="outline" arrow>
            Zur digitalen Hausakte
          </ButtonLink>
        </Reveal>
      </Section>

      <Section>
        <Heading
          eyebrow="Ein Thema, zwei Wege"
          title="Erst verstehen. Dann bewusst entscheiden."
          text="Einfach Hausen macht aus einer Frage nicht sofort einen Auftrag."
        />
        <Stagger className="grid gap-5 lg:grid-cols-2" y={20}>
          <div className="flex h-full flex-col gap-5 rounded-card bg-cream p-7 sm:p-9">
            <p className="text-meta font-semibold uppercase tracking-wider text-brand">Wenn du nur Rat brauchst</p>
            <h3 className="font-display text-2xl font-bold leading-snug text-ink">Frage klären oder Ansprechpartner finden.</h3>
            <p className="leading-relaxed text-body">
              Du bekommst eine fachliche Einordnung und kannst auf Wunsch einen passenden Menschen sprechen. Ein Auftrag entsteht dadurch nicht.
            </p>
            <CheckList items={['Kein Auftrag durch eine normale Frage', 'Persönlicher Kontakt auch ohne Buchung', 'Beauftragen bleibt eine eigene Entscheidung']} />
          </div>
          <div className="flex h-full flex-col gap-5 rounded-card bg-brand-deep p-7 text-white sm:p-9">
            <p className="text-meta font-semibold uppercase tracking-wider text-lime">Wenn etwas erledigt werden soll</p>
            <h3 className="font-display text-2xl font-bold leading-snug">Organisiert statt selbst koordiniert.</h3>
            <p className="leading-relaxed text-white/75">
              Wir vervollständigen die Auftragsdaten, suchen passende Partner und führen Kostenrahmen, Termin und Dokumente an einem Ort zusammen.
            </p>
            <CheckList tone="dark" items={['Passende Partner statt offene Firmenliste', 'Kostenrahmen vor dem Termin', 'Konkreter Ansprechpartner beim Betrieb']} />
          </div>
        </Stagger>
      </Section>

      <Section tone="cream">
        <Heading
          eyebrow="Direkte Wege"
          title="Je nach Situation anders starten."
          text="Eine fachliche Frage, ein dringender Fall und ein Verkaufswunsch sind unterschiedliche Entscheidungen. Deshalb haben sie getrennte Einstiege."
        />
        <LinkCards
          items={[
            { icon: Sparkles, title: 'Erst beraten lassen', text: 'Einen passenden Ansprechpartner sprechen, ohne dass automatisch ein Auftrag entsteht.', href: '/beratung' },
            { icon: Siren, title: 'Dringenden Fall einordnen', text: 'Bei einem Notfall wird nach verfügbarer Hilfe im regionalen Netzwerk gesucht – mit klaren Grenzen.', href: '/notfall' },
            { icon: Tag, title: 'Verkauf vorbereiten', text: 'Bewertung, Makler-Matching und Datenfreigabe bleiben nachvollziehbar unter deiner Kontrolle.', href: '/immobilienverkauf' },
          ]}
        />
      </Section>

      <Section>
        <ImageSplit src="/images/marketing/family-home.jpg" alt="Familie entspannt auf der Terrasse ihres Hauses">
          <SectionHeading
            eyebrow="Langfristig"
            title="Ein Haus ist die größte Investition deines Lebens. Behandle es so."
            text="Wer die Geschichte seines Hauses kennt, entscheidet besser, plant Wartung bewusster und übergibt irgendwann sauber."
          />
          <Stagger className="grid gap-4 sm:grid-cols-2" y={14}>
            {HOUSE_MEMORY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex h-full flex-col gap-2 rounded-2xl bg-cream p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-white text-brand" aria-hidden="true">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display font-bold text-ink">{title}</h3>
                <p className="text-sm leading-relaxed text-body">{text}</p>
              </div>
            ))}
          </Stagger>
        </ImageSplit>
      </Section>

      <Section tone="dark">
        <Heading tone="dark" eyebrow="Klare Regeln" title="Was du von uns erwarten kannst." />
        <FactStrip items={FACTS} />
      </Section>

      <ClosingCta
        title="Dein Hauskonto startet bei 0 €."
        text="Beschreibe dein erstes Anliegen oder bau in Ruhe die Hausakte auf. Beides ist kostenlos."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/#anliegen', label: 'Anliegen beschreiben' }}
      />
    </SiteShell>
  );
}
