import localFont from 'next/font/local';
import { IntakeForm } from '@/components/home/intake-form';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { SmoothScroll } from './motion';
import './tokens.css';
import styles from './mkt.module.css';

// Self-hosted Inter Variable (DESIGN.md: "System-/Inter-nahe Sans"), scoped to
// the marketing shell so the accepted app screens stay untouched.
const interVariable = localFont({
  src: '../../fonts/InterVariable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-marketing',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

/**
 * Chrome der Unterseiten. Kopf- und Fußzeile sind dieselben wie auf der Startseite
 * (src/components/site/site-header.tsx mit dem Leistungen-Megamenü „Was steht bei dir an?“,
 * „Noch nicht sicher, was du brauchst?“ → /#anliegen, Beratung, Notfall, Alle Leistungen;
 * src/components/site/site-footer.tsx mit Blog, Lexikon, Sicherheit). Der Inhalt behält
 * seine bestehenden Bausteine.
 */
export function MarketingShell({ children, footerIntake = true }: { children: React.ReactNode; footerIntake?: boolean }) {
  // Header und Footer liegen bewusst außerhalb von .site: dessen ungeschichtete
  // Link-Regel würde sonst die Tailwind-Farben der gemeinsamen Chrome überstimmen.
  return (
    <div className="min-h-screen bg-white font-sans text-ink antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Zum Inhalt springen
      </a>
      <SiteHeader />
      <div className={`mkt ${styles.site} ${interVariable.variable}`}>
        <SmoothScroll />
        <main id="main-content">{children}</main>
        {footerIntake && (
          <section aria-labelledby="footer-intake-title" className={`${styles.footer} ${styles.onDark}`}>
            <div className={styles.footerIntake}>
              <div className={styles.footerIntakeInner}>
                <h2 id="footer-intake-title">Noch nicht gestartet? Sag uns einfach, was ansteht.</h2>
                <IntakeForm variant="band" />
              </div>
            </div>
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
