import { redirect } from 'next/navigation';

/**
 * Legacy-Route: schrieb in die stillgelegte Supabase-Tabelle `anfragen` und
 * leitete dann nach /app/jobs weiter, wo der Datensatz nie ankam (Daten-Sack-
 * gasse). Kanonischer Anliegen-Einstieg ist der Hausmeister.
 */
export default function AnfrageNeuRedirect() {
  redirect('/app/hausmeister');
}
