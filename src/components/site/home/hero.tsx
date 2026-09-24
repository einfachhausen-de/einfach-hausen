import { Check, Sparkles } from 'lucide-react';
import { Container, ExampleBadge, HouseEdgeImage, PhoneFrame, TradeAvatar } from '@/design-system/site';
import { HeroSearch } from './hero-search';
import { OwnerAppScreen } from './owner-app-screen';

const TRUST = ['Kostenlos für Eigentümer', 'Geprüfte Betriebe aus deiner Region', 'Kein Wechsel ohne deine Freigabe'] as const;

export function Hero() {
  return (
    <section className="bg-brand-deep text-white">
      <Container className="grid items-center gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:py-20">
        <div className="flex flex-col gap-7">
          <p className="inline-flex w-fit items-center gap-2 rounded-pill border border-white/15 py-1.5 pl-1.5 pr-4 text-sm text-white/85">
            <span className="rounded-pill bg-lime px-2 py-0.5 text-meta font-bold text-ink">Neu</span>
            Dein persönlicher KI-Hausmanager ist da
          </p>

          <h1 className="font-display text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Dein Haus.
            <br />
            <span className="text-lime">Alles in einer App.</span>
          </h1>

          <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/80 sm:text-xl">
            Tarife vergleichen und wechseln. Angebote geprüfter Handwerker vergleichen und den Besten als festen Ansprechpartner
            speichern. Und ein KI-Hausmanager, der mitdenkt und dich an das erinnert, woran du nicht denken willst.
          </p>

          <div id="anliegen" className="scroll-mt-28">
            <HeroSearch />
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 text-lime" strokeWidth={3} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden h-[700px] lg:block">
          <HouseEdgeImage
            src="/images/site/owner-sofa.png"
            alt="Paar im eigenen Wohnzimmer schaut entspannt auf das Smartphone"
            sizes="(min-width: 1024px) 34vw, 0px"
            priority
            className="absolute inset-y-8 left-16 right-0"
          />

          <PhoneFrame className="absolute bottom-0 left-0 z-10">
            <OwnerAppScreen />
          </PhoneFrame>

          <div className="absolute right-6 top-20 z-20 flex w-72 items-center gap-3 rounded-2xl bg-white p-3.5 text-ink shadow-lift">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime">
              <Check className="size-5" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="text-meta leading-snug">
              <span className="flex items-center justify-between gap-2">
                <strong className="text-sm">Bereit zur Freigabe</strong>
                <ExampleBadge />
              </span>
              Neuer Stromtarif ab 01.11. <span className="font-semibold text-save">spart 34 € im Monat</span>
            </span>
          </div>

          <div className="absolute bottom-24 right-4 z-20 w-72 rounded-2xl bg-ink p-4 text-white shadow-lift ring-1 ring-white/10">
            <p className="flex items-center justify-between gap-2 text-meta font-semibold text-lime">
              <span className="flex items-center gap-2">
                <Sparkles className="size-3.5" aria-hidden="true" />
                KI-Hausmanager
              </span>
              <ExampleBadge tone="dark" />
            </p>
            <p className="mt-1.5 text-sm leading-snug text-white/90">
              „Deine Heizung ist 14 Jahre alt. Soll ich Angebote für eine Wartung einholen?“
            </p>
            <div className="mt-3 flex items-center gap-2">
              <TradeAvatar trade="heizung" size="sm" className="bg-white/10 text-lime" />
              <span className="text-meta text-white/70">Geprüfte Heizungsbetriebe in deiner Nähe</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
