import type { ReactNode } from 'react';

import { EHStatus } from './primitives';
import s from './styles.module.css';

export function EHRouteTabs({
  label,
  items,
}: {
  label: string;
  items: readonly {
    href: string;
    label: string;
    active: boolean;
  }[];
}) {
  return (
    <nav aria-label={label} className={s.routeTabs}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export type EHScheduleRecord = {
  id: string;
  day: string;
  month: string;
  dateLabel: string;
  title: string;
  detail: string;
  status?: string;
  href?: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
};

export function EHScheduleList({
  label,
  items,
}: {
  label: string;
  items: readonly EHScheduleRecord[];
}) {
  return (
    <ol className={s.scheduleList} aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <div
            className={s.scheduleDate}
            aria-label={item.dateLabel}
          >
            <strong aria-hidden="true">{item.day}</strong>
            <span aria-hidden="true">{item.month}</span>
          </div>

          <div className={s.scheduleInfo}>
            <p>{item.dateLabel}</p>
            <h3>
              {item.href ? (
                <a href={item.href}>{item.title}</a>
              ) : (
                item.title
              )}
            </h3>
            <p>{item.detail}</p>
          </div>

          {item.status && (
            <EHStatus tone={item.tone ?? 'info'}>
              {item.status}
            </EHStatus>
          )}
        </li>
      ))}
    </ol>
  );
}

export type EHDossierRecord = {
  id: string;
  title: string;
  kind: string;
  detail: string;
  href: string;
  amount?: string;
  status?: ReactNode;
};

