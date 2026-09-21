"use client";
import {useEffect, useId, useRef, useState, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormEvent} from "react";
import {EHHeading, EHText, EHButton, EHActions, EHEyebrow, EHStatus} from "./primitives";
import s from "./styles.module.css";
type Native<T> = Omit<T, "style" | "className">;
export function EHAppHeader({eyebrow, title, text, actions}: {eyebrow?: string; title: string; text?: string; actions?: ReactNode}) {
  return <header className={s.appHeader}><div>{eyebrow && <EHEyebrow>{eyebrow}</EHEyebrow>}<EHHeading as="h1" scale="app">{title}</EHHeading>{text && <EHText>{text}</EHText>}</div>{actions && <EHActions>{actions}</EHActions>}</header>;
}
export function EHField({id, label, hint, error, required, children}: {id: string; label: string; hint?: string; error?: string; required?: boolean; children: ReactNode}) {
  return <div className={s.field}><label htmlFor={id}>{label}{required && <span> (erforderlich)</span>}</label>{hint && <p id={id+"-hint"} className={s.fieldHint}>{hint}</p>}{children}{error && <p id={id+"-error"} className={s.fieldError} role="alert">{error}</p>}</div>;
}
export function EHInput(props: Native<InputHTMLAttributes<HTMLInputElement>>) {return <input {...props} className={s.input}/>;}
// Datei-Auswahl: native file-Inputs ignorieren padding/color und zeigen rohen
// Browser-Text ("Choose File - No file chosen"). EHFileInput umhuellt das
// native Input mit einem sichtbaren Button und zeigt den gewaehlten Dateinamen
// rein kosmetisch an. Die Feldbeschriftung liefert EHField (htmlFor); hier wird
// bewusst kein weiteres <label> erzeugt. FormData und Validierung bleiben beim
// nativen Control, Tastatur und Screenreader bleiben auf ihm.
export function EHFileInput({label = "Datei auswählen …", placeholder = "Keine Datei ausgewählt", onChange, ...props}: Native<InputHTMLAttributes<HTMLInputElement>> & {label?: string; placeholder?: string}) {
  const generated = useId();
  const inputId = props.id ?? generated;
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const reset = (event: Event) => {
      // Native und erfolgreiche React-Form-Actions leeren die Dateiauswahl.
      // Ein abgebrochener Reset muss dagegen auch den Dateinamen erhalten.
      queueMicrotask(() => { if (!event.defaultPrevented) setFileName(null); });
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [props.form]);
  return <span className={s.fileInput}>
    <input {...props} ref={inputRef} id={inputId} type="file" className={s.fileInputNative} onChange={event=>{
      const input = event.currentTarget;
      onChange?.(event);
      const names = Array.from(input.files ?? []).map(file => file.name);
      setFileName(names.length > 1 ? `${names.length} Dateien: ${names.join(", ")}` : names[0] ?? null);
    }}/>
    <span className={s.fileInputButton} aria-hidden="true">{label}</span>
    <span className={s.fileInputMeta} aria-hidden="true" title={fileName ?? undefined}>{fileName ?? placeholder}</span>
  </span>;
}
export function EHTextarea(props: Native<TextareaHTMLAttributes<HTMLTextAreaElement>>) {return <textarea rows={5} {...props} className={s.textarea}/>;}
export function EHSelect(props: Native<SelectHTMLAttributes<HTMLSelectElement>>) {return <select {...props} className={s.select}/>;}
export function EHCheckbox({label, ...props}: Native<InputHTMLAttributes<HTMLInputElement>> & {label: ReactNode}) {
  const generated=useId();
  return <label className={s.checkbox} htmlFor={props.id ?? generated}><input {...props} id={props.id ?? generated} type="checkbox"/><span>{label}</span></label>;
}
export function EHTabs({label, tabs, defaultValue, value, onValueChange}: {label: string; tabs: {id: string; label: string; content: ReactNode; disabled?: boolean}[]; defaultValue?: string; value?: string; onValueChange?: (id:string)=>void}) {
  const uid=useId(); const [internal,setInternal]=useState(defaultValue ?? tabs.find(t=>!t.disabled)?.id);
  const selected=value ?? internal; const refs=useRef<(HTMLButtonElement|null)[]>([]);
  const activate=(id:string)=>{setInternal(id);onValueChange?.(id);};
  return <div className={s.tabs}><div role="tablist" aria-label={label} className={s.tabList}>{tabs.map((tab,i)=><button type="button" key={tab.id} ref={node=>{refs.current[i]=node;}} id={uid+"-tab-"+tab.id} role="tab" aria-selected={selected===tab.id} aria-controls={uid+"-panel-"+tab.id} tabIndex={selected===tab.id ? 0 : -1} disabled={tab.disabled} onClick={()=>activate(tab.id)} onKeyDown={event=>{
    if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
    event.preventDefault(); const enabled=tabs.map((t,n)=>t.disabled ? -1:n).filter(n=>n>=0); const index=enabled.indexOf(i);
    const next=event.key==="Home" ? enabled[0] : event.key==="End" ? enabled.at(-1) : enabled[(index+(event.key==="ArrowRight" ? 1:-1)+enabled.length)%enabled.length];
    if(next!==undefined) {refs.current[next]?.focus(); activate(tabs[next].id);}
  }}>{tab.label}</button>)}</div>{tabs.map(tab=><div key={tab.id} id={uid+"-panel-"+tab.id} role="tabpanel" aria-labelledby={uid+"-tab-"+tab.id} hidden={selected!==tab.id} tabIndex={0} className={s.tabPanel}>{tab.content}</div>)}</div>;
}
export function EHDialog({open, onClose, title, children, actions}: {open: boolean; onClose: ()=>void; title: string; children: ReactNode; actions?: ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null); const uid=useId();
  useEffect(()=>{const dialog=ref.current; if(!dialog) return; if(open && !dialog.open) dialog.showModal(); else if(!open && dialog.open) dialog.close();},[open]);
  return <dialog ref={ref} className={s.dialog} aria-labelledby={uid} onCancel={event=>{event.preventDefault();onClose();}} onClose={onClose}><div className={s.dialogHead}><h2 id={uid}>{title}</h2><button type="button" aria-label="Dialog schließen" onClick={onClose}>×</button></div><div className={s.dialogBody}>{children}</div>{actions && <EHActions>{actions}</EHActions>}</dialog>;
}
export function EHEmptyState({title, text, action}: {title: string; text: string; action?: ReactNode}) {
  return <div className={s.emptyState}><EHHeading as="h2" scale="item">{title}</EHHeading><EHText>{text}</EHText>{action && <EHActions>{action}</EHActions>}</div>;
}
export function EHLoadingState({label = "Wird geladen …"}: {label?: string}) {return <div className={s.loading} role="status"><span aria-hidden="true"/>{label}</div>;}
export function EHErrorState({title = "Das hat noch nicht geklappt.", text, onRetry}: {title?: string; text: string; onRetry?: ()=>void}) {
  return <div className={s.errorState} role="alert"><EHHeading as="h2" scale="item">{title}</EHHeading><EHText>{text}</EHText>{onRetry && <EHButton onClick={onRetry} variant="secondary">Erneut versuchen</EHButton>}</div>;
}
export function EHDataTable({caption, columns, rows}: {caption: string; columns: {key: string; label: string; numeric?: boolean}[]; rows: {id: string; cells: Record<string,ReactNode>}[]}) {
  return <div className={s.tableScroll} role="region" aria-label={caption} tabIndex={0}><table className={s.table}><caption>{caption}</caption><thead><tr>{columns.map(c=><th scope="col" key={c.key} data-numeric={c.numeric || undefined}>{c.label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}>{columns.map((c,i)=>i===0 ? <th key={c.key} scope="row">{row.cells[c.key]}</th> : <td key={c.key} data-numeric={c.numeric || undefined}>{row.cells[c.key]}</td>)}</tr>)}</tbody></table>{!rows.length && <EHText>Keine Einträge vorhanden.</EHText>}</div>;
}
export function EHList({items, label}: {label: string; items: {id: string; title: string; text?: string; href?: string; meta?: ReactNode; action?: ReactNode}[]}) {
  return <ul className={s.list} aria-label={label}>{items.map(item=><li key={item.id}><div>{item.href ? <a href={item.href} className={s.listTitle}>{item.title}</a> : <span className={s.listTitle}>{item.title}</span>}{item.text && <EHText>{item.text}</EHText>}</div><div className={s.listMeta}>{item.meta}{item.action}</div></li>)}</ul>;
}
export function EHComposer({onSubmit, pending = false, error, label = "Was steht bei deinem Haus an?", hint = "Beschreibe dein Anliegen. Du entscheidest anschließend über den nächsten Schritt.", submitLabel = "Anliegen weitergeben"}: {onSubmit: (text:string)=>void | Promise<void>; pending?: boolean; error?: string; label?: string; hint?: string; submitLabel?: string}) {
  const id=useId(); const [value,setValue]=useState(""); const [localError,setLocalError]=useState(""); const [submitting,setSubmitting]=useState(false); const busy=pending||submitting;
  async function submit(event:FormEvent<HTMLFormElement>) {event.preventDefault();if(!value.trim()) {setLocalError("Bitte beschreibe dein Anliegen.");return;}setLocalError(""); if(busy)return; setSubmitting(true); try {await onSubmit(value.trim());} catch {setLocalError("Dein Anliegen konnte noch nicht übermittelt werden. Bitte versuche es erneut.");} finally {setSubmitting(false);}}
  const issue=error || localError;
  return <form className={s.composer} onSubmit={submit}><EHField id={id} label={label} hint={hint} error={issue} required><EHTextarea id={id} name="anliegen" value={value} onChange={e=>setValue(e.target.value)} required disabled={busy} maxLength={5000} aria-invalid={Boolean(issue)} aria-describedby={[id+"-hint",issue ? id+"-error" : ""].filter(Boolean).join(" ")}/></EHField><EHActions><EHButton type="submit" disabled={busy} arrow>{busy ? "Wird übermittelt …" : submitLabel}</EHButton></EHActions></form>;
}
export type EHDocument = {id: string; title: string; category: string; date: string; href: string};
export function EHDocumentList({documents}: {documents: EHDocument[]}) {
  const id=useId(); const [query,setQuery]=useState("");const needle=query.trim().toLocaleLowerCase("de");
  const found=documents.filter(d=>(d.title+" "+d.category).toLocaleLowerCase("de").includes(needle));
  return <div className={s.documentList}><EHField id={id} label="Dokumente suchen"><EHInput id={id} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Titel oder Kategorie"/></EHField><p className={s.fieldHint} role="status">{found.length} {found.length===1 ? "Dokument" : "Dokumente"}</p>{found.length ? <EHList label="Dokumente" items={found.map(d=>({...d,text:d.category,meta:<EHStatus>{d.date}</EHStatus>}))}/> : <EHEmptyState title="Keine passenden Dokumente" text="Versuche einen anderen Suchbegriff."/>}</div>;
}
