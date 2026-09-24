import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CircleHelp, Hammer, MessagesSquare, Scale, ShieldCheck } from 'lucide-react';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, ExampleCard, FeatureCards, Heading, LinkCards, PageHero, Section } from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { Reveal, Stagger } from '@/components/marketing/motion';
import { ButtonLink, HouseEdgeImage } from '@/design-system/site';

export const metadata: Metadata = {
  title: "So funktioniert’s – vom Anliegen zum nächsten Schritt",
  description: 'Frage klären, Ansprechpartner finden oder einen Auftrag organisieren: Du beschreibst dein Anliegen und entscheidest, wie es weitergeht.',
  alternates: { canonical: canonical('/so-funktionierts') },
};

const PROCESS = [
  {
    title: 'Du beschreibst die Situation.',
    text: 'In deinen Worten, mit den Informationen, die du gerade hast. Fehlende Angaben können im Gespräch ergänzt werden.',
    example: { label: 'Beispiel · Anliegen', title: 'Dachrinne läuft über', rows: [{ title: 'Beobachtung', text: 'Bei starkem Regen läuft Wasser an der Fassade herunter.' }, { title: 'Ergänzung', text: 'Ein Foto und Angaben zur Höhe helfen bei der Einordnung.' }] },
  },
  {
    title: 'Du prüfst den Vorschlag.',
    text: 'Passt ein verfügbarer Betrieb, kannst du das Angebot und die nächsten Schritte prüfen. Ein Kostenrahmen ist noch keine endgültige Rechnung.',
    example: { label: 'Beispiel · vor dem Auftrag', title: 'Was du wissen möchtest', rows: [{ title: 'Leistung', text: 'Was soll gemacht werden – und was ist nicht enthalten?' }, { title: 'Preis und Termin', text: 'Welche Kosten und welcher Zeitpunkt werden vereinbart?' }] },
  },
  {
    title: 'Der Betrieb übernimmt.',
    text: 'Nach deiner Beauftragung stimmt ihr die Ausführung ab. Hinterlegte Nachrichten, Rechnungen und Nachweise bleiben beim Vorgang auffindbar.',
    example: { label: 'Beispiel · dein Vorgang', title: 'Der Zusammenhang bleibt', rows: [{ title: 'Kontakt', text: 'Der zuständige Betrieb und vorhandene Kontaktdaten.' }, { title: 'Unterlagen', text: 'Die im Vorgang hinterlegten Dokumente und Rechnung.' }] },
  },
] as const;

