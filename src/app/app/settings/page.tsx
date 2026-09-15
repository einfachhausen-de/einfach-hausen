import { BellOff, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { ownerAccountTabs } from '@/components/nav-config';
import { EHAppHeader, EHPanel, EHList, EHButton } from '@/design-system';
import { InstallAppCard } from '@/components/install-app-card';
import { requireUser } from '@/lib/auth';
import { PwaSettingsStatus } from './pwa-settings-status';
import { AccountActions } from './account-actions';
import styles from './settings.module.css';
import { AiSettings } from './ai-settings';

export default async function AppSettingsPage() {
  await requireUser('homeowner');

  return (
    <AppShell role="homeowner" active="/app/settings" title="App-Einstellungen" subtitle="Installation, Offline-Modus und Benachrichtigungen"
      breadcrumbs={[{ href: '/app', label: 'Start' }, { href: '/app/profile', label: 'Profil & Einstellungen' }, { label: 'App-Einstellungen' }]}
      tabs={ownerAccountTabs.map(tab=>({href:tab.href,label:tab.label,active:tab.href==='/app/settings'}))}>
      <EHAppHeader eyebrow="Konfiguration" title="App-Einstellungen" text="Hier siehst du, was dein Browser wirklich unterstützt und welche Funktionen noch nicht aktiv sind." actions={<EHButton href="/app/profile" variant="secondary">Profil</EHButton>} />

      <EHPanel title="Installation & Offline">
        <p>Die App speichert keine privaten Seiten als Offline-Kopie.</p>
        <InstallAppCard />
        <PwaSettingsStatus />
      </EHPanel>

      <EHPanel title="Benachrichtigungen">
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
      </EHPanel>

      <EHPanel title="KI-Assistent">
        <p>Kontingent, Bonus-Aktionen und eigener API-Key (BYOK).</p>
        <AiSettings />
      </EHPanel>

      <EHPanel title="Konto & Daten">
        <p>Datenexport und Konto-Löschung nach DSGVO.</p>
        <AccountActions />
      </EHPanel>
    </AppShell>
  );
}
