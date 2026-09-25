import '@/components/werkbank-layout.css';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { START_VORSCHLAEGE, StartAnsicht, StartRail } from '@/components/homeowner/start-ansicht';
import type { VerlaufEintrag } from '@/components/homeowner/verlauf-zeitleiste';

/**
 * Schaufenster der Startseite mit festen Beispieldaten: dieselbe Komposition
 * wie /app (StartAnsicht), aber ohne Anmeldung und ohne Datenbank.
 */

const VERLAUF: readonly VerlaufEintrag[] = [
  { id: 'u9007', titel: 'Heizungswartung', status: 'Angebote da', ton: 'warn', datum: '26.09.', iso: '2026-09-26T14:30', zusatz: 'Termin 26.09., 14:30 Uhr', href: '/app/jobs' },
  { id: 'u9003', titel: 'Badarmatur tropft', status: 'In Arbeit', ton: 'info', datum: '24.09.', iso: '2026-09-24T10:00', zusatz: 'Termin 24.09., 10:00 Uhr', href: '/app/jobs' },
  { id: 'p9005', titel: 'Thermostate tauschen', status: 'Abgeschlossen', ton: 'ok', datum: '18.09.', iso: '2026-09-18', href: '/app/jobs', vergangen: true },
  { id: 'p9006', titel: 'Dachrinne reinigen', status: 'Abgeschlossen', ton: 'ok', datum: '12.09.', iso: '2026-09-12', href: '/app/jobs', vergangen: true },
  { id: 'p9008', titel: 'Rasen mähen', status: 'Abgeschlossen', ton: 'ok', datum: '05.09.', iso: '2026-09-05', href: '/app/jobs', vergangen: true },
  { id: 'p9009', titel: 'Heizung entlüften', status: 'Abgeschlossen', ton: 'ok', datum: '28.08.', iso: '2026-08-28', href: '/app/jobs', vergangen: true },
  { id: 'p9010', titel: 'Kaminkehrer-Termin', status: 'Abgebrochen', ton: 'neutral', datum: '20.08.', iso: '2026-08-20', href: '/app/jobs', vergangen: true },
  { id: 'p9011', titel: 'Heizkörper tauschen', status: 'Abgeschlossen', ton: 'ok', datum: '02.08.', iso: '2026-08-02', href: '/app/jobs', vergangen: true },
];

export default function Preview() {
  const address = 'Fixturestraße 1, 46325 Borken';

  return (
    <WerkbankRahmen
      role="homeowner"
      active="/app"
      brandSub={address}
      rail={<StartRail werte={{ auftraege: 5, angebote: 2, kontakte: 3, termine: 2 }} />}
    >
      <StartAnsicht
        gruss="Guten Tag, Jeremy"
        adresse={address}
        fokus={{ art: 'entscheidung', anzahl: 2, href: '/app/jobs' }}
        verlauf={VERLAUF}
        stand="23.09.2026"
        vorschlaege={START_VORSCHLAEGE}
        vergleicheHref="/app/preview/angebote"
      />
    </WerkbankRahmen>
  );
}