export default function Page() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="So funktioniert Einfach Hausen"
        title="Ein Anliegen. Ein klarer nächster Schritt."
        text="Du musst noch nicht wissen, welcher Betrieb zuständig ist. Beschreibe, was an deinem Haus los ist. Wir helfen beim Einordnen – und du entscheidest, ob du erst eine Frage klären, einen Menschen sprechen oder etwas erledigen lassen möchtest."
        actions={
          <>
            <ButtonLink href="/register?role=homeowner" size="lg" arrow>
              Mit meinem Anliegen starten
            </ButtonLink>
            <ButtonLink href="#dein-weg" variant="outline" size="lg">
              Meine Möglichkeiten ansehen
            </ButtonLink>
          </>
        }
        aside={
          <ExampleCard
            label="Beispiel · erste Nachricht"
            title="„Bei Regen läuft die Dachrinne über.“"
            rows={[
              { title: 'Was du beschreibst', text: 'Was passiert, seit wann und an welcher Stelle?' },
              { title: 'Was helfen kann', text: 'Ein Foto oder ergänzende Angaben, wenn verfügbar.' },
              { title: 'Was du entscheidest', text: 'Erst eine Einschätzung oder Hilfe bei der Organisation?' },
            ]}
            note="Ein beispielhafter Einstieg. Das Öffnen eines Hauskontos beauftragt keinen Betrieb."
          />
        }
      />

      <Section id="dein-weg">
        <Heading
          eyebrow="Du bestimmst den nächsten Schritt"
          title="Erst verstehen. Oder direkt Hilfe organisieren."
          text="Du kannst mit einer Frage beginnen. Ein persönlicher Ansprechpartner ist auch ohne Handwerkerbuchung möglich; die Verfügbarkeit hängt vom Partnernetz ab."
        />
        <LinkCards
          items={[
            { icon: CircleHelp, label: 'Frage', title: '„Ich möchte erst wissen, was sinnvoll ist.“', text: 'Nutze die Einordnung als Ausgangspunkt. Bei technischen Entscheidungen kann eine Prüfung durch einen Fachbetrieb nötig sein.', href: '/beratung' },
            { icon: MessagesSquare, label: 'Kontakt', title: '„Ich möchte mit einem Menschen sprechen.“', text: 'Beschreibe, wobei du eine persönliche Einschätzung brauchst. Danach kann ein passender Ansprechpartner vermittelt werden.', href: '/register?role=homeowner&request=Ich%20suche%20einen%20pers%C3%B6nlichen%20Ansprechpartner%20f%C3%BCr%20mein%20Anliegen.' },
            { icon: Hammer, label: 'Auftrag', title: '„Ich möchte, dass es erledigt wird.“', text: 'Wir helfen, die Angaben für den Auftrag zusammenzutragen. Leistung, Preis und Termin prüfst du vor deiner Entscheidung.', href: '/register?role=homeowner&request=Ich%20m%C3%B6chte%20eine%20Arbeit%20an%20meinem%20Haus%20organisieren%20lassen.' },
          ]}
        />
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Wenn du eine Arbeit organisieren möchtest" title="Vom ersten Satz zur bewussten Entscheidung." />
        <ol className="flex flex-col gap-6">
          {PROCESS.map((step, index) => (
            <li key={step.title}>
              <Reveal y={24} className="grid items-center gap-8 rounded-card bg-white p-6 ring-1 ring-hairline sm:p-10 lg:grid-cols-2 lg:gap-14">
                <div className="flex flex-col gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-ink font-display text-lg font-extrabold text-lime" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">{step.title}</h3>
                  <p className="text-lg leading-relaxed text-body">{step.text}</p>
                </div>
                <ExampleCard {...step.example} />
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="dark">
        <Heading tone="dark" eyebrow="Was dir Sicherheit gibt" title="Du weißt, worüber du entscheidest." />
        <FeatureCards
          tone="dark"
          items={[
            { icon: ShieldCheck, title: 'Kein Auftrag durch eine Frage.', text: 'Die erste Beschreibung hilft beim Einordnen. Die Beauftragung ist eine separate Entscheidung.' },
            { icon: Scale, title: 'Preis vor Zusage klären.', text: 'Prüfe das Angebot einschließlich Leistung, Material und möglicher Zusatzkosten mit dem Betrieb.' },
            { icon: BadgeCheck, title: 'Verfügbarkeit bleibt ehrlich.', text: 'Region, Leistung und Kapazität entscheiden, ob ein passender Partner verfügbar ist.' },
          ]}
        />
      </Section>

      <Section id="ansprechpartner">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal y={24} className="relative aspect-[4/5] w-full lg:aspect-[5/6]">
            <HouseEdgeImage
              src="/images/marketing/owner-kitchen.jpg"
              alt="Eine Frau sitzt mit einer Tasse am Küchentisch"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="absolute inset-0"
            />
          </Reveal>
          <div className="flex flex-col gap-6">
            <Heading
              eyebrow="Persönlich weiterkommen"
              title="Ein Kontakt mit Zusammenhang."
              text="Du sollst bei einer Rückfrage nicht wieder die ganze Geschichte erzählen müssen. Der zu deinem Vorgang hinterlegte Ansprechpartner und die dokumentierten Absprachen bleiben zusammen."
            />
            <Stagger className="flex flex-col gap-3" y={12}>
              {[
                ['/hausakte', 'Was dir die Hausakte im Alltag bringt'],
                ['/sicherheit', 'Mehr über Partnerauswahl und Sicherheit'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="group inline-flex w-fit items-center gap-2 font-semibold text-brand hover:text-ink">
                  {label}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </Stagger>
            <p className="text-meta text-body">Illustrative Bildwelt, keine Kundenaussage.</p>
          </div>
        </div>
      </Section>

      <Section tone="cream">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Vor dem ersten Anliegen" title="Die häufigsten Fragen zum Ablauf." />
          <PageFaq
            tone="white"
            items={[
              { q: 'Wie schnell bekomme ich einen Ansprechpartner?', a: 'Das hängt von Region, Leistung und freien Kapazitäten ab. Eine pauschale Antwortzeit können wir nicht zusagen. Beschreibe die Dringlichkeit möglichst konkret.' },
              { q: 'Muss ich ein Angebot annehmen?', a: 'Nein. Prüfe, ob Leistung, Kosten und Termin für dich passen. Eine Anfrage verpflichtet dich nicht zur Beauftragung.' },
              { q: 'Wer führt die Arbeit aus und stellt die Rechnung?', a: 'Der eigenständige Partnerbetrieb führt die vereinbarte Leistung aus und rechnet mit dir ab. Einfach Hausen erhebt keine Provision auf den Auftragswert.' },
              { q: 'Was kostet der Einstieg?', a: <>Das Hauskonto ist kostenlos. Zusätzliche Betreuung und Handwerkerleistungen werden gesondert vereinbart. <a href="/preise">Preise und Umfang ansehen</a>.</> },
              { q: 'Was mache ich bei einem Problem mit der Ausführung?', a: 'Dokumentiere das Problem beim betreffenden Vorgang und wende dich an den zuständigen Betrieb. Für Unterstützung bei der Klärung kannst du Einfach Hausen kontaktieren.' },
              { q: 'Kann ich Einfach Hausen als Notdienst nutzen?', a: <>Einfach Hausen ist kein garantierter 24/7-Notdienst. Bei akuter Gefahr nutze den zuständigen Notruf. <a href="/notfall">Hinweise für dringende Fälle</a>.</> },
            ]}
          />
        </div>
      </Section>

      <ClosingCta
        title="Du musst nicht alles wissen. Nur, was gerade los ist."
        text="Beginne mit deinem Anliegen. Den nächsten Schritt entscheidest du danach."
        primary={{ href: '/register?role=homeowner', label: 'Kostenloses Hauskonto anlegen' }}
        secondary={{ href: '/leistungen', label: 'Leistungsbereiche ansehen' }}
      />
    </SiteShell>
  );
}
