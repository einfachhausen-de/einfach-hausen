import { redirect } from 'next/navigation';

/**
 * Legacy-Duplikat des kanonischen Firmendaten-Wizards unter /pro/onboarding
 * (requireUser('provider') + SQLite). Diese Route schrieb noch in die
 * stillgelegte Supabase-Welt und ist nirgendwo verlinkt.
 */
export default function OnboardingProSchrittRedirect({ params }: { params: Promise<{ schritt: string }> }) {
  void params;
  redirect('/pro/onboarding');
}
