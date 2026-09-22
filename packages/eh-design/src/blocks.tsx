import type { ReactNode } from "react";
import {Check, ChevronDown, RotateCw, X} from "lucide-react";
import {EHSection, EHHeading, EHText, EHEyebrow, EHButton, EHTextLink, EHActions, EHImageFrame, type EHTone} from "./primitives";
import s from "./styles.module.css";
export type EHItem = {title: string; text?: ReactNode; icon?: ReactNode};
export type EHLink = {title: string; href: string; text?: string; label?: string};
export function EHPageHero({eyebrow, number, title, text, actions, media, display = false, tone = "paper"}: {eyebrow?: string; number?: string; title: ReactNode; text?: ReactNode; actions?: ReactNode; media?: ReactNode; display?: boolean; tone?: EHTone}) {
  return <EHSection tone={tone}><div className={s.hero} data-has-media={Boolean(media)}><div className={s.heroCopy}>{eyebrow && <EHEyebrow number={number}>{eyebrow}</EHEyebrow>}<EHHeading as="h1" scale={display ? "display" : "page"}>{title}</EHHeading>{text && <EHText size="lead">{text}</EHText>}{actions && <EHActions>{actions}</EHActions>}</div>{media && <div className={s.heroMedia}>{media}</div>}</div></EHSection>;
}
export function EHPromiseRow({items}: {items: EHItem[]}) {
  return <ol className={s.promiseRow}>{items.map((item,i)=><li key={item.title}><EHEyebrow number={String(i+1).padStart(2,"0")}>Einfachhausen</EHEyebrow><EHHeading as="h3" scale="item">{item.title}</EHHeading>{item.text && <div className={s.text}>{item.text}</div>}</li>)}</ol>;
}
export function EHFeatureRows({items}: {items: EHItem[]}) {
  return <ul className={s.featureRows}>{items.map((item,i)=><li key={item.title}><span className={s.rowNumber} aria-hidden="true">{String(i+1).padStart(2,"0")}</span><div><EHHeading as="h3" scale="item">{item.title}</EHHeading>{item.text && <div className={s.text}>{item.text}</div>}</div>{item.icon && <span className={s.featureIcon} aria-hidden="true">{item.icon}</span>}</li>)}</ul>;
}
export function EHSplitStory({eyebrow, title, text, media, children, reverse = false}: {eyebrow?: string; title: ReactNode; text?: ReactNode; media: ReactNode; children?: ReactNode; reverse?: boolean}) {
  return <div className={s.split} data-reverse={reverse || undefined}><div className={s.storyCopy}>{eyebrow && <EHEyebrow>{eyebrow}</EHEyebrow>}<EHHeading>{title}</EHHeading>{text && <EHText size="lead">{text}</EHText>}{children}</div><div className={s.storyMedia}>{media}</div></div>;
}
export function EHSteps({items}: {items: EHItem[]}) {
  return <ol className={s.steps}>{items.map((item,i)=><li key={item.title}><span className={s.stepNumber}>{String(i+1).padStart(2,"0")}</span><div><EHHeading as="h3" scale="item">{item.title}</EHHeading>{item.text && <div className={s.text}>{item.text}</div>}</div></li>)}</ol>;
}
export function EHTimeline({items}: {items: {when: string; title: string; text?: ReactNode; current?: boolean}[]}) {
  return <ol className={s.timeline}>{items.map((item,i)=><li key={i} aria-current={item.current ? "step" : undefined}><span className={s.timelineDate}>{item.when}</span><div><EHHeading as="h3" scale="item">{item.title}</EHHeading>{item.text && <div className={s.text}>{item.text}</div>}</div></li>)}</ol>;
}
export type EHActivityState = "done" | "running" | "failed" | "pending";
export type EHActivityStep = {
  key: string; label: string; state: EHActivityState; meta?: string; details?: string[];
  /** Wiederholung gehoert in eine Client-Komponente: der Knopf loest den Aufruf erneut aus. */
  retry?: {label: string; onClick: () => void};
};
const ACTIVITY_STATE: Record<EHActivityState, string> = {done: "Erledigt", running: "Laeuft", failed: "Fehlgeschlagen", pending: "Offen"};
/**
 * Ablauf mit Zustand: eine Zeile je Schritt, der Zustand reist in `data-stand`,
 * die Details klappen nativ auf (`<details>`, kein Skript, kein Zustand in der
 * Klasse). Ein Fehler mit `retry` bleibt offen, damit Ursache und Wiederholung
 * sofort sichtbar sind. Der Inhalt kommt fertig vom Aufrufer: hier wird nichts
 * erfunden, nur gezeigt.
 */
