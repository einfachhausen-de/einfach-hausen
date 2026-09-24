import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import s from "./styles.module.css";

export type EHTone = "paper" | "white" | "sand" | "deep";
type Children = { children: ReactNode };
export function EHScope({children, app = false}: Children & {app?: boolean}) {
  return <div className={s.scope} data-eh-app={app || undefined}>{children}</div>;
}
export function EHLogo({src = "/brand/logo-full.png", href = "/", label = "einfachhausen – Startseite"}: {src?: string; href?: string; label?: string}) {
  const logo = <img src={src} alt="einfachhausen" width={150} height={95} className={s.logo} />;
  return <a className={s.logoLink} href={href} aria-label={label}>{logo}</a>;
}
export function EHContainer({children, narrow = false}: Children & {narrow?: boolean}) {
  return <div className={narrow ? s.narrow : s.container}>{children}</div>;
}
export function EHSection({children, tone = "paper", id, compact = false}: Children & {tone?: EHTone; id?: string; compact?: boolean}) {
  return <section id={id} className={s.section} data-tone={tone} data-compact={compact || undefined}><EHContainer>{children}</EHContainer></section>;
}
export function EHEyebrow({children, number}: Children & {number?: string}) {
  return <p className={s.eyebrow}>{number && <span className={s.register}>{number}</span>}{children}</p>;
}
export function EHHeading({children, as: Tag = "h2", scale = "section"}: Children & {as?: "h1" | "h2" | "h3" | "h4"; scale?: "display" | "page" | "section" | "app" | "item"}) {
  return <Tag className={s.heading} data-scale={scale}>{children}</Tag>;
}
export function EHText({children, size = "body", muted = false}: Children & {size?: "body" | "lead" | "meta"; muted?: boolean}) {
  return <p className={s.text} data-size={size} data-muted={muted || undefined}>{children}</p>;
}
type ButtonVisual = {children: ReactNode; variant?: "primary" | "secondary" | "quiet" | "on-dark" | "danger" | "outline"; size?: "regular" | "small"; arrow?: boolean};
type ButtonNative = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style" | "className" | "children">;
type AnchorNative = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "style" | "className" | "children" | "href">;
export type EHButtonProps = ButtonVisual & ((ButtonNative & {href?: never}) | (AnchorNative & {href: string}));
export function EHButton(props: EHButtonProps) {
  const {children, variant = "primary", size = "regular", arrow = false, ...native} = props;
  const content = <>{children}{arrow && <span aria-hidden="true">↗</span>}</>;
  const shared = {className: s.button, "data-variant": variant, "data-size": size};
  return typeof native.href === "string"
    ? <a {...native as AnchorNative & {href: string}} {...shared}>{content}</a>
    : <button type="button" {...native as ButtonNative} {...shared}>{content}</button>;
}
export function EHTextLink({href, children}: Children & {href: string}) {
  return <a href={href} className={s.textLink}>{children}<span aria-hidden="true"> ↗</span></a>;
}
export function EHActions({children}: Children) {return <div className={s.actions}>{children}</div>;}
export function EHImageFrame({src, alt, caption, portrait = false, priority = false}: {src: string; alt: string; caption?: ReactNode; portrait?: boolean; priority?: boolean}) {
  return <figure className={s.figure}><div className={s.imageCut} data-portrait={portrait || undefined}><img src={src} alt={alt} loading={priority ? "eager" : "lazy"} /></div>{caption && <figcaption>{caption}</figcaption>}</figure>;
}
export function EHRecordCover({eyebrow = "Deine Hausakte", title, subtitle, number = "01", children}: {eyebrow?: string; title: ReactNode; subtitle?: string; number?: string; children?: ReactNode}) {
  return <div className={s.recordCover}><EHEyebrow number={number}>{eyebrow}</EHEyebrow><EHHeading as="h2" scale="section">{title}</EHHeading>{subtitle && <EHText>{subtitle}</EHText>}{children && <div className={s.coverBody}>{children}</div>}<div className={s.coverFoot}><span>einfachhausen</span><span>Alles an seinem Platz.</span></div></div>;
}
export function EHStatus({children, tone = "neutral"}: Children & {tone?: "neutral" | "info" | "success" | "warning" | "error"}) {
  return <span className={s.status} data-status={tone}>{children}</span>;
}
export function EHDivider() {return <hr className={s.divider} />;}
