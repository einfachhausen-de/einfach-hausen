import { redirect } from 'next/navigation';

/**
 * Legacy-Duplikat von /app/messages. Kontaktpflege laeuft kanonisch darueber.
 */
export default function AnsprechpartnerRedirect() {
  redirect('/app/messages');
}
