/**
 * EHOfferCard — Markt-Kachel im Wolt-Schema (Betreiber 24.09.): Markenfarbige
 * Hero-Flaeche mit Kategorie-Glyph, Vorschlags-Badge als dunkle Pille oben
 * links, darunter Titel plus Anbieter-Chip, eine Zeile Kontext, gestrichelte
 * Trennlinie, Meta-Zeile (Frist, Partner) und rechts der Abschuss zum Partner.
 * Ein Vorschlag ist die Kachel nur, wenn der Partner einen besseren Tarif hat
 * als der Nutzer — das tragt die Seite als badge ein; der Kern waehlt nicht.
 */
import {EH_ICONS, type EHIconKey} from './icons';
import s from './styles.module.css';

export type EHOfferCardProps = {
  id?: string;
  hue: string;
  icon: EHIconKey;
  title: string;
  badge?: string;
  brand?: string;
  text?: string;
  meta?: {icon?: EHIconKey; label: string}[];
  action?: {href: string; label: string};
  note?: string;
};

export function EHOfferCard({id, hue, icon, title, badge, brand, text, meta, action, note}: EHOfferCardProps) {
  const Icon = EH_ICONS[icon];
  return (
    <article id={id} className={s.offerCard} data-hue={hue}>
      <div className={s.offerHero} aria-hidden="true">
        {badge && <span className={s.offerBadge} aria-hidden="true"><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12.6 2.6a2 2 0 0 0-1.4-.6H5a2 2 0 0 0-2 2v6.2c0 .5.2 1 .6 1.4l7.6 7.6a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8ZM7 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>{badge}</span>}
        <Icon size={30} />
      </div>
      <div className={s.offerBody}>
        <p className={s.offerTitleRow}>
          <strong>{title}</strong>
          {brand && <span className={s.offerBrand}>{brand}</span>}
        </p>
        {text && <p className={s.offerText}>{text}</p>}
      </div>
      {(meta && meta.length > 0) || action || note ? (
        <div className={s.offerFoot}>
          {meta && meta.length > 0 && (
            <ul className={s.offerMeta}>
              {meta.map((m, i) => {
                const MetaIcon = m.icon ? EH_ICONS[m.icon] : null;
                return <li key={i}>{MetaIcon && <MetaIcon size={13} />}<span>{m.label}</span></li>;
              })}
            </ul>
          )}
          {action ? (
            <a className={s.offerCta} href={action.href}>
              {action.label}
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            </a>
          ) : note ? (
            <span className={s.offerNote}>{note}</span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
