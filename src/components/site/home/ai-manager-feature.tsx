import { Brain, CalendarCheck, FileSearch, Mic, Paperclip, Scale, Send, Sparkles } from 'lucide-react';
import { ButtonLink, Container, ExampleBadge, SectionHeading } from '@/design-system/site';

const POWERS = [
  { icon: Brain, title: 'Kennt dein Haus', text: 'Baujahr, Heizung, Verträge, Handwerker – er weiß, wovon er spricht.' },
  { icon: Scale, title: 'Prüft Angebote', text: 'Ist der Preis fair? Er vergleicht und erklärt jede Position.' },
  { icon: FileSearch, title: 'Versteht Unterlagen', text: 'Rechnungen, Verträge, Garantien – einfach abfotografieren.' },
  { icon: CalendarCheck, title: 'Bereitet vor', text: 'Anfragen formulieren, Erinnerungen setzen, Angebote einholen – du gibst frei.' },
] as const;

export function AiManagerFeature() {
  return (
    <section id="ki-hausmanager" className="scroll-mt-24 bg-brand-deep py-20 text-white lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col gap-10">
          <SectionHeading
            tone="dark"
            eyebrow="KI-Hausmanager"
            title={
              <>
                Der Hausmeister, den du dir <span className="text-lime">immer gewünscht hast.</span>
              </>
            }
            text="Immer erreichbar, nie genervt, und er vergisst nichts. Frag ihn, was dein Haus, deine Verträge und Handwerker betrifft – ist er sich unsicher, fragt er nach. Und er kümmert sich nur, wenn du es freigibst."
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {POWERS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col gap-2 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <Icon className="size-5 text-lime" aria-hidden="true" />
                <strong className="font-semibold">{title}</strong>
                <span className="text-sm leading-relaxed text-white/65">{text}</span>
              </li>
            ))}
          </ul>
          <ButtonLink href="/register?role=homeowner" size="lg" arrow className="w-fit">
            Hausmanager kostenlos testen
          </ButtonLink>
        </div>

        <div className="rounded-card bg-white p-3 text-ink shadow-lift">
          <div className="flex items-center gap-3 border-b border-hairline px-4 pb-4 pt-3">
            <span className="grid size-10 place-items-center rounded-pill bg-brand text-lime">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">Dein Hausmanager</p>
              <p className="flex items-center gap-1.5 text-meta text-save">
                <span className="size-1.5 rounded-pill bg-save" aria-hidden="true" />
                Online · kennt dein Haus
              </p>
            </div>
            <ExampleBadge>Beispielgespräch</ExampleBadge>
          </div>

          <div className="flex flex-col gap-3 px-3 py-5 text-sm" aria-label="Beispielgespräch mit dem KI-Hausmanager">
            <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-white">
              Im Keller riecht es muffig und an der Wand ist ein dunkler Fleck.
            </p>
            <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-cream px-4 py-3 leading-relaxed">
              <p>Das klingt nach Feuchtigkeit – bei einem Haus von 1978 nicht ungewöhnlich. Das empfehle ich:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Heute: Stoßlüften und den Fleck fotografieren</li>
                <li>Diese Woche: Feuchtemessung durch einen Fachbetrieb</li>
              </ol>
              <p className="mt-2">Ich habe 2 geprüfte Betriebe in deiner Nähe gefunden. Soll ich Angebote einholen?</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-pill bg-lime px-4 py-2 text-meta font-bold">Ja, Termin anfragen</span>
              <span className="rounded-pill border border-hairline px-4 py-2 text-meta font-semibold">Was kostet das?</span>
            </div>
            <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-white">Ja, bitte für Donnerstag.</p>
            <p className="max-w-[88%] rounded-2xl rounded-bl-md bg-cream px-4 py-3">
              Erledigt. Deine Anfrage ist an <strong>2 geprüfte Fachbetriebe</strong> raus. Ich melde mich, sobald der Termin steht.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-cream p-2 pl-4" aria-hidden="true">
            <Paperclip className="size-4 text-body" />
            <span className="flex-1 text-sm text-body">Schreib oder sprich …</span>
            <span className="grid size-9 place-items-center rounded-pill bg-white text-ink">
              <Mic className="size-4" />
            </span>
            <span className="grid size-9 place-items-center rounded-pill bg-ink text-white">
              <Send className="size-4" />
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
