import { Camera, Check, FileSignature, MousePointerClick, ShieldCheck, Zap } from 'lucide-react';
import { ButtonLink, CheckList, Container, SectionHeading } from '@/design-system/site';

const OFFERS = [
  { name: 'Ökostrom-Tarif A', detail: '12 Monate Preisgarantie · Ökostrom', price: '89,17 €', year: '1.070 €', save: '412 €', best: true },
  { name: 'Ökostrom-Tarif B', detail: '24 Monate Preisgarantie', price: '93,17 €', year: '1.118 €', save: '364 €', best: false },
  { name: 'Stromtarif C', detail: 'Monatlich kündbar', price: '96,50 €', year: '1.158 €', save: '324 €', best: false },
] as const;

const STEPS = [
  { icon: Camera, title: 'Vertrag abfotografieren', text: 'Oder einfach die letzte Abrechnung hochladen.' },
  { icon: Zap, title: 'Bessere Tarife sehen', text: 'Wir vergleichen und zeigen dir, was du sparst.' },
  { icon: MousePointerClick, title: 'Mit einem Klick wechseln', text: 'Kündigung und Wechsel bereiten wir für dich vor.' },
] as const;

export function TariffFeature() {
  return (
    <section id="tarife" className="scroll-mt-24 bg-cream py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="rounded-card bg-white p-5 shadow-lift sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-5">
              <div>
                <p className="text-sm text-body">Strom · 3.500 kWh · PLZ 72379</p>
                <p className="font-display text-xl font-bold">3 günstigere Tarife gefunden</p>
              </div>
              <span className="rounded-pill bg-lime-soft px-3 py-1 text-meta font-bold text-save">Beispielrechnung</span>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-coral/40 bg-coral-soft px-4 py-3 text-sm">
              <span>
                <span className="block text-meta text-body">Dein aktueller Tarif</span>
                <strong>Grundversorgung</strong>
              </span>
              <span className="text-right">
                <strong className="block text-coral">1.482 € / Jahr</strong>
                <span className="text-meta text-body">123,50 € / Monat</span>
              </span>
            </div>

            <ul className="mt-3 flex flex-col gap-3">
              {OFFERS.map((offer) => (
                <li
                  key={offer.name}
                  className={
                    offer.best
                      ? 'relative rounded-2xl bg-white p-4 ring-2 ring-lime-strong'
                      : 'relative rounded-2xl bg-cream/70 p-4'
                  }
                >
                  {offer.best && (
                    <span className="absolute -top-3 left-4 rounded-pill bg-ink px-3 py-0.5 text-meta font-bold text-lime">
                      Bester Preis
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{offer.name}</p>
                      <p className="text-meta text-body">{offer.detail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold">{offer.price}</p>
                      <p className="text-meta font-semibold text-save">spart {offer.save}</p>
                    </div>
                  </div>
                  {offer.best && (
                    <div className="mt-3 flex h-10 items-center justify-center gap-2 rounded-pill bg-lime text-sm font-bold text-ink" aria-hidden="true">
                      <FileSignature className="size-4" />
                      Jetzt wechseln – nach deiner Freigabe
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-center gap-2 text-meta text-body">
              <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
              Anbieternamen und Preise sind illustrativ. Kein Wechsel ohne deine Bestätigung.
            </p>
          </div>
        </div>

        <div className="order-1 flex flex-col gap-8 lg:order-2">
          <SectionHeading
            eyebrow="Tarife & Verträge"
            title="Wechseln in 3 Minuten. Den Papierkram machen wir."
            text="Du musst nie wieder Vergleichsportale durchforsten. Einfach Hausen kennt deine Verträge, prüft sie regelmäßig und sagt dir, wann sich ein Wechsel lohnt."
          />
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex flex-col gap-2 rounded-2xl bg-white p-4">
                <span className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-sm font-bold text-body/60">0{index + 1}</span>
                </span>
                <strong className="text-sm">{title}</strong>
                <span className="text-sm leading-snug text-body">{text}</span>
              </li>
            ))}
          </ol>
          <CheckList
            items={[
              'Strom, Gas, Internet, Mobilfunk und Versicherungen an einem Ort',
              'Laufender Tarif-Check: Wir melden uns, wenn es günstiger geht – du gibst frei',
              'Laufzeiten und Kündigungsfristen immer im Blick',
            ]}
          />
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href="/register?role=homeowner&request=Meine%20Tarife%20vergleichen" size="lg" arrow>
              Meine Tarife prüfen
            </ButtonLink>
            <span className="flex items-center gap-2 text-sm text-body">
              <Check className="size-4 text-save" strokeWidth={3} aria-hidden="true" />
              Kostenlos und unverbindlich
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
