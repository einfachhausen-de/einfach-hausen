import type { ComponentProps, ReactNode } from 'react';
import { EHMetricsBar, EHOwnerSection } from '@/design-system';

type Verweis = { href: string; label: string };

/**
 * Werkbank-Bausteine fuer Owner- und Betriebsseiten (DESIGN.md §14, Richtung A).
 * Gleiche Props wie die frueheren Dokument-Bausteine, damit jede Seite
 * ohne Datenumbau in dieselbe Komposition wie /app, /app/jobs und
 * /app/calendar wechselt: ein Werkbank-Kopf statt Dokumentkopf,
 * Registerabschnitte statt Karten, Kontextspalte statt Kachelraster.
 */
export function WerkbankKopf({ title, context, actions }: { title: string; context?: string; actions?: ReactNode }) {
  return (
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>{title}</h1>
        {context && <span>{context}</span>}
      </div>
      {actions && <div className="eh-werkbank-kopf-tools">{actions}</div>}
    </header>
  );
}

export function WerkbankAbschnitt({ title, children, link }: { title: string; children: ReactNode; link?: Verweis }) {
  return (
    <EHOwnerSection title={title} action={link}>
      <div className="eh-werkbank-abschnitt">{children}</div>
    </EHOwnerSection>
  );
}

export function WerkbankPanel({ title, label, children, footer }: { title?: string; label?: string; children: ReactNode; footer?: { href: string; text: string } }) {
  const heading = title || label;
  if (!heading) {
    return (
      <section className="eh-werkbank-abschnitt">
        {children}
        {footer && <a className="eh-werkbank-abschnitt-link" href={footer.href}>{footer.text}<span aria-hidden="true"> →</span></a>}
      </section>
    );
  }
  return (
    <EHOwnerSection title={heading} action={footer ? { href: footer.href, label: footer.text } : undefined}>
      <div className="eh-werkbank-abschnitt">{children}</div>
    </EHOwnerSection>
  );
}

/** Hauptspalte plus Kontextspalte. Unter 1100px untereinander, Aufgabe zuerst. */
export function WerkbankRaster({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="eh-werkbank-raster">
      <div className="eh-werkbank-raster-haupt">{main}</div>
      <aside className="eh-werkbank-raster-seite" aria-label="Kontext dieser Seite">{aside}</aside>
    </div>
  );
}

export function WerkbankKennzahlen(props: ComponentProps<typeof EHMetricsBar>) {
  return (
    <div className="eh-werkbank-kennzahlen">
      <EHMetricsBar {...props} />
    </div>
  );
}
