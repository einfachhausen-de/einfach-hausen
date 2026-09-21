import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { BarChart3, ChevronRight, Clock, MessageCircle, Plus, Wrench } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import styles from '../homeowner.module.css';

// Public preview – no auth, mock data, for screenshot – matches new reduced layout
export default function Preview() {
  const address = 'Fixturestraße 1, 46325 Borken';
  const firstName = 'Gina';
  const recentJobs = [
    { id: 9004, title: 'Heizkörper entlüften', status: 'In Arbeit', date: '16.09.' },
    { id: 9003, title: 'Badarmatur tropft', status: 'Angebote da', date: '14.09.' },
    { id: 9005, title: 'Thermostate tauschen', status: 'Erledigt', date: '12.09.' },
    { id: 9006, title: 'Dachrinne reinigen', status: 'Offen', date: '10.09.' },
  ];

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
            <p className={styles.dashSub}>Was gerade läuft und womit du direkt weiterkommst – ohne Suchen.</p>
          </div>
          <div className={styles.dashHeaderActions}>
            <Link className={styles.dashPrimaryAction} href="#">
              <Plus size={18} /> Neues Anliegen
            </Link>
          </div>
        </header>

        {/* 1) Aktuelle Vorgänge ganz oben */}
        <section className={styles.sectionCard}>
          <header className={styles.sectionCardHeader}>
            <h2>Aktuelle Vorgänge</h2>
            <Link href="#">Alle Aufträge →</Link>
          </header>
          <ul className={styles.sectionList}>
            {recentJobs.map((job) => (
              <li key={job.id}>
                <Link href="#" className={styles.contentsLink}>
                  <span className={styles.itemIcon}>
                    <Clock size={18} />
                  </span>
                  <span className={styles.itemMain}>
                    <b>{job.title}</b>
                    <small>
                      {job.date} · Nr. {job.id}
                    </small>
                  </span>
                  <span className={styles.itemMeta}>
                    <span className={`${styles.pill} ${job.status === 'Angebote da' ? styles.pillWarn : styles.pillInfo}`}>
                      {job.status}
                    </span>
                    <ChevronRight size={16} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 2) Schnellaktionen – nur 3 Cards */}
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
      </div>
    </WerkbankRahmen>
  );
}
