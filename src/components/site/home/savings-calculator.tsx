'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { Container, SectionHeading } from '@/design-system/site';

type Heating = 'gas' | 'oel' | 'waermepumpe';
type LastSwitch = 'nie' | 'alt' | 'neu';

const PEOPLE = [1, 2, 3, 4, 5] as const;
const POWER_KWH: Record<number, number> = { 1: 1500, 2: 2500, 3: 3500, 4: 4250, 5: 5000 };
const POWER_SAVING_PER_KWH: Record<LastSwitch, number> = { nie: 0.1, alt: 0.06, neu: 0.02 };
const HEAT_SAVING: Record<Heating, Record<LastSwitch, number>> = {
  gas: { nie: 540, alt: 360, neu: 90 },
  oel: { nie: 0, alt: 0, neu: 0 },
  waermepumpe: { nie: 320, alt: 210, neu: 60 },
};
const INSURANCE_SAVING: Record<LastSwitch, number> = { nie: 190, alt: 120, neu: 50 };
const INTERNET_SAVING: Record<LastSwitch, number> = { nie: 150, alt: 100, neu: 30 };

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function SavingsCalculator() {
  const [people, setPeople] = useState(3);
  const [heating, setHeating] = useState<Heating>('gas');
  const [lastSwitch, setLastSwitch] = useState<LastSwitch>('nie');

  const rows = [
    { label: 'Strom', value: Math.round(POWER_KWH[people] * POWER_SAVING_PER_KWH[lastSwitch]) },
    { label: heating === 'waermepumpe' ? 'Wärmepumpen-Strom' : 'Gas', value: HEAT_SAVING[heating][lastSwitch] },
    { label: 'Versicherungen', value: INSURANCE_SAVING[lastSwitch] },
    { label: 'Internet & Mobilfunk', value: INTERNET_SAVING[lastSwitch] },
  ].filter((row) => row.value > 0);

  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const max = Math.max(...rows.map((row) => row.value));

  return (
    <section id="sparrechner" className="bg-cream py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Sparrechner"
            title={
              <>
                Wie viel Geld lässt dein Haus <span className="text-coral">gerade liegen?</span>
              </>
            }
            text="Die meisten Eigentümer zahlen jahrelang zu viel. Nicht, weil sie wollen – sondern weil Vergleichen und Kündigen nervt. Rechne in 10 Sekunden nach."
          />

          <div className="flex flex-col gap-6">
            <OptionGroup label="Personen im Haushalt">
              {PEOPLE.map((count) => (
                <Option key={count} active={people === count} onClick={() => setPeople(count)}>
                  {count === 5 ? '5+' : count}
                </Option>
              ))}
            </OptionGroup>

            <OptionGroup label="Wie heizt du?">
              <Option active={heating === 'gas'} onClick={() => setHeating('gas')}>Gas</Option>
              <Option active={heating === 'waermepumpe'} onClick={() => setHeating('waermepumpe')}>Wärmepumpe</Option>
              <Option active={heating === 'oel'} onClick={() => setHeating('oel')}>Öl / Sonstiges</Option>
            </OptionGroup>

            <OptionGroup label="Wann hast du zuletzt deine Tarife gewechselt?">
              <Option active={lastSwitch === 'nie'} onClick={() => setLastSwitch('nie')}>Noch nie</Option>
              <Option active={lastSwitch === 'alt'} onClick={() => setLastSwitch('alt')}>Vor über 2 Jahren</Option>
              <Option active={lastSwitch === 'neu'} onClick={() => setLastSwitch('neu')}>Vor Kurzem</Option>
            </OptionGroup>
          </div>
        </div>

        <div className="relative rounded-card bg-brand-deep p-7 text-white shadow-lift sm:p-10">
          <p className="flex items-center gap-2 text-sm font-medium text-white/70">
            <TrendingDown className="size-4 text-lime" aria-hidden="true" />
            Dein geschätztes Sparpotenzial
          </p>
          <p className="mt-2 font-display text-6xl font-bold tracking-tight text-lime sm:text-7xl" aria-live="polite">
            {euro.format(total)}
          </p>
          <p className="text-white/60">pro Jahr – jedes Jahr, in dem du nichts änderst.</p>

          <ul className="mt-8 flex flex-col gap-4">
            {rows.map((row) => (
              <li key={row.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">{row.label}</span>
                  <span className="font-semibold">{euro.format(row.value)}</span>
                </div>
                <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2 w-full overflow-hidden rounded-pill" aria-hidden="true">
                  <rect width="100" height="8" className="fill-white/10" />
                  <rect width={(row.value / max) * 100} height="8" className="fill-lime transition-[width] duration-500" />
                </svg>
              </li>
            ))}
          </ul>

          {heating === 'oel' && (
            <p className="mt-4 text-sm text-white/70">
              Heizung mit Öl oder Sonstigem: Den Heizanteil rechnen wir nicht pauschal – den prüfen wir mit deinen echten Unterlagen.
              Strom, Versicherungen und Internet sind eingerechnet.
            </p>
          )}

          <div className="mt-8 rounded-2xl bg-white/5 p-4 text-sm text-white/80 ring-1 ring-white/10">
            In 5 Jahren sind das <strong className="text-white">{euro.format(total * 5)}</strong>. Einfach Hausen behält deine Verträge
            im Blick und meldet sich, sobald es günstiger geht – gewechselt wird nur mit deiner Freigabe.
          </div>

          <Link
            href="/register?role=homeowner&request=Sparpotenzial%20meiner%20Vertr%C3%A4ge%20pr%C3%BCfen"
            className="group mt-6 flex h-14 items-center justify-center gap-2 rounded-pill bg-lime font-bold text-ink transition-colors hover:bg-lime-strong"
          >
            Sparpotenzial jetzt sichern
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-meta text-white/70">
            Unverbindliche Schätzung mit Richtwerten: typischer Stromverbrauch nach Haushaltsgröße und übliche Preisabstände
            zwischen Grundversorgung bzw. Bestandsvertrag und Wettbewerbstarifen. Dein echtes Ergebnis hängt von Region, Verbrauch
            und Vertrag ab.
          </p>
        </div>
      </Container>
    </section>
  );
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="h-11 min-w-12 rounded-pill border border-hairline bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
    >
      {children}
    </button>
  );
}