export function EHDossierList({
  label,
  items,
}: {
  label: string;
  items: readonly EHDossierRecord[];
}) {
  return (
    <ul className={s.dossierList} aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <span
            className={s.documentMark}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 28"
              fill="none"
            >
              <path
                d="M4 1h10l6 6v20H4zM14 1v7h6M8 14h8M8 19h6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </span>

          <div className={s.dossierInfo}>
            <span>{item.kind}</span>
            <h3>
              <a href={item.href}>{item.title}</a>
            </h3>
            <p>{item.detail}</p>
          </div>

          <div className={s.dossierMeta}>
            {item.amount && <strong>{item.amount}</strong>}
            {item.status}
            <a
              href={item.href}
              aria-label={`${item.title} öffnen`}
            >
              Öffnen ↗
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

export type EHOrderRecord = {
  id: string;
  title: string;
  href: string;
  kind: string;
  status: string;
  contact: string;
  amount: string;
  action: string;
  detail?: string;
};

export function EHOrderList({
  items,
}: {
  items: readonly EHOrderRecord[];
}) {
  return (
    <ul className={s.orderList}>
      {items.map((item) => (
        <li key={item.id}>
          <div className={s.orderTop}>
            <span>{item.kind}</span>
            <EHStatus>{item.status}</EHStatus>
          </div>

          <h2>
            <a href={item.href}>{item.title}</a>
          </h2>

          {item.detail && <p>{item.detail}</p>}

          <dl>
            <div>
              <dt>Ansprechpartner</dt>
              <dd>{item.contact}</dd>
            </div>

            <div>
              <dt>
                {item.kind === 'Kontakt'
                  ? 'Preis'
                  : 'Angebot'}
              </dt>
              <dd>{item.amount}</dd>
            </div>
          </dl>

          <a
            className={s.orderNext}
            href={item.href}
          >
            {item.action}
            <span aria-hidden="true">↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function EHIdentitySummary({
  initials,
  name,
  email,
  children,
}: {
  initials: string;
  name: string;
  email: string;
  children?: ReactNode;
}) {
  return (
    <section className={s.identitySummary}>
      <span
        className={s.identityAvatar}
        aria-hidden="true"
      >
        {initials}
      </span>

      <div>
        <h2>{name}</h2>
        <p>{email}</p>
      </div>

      {children}
    </section>
  );
}

export type EHOwnerOrdersStatItem =
  | {
      href: string;
      value: number;
      label: string;
      icon: ReactNode;
      tone: 'petrol' | 'sand' | 'paper';
      title?: never;
      text?: never;
    }
  | {
      href: string;
      title: string;
      text: string;
      icon: ReactNode;
      tone: 'warm';
      value?: never;
      label?: never;
    };

export type EHOwnerOrdersListItem = {
  id: string;
  href: string;
  title: string;
  category: string;
  provider?: string | null;
  status: string;
  statusTone:
    | 'neutral'
    | 'info'
    | 'success'
    | 'warning';
  schedule: string;
  media?: {
    src: string;
    alt: string;
  };
};

export function EHOwnerOrdersHero({
  eyebrow,
  title,
  text,
  imageSrc,
  imageAlt,
  address,
  postcode,
  search,
}: {
  eyebrow: string;
  title: ReactNode;
  text: string;
  imageSrc: string;
  imageAlt: string;
  address: string;
  postcode: string;
  search: {
    action: string;
    name: string;
    defaultValue?: string;
    placeholder: string;
  };
}) {
  return (
    <section className={s.ownerOrdersHero}>
      <form
        className={s.ownerOrdersSearch}
        action={search.action}
        method="get"
        role="search"
      >
        <label htmlFor="owner-orders-search">
          Aufträge durchsuchen
        </label>

        <span aria-hidden="true">⌕</span>

        <input
          id="owner-orders-search"
          name={search.name}
          type="search"
          defaultValue={search.defaultValue}
          placeholder={search.placeholder}
        />
      </form>

      <div className={s.ownerOrdersHeroBody}>
        <div className={s.ownerOrdersHeroCopy}>
          <p className={s.ownerOrdersEyebrow}>
            {eyebrow}
          </p>

          <h1>{title}</h1>

          <p>{text}</p>
        </div>

        <figure className={s.ownerOrdersHeroMedia}>
          <img
            src={imageSrc}
            alt={imageAlt}
          />

          <figcaption>
            <span aria-hidden="true">⌖</span>

            <span>
              <strong>{address}</strong>
              {postcode && <small>{postcode}</small>}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function EHOwnerOrdersStats({
  items,
}: {
  items: readonly EHOwnerOrdersStatItem[];
}) {
  return (
    <nav
      className={s.ownerOrdersStats}
      aria-label="Auftragsübersicht"
    >
      {items.map((item) => (
        <a
          href={item.href}
          key={`${item.href}-${item.tone}`}
          data-tone={item.tone}
        >
          <span className={s.ownerOrdersStatIcon}>
            {item.icon}
          </span>

          {'value' in item ? (
            <span className={s.ownerOrdersStatCopy}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </span>
          ) : (
            <span className={s.ownerOrdersStatCopy}>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </span>
          )}

          <span
            className={s.ownerOrdersStatArrow}
            aria-hidden="true"
          >
            →
          </span>
        </a>
      ))}
    </nav>
  );
}

export function EHOwnerOrdersList({
  items,
}: {
  items: readonly EHOwnerOrdersListItem[];
}) {
  return (
    <ul
      className={s.ownerOrdersList}
      aria-label="Aktuelle Aufträge"
    >
      {items.map((item) => (
        <li key={item.id}>
          <a
            className={s.ownerOrdersPrimary}
            href={item.href}
            aria-label={`${item.title} öffnen`}
          >
            <span className={s.ownerOrdersThumbnail}>
              {item.media ? (
                <img
                  src={item.media.src}
                  alt={item.media.alt}
                />
              ) : (
                <span aria-hidden="true">⌂</span>
              )}
            </span>

            <span className={s.ownerOrdersTitle}>
              <strong>{item.title}</strong>

              <small>
                {[
                  item.category,
                  item.provider,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </span>
          </a>

          <span
            className={s.ownerOrdersStatus}
            data-tone={item.statusTone}
          >
            {item.status}
          </span>

          <span className={s.ownerOrdersSchedule}>
            {item.schedule}
          </span>

          <a
            className={s.ownerOrdersDetailButton}
            href={item.href}
          >
            Details
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Ein Datensatz, drei Ansichten (Werkbank, Variante A). Derselbe Eintrag wird
 * als dichte Zeile, als Karte und als Zeitachsen-Ereignis dargestellt - die
 * Seiten liefern die Daten, der Umschalter waehlt nur die Darstellung.
 */
export type EHRecordEntry = {
  id: string;
  /** Erste Zeile. In der Liste und auf der Karte der Anker des Eintrags. */
  title: string;
  /** Zweite Zeile: Anbieter, Ort, Zusatz. Bleibt kurz, damit die Zeile dicht bleibt. */
  detail?: string;
  /** Kennzahl, Betrag oder Termin - rechts in der Liste, unten auf der Karte. */
  value?: string;
  /** Zusatzzeile der Chronik. */
  note?: string;
  /** ISO-Datum (YYYY-MM-DD). Die Chronik sortiert daran absteigend. */
  date?: string;
  /** Anzeige des Datums, zum Beispiel "14.09.". */
  dateLabel?: string;
  /** Frei komponierter Zustand, meist <EHStatus/>. */
  status?: ReactNode;
  /** 20px-Symbol, zum Beispiel <FileText size={20}/>. */
  icon?: ReactNode;
  href?: string;
};

function RecordRow({item}: {item: EHRecordEntry}) {
  const body = <>
    {item.icon && <span className={s.recordIcon} aria-hidden="true">{item.icon}</span>}

    <span className={s.recordMain}>
      <span className={s.recordTitle}>{item.title}</span>
      {item.detail && <span className={s.recordDetail}>{item.detail}</span>}
    </span>

    {(item.value || item.dateLabel || item.status) && (
      <span className={s.recordTail}>
        {item.value && <span className={s.recordValue}>{item.value}</span>}
        {item.dateLabel && <span className={s.recordDate}>{item.dateLabel}</span>}
        {item.status}
      </span>
    )}
  </>;

  return item.href
    ? <a className={s.recordRow} href={item.href}>{body}</a>
    : <div className={s.recordRow}>{body}</div>;
}

/** Dicht: eine Zeile pro Eintrag. */
export function EHRecordList({label, items, empty}: {label: string; items: readonly EHRecordEntry[]; empty?: ReactNode}) {
  if (!items.length) return <p className={s.recordEmpty}>{empty ?? "Keine Einträge."}</p>;

  return (
    <ul className={s.recordList} aria-label={label}>
      {items.map((item) => <li key={item.id}><RecordRow item={item}/></li>)}
    </ul>
  );
}

/** Eine Karte pro Eintrag. */
export function EHRecordCards({label, items, empty}: {label: string; items: readonly EHRecordEntry[]; empty?: ReactNode}) {
  if (!items.length) return <p className={s.recordEmpty}>{empty ?? "Keine Einträge."}</p>;

  return (
    <ul className={s.recordCards} aria-label={label}>
      {items.map((item) => {
        const body = <>
          <span className={s.recordCardTop}>
            {item.icon
              ? <span className={s.recordIcon} aria-hidden="true">{item.icon}</span>
              : <span aria-hidden="true"/>}
            {item.status}
          </span>

          <span className={s.recordCardTitle}>{item.title}</span>
          {item.detail && <span className={s.recordDetail}>{item.detail}</span>}

          {(item.value || item.dateLabel) && (
            <span className={s.recordCardFoot}>
              {item.value && <span className={s.recordValue}>{item.value}</span>}
              {item.dateLabel && <span className={s.recordDate}>{item.dateLabel}</span>}
            </span>
          )}
        </>;

        return (
          <li key={item.id}>
            {item.href
              ? <a className={s.recordCard} href={item.href}>{body}</a>
              : <div className={s.recordCard}>{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}

function byDateDescending(items: readonly EHRecordEntry[]) {
  const dated = items.filter((item) => item.date).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  // Ohne Datum bleibt der Eintrag in der Reihenfolge der Seite und steht hinten.
  return [...dated, ...items.filter((item) => !item.date)];
}

/** Zeitachse: absteigend nach Datum, das Neueste oben. */
export function EHRecordTimeline({label, items, empty}: {label: string; items: readonly EHRecordEntry[]; empty?: ReactNode}) {
  if (!items.length) return <p className={s.recordEmpty}>{empty ?? "Keine Einträge."}</p>;

  return (
    <ol className={s.recordTimeline} aria-label={label}>
      {byDateDescending(items).map((item) => {
        const body = <>
          <span className={s.recordEventTop}>
            <span className={s.recordTitle}>{item.title}</span>
            {item.status}
          </span>

          {item.detail && <span className={s.recordDetail}>{item.detail}</span>}
          {item.note && <span className={s.recordNote}>{item.note}</span>}
        </>;

        return (
          <li key={item.id} className={s.recordEvent}>
            {item.date
              ? <time className={s.recordEventTime} dateTime={item.date}>{item.dateLabel ?? item.date}</time>
              : <span aria-hidden="true"/>}

            {item.icon
              ? <span className={s.recordIcon} aria-hidden="true">{item.icon}</span>
              : <span aria-hidden="true"/>}

            {item.href
              ? <a className={s.recordEventBody} href={item.href}>{body}</a>
              : <div className={s.recordEventBody}>{body}</div>}
          </li>
        );
      })}
    </ol>
  );
}

export function EHOwnerOrdersSupport({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href: string;
  label: string;
}) {
  return (
    <aside className={s.ownerOrdersSupport}>
      <span
        className={s.ownerOrdersSupportIcon}
        aria-hidden="true"
      >
        ✦
      </span>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>

      <a href={href}>
        {label}
        <span aria-hidden="true">→</span>
      </a>
    </aside>
  );
}
