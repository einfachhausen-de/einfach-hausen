import { ArrowRight, Database, Handshake, Menu, ShieldCheck, X } from 'lucide-react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { ScrollShadow, SmoothScroll } from './motion';
import styles from './marketing.module.css';
// Static imports: content-hashed URLs, immune to optimizer cache staleness.
import logoMark from './assets/logo-mark.png';

// Self-hosted Inter Variable: the public website shares the crisp, neutral
// grotesque look of the app surfaces (DESIGN.md: "System-/Inter-nahe Sans").
// Scoped to the marketing shell so the accepted app screens stay untouched.
const interVariable = localFont({
  src: '../../fonts/InterVariable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-marketing',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

const primary = [
  ["So funktioniert's", '/so-funktionierts'],
  ['Leistungen', '/leistungen'],
  ['Hausakte', '/hausakte'],
  ['Für Betriebe', '/partner'],
  ['Preise', '/preise'],
] as const;

const mobileMore = [
  ['Für Eigenheimbesitzer', '/eigenheimbesitzer'],
  ['Über uns', '/ueber-uns'],
  ['Hilfe', '/hilfe'],
  ['Kontakt', '/kontakt'],
  ['Sicherheit', '/sicherheit'],
] as const;

const footerGroups = [
  {
    title: 'Für Eigenheimbesitzer',
    links: [
      ["So funktioniert's", '/so-funktionierts'],
      ['Leistungen', '/leistungen'],
      ['Digitale Hausakte', '/hausakte'],
      ['Preise', '/preise'],
      ['Hilfe', '/hilfe'],
    ],
  },
  {
    title: 'Für Betriebe',
    links: [
      ['Partner werden', '/partner'],
      ['Partner-Modelle', '/preise'],
      ['Qualitätsmodell', '/partner'],
      ['Partner-Login', '/login'],
    ],
  },
  {
    title: 'Einfach Hausen',
    links: [
      ['Für Eigenheimbesitzer', '/eigenheimbesitzer'],
      ['Über uns', '/ueber-uns'],
      ['Kontakt', '/kontakt'],
      ['Sicherheit', '/sicherheit'],
      ['Hilfe & FAQ', '/hilfe'],
    ],
  },
  {
    title: 'Rechtliches',
    links: [
      ['Impressum', '/impressum'],
      ['Datenschutz', '/datenschutz'],
      ['AGB', '/agb'],
      ['Barrierefreiheit', '/barrierefreiheit'],
    ],
  },
] as const;

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.site} ${interVariable.variable}`}>
      <SmoothScroll />
      <a className={styles.skipLink} href="#main-content">Zum Inhalt springen</a>
      <ScrollShadow>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* Native navigation is intentional here to keep the public marketing shell hydration-free. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={styles.logoLink} href="/" aria-label="einfachhausen Startseite">
            <Image src={logoMark} alt="" width={36} height={27} priority className={styles.logoImg} />
            <span className={styles.logoWord}><b>einfach</b><span>hausen</span></span>
          </a>
          <nav className={styles.desktopNav} aria-label="Hauptnavigation">
            {primary.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className={styles.headerActions}>
            <a className={styles.loginLink} href="/login">Einloggen</a>
            <a className={styles.primaryButton} href="/register?role=homeowner">Kostenlos starten <ArrowRight size={16} /></a>
          </div>
          <details className={styles.mobileMenu}>
            <summary aria-label="Menü öffnen"><Menu className={styles.menuIcon} size={22} /><X className={styles.closeIcon} size={22} /></summary>
            <nav aria-label="Mobile Navigation">
              {[...primary, ...mobileMore].map(([label, href]) => <a key={href} href={href}>{label}</a>)}
              <div className={styles.mobileMenuActions}>
                <a className={styles.secondaryButton} href="/login">Einloggen</a>
                <a className={styles.primaryButton} href="/register?role=homeowner">Kostenlos starten</a>
              </div>
            </nav>
          </details>
        </div>
      </header>
      </ScrollShadow>
      <main id="main-content">{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerLead}>
          <div>
            <span>Einfach anfangen</span>
            <h2>Ein Haus. Ein Gedächtnis. Ein verlässlicher nächster Schritt.</h2>
          </div>
          <a href="/register?role=homeowner">Hauskonto erstellen <ArrowRight size={17} aria-hidden="true" /></a>
        </div>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className={styles.footerLogo} href="/" aria-label="einfachhausen Startseite">
              <Image src={logoMark} alt="" width={43} height={32} className={styles.logoImg} />
              <span><b>einfach</b>hausen</span>
            </a>
            <p>Eine Anlaufstelle für alles rund ums Eigenheim: Anliegen einordnen, passende Menschen finden, Aufträge organisieren und Hauswissen behalten.</p>
            <div className={styles.footerPrinciples}>
              <span><ShieldCheck size={17} aria-hidden="true" /> Du entscheidest</span>
              <span><Handshake size={17} aria-hidden="true" /> Geprüfte Partner</span>
              <span><Database size={17} aria-hidden="true" /> Hauswissen behalten</span>
            </div>
          </div>
          <div className={styles.footerGrid}>
            {footerGroups.map((group) => (
              <section key={group.title}>
                <h2>{group.title}</h2>
                <nav aria-label={group.title}>
                  {group.links.map(([label, href]) => <a key={`${group.title}-${href}-${label}`} href={href}>{label}</a>)}
                </nav>
              </section>
            ))}
          </div>
        </div>
        <div className={styles.trustBadges} aria-label="Vertrauensmerkmale">
          <span className={styles.trustBadge}><ShieldCheck size={15} aria-hidden="true" /> Geprüfte Vertragspartner</span>
          <span className={styles.trustBadge}><Database size={15} aria-hidden="true" /> DSGVO: Hosting in der EU</span>
          <span className={styles.trustBadge}><Handshake size={15} aria-hidden="true" /> Kein Lead-Handel</span>
          <span className={styles.trustBadge}><ShieldCheck size={15} aria-hidden="true" /> Kein Auftrag ohne deine Entscheidung</span>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2026 Einfach Hausen · Digital organisiert, durch eigenständige Partnerbetriebe ausgeführt.</p>
          <a href="/kontakt">Kontakt</a>
        </div>
      </footer>
    </div>
  );
}
