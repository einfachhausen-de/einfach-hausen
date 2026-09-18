import { redirect } from 'next/navigation';

/**
 * Legacy-Duplikat des kanonischen Firmendaten-Wizards unter /pro/onboarding.
 */
export default function OnboardingProGebietRedirect() {
  redirect('/pro/onboarding');
}
