"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import s from "./styles.module.css";

export type EHDirectoryCategory = { readonly id: string; readonly label: string; readonly subcategories: readonly { readonly id: string; readonly label: string }[] };
export type EHDirectoryContact = { id: number; platformUserId: number | null; name: string; company: string; phone: string; email: string; legacyCategory: string; revision: number; subcategoryIds: string[]; unreadCount?: number };
export type EHDirectoryFormState = { error?: string; fieldErrors?: Record<string, string>; duplicates?: EHDirectoryContact[] };
export type EHDirectoryAction = (state: EHDirectoryFormState, data: FormData) => Promise<EHDirectoryFormState>;
export type EHDirectoryMode = "categories" | "subcategories" | "contacts" | "manage" | "detail" | "new" | "assign" | "edit";

function directoryHref(values: { main?: string; sub?: string; entry?: number; mode?: string; q?: string }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") params.set(key, String(value));
  return `/app/messages${params.size ? `?${params.toString()}` : ""}`;
}
function DirectoryArrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>;
}
function serviceLabels(contact: EHDirectoryContact, categories: readonly EHDirectoryCategory[]) {
  const assigned = new Set(contact.subcategoryIds);
  return categories.flatMap(main => main.subcategories.filter(sub => assigned.has(sub.id)).map(sub => sub.label));
}
function dialHref(phone: string) {
  const dial = phone.replace(/[^0-9+*#,;]/g, "");
  return dial && /\d/.test(dial) ? `tel:${dial}` : undefined;
}

export function EHContactWorkspace({ categories, contacts, mode, mainId, subcategoryId, entryId, query = "", requestId, notice, action, conversation }: {
  categories: readonly EHDirectoryCategory[]; contacts: EHDirectoryContact[]; mode: EHDirectoryMode;
  mainId?: string; subcategoryId?: string; entryId?: number; query?: string; requestId: string;
  notice?: string; action: EHDirectoryAction; conversation?: ReactNode;
}) {
  const main = categories.find(item => item.id === mainId);
  const sub = main?.subcategories.find(item => item.id === subcategoryId);
  const entry = contacts.find(item => item.id === entryId);
  const isEditor = mode === "new" || mode === "assign" || mode === "edit";
  const title = mode === "categories" ? "Ansprechpartner" : mode === "manage" ? "Deine Kontakte" : mode === "new" ? "Kontakt hinzufügen" : mode === "assign" ? "Leistungen zuordnen" : mode === "edit" ? "Kontakt bearbeiten" : mode === "detail" ? entry?.name || "Kontakt nicht verfügbar" : sub?.label || main?.label || "Bereich nicht verfügbar";
  const description = mode === "categories" ? "Wähle einen Bereich. Danach das passende Gewerk." : mode === "subcategories" ? "Für welche Leistung suchst du einen Ansprechpartner?" : mode === "contacts" ? "Deine gespeicherten Kontakte für diese Leistung." : mode === "manage" ? "Alle Kontakte an einem Ort. Auch die, die noch keinem Bereich zugeordnet sind." : mode === "new" ? "Einmal speichern. In allen gewählten Leistungen wiederfinden." : mode === "assign" ? "Du änderst nur die Leistungen dieses Bereichs. Dein Kontakt bleibt erhalten." : mode === "edit" ? "Änderungen gelten überall, wo dieser Kontakt zugeordnet ist." : entry?.company || undefined;
  const back = entry ? directoryHref({ entry: entry.id, main: main?.id, sub: sub?.id, q: query }) : sub ? directoryHref({ main: main?.id, sub: sub.id, q: query }) : "/app/messages";
  const normalizedQuery = query.trim().toLocaleLowerCase("de");
  const visible = contacts.filter(contact => (!sub || contact.subcategoryIds.includes(sub.id)) && (!normalizedQuery || `${contact.name} ${contact.company} ${contact.email} ${serviceLabels(contact, categories).join(" ")}`.toLocaleLowerCase("de").includes(normalizedQuery)));
  return <div className={s.directoryWorkspace} data-contact-level={mode}>
    {mode !== "categories" && <nav className={s.directoryBreadcrumb} aria-label="Kontakt-Navigation">
      <a href="/app/messages">Ansprechpartner</a>
      {main && <><DirectoryArrow /><a href={directoryHref({ main: main.id })}>{main.label}</a></>}
      {sub && <><DirectoryArrow /><a href={directoryHref({ main: main?.id, sub: sub.id })}>{sub.label}</a></>}
      {mode === "manage" && <><DirectoryArrow /><span aria-current="page">Kontakte verwalten</span></>}
    </nav>}
    <header className={s.directoryHeader}>
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {mode === "categories" && <a className={s.directorySecondary} href={directoryHref({ mode: "manage" })}>Kontakte verwalten</a>}
      {mode === "contacts" && sub && <a className={s.directoryPrimary} href={directoryHref({ main: main?.id, sub: sub.id, mode: "new" })}>Kontakt hinzufügen</a>}
      {mode === "detail" && entry && entry.platformUserId === null && <a className={s.directorySecondary} href={directoryHref({ entry: entry.id, main: main?.id, sub: sub?.id, mode: "edit", q: query })}>Kontakt bearbeiten</a>}
    </header>
    {notice && <p className={s.directoryNotice} role="status">{notice}</p>}
    {mode === "categories" && <nav aria-label="Hauptkategorien"><ul className={s.directoryCategories}>
      {categories.map(category => <li key={category.id}><a href={directoryHref({ main: category.id })} data-main-category={category.id}><span>{category.label}</span><DirectoryArrow /></a></li>)}
    </ul></nav>}
    {mode === "subcategories" && main && <nav aria-label={`Leistungen in ${main.label}`}><ul className={s.directorySubcategories}>
      {main.subcategories.map(item => <li key={item.id}><a href={directoryHref({ main: main.id, sub: item.id })} data-subcategory={item.id}><span>{item.label}</span><DirectoryArrow /></a></li>)}
    </ul></nav>}
    {(mode === "contacts" || mode === "manage") && <>
      <form className={s.directorySearch} action="/app/messages" method="get" role="search">
        {mode === "manage" && <input type="hidden" name="mode" value="manage" />}
        {main && <input type="hidden" name="main" value={main.id} />}{sub && <input type="hidden" name="sub" value={sub.id} />}
        <label htmlFor="directory-search">{mode === "manage" ? "Alle Kontakte durchsuchen" : "Kontakte in dieser Leistung suchen"}</label>
        <div><input id="directory-search" name="q" type="search" defaultValue={query} placeholder="Name oder Betrieb" /><button className={s.directorySecondary}>Suchen</button></div>
      </form>
      {visible.length ? <ul className={s.directoryContacts} aria-label="Gespeicherte Kontakte">
        {visible.map(contact => <li key={contact.id} data-contact-entry={contact.id}>
          <a className={s.directoryContactLink} href={directoryHref({ entry: contact.id, main: main?.id, sub: sub?.id, q: query })}>
            <div><strong>{contact.name}</strong>{contact.company && contact.company !== contact.name && <p>{contact.company}</p>}
              <p className={s.directoryServices}>{serviceLabels(contact, categories).join(" · ") || "Noch keinem Bereich zugeordnet"}</p>
              {!!contact.unreadCount && <span className={s.directoryUnread}>{contact.unreadCount} ungelesen</span>}
            </div><DirectoryArrow />
          </a>
          {dialHref(contact.phone) && <a className={s.directoryInlineAction} href={dialHref(contact.phone)} aria-label={`${contact.name} anrufen`}>Anrufen</a>}
        </li>)}
      </ul> : <div className={s.directoryEmpty}><h2>{query ? "Keine passenden Kontakte" : "Hier ist noch kein Kontakt gespeichert"}</h2>
        <p>{query ? "Versuche einen anderen Namen oder entferne den Suchbegriff." : mode === "manage" ? "Wähle zuerst einen Bereich und eine Leistung. Dort kannst du deinen ersten Kontakt hinzufügen." : "Speichere einen neuen Kontakt oder ordne einen bestehenden zu."}</p>
        <a className={s.directorySecondary} href={query ? directoryHref({ main: main?.id, sub: sub?.id, mode: mode === "manage" ? "manage" : undefined }) : mode === "manage" ? "/app/messages" : directoryHref({ main: main?.id, sub: sub?.id, mode: "new" })}>{query ? "Suche zurücksetzen" : mode === "manage" ? "Bereich wählen" : "Kontakt hinzufügen"}</a>
      </div>}
      {mode === "contacts" && <footer className={s.directoryFooter}><span>Noch kein passender Betrieb dabei?</span><a href="/app/hausmeister">Mit dem Hausmanager suchen</a></footer>}
      {sub && /notfall|notdienst/i.test(sub.label) && <p className={s.directoryHelp}>Die Zuordnung ist keine Zusage für Erreichbarkeit oder einen 24-Stunden-Dienst. Bei unmittelbarer Gefahr: 112.</p>}
    </>}
    {mode === "detail" && entry && <>
      <a className={s.directoryBack} href={sub ? directoryHref({ main: main?.id, sub: sub.id, q: query }) : directoryHref({ mode: "manage", q: query })}>Zurück zur Kontaktliste</a>
      <div className={s.directoryDetail}>
        <section aria-labelledby="contact-reachability"><h2 id="contact-reachability">Kontaktdaten</h2><dl className={s.directoryData}>
          <div><dt>Telefon</dt><dd>{dialHref(entry.phone) ? <a href={dialHref(entry.phone)}>{entry.phone}</a> : "Nicht hinterlegt"}</dd></div>
          <div><dt>E-Mail</dt><dd>{entry.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email) ? <a href={`mailto:${encodeURIComponent(entry.email)}`}>{entry.email}</a> : "Nicht hinterlegt"}</dd></div>
        </dl><p className={s.directoryHelp}>{entry.platformUserId === null ? "Privat gespeicherter Kontakt. Keine automatische Einladung und kein App-Chat." : "Verknüpfter Partnerkontakt. Kontaktdaten stammen aus dem Partnerprofil."}</p></section>
        <section aria-labelledby="contact-services"><div className={s.directorySectionHead}><h2 id="contact-services">Leistungen</h2><a href={directoryHref({ entry: entry.id, main: main?.id || categories.find(group => group.subcategories.some(item => entry.subcategoryIds.includes(item.id)))?.id || categories[0]?.id, mode: "assign", q: query })}>Zuordnung bearbeiten</a></div>
          {categories.filter(group => group.subcategories.some(item => entry.subcategoryIds.includes(item.id))).map(group => <div className={s.directoryAssignmentGroup} key={group.id}><h3>{group.label}</h3><ul>{group.subcategories.filter(item => entry.subcategoryIds.includes(item.id)).map(item => <li key={item.id}><a href={directoryHref({ main: group.id, sub: item.id })}>{item.label}</a></li>)}</ul></div>)}
          {!entry.subcategoryIds.length && <p className={s.directoryHelp}>Noch keine Leistungen gewählt.{entry.legacyCategory ? ` Dein bisheriger Bereich „${entry.legacyCategory}“ bleibt gespeichert.` : ""}</p>}
        </section>
      </div>
      {conversation && <section className={s.directoryConversation} aria-labelledby="directory-messages"><h2 id="directory-messages">Nachrichten</h2>{conversation}</section>}
    </>}
    {isEditor && (mode === "edit" ? entry?.platformUserId === null : Boolean(main)) && <>
      <a className={s.directoryBack} href={back}>Abbrechen und zurück</a>
      {mode === "assign" && entry && <form className={s.directoryGroupSwitch} action="/app/messages" method="get">
        <input type="hidden" name="entry" value={entry.id} /><input type="hidden" name="mode" value="assign" />
        <label htmlFor="directory-main">Bereich für {entry.name}</label><div><select id="directory-main" name="main" defaultValue={main?.id}>{categories.map(group => <option key={group.id} value={group.id}>{group.label}</option>)}</select><button className={s.directorySecondary}>Bereich öffnen</button></div>
      </form>}
      <EHDirectoryEditor key={`${mode}-${entry?.id}-${main?.id}`} mode={mode as "new" | "assign" | "edit"} main={main} subcategoryId={sub?.id} entry={entry} contacts={contacts} requestId={requestId} action={action} />
    </>}
  </div>;
}

export function EHDirectoryEditor({ mode, main, subcategoryId, entry, contacts, requestId, action }: {
  mode: "new" | "assign" | "edit"; main?: EHDirectoryCategory; subcategoryId?: string; entry?: EHDirectoryContact; contacts: EHDirectoryContact[]; requestId: string; action: EHDirectoryAction;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errorRef = useRef<HTMLDivElement>(null);
  const [kind, setKind] = useState<"create" | "existing">("create");
  const [existingId, setExistingId] = useState("");
  const [fields, setFields] = useState({ name: entry?.name || "", company: entry?.company || "", phone: entry?.phone || "", email: entry?.email || "" });
  const [selected, setSelected] = useState<string[]>(mode === "assign" ? entry?.subcategoryIds.filter(id => main?.subcategories.some(sub => sub.id === id)) || [] : subcategoryId ? [subcategoryId] : []);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const existing = contacts.find(contact => String(contact.id) === existingId);
  const target = mode === "new" ? existing : entry;
  const intent = mode === "new" ? kind : mode === "assign" ? "replace" : "update";
  useEffect(() => { if (state.error || state.duplicates?.length) errorRef.current?.focus(); }, [state]);
  function chooseExisting(value: string) {
    setKind("existing"); setExistingId(value);
    const contact = contacts.find(item => String(item.id) === value);
    setSelected(Array.from(new Set([...(contact?.subcategoryIds.filter(id => main?.subcategories.some(sub => sub.id === id)) || []), ...(subcategoryId ? [subcategoryId] : [])])));
  }
  function checkbox(id: string, label: string) {
    const pinned = mode === "new" && id === subcategoryId;
    return <label className={s.directoryCheckbox} key={id}>
      <input type="checkbox" name="subcategoryIds" value={id} checked={selected.includes(id)} disabled={pinned || pending} onChange={event => setSelected(previous => event.target.checked ? [...previous, id] : previous.filter(value => value !== id))} />
      {pinned && <input type="hidden" name="subcategoryIds" value={id} />}<span>{label}{pinned && <small>Bereits ausgewählt</small>}</span>
    </label>;
  }
  const single = main?.subcategories.find(item => item.id === subcategoryId);
  return <form action={formAction} className={s.directoryEditor} aria-busy={pending}>
    <input type="hidden" name="intent" value={intent} /><input type="hidden" name="requestId" value={requestId} />
    <input type="hidden" name="mainId" value={main?.id || ""} /><input type="hidden" name="initialSubcategoryId" value={subcategoryId || ""} />
    <input type="hidden" name="entryId" value={target?.id || ""} /><input type="hidden" name="revision" value={target?.revision ?? 0} />
    {(state.error || state.duplicates?.length) && <div className={s.directoryFormError} tabIndex={-1} ref={errorRef} role="alert">
      <h2>{state.duplicates?.length ? "Ist dieser Kontakt schon gespeichert?" : "Noch nicht gespeichert"}</h2><p>{state.error || "Wähle den bestehenden Kontakt. So bleiben seine Leistungen und Absprachen zusammen."}</p>
      {!!state.duplicates?.length && <ul>{state.duplicates.map(contact => <li key={contact.id}><button type="button" className={s.directorySecondary} onClick={() => chooseExisting(String(contact.id))}>{contact.name}{contact.company && contact.company !== contact.name ? ` · ${contact.company}` : ""} verwenden</button></li>)}</ul>}
    </div>}
    <fieldset disabled={pending} className={s.directoryFormBody}>
      {mode === "new" && contacts.length > 0 && <fieldset className={s.directoryChoice}><legend>Kontakt auswählen</legend>
        <label><input type="radio" name="contactSource" value="create" checked={kind === "create"} onChange={() => { setKind("create"); setSelected(subcategoryId ? [subcategoryId] : []); }} />Neuen Kontakt speichern</label>
        <label><input type="radio" name="contactSource" value="existing" checked={kind === "existing"} onChange={() => { if (contacts[0]) chooseExisting(String(contacts[0].id)); }} />Bestehenden Kontakt zuordnen</label>
      </fieldset>}
      {mode === "new" && kind === "existing" && <div className={s.directoryField}><label htmlFor="directory-existing">Gespeicherter Kontakt</label><select id="directory-existing" value={existingId} required onChange={event => chooseExisting(event.target.value)}><option value="">Kontakt wählen</option>{contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name}{contact.company && contact.company !== contact.name ? ` · ${contact.company}` : ""}</option>)}</select><p>Es wird kein zweiter Kontakt erstellt. Bisherige Leistungen bleiben erhalten.</p></div>}
      {(mode === "edit" || mode === "new" && kind === "create") && <fieldset className={s.directoryFields}><legend>Kontaktdaten</legend>
        {([{ name: "name", label: "Name oder Betriebsname", type: "text", max: 120, required: true, placeholder: "z. B. Mustermann Gartenbau" }, { name: "company", label: "Betrieb (optional)", type: "text", max: 120, required: false, placeholder: "Falls abweichend vom Namen" }, { name: "phone", label: "Telefon (optional)", type: "tel", max: 40, required: false, placeholder: "z. B. +49 …" }, { name: "email", label: "E-Mail (optional)", type: "email", max: 254, required: false, placeholder: "name@betrieb.de" }] as const).map(field => <div className={s.directoryField} key={field.name}><label htmlFor={`directory-${field.name}`}>{field.label}</label><input id={`directory-${field.name}`} name={field.name} type={field.type} required={field.required} maxLength={field.max} placeholder={field.placeholder} autoComplete="off" value={fields[field.name]} onChange={event => { setAllowDuplicate(false); setFields(previous => ({ ...previous, [field.name]: event.target.value })); }} aria-invalid={!!state.fieldErrors?.[field.name]} aria-describedby={state.fieldErrors?.[field.name] ? `directory-${field.name}-error` : undefined} />{state.fieldErrors?.[field.name] && <p id={`directory-${field.name}-error`} className={s.directoryFieldError}>{state.fieldErrors[field.name]}</p>}</div>)}
      </fieldset>}
      {mode !== "edit" && main && <fieldset className={s.directoryServicesField} aria-describedby="directory-services-help"><legend>{main.label}: Leistungen</legend>
        <p id="directory-services-help">{mode === "new" ? "Die gewählte Leistung reicht aus. Weitere Zuordnungen sind freiwillig." : "Wähle alle passenden Leistungen. Ohne Auswahl wird nur die Zuordnung zu diesem Bereich entfernt."}</p>
        {mode === "new" && single ? <>{checkbox(single.id, single.label)}<details className={s.directoryOptional}><summary>Weitere Leistungen zuordnen (optional)</summary><div className={s.directoryChecks}>{main.subcategories.filter(item => item.id !== single.id).map(item => checkbox(item.id, item.label))}</div></details></> : <div className={s.directoryChecks}>{main.subcategories.map(item => checkbox(item.id, item.label))}</div>}
        {state.fieldErrors?.subcategoryIds && <p className={s.directoryFieldError}>{state.fieldErrors.subcategoryIds}</p>}
      </fieldset>}
      {mode === "new" && kind === "create" && !!state.duplicates?.length && <label className={s.directoryCheckbox}><input type="checkbox" name="allowPossibleDuplicate" checked={allowDuplicate} onChange={event => setAllowDuplicate(event.target.checked)} value="true" /><span>Dies ist ein anderer Kontakt. Trotzdem neu speichern.</span></label>}
      <div className={s.directorySave}><button type="submit" className={s.directoryPrimary} disabled={pending || intent === "existing" && !existing}>{pending ? "Wird gespeichert …" : intent === "create" ? "Kontakt speichern" : intent === "existing" ? "Kontakt zuordnen" : "Änderungen speichern"}</button><p>{mode === "edit" ? "Alle Zuordnungen bleiben erhalten." : "Ein Kontakt. Mehrere Leistungen. Keine doppelten Einträge."}</p></div>
    </fieldset>
  </form>;
}
