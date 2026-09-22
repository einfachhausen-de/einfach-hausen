/** Compatibility adapters. Public signatures stay stable; styling belongs to @einfachhausen/design. */
import {Check, CircleCheck} from "lucide-react";
import {EHPageHero, EHSection, EHEyebrow, EHHeading, EHText, EHButton, EHTextLink, EHFeatureRows, EHSteps, EHFAQ, EHTimeline, EHFacts, EHPanel, EHProse, EHCallout, EHActions, EHSectionHeading, EHProcess, EHEditorialStatement} from "@/design-system";
import styles from "./mkt.module.css";
export {styles as mkt};
type Tone = "plain" | "canvas" | "surface" | "soft" | "sand" | "dark" | "green";
const tones = {plain:"paper",canvas:"paper",surface:"white",soft:"paper",sand:"sand",dark:"deep",green:"deep"} as const;
export function Eyebrow({children}: {children: React.ReactNode; terra?:boolean}) {return <EHEyebrow>{children}</EHEyebrow>;}
export function Container({children,className=""}: {children:React.ReactNode;className?:string}) {return <div className={`${styles.container} ${className}`}>{children}</div>;}
export function PageHero({eyebrow,title,text,actions,aside}: {eyebrow:string;title:string;text:string;actions?:React.ReactNode;aside?:React.ReactNode;terra?:boolean}) {
  return <EHPageHero {...{eyebrow,title,text,actions}} media={aside}/>;
}
export function Section({eyebrow,title,text,children,tone="plain",tight=false,center=false,id}: {eyebrow?:string;title?:string;text?:string;children:React.ReactNode;tone?:Tone;tight?:boolean;center?:boolean;id?:string}) {
  return <EHSection id={id} tone={tones[tone]} compact={tight}>{(eyebrow || title || text) && <EHSectionHeading {...{eyebrow,title,text,center}}/>}{children}</EHSection>;
}
export function CardGrid({children,cols=3}: {children:React.ReactNode;cols?:2|3|4}) {return <div className={styles.cardGrid} data-cols={cols}>{children}</div>;}
export function Card({icon,title,text,tone="surface",children}: {icon?:React.ReactNode;title:string;text?:string;tone?:"surface"|"sand"|"soft"|"dark";children?:React.ReactNode}) {
  const body=<>{icon && <span className={styles.cardIcon} aria-hidden="true">{icon}</span>}{text && <EHText>{text}</EHText>}{children}</>;
  return tone==="dark" || tone==="sand" ? <EHCallout title={title} tone={tone==="dark"?"deep":"paper"}>{body}</EHCallout> : <EHPanel title={title}>{body}</EHPanel>;
}
export function FeatureGrid({items}: {items:ReadonlyArray<{icon:React.ReactNode;title:string;text:string}>;cols?:2|3|4}) {return <EHFeatureRows items={[...items]}/>;}
export function Statement({kicker,tone="sand",children}: {kicker:string;tone?:Tone;children:React.ReactNode}) {return <EHEditorialStatement eyebrow={kicker} tone={tones[tone]}>{children}</EHEditorialStatement>;}
export function Numbered({items}: {items:ReadonlyArray<{title:string;text:string}>;tone?:Tone}) {return <EHFeatureRows items={[...items]}/>;}
export function Steps({items}: {items:ReadonlyArray<{title:string;text:string;visual?:React.ReactNode}>}) {return items.some(item=>item.visual) ? <EHProcess items={items.map(item=>({title:item.title,text:item.text,media:item.visual}))}/> : <EHSteps items={[...items]}/>;}
export function Split({children}: {children:React.ReactNode}) {return <div className={styles.split}>{children}</div>;}
type ButtonVariant = "primary" | "ghost" | "terra" | "onDark" | "ghostOnDark";
const buttonVariants = {primary:"primary",ghost:"secondary",terra:"primary",onDark:"on-dark",ghostOnDark:"quiet"} as const;
export function LinkButton({href,children,secondary=false,variant,size,arrow}: {href:string;children:React.ReactNode;secondary?:boolean;variant?:ButtonVariant;size?:"sm"|"lg";arrow?:boolean}) {
  const v=variant ?? (secondary ? "ghost":"primary");
  return <EHButton href={href} variant={buttonVariants[v]} size={size==="sm"?"small":"regular"} arrow={arrow ?? ["primary","onDark","terra"].includes(v)}>{children}</EHButton>;
}
export function TextLink({href,children}: {href:string;children:React.ReactNode}) {return <EHTextLink href={href}>{children}</EHTextLink>;}
export function BulletList({items}: {items:readonly string[]}) {return <ul className={styles.bulletList}>{items.map(item=><li key={item}><span aria-hidden="true"><Check size={16}/></span>{item}</li>)}</ul>;}
export function InfoPanel({children,label}: {children:React.ReactNode;label?:string}) {return <EHPanel label={label}>{children}</EHPanel>;}
export function ProofRow({items,className=""}: {items?:readonly string[];className?:string}) {
  const list=items ?? ["Hauskonto kostenlos","kein Auftrag ohne deine Entscheidung","geprüfte Partner aus deiner Region"];
  return <div className={`${styles.proofRow} ${className}`}>{list.map(item=><span key={item}><CircleCheck size={16} aria-hidden="true"/>{item}</span>)}</div>;
}
export function Facts({items}: {items:ReadonlyArray<{value:string;label:string}>}) {return <EHFacts items={[...items]}/>;}
export function Testimonials({items}: {items:ReadonlyArray<{quote:string;name:string;meta:string}>}) {
  return <div className={styles.cardGrid} data-cols={items.length>=3?3:2}>{items.map(t=><blockquote className={styles.testimonial} key={t.name}><EHText size="lead">„{t.quote}“</EHText><footer><strong>{t.name}</strong><EHText size="meta">{t.meta}</EHText></footer></blockquote>)}</div>;
}
export function Faq({items}: {items:ReadonlyArray<{q:string;a:React.ReactNode}>}) {return <EHFAQ items={[...items]}/>;}
export function Timeline({items}: {items:ReadonlyArray<{when:string;title:string;text:string}>}) {return <EHTimeline items={[...items]}/>;}
export function CtaBand({title,text,href="/register?role=homeowner",label="Hauskonto kostenlos anlegen",secondaryHref="/#anliegen",secondaryLabel="Anliegen starten"}: {title:string;text:string;href?:string;label?:string;secondaryHref?:string;secondaryLabel?:string}) {
  return <EHSection tone="deep"><div className={styles.sectionHead}><EHEyebrow>Dein Haus. Einfach geregelt.</EHEyebrow><EHHeading>{title}</EHHeading><EHText size="lead">{text}</EHText><ProofRow/><EHActions><LinkButton href={href} variant="onDark">{label}</LinkButton><LinkButton href={secondaryHref} variant="ghostOnDark">{secondaryLabel}</LinkButton></EHActions></div></EHSection>;
}
export function LegalNotice({title,children}: {title:string;children:React.ReactNode}) {return <EHCallout title={title}>{children}</EHCallout>;}
export function Prose({children}: {children:React.ReactNode}) {return <EHProse>{children}</EHProse>;}
