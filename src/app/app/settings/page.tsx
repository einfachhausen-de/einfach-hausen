import { BellOff, ShieldCheck } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankKennzahlen, WerkbankKopf, WerkbankPanel, WerkbankRaster } from '@/components/werkbank-seite';
import { EHList, EHButton, EHRecordList, EHStatus, EHText, type EHRecordEntry } from '@/design-system';
import { InstallAppCard } from '@/components/install-app-card';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiQuotaSnapshot } from '@/lib/ai-engine';
import { dateLabel } from '@/lib/format';
import { PwaSettingsStatus } from './pwa-settings-status';
import { AccountActions } from './account-actions';
import { OwnerSettingsDialog } from './owner-settings-dialog';
import styles from './settings.module.css';
import { AiSettings } from './ai-settings';

type Notice = { id: number; title: string; body: string; href: string; read_at: string | null; created_at: string };
type DataRequest = { id: number; kind: string; status: string; created_at: string; completed_at: string | null };

const monthYear = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' });
const requestKindLabels: Record<string, string> = { export: 'Datenexport', deletion: 'Kontolöschung' };

/** Registrierungsmonat als Kennzahl: kurze, stabile Anzeige statt eines Zeitstempels. */
function monthYearLabel(value: string | null | undefined): string {
  if (!value) return '–';
  const raw = String(value).trim();
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T12:00:00Z' : raw.replace(' ', 'T') + 'Z');
  return Number.isFinite(date.getTime()) ? monthYear.format(date) : '–';
}

