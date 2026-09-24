import { Building2, HandCoins, Lock } from 'lucide-react';
import { ButtonLink, CheckList, Container } from '@/design-system/site';

const HOW_WE_EARN = [
  {
    icon: Building2,
    title: 'Betriebe zahlen ein Partner-Abo',
    text: 'Handwerksbetriebe zahlen einen festen Monatsbeitrag – ohne Provision auf deinen Auftrag.',
  },
  {
    icon: HandCoins,
    title: 'Anbieter vergüten Tarifwechsel',
    text: 'Wechselst du über uns, zahlt ggf. der neue Anbieter eine Vergütung. Dein Preis ändert sich dadurch nicht.',
  },
  {
    icon: Lock,
    title: 'Deine Daten verkaufen wir nie',
    text: 'Keine Weitergabe, kein Lead-Handel. Ein Betrieb sieht deine Anfrage erst, wenn du zustimmst.',
  },
] as const;

export function PricingPromise() {
  return (
    <section id="preise" className="scroll-mt-24 bg-white pb-20 lg:pb-28">
      <Container>
        <div className="grid overflow-hidden rounded-[2.5rem] bg-ink text-white lg:grid-cols-2">
          <div className="flex flex-col gap-8 p-8 sm:p-12 lg:p-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-lime">Preise für Eigentümer</p>
            <div>
              <p className="font-display text-8xl font-extrabold leading-none tracking-tighter sm:text-9xl">0 €</p>
              <p className="mt-3 font-display text-2xl font-bold">Für immer. Ohne Haken.</p>
            </div>
            <CheckList
              tone="dark"
              items={[
                'Tarifvergleich & Wechsel-Service',
                'Handwerker-Angebote vergleichen & speichern',
                'KI-Hausmanager inklusive',
                'Digitale Hausakte & Erinnerungen',
                'Keine Provision, keine Servicegebühr',
              ]}
            />
            <ButtonLink href="/register?role=homeowner" size="lg" arrow className="w-fit">
              Kostenloses Hauskonto anlegen
            </ButtonLink>
          </div>
          <div className="flex flex-col gap-6 bg-white/5 p-8 sm:p-12 lg:p-14">
            <h2 className="font-display text-3xl font-extrabold tracking-tight">„Und wie verdient ihr dann Geld?“</h2>
            <p className="text-white/70">Berechtigte Frage. Wir sind transparent:</p>
            <ul className="flex flex-col gap-4">
              {HOW_WE_EARN.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <strong className="block font-semibold">{title}</strong>
                    <span className="text-sm leading-relaxed text-white/65">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
