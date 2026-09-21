import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { BarChart3, ChevronRight, FileText, MessageCircle, Plus, Users, Wrench } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import styles from '../homeowner.module.css';

// Public preview – no auth, mock data – matches v3 layout
export default function Preview() {
  const address = 'Fixturestraße 1, 46325 Borken';
  const firstName = 'Gina';

  return (
    <WerkbankRahmen
      role="homeowner"
      active="/app"
      brandSub={address}
      rail={
        <>
          <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
          <div className="eh-werkbank-karte">
            <h4>Dein Zuhause</h4>
            <div className="eh-werkbank-bar">
              <i style={{ width: '75%' }} />
            </div>
            <div className="eh-werkbank-row">
              <span>Profil vollständig</span>
              <span>75% · 3 von 4</span>
            </div>
            <div className="eh-werkbank-row">
              <span>Offene Vorgänge</span>
              <span>5</span>
            </div>
            <div className="eh-werkbank-row">
              <span>Dokumente</span>
              <span>4</span>
            </div>
            <Link href="#" className="eh-werkbank-go">
              Profil vervollständigen →
            </Link>
          </div>
          <div className="eh-werkbank-karte">
            <h4>Hilfe</h4>
            <p className={styles.railHelp}>Dein Hausmanager beantwortet Fragen zu Vorgängen, Terminen und Unterlagen.</p>
            <Link href="#" className="eh-werkbank-go">
              Hausmanager fragen →
            </Link>
          </div>
        </>
      }
    >
      <div className={styles.dashRoot}>
        <header className={styles.dashHeader}>
          <div className={styles.dashHeaderCopy}>
            <p className={styles.dashEyebrow}>{address} · Eigentümer-App</p>
            <h1 className={styles.dashTitle}>Hallo {firstName}, dein Zuhause im Überblick</h1>
            <p className={styles.dashSub}>Womit du direkt weiterkommst – ohne Suchen.</p>
          </div>
          <div className={styles.dashHeaderActions}>
            <Link className={styles.dashPrimaryAction} href="#">
              <Plus size={18} /> Neues Anliegen
            </Link>
          </div>
        </header>

        {/* 1) Schnellaktionen ganz oben */}
        <section className={styles.quickSection}>
          <p className={styles.quickLabel}>Schnellaktionen</p>
          <div className={`${styles.quickGrid} ${styles.quickGridThree}`}>
            <Link href="#" className={`${styles.quickCard} ${styles.quickCardPrimary}`}>
              <span className={styles.quickIcon}>
                <Wrench size={20} />
              </span>
              <strong>Auftrag starten</strong>
              <small>Handwerker, Wartung oder Reparatur – Auftrag anlegen und passenden Betrieb finden.</small>
              <span className={styles.quickCardArrow}>
                Auftrag starten <ChevronRight size={16} />
              </span>
            </Link>
            <Link href="#" className={styles.quickCard}>
              <span className={styles.quickIcon}>
                <MessageCircle size={20} />
              </span>
              <strong>Beratung starten</strong>
              <small>Frage zu deinem Zuhause klären – mit Hausmanager oder Fachberatung sprechen.</small>
              <span className={styles.quickCardArrow}>
                Beratung starten <ChevronRight size={16} />
              </span>
            </Link>
            <Link href="#" className={styles.quickCard}>
              <span className={styles.quickIcon}>
                <BarChart3 size={20} />
              </span>
              <strong>Tarife vergleichen</strong>
              <small>Versicherung, Energie oder Verträge prüfen – Tarife vergleichen und sparen.</small>
              <span className={styles.quickCardArrow}>
                Tarife vergleichen <ChevronRight size={16} />
              </span>
            </Link>
          </div>
        </section>

        {/* 2) Mein Zuhause im Überblick */}
        <section className={styles.overviewSection}>
          <p className={styles.quickLabel}>Mein Zuhause im Überblick</p>
          <div className={`${styles.quickGrid} ${styles.quickGridThree}`}>
            <Link href="#" className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon}>
                  <Wrench size={20} />
                </span>
                <span className={styles.overviewCount}>5</span>
              </div>
              <div className={styles.overviewMeta}>
                <strong>Aktuelle Aufträge</strong>
                <small>5 Aufträge in Bearbeitung – Status und nächste Schritte.</small>
              </div>
              <span className={styles.quickCardArrow}>
                Aufträge ansehen <ChevronRight size={16} />
              </span>
            </Link>
            <Link href="#" className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon}>
                  <FileText size={20} />
                </span>
                <span className={styles.overviewCount} data-tone="terra">
                  2
                </span>
              </div>
              <div className={styles.overviewMeta}>
                <strong>Angebote</strong>
                <small>2 offene Angebote warten auf Entscheidung.</small>
              </div>
              <span className={styles.quickCardArrow}>
                Angebote prüfen <ChevronRight size={16} />
              </span>
            </Link>
            <Link href="#" className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon}>
                  <Users size={20} />
                </span>
                <span className={styles.overviewCount}>3</span>
              </div>
              <div className={styles.overviewMeta}>
                <strong>Ansprechpartner</strong>
                <small>3 Partner haben für dich gearbeitet – Kontakt und Historie.</small>
              </div>
              <span className={styles.quickCardArrow}>
                Partner ansehen <ChevronRight size={16} />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </WerkbankRahmen>
  );
}
