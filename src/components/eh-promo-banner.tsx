import type { ReactNode } from 'react';
import '@/components/werkbank-layout.css';

/**
 * EHPromoBanner — der redaktionelle Einlade-Karton der Werkbank: weiße
 * Fläche, Haarlinie mit Petrol-Kante (wie .eh-vdash-fokus), Eyebrow-Zeile,
 * kompakte Überschrift in Überschriftenskala. Die Aktionsspalte compose
 * der Aufrufer als Kinder (z.B. Vertrag-anlegen-Menue + Vergleichs-Button) —
 * das Banner selbst ist nur Bühne, kein Knopf.
 *
 * Anmerkung Designkern: packages/eh-design ist versiegelt; laut DESIGN.md
 * darf ein Agent den Kern nicht selbst nachversiegeln. Das Modul liegt im
 * anwendbaren Layer und führt ausschließlich Design-Token.
 */
export function EHPromoBanner({
  kicker, icon, title, text, children,
}: {
  kicker?: string;
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <aside className="eh-promo" aria-label={kicker ?? 'Hinweis'}>
      <div className="eh-promo-text">
        {kicker && <span className="eh-promo-kicker">{icon}{kicker}</span>}
        <p className="eh-promo-title">{title}</p>
        {text && <p className="eh-promo-sub">{text}</p>}
      </div>
      {children && <div className="eh-promo-cta">{children}</div>}
    </aside>
  );
}
