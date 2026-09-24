import type { ReactNode } from 'react';
import { EHButton, EHStatus } from './primitives';
import s from './styles.module.css';

type Action = { href: string; label: string };
export function EHOwnerPageHeader({ title, text, action, context }: { title: string; text: string; action?: Action; context?: string }) {
  return <header className={s.ownerPageHeader}><div>{context && <p className={s.ownerPageContext}>{context}</p>}<h1>{title}</h1><p>{text}</p></div>{action && <EHButton href={action.href}>{action.label}</EHButton>}</header>;
}
export function EHOwnerSection({ title, text, children, action }: { title: string; text?: string; children: ReactNode; action?: Action }) {
  return <section className={s.ownerSection}><header><div><h2>{title}</h2>{text && <p>{text}</p>}</div>{action && <a href={action.href}>{action.label}<span aria-hidden="true">→</span></a>}</header>{children}</section>;
}
export type EHOwnerRecord = { id: string; title: string; href: string; detail: string; meta?: string; status?: string; tone?: 'neutral' | 'info' | 'success' | 'warning' | 'error'; action?: string; media?: { src: string; alt: string } };
export function EHOwnerRecords({ label, items }: { label: string; items: readonly EHOwnerRecord[] }) {
  return <ul className={s.ownerRecords} aria-label={label}>{items.map(item => <li key={item.id}><div className={s.ownerRecordIdentity}>{item.media && <img className={s.ownerRecordMedia} src={item.media.src} alt={item.media.alt} />}<div><h3><a href={item.href}>{item.title}</a></h3><p>{item.detail}</p>{item.meta && <p className={s.ownerRecordMeta}>{item.meta}</p>}</div></div><div className={s.ownerRecordAction}>{item.status && <EHStatus tone={item.tone}>{item.status}</EHStatus>}<a href={item.href} aria-label={`${item.action || 'Öffnen'}: ${item.title}`}>{item.action || 'Öffnen'}<span aria-hidden="true"> →</span></a></div></li>)}</ul>;
}
export function EHOwnerFilters({ label, items }: { label: string; items: readonly { href: string; label: string; count?: number; active: boolean }[] }) {
  return <nav className={s.ownerFilters} aria-label={label}>{items.map(item => <a key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined}>{item.label}{item.count !== undefined && <span>{item.count}</span>}</a>)}</nav>;
}
export function EHOwnerSearch({ action, query, placeholder, hidden, areas, area }: { action: string; query: string; placeholder: string; hidden?: { name: string; value: string }; areas?: string[]; area?: string }) {
  return <form className={s.ownerSearch} action={action} method="get" role="search" aria-label={placeholder}>{hidden && <input type="hidden" name={hidden.name} value={hidden.value} />}<label><span>Suchen</span><input name="q" type="search" defaultValue={query} placeholder={placeholder} /></label>{areas && <label><span>Bereich</span><select name="bereich" defaultValue={area || ''}><option value="">Alle Bereiche</option>{areas.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}<EHButton type="submit" variant="secondary">Anzeigen</EHButton></form>;
}
export function EHOwnerLinks({ items }: { items: readonly { href: string; title: string; text: string }[] }) {
  return <nav className={s.ownerLinks} aria-label="Weitere Möglichkeiten">{items.map(item => <a key={item.href} href={item.href}><strong>{item.title}<span aria-hidden="true"> →</span></strong><span>{item.text}</span></a>)}</nav>;
}
export function EHOwnerWelcome({ children, imageSrc, caption }: { children: ReactNode; imageSrc: string; caption: string }) {
  return <div className={s.ownerWelcome}><div>{children}</div><figure><img src={imageSrc} alt="" /><figcaption>{caption}</figcaption></figure></div>;
}
export function EHOwnerComposer({ children }: { children: ReactNode }) {
  return <section className={s.ownerComposer}><header><h2>Was möchtest du für dein Zuhause klären?</h2><p>Beschreibe dein Anliegen. Den nächsten Schritt prüfst du, bevor du einen Auftrag erteilst.</p></header>{children}</section>;
}
export function EHOwnerContacts({ groups }: { groups: readonly { title: string; contacts: readonly { id: string; name: string; company: string; role?: string; context?: string; href: string; phone?: string; unread: number }[] }[] }) {
  return <div className={s.ownerContacts}>{groups.map(group => <EHOwnerSection key={group.title} title={group.title}><ul className={s.ownerRecords} aria-label={group.title}>{group.contacts.map(contact => <li key={contact.id}><div className={s.ownerRecordIdentity}><span className={s.ownerContactInitials} aria-hidden="true">{contact.name.split(/\s+/).filter(Boolean).map(word => word[0]).slice(0, 2).join('')}</span><div><h3><a href={contact.href}>{contact.name}</a></h3><p>{contact.company}{contact.role ? ` · ${contact.role}` : ''}</p>{contact.context && <p className={s.ownerRecordMeta}>Zuletzt: {contact.context}</p>}{contact.unread > 0 && <EHStatus tone="info">{contact.unread} ungelesen</EHStatus>}</div></div><div className={s.ownerRecordAction}>{contact.phone && <a href={`tel:${contact.phone}`}>Anrufen</a>}<a href={contact.href} aria-label={`Nachricht an ${contact.name}`}>Nachricht<span aria-hidden="true"> →</span></a></div></li>)}</ul></EHOwnerSection>)}</div>;
}

export function EHOwnerOverview({ main, aside }: { main: ReactNode; aside?: ReactNode }) {
  return <div className={s.ownerOverview} data-with-aside={aside ? 'true' : undefined}><div>{main}</div>{aside && <aside>{aside}</aside>}</div>;
}
