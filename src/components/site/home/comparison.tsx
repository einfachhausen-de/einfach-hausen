import { Check, Minus, X } from 'lucide-react';
import { Container, SectionHeading } from '@/design-system/site';

type Mark = 'yes' | 'no' | 'partial';

const COLUMNS = ['Einfach Hausen', 'Vergleichsportale', 'Handwerkerportale', 'Ordner & Zettel'] as const;

const ROWS: ReadonlyArray<{ label: string; marks: readonly [Mark, Mark, Mark, Mark] }> = [
  { label: 'Tarife vergleichen & wechseln', marks: ['yes', 'yes', 'no', 'no'] },
  { label: 'Automatischer Spar-Alarm', marks: ['yes', 'partial', 'no', 'no'] },
  { label: 'Geprüfte Handwerker finden', marks: ['yes', 'no', 'yes', 'no'] },
  { label: 'Handwerker-Angebote vergleichen', marks: ['yes', 'no', 'partial', 'no'] },
  { label: 'Handwerker als Kontakt speichern', marks: ['yes', 'no', 'partial', 'partial'] },
  { label: 'Fester Ansprechpartner nach der Buchung', marks: ['yes', 'no', 'partial', 'no'] },
  { label: 'KI-Hausmanager rund um die Uhr', marks: ['yes', 'no', 'no', 'no'] },
  { label: 'Digitale Hausakte & Garantien', marks: ['yes', 'no', 'no', 'partial'] },
  { label: 'Wartungs-Erinnerungen', marks: ['yes', 'no', 'no', 'no'] },
];

function MarkIcon({ mark, highlight }: { mark: Mark; highlight?: boolean }) {
  if (mark === 'yes') {
    return (
      <span className={`mx-auto grid size-7 place-items-center rounded-pill ${highlight ? 'bg-lime text-ink' : 'bg-brand-soft text-brand'}`}>
        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">Ja</span>
      </span>
    );
  }
  if (mark === 'partial') {
    return (
      <span className="mx-auto grid size-7 place-items-center rounded-pill bg-cream text-body">
        <Minus className="size-4" aria-hidden="true" />
        <span className="sr-only">Teilweise</span>
      </span>
    );
  }
  return (
    <span className="mx-auto grid size-7 place-items-center text-body/40">
      <X className="size-4" aria-hidden="true" />
      <span className="sr-only">Nein</span>
    </span>
  );
}

export function Comparison() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Der Vergleich"
          title="Warum zehn Apps und drei Ordner, wenn eine App reicht?"
        />
        <div className="relative overflow-x-auto rounded-card bg-white p-2 sm:p-4">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <caption className="sr-only">Funktionsvergleich zwischen Einfach Hausen und anderen Lösungen</caption>
            <thead>
              <tr>
                <th scope="col" className="w-[34%] p-4 text-left font-medium text-body">
                  Funktion
                </th>
                {COLUMNS.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={
                      index === 0
                        ? 'rounded-t-2xl bg-brand-deep p-4 text-center font-display text-base font-bold text-white'
                        : 'p-4 text-center font-semibold text-ink'
                    }
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, rowIndex) => (
                <tr key={row.label}>
                  <th scope="row" className="border-t border-hairline p-4 text-left font-medium text-ink">
                    {row.label}
                  </th>
                  {row.marks.map((mark, index) => (
                    <td
                      key={index}
                      className={
                        index === 0
                          ? `border-t border-white/10 bg-brand-deep p-4 ${rowIndex === ROWS.length - 1 ? 'rounded-b-2xl' : ''}`
                          : 'border-t border-hairline p-4'
                      }
                    >
                      <MarkIcon mark={mark} highlight={index === 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
