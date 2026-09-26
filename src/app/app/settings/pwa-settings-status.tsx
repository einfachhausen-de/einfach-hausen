'use client';

import { useEffect, useState } from 'react';
import { WerkbankKennzahlen } from '@/components/werkbank-seite';
import styles from './settings.module.css';

type Status = {
  online: boolean;
  controlled: boolean;
  installed: boolean;
};

function readStatus(): Status {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return {
    online: navigator.onLine,
    controlled: Boolean(navigator.serviceWorker?.controller),
    installed: standalone,
  };
}

export function PwaSettingsStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const sync = () => setStatus(readStatus());
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    window.addEventListener('appinstalled', sync);
    window.addEventListener('eh-service-worker-ready', sync);
    navigator.serviceWorker?.addEventListener('controllerchange', sync);
    const media = window.matchMedia('(display-mode: standalone)');
    media.addEventListener?.('change', sync);

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
      window.removeEventListener('appinstalled', sync);
      window.removeEventListener('eh-service-worker-ready', sync);
      navigator.serviceWorker?.removeEventListener('controllerchange', sync);
      media.removeEventListener?.('change', sync);
    };
  }, []);

  if (!status) return <p className={styles.statusLine}>Browser-Status wird geprüft …</p>;

  return (
    <div className={styles.statusBlock} role="status" aria-live="polite">
      <WerkbankKennzahlen
        label="Browser-Status"
        items={[
          { id: 'verbindung', label: 'Verbindung', value: status.online ? 'Online' : 'Offline' },
          { id: 'recovery', label: 'Offline-Recovery', value: status.controlled ? 'Bereit' : 'Noch nicht aktiv' },
          { id: 'installation', label: 'Installation', value: status.installed ? 'Installiert' : 'Im Browser' },
        ]}
      />
      <p className={styles.statusLine}>
        {status.online
          ? 'Speichern, Senden und Buchen nutzen die aktuelle Serververbindung.'
          : 'Senden, Speichern und Buchen bleiben gesperrt, bis die Verbindung wieder da ist.'}
      </p>
    </div>
  );
}
