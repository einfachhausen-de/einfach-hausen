import type { ReactNode } from 'react';
import '@/components/werkbank-layout.css';

/**
 * EHPromoBanner — die ruhige Aktionszeile der Werkbank: ein Satz links,
 * die Knöpfe rechts, eine Haarlinie rum. Kein Eyebrow, kein Claim, kein
 * Versprechen-Absatz — die v2 (Betreiber 24.09.: "sieht zu sehr nach KI-
 * Generierung aus") streicht die Marketing-Grammatik auf ein Zeilenmaß.
 * Die Aktionsspalte composed der Aufrufer (z.B. das Anlage-Menue).
 *
 * Anmerkung Designkern: packages/eh-design ist versiegelt; laut DESIGN.md
 * darf ein Agent den Kern nicht selbst nachversiegeln. Das Modul liegt im
 * anwendbaren Layer und führt ausschließlich Design-Token.
 */
export function EHPromoBanner({
  title, text, children,
}: {
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <aside className="eh-promo" aria-label="Aktionen">
      <p className="eh-promo-line">
        <strong>{title}</strong>
        {text && <span>{text}</span>}
      </p>
      {children && <div className="eh-promo-cta">{children}</div>}
    </aside>
  );
}
