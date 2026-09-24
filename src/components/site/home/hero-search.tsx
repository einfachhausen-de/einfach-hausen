'use client';

import { useId, useState } from 'react';
import { ArrowRight, MapPin, Search, Sparkles, Users, Wrench, Zap } from 'lucide-react';
import { cn } from '@/design-system/site';

type TabId = 'handwerker' | 'tarife' | 'ki';

const TABS: ReadonlyArray<{ id: TabId; label: string; short: string; icon: typeof Wrench }> = [
  { id: 'handwerker', label: 'Handwerker finden', short: 'Handwerker', icon: Wrench },
  { id: 'tarife', label: 'Tarife vergleichen', short: 'Tarife', icon: Zap },
  { id: 'ki', label: 'KI-Hausmanager', short: 'KI fragen', icon: Sparkles },
];

const CRAFT_CHIPS = ['Heizung warten', 'Wasserhahn tropft', 'Dachrinne reinigen', 'Wallbox installieren'] as const;
const TARIFF_TYPES = ['Strom', 'Gas', 'Internet', 'Versicherung'] as const;
const KI_CHIPS = ['Wann muss meine Heizung gewartet werden?', 'Lohnt sich eine Wärmepumpe?', 'Was kostet ein neues Dach?'] as const;

const inputClass =
  'h-14 w-full rounded-2xl border border-hairline bg-cream/60 pl-11 pr-4 text-base text-ink placeholder:text-body/70 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10';

const submitClass =
  'group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-lime px-7 text-base font-bold text-ink transition-colors hover:bg-lime-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export function HeroSearch() {
  const baseId = useId();
  const [tab, setTab] = useState<TabId>('handwerker');
  const [craftRequest, setCraftRequest] = useState('');
  const [plz, setPlz] = useState('');
  const [tariffType, setTariffType] = useState<(typeof TARIFF_TYPES)[number]>('Strom');
  const [household, setHousehold] = useState('3');
  const [question, setQuestion] = useState('');

  const plzSuffix = plz ? ` (PLZ ${plz})` : '';
  const craftSentence = craftRequest ? `${craftRequest}${plzSuffix}` : '';
  const tariffSentence = `Tarifvergleich ${tariffType}${
    tariffType === 'Strom' || tariffType === 'Gas' ? ` für ${household} ${household === '1' ? 'Person' : 'Personen'}` : ''
  }${plzSuffix}`;

  return (
    <div className="rounded-[1.75rem] bg-white p-2 text-ink shadow-lift">
      <fieldset className="grid grid-cols-3 gap-1 rounded-[1.4rem] bg-cream p-1">
        <legend className="sr-only">Was möchtest du erledigen?</legend>
        {TABS.map(({ id, label, short, icon: Icon }) => (
          <label
            key={id}
            className="group flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[1.1rem] text-sm font-semibold text-body transition-colors hover:text-ink has-[:checked]:bg-white has-[:checked]:text-ink has-[:checked]:shadow-card has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand"
          >
            <input
              type="radio"
              name={`${baseId}-mode`}
              value={id}
              checked={tab === id}
              onChange={() => setTab(id)}
              aria-controls={`${baseId}-panel-${id}`}
              className="sr-only"
            />
            <Icon className="size-4 group-has-[:checked]:text-brand" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{short}</span>
          </label>
        ))}
      </fieldset>

      <div className="p-3 sm:p-4">
        {tab === 'handwerker' && (
          <form
            action="/register"
            method="get"
            id={`${baseId}-panel-handwerker`}
            aria-label="Handwerker finden"
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="role" value="homeowner" />
            <input type="hidden" name="request" value={craftSentence} />
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Was soll gemacht werden?</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-body" aria-hidden="true" />
                <input
                  className={inputClass}
                  value={craftRequest}
                  onChange={(event) => setCraftRequest(event.target.value)}
                  placeholder="Was soll gemacht werden?"
                  required
                  autoComplete="off"
                />
              </label>
              <PlzField value={plz} onChange={setPlz} />
              <button type="submit" className={submitClass}>
                Finden
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-meta font-medium text-body">Beliebt:</span>
              {CRAFT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setCraftRequest(chip)}
                  className="rounded-pill border border-hairline px-3 py-1.5 text-meta font-medium text-ink transition-colors hover:border-brand hover:bg-brand-soft"
                >
                  {chip}
                </button>
              ))}
            </div>
          </form>
        )}

        {tab === 'tarife' && (
          <form
            action="/register"
            method="get"
            id={`${baseId}-panel-tarife`}
            aria-label="Tarife vergleichen"
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="role" value="homeowner" />
            <input type="hidden" name="request" value={tariffSentence} />
            <fieldset>
              <legend className="sr-only">Was möchtest du vergleichen?</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TARIFF_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-hairline text-sm font-semibold text-ink transition-colors hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand"
                  >
                    <input
                      type="radio"
                      name="tariffType"
                      value={type}
                      checked={tariffType === type}
                      onChange={() => setTariffType(type)}
                      className="sr-only"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-3 md:flex-row">
              <PlzField value={plz} onChange={setPlz} grow />
              {(tariffType === 'Strom' || tariffType === 'Gas') && (
                <label className="relative md:w-52">
                  <span className="sr-only">Personen im Haushalt</span>
                  <Users className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-body" aria-hidden="true" />
                  <select
                    value={household}
                    onChange={(event) => setHousehold(event.target.value)}
                    className={cn(inputClass, 'appearance-none')}
                  >
                    {['1', '2', '3', '4', '5'].map((count) => (
                      <option key={count} value={count}>
                        {count === '5' ? '5+ Personen' : `${count} ${count === '1' ? 'Person' : 'Personen'}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button type="submit" className={submitClass}>
                Vergleichen
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-meta text-body">Wir bereiten Kündigung und Wechsel für dich vor. Kein Wechsel ohne deine Freigabe.</p>
          </form>
        )}

        {tab === 'ki' && (
          <form
            action="/register"
            method="get"
            id={`${baseId}-panel-ki`}
            aria-label="KI-Hausmanager fragen"
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="role" value="homeowner" />
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Deine Frage an den KI-Hausmanager</span>
                <Sparkles className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand" aria-hidden="true" />
                <input
                  name="request"
                  className={inputClass}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Frag alles rund um dein Haus …"
                  required
                  autoComplete="off"
                />
              </label>
              <button type="submit" className={submitClass}>
                Fragen
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {KI_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setQuestion(chip)}
                  className="rounded-pill border border-hairline px-3 py-1.5 text-meta font-medium text-ink transition-colors hover:border-brand hover:bg-brand-soft"
                >
                  {chip}
                </button>
              ))}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PlzField({ value, onChange, grow }: { value: string; onChange: (value: string) => void; grow?: boolean }) {
  return (
    <label className={cn('relative', grow ? 'flex-1' : 'md:w-40')}>
      <span className="sr-only">Postleitzahl</span>
      <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-body" aria-hidden="true" />
      <input
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 5))}
        placeholder="PLZ"
        inputMode="numeric"
        autoComplete="postal-code"
        pattern="\d{5}"
        title="Fünfstellige Postleitzahl"
      />
    </label>
  );
}
