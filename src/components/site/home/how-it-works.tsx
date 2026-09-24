import { Container, HouseEdgeImage, SectionHeading } from '@/design-system/site';

const STEPS = [
  { title: 'Kostenlos registrieren', text: 'E-Mail, Passwort, fertig. Keine Kreditkarte, kein Abo, keine versteckten Kosten.', time: '30 Sek.' },
  { title: 'Dein Haus anlegen', text: 'Adresse, Baujahr, Heizung – und bei Lust die ersten Verträge abfotografieren.', time: '90 Sek.' },
  { title: 'Zurücklehnen', text: 'Wir finden Sparpotenzial, erinnern an Wartungen und haben Handwerker parat, wenn du sie brauchst.', time: 'für immer' },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[520px]">
          <HouseEdgeImage
            src="/images/site/craftsman-at-work.png"
            alt="Ein Heizungstechniker wartet die Heizung, die Eigentümerin schaut entspannt zu"
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="absolute inset-0"
          />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white p-4 shadow-lift">
            <p className="text-meta font-semibold uppercase tracking-wider text-brand">Heizungswartung · erledigt</p>
            <p className="mt-1 text-sm text-ink">Rechnung, Protokoll und nächster Termin liegen automatisch in deiner Hausakte.</p>
          </div>
        </div>

        <div className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="So einfach geht’s"
            title="In 2 Minuten startklar. Danach läuft’s von allein."
          />
          <ol className="flex flex-col">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-6 pb-10 last:pb-0">
                {index < STEPS.length - 1 && (
                  <span className="absolute left-6 top-14 h-[calc(100%-3.5rem)] w-px bg-hairline" aria-hidden="true" />
                )}
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink font-display text-lg font-extrabold text-lime">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl font-bold">{step.title}</h3>
                    <span className="rounded-pill bg-lime-soft px-2.5 py-0.5 text-meta font-semibold text-save">{step.time}</span>
                  </div>
                  <p className="leading-relaxed text-body">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
