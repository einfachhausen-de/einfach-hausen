import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink, Container, cn, houseEdgeClass } from '@/design-system/site';

export function FinalCta() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Container>
        <div className={cn('bg-lime px-6 py-16 text-center sm:px-12 lg:py-24', houseEdgeClass)}>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
            <h2 className="font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Dein Haus kümmert sich ab heute um sich selbst.
            </h2>
            <p className="max-w-xl text-lg text-ink/75">
              Leg jetzt dein kostenloses Hauskonto an. In 2 Minuten eingerichtet – und ab dem ersten Tag sparst du Zeit, Nerven und Geld.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <ButtonLink href="/register?role=homeowner" variant="ink" size="lg" arrow>
                Jetzt kostenlos starten
              </ButtonLink>
              <Link href="/login" className="inline-flex h-14 items-center gap-2 px-4 font-semibold text-ink hover:underline">
                Ich hab schon ein Konto <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-ink/80">
              {['Keine Kreditkarte', 'Kein Abo', 'Jederzeit löschbar'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
