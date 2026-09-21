import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import localFont from 'next/font/local';
import { IntakeForm } from '@/components/home/intake-form';
import { ScrollShadow, SmoothScroll } from './motion';
import { SERVICE_CATEGORIES } from './service-catalog';
import './tokens.css';
import styles from './mkt.module.css';
import logoFull from './assets/logo-full.png';

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

const helpLinks = [
  ['Hilfe & FAQ', '/hilfe'],
  ['Sicherheit & Daten', '/sicherheit'],
  ['Blog', '/blog'],
  ['Lexikon', '/lexikon'],
  ['Kontakt', '/kontakt'],
] as const;

const mobileMore = [
  ['Für Eigenheimbesitzer', '/eigenheimbesitzer'],
  ['Für Betriebe', '/partner'],
  ['Über uns', '/ueber-uns'],
  ['Kontakt', '/kontakt'],
] as const;

const megaServiceGroups = [
  { title: 'Technik & Versorgung', items: SERVICE_CATEGORIES.slice(0, 4) },
  { title: 'Gebäude & Grundstück', items: SERVICE_CATEGORIES.slice(4, 8) },
  { title: 'Service & Sonderfälle', items: SERVICE_CATEGORIES.slice(8, 12) },
] as const;

const footerGroups = [
  {
    title: 'Produkt',
    links: [
      ["So funktioniert's", '/so-funktionierts'],
      ['Leistungen', '/leistungen'],
      ['Digitale Hausakte', '/hausakte'],
      ['Dein Ansprechpartner', '/so-funktionierts#ansprechpartner'],
      ['Preise', '/preise'],
    ],
  },
  {
    title: 'Für Eigentümer',
    links: [
      ['Für Eigenheimbesitzer', '/eigenheimbesitzer'],
      ['Sicherheit & Daten', '/sicherheit'],
      ['Beratung', '/beratung'],
      ['Notfall', '/notfall'],
      ['Versicherung', '/versicherung'],
      ['Immobilienverkauf', '/immobilienverkauf'],
      ['Hilfe & FAQ', '/hilfe'],
      ['Anmelden', '/login'],
    ],
  },
  {
    title: 'Für Betriebe',
    links: [
      ['Partner werden', '/partner'],
      ['Partner-App', '/partner#partner-app'],
      ['Qualitätsmodell', '/partner#qualitaet'],
      ['Partner-Modelle', '/preise'],
      ['Partner-Login', '/login'],
    ],
  },
  {
    title: 'Einfach Hausen',
    links: [
      ['Über uns', '/ueber-uns'],
      ['Kontakt', '/kontakt'],
      ['Impressum', '/impressum'],
      ['Datenschutz', '/datenschutz'],
      ['AGB', '/agb'],
      ['Barrierefreiheit', '/barrierefreiheit'],
    ],
  },
] as const;