export function EHActivity({steps, title, label}: {steps: EHActivityStep[]; title?: string; label?: string}) {
  if (!steps.length) return null;
  return <div className={s.activity} role="group" aria-label={label}>
    {title && <EHText size="meta" muted>{title}</EHText>}
    <ol className={s.activityList}>{steps.map((step, index) => {
      const kopf = <>
        <span className={s.activityMark} role="img" aria-label={ACTIVITY_STATE[step.state]}>{step.state === "done" ? <Check size={14} /> : step.state === "failed" ? <X size={14} /> : index + 1}</span>
        <span className={s.activityLabel}>{step.label}</span>
        {step.meta && <span className={s.activityMeta}>{step.meta}</span>}
      </>;
      const details = step.details?.length ? <ul className={s.activityDetails}>{step.details.map((zeile, i) => <li key={i}>{zeile}</li>)}</ul> : null;
      return <li key={step.key} data-stand={step.state} aria-current={step.state === "running" ? "step" : undefined}>
        {details && !step.retry
          ? <details className={s.activityRow}><summary className={s.activityHead}>{kopf}<ChevronDown className={s.activityChevron} size={16} aria-hidden="true" /></summary>{details}</details>
          : <div className={s.activityRow}><div className={s.activityHead}>{kopf}</div>{details}
              {step.retry && <div className={s.activityAction}><button type="button" className={s.activityRetry} onClick={step.retry.onClick}><RotateCw size={14} aria-hidden="true" />{step.retry.label}</button></div>}
            </div>}
      </li>;
    })}</ol>
  </div>;
}
export function EHFacts({items}: {items: {value: ReactNode; label: string; source?: string}[]}) {
  return <dl className={s.facts}>{items.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd>{item.source && <dd className={s.factSource}>{item.source}</dd>}</div>)}</dl>;
}
export function EHComparison({left, right}: {left: {title: string; items: string[]}; right: {title: string; items: string[]}}) {
  return <div className={s.comparison}>{[left,right].map((part,i)=><div key={part.title} data-emphasis={i===1}><EHEyebrow number={String(i+1).padStart(2,"0")}>Im Vergleich</EHEyebrow><EHHeading as="h3" scale="item">{part.title}</EHHeading><ul>{part.items.map(item=><li key={item}>{item}</li>)}</ul></div>)}</div>;
}
export function EHFAQ({items}: {items: {q: string; a: ReactNode}[]}) {
  return <div className={s.faq}>{items.map(item=><details key={item.q}><summary>{item.q}<span aria-hidden="true">+</span></summary><div>{item.a}</div></details>)}</div>;
}
export function EHCallout({title, children, tone = "paper"}: {title: string; children: ReactNode; tone?: "paper" | "deep"}) {
  return <aside className={s.callout} data-tone={tone}><EHHeading as="h3" scale="item">{title}</EHHeading><div className={s.calloutBody}>{children}</div></aside>;
}
export function EHClosing({title, text, href, label = "Anliegen besprechen", secondary}: {title: ReactNode; text?: string; href?: string; label?: string; secondary?: ReactNode}) {
  return <EHSection tone="deep"><div className={s.closing}><EHEyebrow number="EH">Dein Haus. Einfach geregelt.</EHEyebrow><EHHeading>{title}</EHHeading>{text && <EHText size="lead">{text}</EHText>}<EHActions>{href && <EHButton href={href} variant="on-dark" arrow>{label}</EHButton>}{secondary}</EHActions></div></EHSection>;
}
export function EHProse({children}: {children: ReactNode}) {return <div className={s.prose}>{children}</div>;}
export function EHArticleHeader({category, title, description, author, date, readingTime}: {category: string; title: string; description?: string; author?: string; date?: string; readingTime?: string}) {
  return <header className={s.articleHeader}><EHEyebrow>{category}</EHEyebrow><EHHeading as="h1" scale="page">{title}</EHHeading>{description && <EHText size="lead">{description}</EHText>}<div className={s.articleMeta}>{[author,date,readingTime].filter(Boolean).map(item=><span key={item}>{item}</span>)}</div></header>;
}
export function EHContents({items, title = "Auf dieser Seite"}: {items: {id: string; title: string}[]; title?: string}) {
  return <nav className={s.contents} aria-label={title}><EHEyebrow>{title}</EHEyebrow><ol>{items.map((item,i)=><li key={item.id}><a href={"#"+item.id}><span>{String(i+1).padStart(2,"0")}</span>{item.title}</a></li>)}</ol></nav>;
}
export function EHRelated({items, title = "Das könnte dich auch interessieren"}: {items: EHLink[]; title?: string}) {
  return <div className={s.related}><EHHeading>{title}</EHHeading><EHServiceIndex items={items}/></div>;
}
export function EHServiceIndex({items}: {items: EHLink[]}) {
  return <ul className={s.serviceIndex}>{items.map((item,i)=><li key={item.href}><a href={item.href}><span className={s.rowNumber}>{String(i+1).padStart(2,"0")}</span><div>{item.label && <EHEyebrow>{item.label}</EHEyebrow>}<EHHeading as="h3" scale="item">{item.title}</EHHeading>{item.text && <div className={s.text}>{item.text}</div>}</div><span aria-hidden="true">↗</span></a></li>)}</ul>;
}
export function EHPricing({plans, note}: {plans: {name: string; price: string; period?: string; text: string; features: string[]; href: string; action: string; recommended?: boolean}[]; note?: string}) {
  return <div><div className={s.pricing}>{plans.map(plan=><section key={plan.name} className={s.pricePlan} data-recommended={plan.recommended || undefined}><EHEyebrow>{plan.recommended ? "Unsere Empfehlung" : "Dein Umfang"}</EHEyebrow><EHHeading as="h3" scale="item">{plan.name}</EHHeading><p className={s.price}>{plan.price}<span>{plan.period}</span></p><EHText>{plan.text}</EHText><ul>{plan.features.map(f=><li key={f}>{f}</li>)}</ul><EHButton href={plan.href} arrow>{plan.action}</EHButton></section>)}</div>{note && <EHText size="meta">{note}</EHText>}</div>;
}
export function EHMediaStory({src, alt, caption, title, text}: {src: string; alt: string; caption?: string; title: string; text: string}) {
  return <EHSplitStory title={title} text={text} media={<EHImageFrame src={src} alt={alt} caption={caption}/>}/>;
}
export function EHArticleLayout({contents, children}: {contents: {id: string; title: string}[]; children: ReactNode}) {
  return <div className={s.articleLayout}><EHContents items={contents}/><EHProse>{children}</EHProse></div>;
}
export function EHPanel({title, label, children, footer}: {title?: string; label?: string; children: ReactNode; footer?: {href: string; text: string}}) {
  return <section className={s.panel}>{label && <EHEyebrow>{label}</EHEyebrow>}{title && <EHHeading as="h2" scale="item">{title}</EHHeading>}<div className={s.panelBody}>{children}</div>{footer && <EHTextLink href={footer.href}>{footer.text}</EHTextLink>}</section>;
}
