import Image from 'next/image';
import { Check, Sparkles, Star } from 'lucide-react';
import { Container } from '../ui';
import { PhoneFrame } from '../phone-frame';
import { HeroSearch } from './hero-search';
import { OwnerAppScreen } from './owner-app-screen';

const TRUST = ['Kostenlos für Eigentümer', 'Geprüfte Betriebe', 'Wechsel-Service inklusive'] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-deep text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_20%,rgba(190,242,100,0.14),transparent_60%),radial-gradient(50%_50%_at_10%_90%,rgba(14,79,85,0.9),transparent_70%)]"
      />
      <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:py-20">
        <div className="flex flex-col gap-7">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-4 text-sm text-white/85">
            <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-ink">Neu</span>
            Dein persönlicher KI-Hausmanager ist da
          </p>

          <h1 className="font-display text-balance text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Alles fürs Haus.
            <br />
            In <span className="whitespace-nowrap text-lime">einer App.</span>
          </h1>

          <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/75 sm:text-xl">
            Tarife vergleichen und mit einem Klick wechseln. Geprüfte Handwerker finden und speichern. Und ein KI-Hausmanager, der an alles
            denkt, woran du nicht denken willst.
          </p>

          <HeroSearch />

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 text-lime" strokeWidth={3} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden h-[680px] items-center justify-center lg:flex">
          <div className="absolute inset-x-6 bottom-6 top-10 overflow-hidden rounded-[2.5rem]">
            <Image
              src="/images/site/owner-sofa.png"
              alt="Entspanntes Paar im eigenen Haus schaut auf das Smartphone"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 0px"
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/40 to-transparent" />
          </div>

          <PhoneFrame className="relative z-10 motion-safe:animate-float-slow">
            <OwnerAppScreen />
          </PhoneFrame>

          <div className="absolute -left-6 top-14 z-20 flex w-60 items-center gap-3 rounded-2xl bg-white p-3 text-ink shadow-2xl motion-safe:animate-float">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime">
              <Check className="size-5" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="text-xs leading-snug">
              <strong className="block text-sm">Wechsel erledigt</strong>
              Neuer Stromtarif ab 01.11. <span className="font-semibold text-save">−34 €/Monat</span>
            </span>
          </div>

          <div className="absolute -right-2 top-[46%] z-20 flex w-56 items-center gap-3 rounded-2xl bg-white p-3 text-ink shadow-2xl motion-safe:animate-float-slow">
            <Image src="/images/site/avatar-heizung.png" alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
            <span className="text-xs leading-snug">
              <strong className="block text-sm">Termin bestätigt</strong>
              Bauer Haustechnik · Do, 9:00
              <span className="mt-0.5 flex items-center gap-0.5 text-coral" aria-label="5 von 5 Sternen">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-3 fill-current" aria-hidden="true" />
                ))}
              </span>
            </span>
          </div>

          <div className="absolute bottom-20 -left-4 z-20 w-64 rounded-2xl bg-ink p-4 text-white shadow-2xl ring-1 ring-white/10 motion-safe:animate-float">
            <p className="flex items-center gap-2 text-xs font-semibold text-lime">
              <Sparkles className="size-3.5" aria-hidden="true" />
              KI-Hausmanager
            </p>
            <p className="mt-1.5 text-sm leading-snug text-white/85">
              „Deine Heizung ist 14 Jahre alt. Soll ich einen Wartungstermin mit Bauer Haustechnik anfragen?“
            </p>
          </div>

        </div>
      </Container>
    </section>
  );
}