export default async function AppSettingsPage() {
  const user = await requireUser('homeowner');

  // Kennzahlen und rechte Spalte lesen dieselben echten Staende: Mitteilungen,
  // KI-Kontingent, Bonus-Guthaben und das Alter des Kontos.
  const quota = aiQuotaSnapshot(user.id);
  const account = db.prepare('SELECT created_at FROM users WHERE id=?').get(user.id) as { created_at: string } | undefined;
  const unread = (db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL AND channel='in_app'").get(user.id) as { c: number }).c;
  const noticeTotal = (db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND channel='in_app'").get(user.id) as { c: number }).c;
  const notices = db.prepare("SELECT id,title,body,href,read_at,created_at FROM notifications WHERE user_id=? AND channel='in_app' ORDER BY created_at DESC LIMIT 5").all(user.id) as Notice[];
  const dataRequests = db.prepare('SELECT id,kind,status,created_at,completed_at FROM data_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 3').all(user.id) as DataRequest[];
  const lastRequest = dataRequests[0];

  const noticeItems: EHRecordEntry[] = notices.map(notice => ({
    id: String(notice.id),
    title: notice.title,
    detail: notice.body || undefined,
    date: String(notice.created_at).slice(0, 10),
    dateLabel: dateLabel(notice.created_at),
    status: notice.read_at ? undefined : <EHStatus tone="info">Neu</EHStatus>,
    href: notice.href || '/notifications',
  }));

  return (
    <WerkbankRahmen role="homeowner" active="/app/settings"
>
      <WerkbankKopf title="App-Einstellungen" actions={<><OwnerSettingsDialog /><EHButton href="/app/profile" variant="secondary">Profil</EHButton></>} />

      <WerkbankKennzahlen label="App-Einstellungen" items={[
        { id: 'mitteilungen', label: 'Ungelesen', value: String(unread), hint: noticeTotal > 0 ? `${noticeTotal} Mitteilungen gesamt` : 'noch keine Mitteilung' },
        { id: 'kontingent', label: 'KI-Kontingent frei', value: `${quota.freemiumRemaining} von ${quota.freemiumAllowed}`, hint: quota.byok ? 'eigener Schlüssel aktiv' : 'KI-Aktionen pro Monat' },
        { id: 'bonus', label: 'Bonus-Aktionen', value: String(quota.credits), hint: 'zusätzlich verfügbar' },
        { id: 'konto', label: 'Konto seit', value: monthYearLabel(account?.created_at), hint: 'Registrierung' },
      ]} />

      <WerkbankRaster main={<>
        <WerkbankPanel title="Installation & Offline">
          <p>Die App speichert keine privaten Seiten als Offline-Kopie.</p>
          <InstallAppCard />
          <PwaSettingsStatus />
        </WerkbankPanel>

        <WerkbankPanel title="Benachrichtigungen">
          <p>In-App-Updates sind aktiv; Browser-Push ist noch nicht freigeschaltet.</p>
          <EHList label="Benachrichtigungen" items={[{ id: 'inapp', title: 'In-App-Benachrichtigungen öffnen', text: 'Auftragsstatus, Nachrichten und wichtige Plattform-Updates.', href: '/notifications' }]} />

          <div className={styles.disabledSetting} role="group" aria-labelledby="push-setting-title" aria-describedby="push-setting-help">
            <BellOff aria-hidden="true" />
            <span>
              <strong id="push-setting-title">Browser-Push</strong>
              <small id="push-setting-help">Noch nicht verfügbar. Wir fragen deshalb keine Benachrichtigungsberechtigung an und zeigen keinen wirkungslosen Einschalter.</small>
            </span>
            <input type="checkbox" disabled aria-label="Browser-Push noch nicht verfügbar" />
          </div>

          <div className={styles.disabledSetting} role="group" aria-labelledby="checklist-setting-title" aria-describedby="checklist-setting-help">
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong id="checklist-setting-title">Checklisten-Erinnerungen per Push</strong>
              <small id="checklist-setting-help">Noch nicht verfügbar. Erinnerungen erscheinen erst als Push-Option, wenn eine echte Zustellung eingerichtet ist.</small>
            </span>
            <input type="checkbox" disabled aria-label="Checklisten-Erinnerungen per Push noch nicht verfügbar" />
          </div>
        </WerkbankPanel>

        <WerkbankPanel title="KI-Assistent">
          <p>Kontingent, Bonus-Aktionen und eigener API-Key (BYOK).</p>
          <AiSettings />
        </WerkbankPanel>

        <WerkbankPanel title="Konto & Daten">
          <p>Datenexport und Konto-Löschung nach DSGVO.</p>
          <AccountActions />
        </WerkbankPanel>
      </>} aside={<>
        <WerkbankAbschnitt title="Deine Mitteilungen">
          <EHRecordList label="Deine Mitteilungen" items={noticeItems} empty="Noch keine Mitteilung. Auftragsstatus und Absprachen erscheinen hier, sobald es etwas Neues gibt." />
          <EHButton href="/notifications" variant="secondary" arrow>Alle Mitteilungen</EHButton>
        </WerkbankAbschnitt>
        <WerkbankAbschnitt title="KI-Kontingent">
          <EHText>{quota.freemiumRemaining} von {quota.freemiumAllowed} freien Aktionen übrig, dazu {quota.credits} Bonus-Aktionen.</EHText>
          <EHStatus tone={quota.byok ? 'success' : 'neutral'}>{quota.byok ? 'Eigener Schlüssel aktiv' : 'Plattform-Kontingent'}</EHStatus>
          <EHText muted>Der eigene API-Key läuft über dein Anbieter-Konto — dessen Limits und Kosten gelten.</EHText>
        </WerkbankAbschnitt>
        <WerkbankAbschnitt title="Daten & Konto">
          {lastRequest ? <>
            <EHText>{requestKindLabels[lastRequest.kind] ?? lastRequest.kind}</EHText>
            <EHStatus tone={lastRequest.status === 'completed' ? 'success' : lastRequest.status === 'failed' ? 'error' : 'info'}>
              {lastRequest.status === 'completed' ? 'Abgeschlossen' : lastRequest.status === 'failed' ? 'Fehlgeschlagen' : 'Beantragt'}
            </EHStatus>
            <EHText muted>{dateLabel(lastRequest.completed_at || lastRequest.created_at)}</EHText>
          </> : <EHText muted>Bisher kein Datenexport und keine Kontolöschung beantragt. Beides startest du links unter „Konto & Daten“.</EHText>}
          <EHText muted>Konto seit {monthYearLabel(account?.created_at)}.</EHText>
        </WerkbankAbschnitt>
      </>} />
    </WerkbankRahmen>
  );
}
