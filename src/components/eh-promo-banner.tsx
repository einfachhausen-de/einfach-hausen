import type { ReactNode } from 'react';
import '@/components/werkbank-layout.css';

/**
 * EHPromoBanner — der redaktionelle Einlade-Karton der Werkbank: weiße
 * Fläche, Haarlinie mit Petrol-Kante (wie .eh-vdash-fokus), Eyebrow-Zeile,
 * kompakte Überschrift in Überschriftenskala, ein Primär-Button in
 * Systemsprache und die Direktwege als ruhige Trennstrich-Leiste.
 * Kein Rabattbanner: ein eindeutiger nächster Schritt, keine Farbexplosion.
 *
 * Anmerkung Designkern: packages/eh-design ist versiegelt; laut DESIGN.md
 * darf ein Agent den Kern nicht selbst nachversiegeln. Das Modul liegt im
 * anwendbaren Layer und führt ausschließlich Design-Token.
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
    <aside className="eh-promo" aria-label={kicker ?? 'Hinweis'}>
      <div className="eh-promo-text">
        {kicker && <span className="eh-promo-kicker">{icon}{kicker}</span>}
        <p className="eh-promo-title">{title}</p>
        {text && <p className="eh-promo-sub">{text}</p>}
        {links && links.length > 0 && (
          <nav className="eh-promo-links" aria-label="Direkt zu einem Schritt">
            {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
        )}
      </div>
      <a className="eh-promo-button" href={primary.href}>{primary.label}</a>
    </aside>
  );
}
