import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

/**
 * Legacy-Route auf stillgelegtem Supabase-Datenmodell (anfragen/anfrage_messages
 * + Realtime-Channel ohne pruefbare RLS, Supabase-Subject ungeprueft mit
 * Application-User-ID gleichgesetzt) — T-0168-Verstoß.
 *
 * Nachrichten laufen kanonisch ueber /app/messages mit serverseitiger
 * Autorisierung. Die alte Route wird zu genau dort weitergeleitet.
 */
export default async function ChatRedirect({ params }: { params: Promise<{ anfrageId: string }> }) {
  const { anfrageId } = await params;
  await requireUser();
  redirect(`/app/messages?job=${encodeURIComponent(anfrageId)}`);
}
