import type { ReactNode } from 'react';
import '@/components/werkbank-layout.css';

/**
 * EHPromoBanner — das Werbebanner-Muster aus der Vertrags-Hausakte (24.09.,
 * Betreiber-Liebling): dunkler Markenverlauf, Kicker + Claim, ein Primär-CTA
 * und bis zu drei Direktwege. Ueberall einsetzbar, wo eine Seite jemanden
 * einladen soll, ohne zu schreien.
 *
 * Anmerkung Designkern: packages/eh-design ist versiegelt (design-lock.json);
 * laut DESIGN.md darf ein Agent den Kern nicht selbst neu versiegeln. Dieses
 * Modul liegt bewusst im anwendbaren Layer und nutzt dieselben Tokens —
 * eine formale Aufnahme in den Kern erfolgt nur nach expliziter Freigabe
 * des Eigentuemmers ("Brand authority").
 */
export function EHPromoBanner({
  kicker, icon, title, text, primary, links,
}: {
  kicker?: string;
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  primary: { href: string; label: string };
  links?: { href: string; label: string }[];
}) {
  return (
    <aside className="eh-promo" aria-label={kicker ?? 'Angebot'}>
      <div className="eh-promo-text">
        {kicker && <span className="eh-promo-kicker">{icon}{kicker}</span>}
        <strong>{title}</strong>
        {text && <p>{text}</p>}
      </div>
      <div className="eh-promo-cta">
        <a className="eh-promo-button" href={primary.href}>{primary.label}</a>
        {links && links.length > 0 && (
          <nav className="eh-promo-links" aria-label="Direkt zu einem Schritt">
            {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
        )}
      </div>
    </aside>
  );
}
