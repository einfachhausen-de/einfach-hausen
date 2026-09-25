import { CheckList } from '@/design-system/site';
import { OWNER_ASSURANCES, PARTNER_ASSURANCES } from './assurances';

type AuthRole = 'kunde' | 'handwerker';

const AUTH_ASIDE_COPY = {
  kunde: {
    eyebrow: 'Für Eigentümer',
    title: 'Dein Haus. Ein Ansprechpartner.',
    text: 'Hausakte, Termine und die Menschen, die dein Haus kennen – an einem Ort.',
    points: OWNER_ASSURANCES,
  },
  handwerker: {
    eyebrow: 'Für Betriebe',
    title: 'Mehr Stammkunden. 0 % Provision.',
    text: 'Anfragen aus deiner Region, passend zu Fachgebiet, Qualifikation und Kapazität.',
    points: PARTNER_ASSURANCES,
  },
} satisfies Record<AuthRole, { eyebrow: string; title: string; text: string; points: readonly string[] }>;

/**
 * Rollenabhängiger Inhalt der Login-Bildkarte (DESIGN.md § Startseite und Login).
 * Die Zusagenliste erscheint erst ab `lg`, damit die Karte mobil das Foto nicht verdeckt.
 */
export function AuthAside({ role }: { role: AuthRole }) {
  const copy = AUTH_ASIDE_COPY[role];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-meta font-semibold uppercase tracking-wider text-brand">{copy.eyebrow}</p>
      <h2 className="font-display text-xl font-bold leading-tight text-ink">{copy.title}</h2>
      <p className="text-sm leading-relaxed text-body">{copy.text}</p>
      <div className="mt-2 hidden lg:block">
        <CheckList items={copy.points} />
      </div>
    </div>
  );
}
