import { redirect } from 'next/navigation';

/**
 * Legacy-Firmendaten-Wizard auf stillgelegtem Supabase-Datenmodell
 * (Profil in user_metadata statt SQLite, ungeprueftes Subject-Mapping).
 * Kanonisch ist /pro/onboarding (requireUser('provider') + SQLite).
 * Nirgendwo verlinkt — der alte Wizard wird dorthin weitergeleitet.
 */
export default function OnboardingProRedirect() {
  redirect('/pro/onboarding');
}