export function MarketingShell({ children, footerIntake = true }: { children: React.ReactNode; footerIntake?: boolean }) {
  return (
    <div className={`mkt ${styles.site} ${interVariable.variable}`}>
      <SmoothScroll />
      <a className={styles.skipLink} href="#main-content">Zum Inhalt springen</a>
      <ScrollShadow>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            {/* Native navigation keeps the public shell hydration-free. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className={styles.logoLink} href="/" aria-label="einfachhausen Startseite">
              <Image src={logoFull} alt="einfachhausen" width={114} height={72} priority className={styles.logoImg} />
            </a>
            <nav className={styles.desktopNav} aria-label="Hauptnavigation">
              <a href="/so-funktionierts">So funktioniert&apos;s</a>
              <details className={styles.navDisclosure}>
                <summary>Leistungen <ChevronDown size={14} aria-hidden="true" /></summary>
                <div className={styles.megaMenu}>
                  <div className={styles.megaTop}>
                    <div className={styles.megaIntro}>
                      <span>Alles rund ums Eigenheim</span>
                      <h2>Was steht bei dir an?</h2>
                      <p>Finde den passenden Bereich direkt — oder beschreib einfach dein Anliegen.</p>
                    </div>
                    <Link className={styles.megaAllLink} href="/leistungen">
                      Alle Leistungen <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                  <div className={styles.megaBody}>
                    <div className={styles.megaServices} aria-label="Leistungsbereiche">
                      {megaServiceGroups.map((group) => (
                        <section className={styles.megaGroup} key={group.title}>
                          <h3>{group.title}</h3>
                          <div className={styles.megaGroupList}>
                            {group.items.map(({ slug, shortTitle, description, icon: Icon }) => (
                              <a key={slug} href={`/leistungen/${slug}`} className={styles.megaService}>
                                <span className={styles.megaServiceIcon}><Icon size={18} aria-hidden="true" /></span>
                                <span className={styles.megaServiceCopy}>
                                  <strong>{shortTitle}</strong>
                                  <small>{description}</small>
                                </span>
                                <ArrowRight className={styles.megaServiceArrow} size={14} aria-hidden="true" />
                              </a>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                    <aside className={styles.megaQuick} aria-label="Schnelle Wege">
                      <div className={styles.megaQuickIntro}>
                        <span className={styles.megaQuickEyebrow}>Einfach anfangen</span>
                        <strong>Noch nicht sicher, was du brauchst?</strong>
                        <p>Beschreib kurz, was ansteht. Wir helfen beim Einordnen — ohne Buchungszwang.</p>
                        <Link className={styles.megaPrimaryAction} href="/#anliegen">
                          Anliegen beschreiben <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      </div>
                      <div className={styles.megaQuickLinks}>
                        <a href="/beratung"><span><strong>Beratung</strong><small>Erst fachlich einordnen</small></span><ArrowRight size={13} aria-hidden="true" /></a>
                        <a href="/notfall"><span><strong>Notfall</strong><small>Dringenden Fall richtig starten</small></span><ArrowRight size={13} aria-hidden="true" /></a>
                        <a href="/so-funktionierts#ansprechpartner"><span><strong>Ansprechpartner</strong><small>Persönlichen Kontakt finden</small></span><ArrowRight size={13} aria-hidden="true" /></a>
                      </div>
                      <small className={styles.megaTrust}>Kein Auftrag ohne deine Entscheidung.</small>
                    </aside>
                  </div>
                </div>
              </details>
              <a href="/hausakte">Hausakte</a>
              <a href="/preise">Preise</a>
              <details className={`${styles.navDisclosure} ${styles.helpDisclosure}`}>
                <summary>Hilfe <ChevronDown size={14} aria-hidden="true" /></summary>
                <div className={styles.helpMenu}>
                  {helpLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
                </div>
              </details>
            </nav>
            <div className={styles.headerActions}>
              <a className={`${styles.btnGhost} ${styles.btnSm}`} href="/login">Anmelden</a>
              <a className={`${styles.btnPrimary} ${styles.btnSm}`} href="/register?role=homeowner">Kostenlos starten <ArrowRight size={15} aria-hidden="true" /></a>
            </div>
            <details className={styles.mobileMenu}>
              <summary aria-label="Menü öffnen"><Menu className={styles.menuIcon} size={22} /><X className={styles.closeIcon} size={22} /></summary>
              <nav aria-label="Mobile Navigation">
                <a href="/so-funktionierts">So funktioniert&apos;s</a>
                <details className={styles.mobileDisclosure}>
                  <summary>Leistungen <ChevronDown size={16} aria-hidden="true" /></summary>
                  <div>{SERVICE_CATEGORIES.map(({ slug, shortTitle }) => <a key={slug} href={`/leistungen/${slug}`}>{shortTitle}</a>)}</div>
                  <Link className={styles.mobileAllLink} href="/leistungen">Alle Leistungen</Link>
                </details>
                <a href="/hausakte">Hausakte</a>
                <a href="/preise">Preise</a>
                <details className={styles.mobileDisclosure}>
                  <summary>Hilfe <ChevronDown size={16} aria-hidden="true" /></summary>
                  <div>{helpLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div>
                </details>
                {mobileMore.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
                <a href="/impressum">Impressum</a>
                <a href="/datenschutz">Datenschutz</a>
                <a href="/agb">AGB</a>
                <div className={styles.mobileMenuActions}>
                  <a className={styles.btnGhost} href="/login">Anmelden</a>
                  <a className={styles.btnPrimary} href="/register?role=homeowner">Kostenlos starten</a>
                </div>
              </nav>
            </details>
          </div>
        </header>
      </ScrollShadow>
      <main id="main-content">{children}</main>
      <footer className={`${styles.footer} ${styles.onDark}`}>
        {footerIntake && (
          <div className={styles.footerIntake}>
            <div className={styles.footerIntakeInner}>
              <h2>Noch nicht gestartet? Sag uns einfach, was ansteht.</h2>
              <IntakeForm variant="band" />
            </div>
          </div>
        )}
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" aria-label="einfachhausen Startseite"><Image src={logoFull} alt="einfachhausen" width={140} height={97} className={styles.logoImg} /></a>
            <p className={styles.footerClaim}>Regional. Menschlich. Organisiert.</p>
            <p>Dein persönlicher Hausmanager: Anliegen beschreiben, geprüfte Partner aus deiner Region übernehmen, alles bleibt in deiner Hausakte.</p>
            <span>© 2026 Einfach Hausen</span>
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
        <div className={styles.footerBottom}>
          <p>Einfach Hausen organisiert digital. Ausgeführt wird durch eigenständige, geprüfte Partnerbetriebe. Kein Auftrag ohne deine Entscheidung.</p>
          <a href="/kontakt">Kontakt</a>
        </div>
      </footer>
    </div>
  );
}
