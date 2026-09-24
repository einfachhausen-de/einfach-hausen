import Link from 'next/link';
import { Search } from 'lucide-react';
import { EHOwnerFilters, EHText, EHOfferDeal } from '@/design-system';
import { AFFILIATE_CATEGORIES, AFFILIATE_CATEGORY_LABELS } from '@/lib/affiliate';
import { filtereAngebote, type Angebot } from '@/lib/angebote';

/**
 * Chrome der Angebote-Seite (Betreiber 24.09., Vorbild CHECK24-Dealz):
 * Kopfzeile, Suchleiste, Kategoriechips, Sortierung, Zahlzeile und die
 * Liste als liegende Deal-Karten (EHOfferDeal, Kern). Filter sind reine
 * GET-Links/Formulare — kein Client-Zustand, jede Ansicht ist teilbar.
 */
export function AngebotsListe({ base, sp, alle, hinweis }: { base: string; sp: Record<string, string>; alle: Angebot[]; hinweis?: string }) {
  const { sichtbar, aktiv } = filtereAngebote(alle, sp);
  const link = (params: Record<string, string | null>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...params })) {
      if (v) u.set(k, v);
    }
    const q = u.toString();
    return q ? `${base}?${q}` : base;
  };
  const vorschlaege = alle.filter((a) => a.vorschlag).length;
  return (
    <div className="eh-ang">
      <div className="eh-ang-kopf">
        <h1>Angebote in deiner Nähe</h1>
        <p>Die Tarife unserer Partner, sortiert nach dem, was sie dir bringen — ein Angebot ist oben, wo es deinen erfassten Vertrag schlägt.</p>
      </div>
      <form className="eh-ang-suche" method="get" action={base} role="search">
        <Search size={15} aria-hidden="true" />
        <input type="search" name="q" defaultValue={sp.q ?? ''} placeholder="Angebot, Anbieter oder Kategorie durchsuchen …" aria-label="Angebote durchsuchen" />
        {sp.art && <input type="hidden" name="art" value={sp.art} />}
        {sp.nur === '1' && <input type="hidden" name="nur" value="1" />}
        {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
        <button type="submit" className="eh-ang-btn">Suchen</button>
      </form>
      <EHOwnerFilters
        label="Nach Kategorie filtern"
        items={[
          { href: link({ art: null, nur: null }), label: 'Alle Angebote', active: !sp.art && !sp.nur },
          ...AFFILIATE_CATEGORIES.map((k) => ({ href: link({ art: k }), label: AFFILIATE_CATEGORY_LABELS[k] ?? k, active: sp.art === k })),
        ]}
      />
      <EHOwnerFilters
        label="Sortierung und Ansicht"
        items={[
          { href: link({ sort: 'spar' }), label: 'Sortiert nach Ersparnis', active: (sp.sort ?? 'spar') === 'spar' },
          { href: link({ sort: 'name' }), label: 'Sortiert nach Name', active: sp.sort === 'name' },
          { href: link({ nur: vorschlaege > 0 && sp.nur !== '1' ? '1' : null }), label: `Nur Vorschläge (${vorschlaege})`, active: sp.nur === '1' },
        ]}
      />
      <p className="eh-ang-treffer">
        {sichtbar.length} von {alle.length} Angeboten gefunden
        {aktiv && <> · <Link href={base}>Alle Filter zurücksetzen</Link></>}
      </p>
      {sichtbar.length === 0 ? (
        <p className="eh-ang-leer">Kein Angebot passt zu dieser Filterstellung. <Link href={base}>Zurücksetzen</Link></p>
      ) : (
        <ul className="eh-ang-liste">
          {sichtbar.map((a) => (
            <li key={a.category}>
              <EHOfferDeal
                id={a.id}
                hue={a.hue}
                icon={a.icon}
                title={a.title}
                brand={a.brand}
                text={a.text}
                spar={a.sparText}
                rate={a.rateText}
                frist={a.fristKurz}
                meta={a.meta}
                action={a.action}
                note={a.note}
              />
            </li>
          ))}
        </ul>
      )}
      <EHText muted>{hinweis ?? 'Wir zeigen keine eigenen Tarife und keine Rangliste. Der Vergleich läuft beim jeweiligen Partner, dort wird auch abgeschlossen. Deine Vertragsdaten bleiben in der Hausakte und werden nicht an den Partner übertragen.'}</EHText>
    </div>
  );
}
