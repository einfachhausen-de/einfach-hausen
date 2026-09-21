import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { BarChart3, ChevronRight, Clock, FileText, History, MessageCircle, Plus, Users, Wrench } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import styles from '../homeowner.module.css';

export default function Preview() {
  const address = 'Fixturestraße 1, 46325 Borken';
  const firstName = 'Gina';
  const history = [
    { id: 9004, title: 'Heizkörper entlüften', status: 'Erledigt', date: '16.09.' },
    { id: 9003, title: 'Badarmatur tropft', status: 'In Arbeit', date: '14.09.' },
    { id: 9005, title: 'Thermostate tauschen', status: 'Erledigt', date: '12.09.' },
    { id: 9006, title: 'Dachrinne reinigen', status: 'Abgeschlossen', date: '10.09.' },
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
            <div className="eh-werkbank-bar"><i style={{ width: '75%' }} /></div>
            <div className="eh-werkbank-row"><span>Profil vollständig</span><span>75% · 3 von 4</span></div>
            <div className="eh-werkbank-row"><span>Offene Vorgänge</span><span>5</span></div>
            <div className="eh-werkbank-row"><span>Dokumente</span><span>4</span></div>
            <Link href="#" className="eh-werkbank-go">Profil vervollständigen →</Link>
          </div>
          <div className="eh-werkbank-karte">
            <h4>Hilfe</h4>
            <p className={styles.railHelp}>Dein Hausmanager beantwortet Fragen zu Vorgängen, Terminen und Unterlagen.</p>
            <Link href="#" className="eh-werkbank-go">Hausmanager fragen →</Link>
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
            <Link className={styles.dashPrimaryAction} href="#"><Plus size={18} /> Neues Anliegen</Link>
          </div>
        </header>

        {/* 1) Überblick ganz oben */}
        <section className={styles.overviewSection}>
          <p className={styles.quickLabel}>Mein Zuhause im Überblick</p>
          <div className={`${styles.quickGrid} ${styles.quickGridThree}`}>
            <Link href="#" className={styles.quickCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon}><Wrench size={20} /></span>
                <span className={styles.overviewCount}>5</span>
              </div>
              <strong>Aktuelle Aufträge</strong>
              <small>5 in Bearbeitung.</small>
              <span className={styles.quickCardArrow}>Ansehen <ChevronRight size={16} /></span>
            </Link>
            <Link href="#" className={styles.quickCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon}><FileText size={20} /></span>
                <span className={styles.overviewCount} data-tone="terra">2</span>
              </div>
              <strong>Angebote</strong>
              <small>2 warten auf Entscheidung.</small>
              <span className={styles.quickCardArrow}>Prüfen <ChevronRight size={16} /></span>
            </Link>
            <Link href="#" className={styles.quickCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon}><Users size={20} /></span>
                <span className={styles.overviewCount}>3</span>
              </div>
              <strong>Ansprechpartner</strong>
              <small>3 Partner.</small>
              <span className={styles.quickCardArrow}>Partner <ChevronRight size={16} /></span>
            </Link>
          </div>
        </section>

        {/* 2) Schnellaktionen */}
        <section className={styles.quickSection}>
          <p className={styles.quickLabel}>Schnellaktionen</p>
          <div className={`${styles.quickGrid} ${styles.quickGridThree}`}>
            <Link href="#" className={`${styles.quickCard} ${styles.quickCardPrimary}`}>
              <span className={styles.quickIcon}><Wrench size={20} /></span>
              <strong>Auftrag starten</strong>
              <small>Handwerker, Wartung oder Reparatur – Auftrag anlegen und passenden Betrieb finden.</small>
              <span className={styles.quickCardArrow}>Auftrag starten <ChevronRight size={16} /></span>
            </Link>
            <Link href="#" className={styles.quickCard}>
              <span className={styles.quickIcon}><MessageCircle size={20} /></span>
              <strong>Beratung starten</strong>
              <small>Frage zu deinem Zuhause klären – mit Hausmanager oder Fachberatung sprechen.</small>
              <span className={styles.quickCardArrow}>Beratung starten <ChevronRight size={16} /></span>
            </Link>
            <Link href="#" className={styles.quickCard}>
              <span className={styles.quickIcon}><BarChart3 size={20} /></span>
              <strong>Tarife vergleichen</strong>
              <small>Versicherung, Energie oder Verträge prüfen – Tarife vergleichen und sparen.</small>
              <span className={styles.quickCardArrow}>Tarife vergleichen <ChevronRight size={16} /></span>
            </Link>
          </div>
        </section>

        {/* 3) Haus-Historie ganz unten */}
        <section className={styles.sectionCard}>
          <header className={styles.sectionCardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={styles.itemIcon}><History size={18} /></span>
              <h2>Haus-Historie</h2>
            </div>
            <Link href="#">Alle Aufträge →</Link>
          </header>
          <ul className={styles.sectionList}>
            {history.map((job) => (
              <li key={job.id}>
                <Link href="#" className={styles.contentsLink}>
                  <span className={styles.itemIcon}><Clock size={18} /></span>
                  <span className={styles.itemMain}>
                    <b>{job.title}</b>
                    <small>{job.date} · Nr. {job.id}</small>
                  </span>
                  <span className={styles.itemMeta}>
                    <span className={`${styles.pill} ${job.status === 'Angebote da' ? styles.pillWarn : styles.pillInfo}`}>{job.status}</span>
                    <ChevronRight size={16} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </WerkbankRahmen>
  );
}
