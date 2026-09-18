import { redirect } from 'next/navigation';

/**
 * Legacy-Route auf stillgelegtem Supabase-Datenmodell (anfragen/angebote),
 * Angebot-Annahme ohne serverseitige Autorisierung. Auftraege leben kanonisch
 * unter /app/jobs/[id] mit requireUser + Eigentumspruefung.
 */
export default async function AnfrageRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/jobs/${encodeURIComponent(id)}`);
}
