import { Camera, FileSignature, MousePointerClick, ShieldCheck, Zap } from 'lucide-react';
import { CheckList, SectionHeading } from '@/design-system/site';
import { CtaRow, DemoFrame, FeatureSplit, IconTiles } from '@/components/site/page/blocks';

const OFFERS = [
  { name: 'Ökostrom-Tarif A', detail: '12 Monate Preisgarantie · Ökostrom', price: '89,17 €', year: '1.070 €', save: '412 €', best: true },
  { name: 'Ökostrom-Tarif B', detail: '24 Monate Preisgarantie', price: '93,17 €', year: '1.118 €', save: '364 €', best: false },
  { name: 'Stromtarif C', detail: 'Monatlich kündbar', price: '96,50 €', year: '1.158 €', save: '324 €', best: false },
] as const;

const STEPS = [
  { icon: Camera, title: 'Vertrag abfotografieren', text: 'Oder einfach die letzte Abrechnung hochladen.' },
  { icon: Zap, title: 'Bessere Tarife sehen', text: 'Wir vergleichen und zeigen dir, was du sparst.' },
  { icon: MousePointerClick, title: 'Mit einem Klick wechseln', text: 'Kündigung und Wechsel bereiten wir für dich vor.' },
];

function TariffDemo() {
  return (
    <DemoFrame context="Strom · 3.500 kWh · PLZ 72379" title="3 günstigere Tarife gefunden" badge="Beispielrechnung">
      <div className="flex items-center justify-between rounded-2xl border border-dashed border-coral/40 bg-coral-soft px-4 py-3 text-sm">
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
            className={offer.best ? 'relative rounded-2xl bg-white p-4 ring-2 ring-lime-strong' : 'relative rounded-2xl bg-cream/70 p-4'}
          >
            {offer.best && (
              <span className="absolute -top-3 left-4 rounded-pill bg-ink px-3 py-0.5 text-meta font-bold text-lime">Bester Preis</span>
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
    </DemoFrame>
  );
}

export function TariffFeature() {
  return (
    <FeatureSplit id="tarife" tone="cream" mediaFirst media={<TariffDemo />}>
      <SectionHeading
        eyebrow="Tarife & Verträge"
        title="Wechseln in 3 Minuten. Den Papierkram machen wir."
        text="Du musst nie wieder Vergleichsportale durchforsten. Einfach Hausen kennt deine Verträge, prüft sie regelmäßig und sagt dir, wann sich ein Wechsel lohnt."
      />
      <IconTiles items={STEPS} numbered columns={3} />
      <CheckList
        items={[
          'Strom, Gas, Internet, Mobilfunk und Versicherungen an einem Ort',
          'Laufender Tarif-Check: Wir melden uns, wenn es günstiger geht – du gibst frei',
          'Laufzeiten und Kündigungsfristen immer im Blick',
        ]}
      />
      <CtaRow href="/register?role=homeowner&request=Meine%20Tarife%20vergleichen" note="Kostenlos und unverbindlich">
        Meine Tarife prüfen
      </CtaRow>
    </FeatureSplit>
  );
}
