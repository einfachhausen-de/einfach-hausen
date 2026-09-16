import { requireUser } from '@/lib/auth';
import { AppShell } from '@/components/shell';
import { loadOnboardingState, saveOnboardingContactAction, saveOnboardingInterestsAction, saveOnboardingProfileAction } from './actions';
import { db } from '@/lib/db';
import { EHPanel, EHField, EHInput, EHSelect, EHCheckbox, EHSubmitButton, EHButton, EHErrorState, EHPageHeader } from '@/design-system';

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser('homeowner');
  const state = await loadOnboardingState();
  const { error } = await searchParams;
  const categories = [...new Set((db.prepare('SELECT DISTINCT category FROM service_catalog WHERE active=1 ORDER BY category').all() as Array<{ category: string }>).map(r => r.category))];

  return (
    <AppShell role="homeowner" active="/app" title="Einrichtung" subtitle={`Schritt ${state.stepIndex} von ${state.totalSteps}`}>
      <div className="onboarding-flow">
        <EHPageHeader title="Einrichtung" context={`Schritt ${state.stepIndex} von ${state.totalSteps}`} />
        <progress value={state.stepIndex} max={state.totalSteps} aria-label={`Fortschritt: Schritt ${state.stepIndex} von ${state.totalSteps}`} />
        {error && <EHErrorState text={error} />}
        {state.step === 'profile' && (
          <EHPanel title="Dein Zuhause">
            <p>Damit Partner in deiner Region arbeiten können.</p>
            <form action={saveOnboardingProfileAction}>
              <EHField id="ob-address" label="Straße und Hausnummer"><EHInput id="ob-address" name="address" defaultValue={state.address} required maxLength={200} /></EHField>
              <EHField id="ob-postcode" label="PLZ"><EHInput id="ob-postcode" name="postcode" defaultValue={state.postcode} required inputMode="numeric" pattern="[0-9]{4,5}" /></EHField>
              <EHSubmitButton>Weiter</EHSubmitButton>
            </form>
          </EHPanel>
        )}
        {state.step === 'interests' && (
          <EHPanel title="Worum geht es bei deinem Haus?">
            <p>Mehrfachauswahl möglich. Du kannst das auch überspringen.</p>
            <form action={saveOnboardingInterestsAction}>
              {categories.map(category => (
                <EHCheckbox key={category} label={category} name="interest" value={category} defaultChecked={state.interests.includes(category)} />
              ))}
              <EHSubmitButton>Weiter</EHSubmitButton>
              <EHButton type="submit" name="skip" value="1" variant="secondary">Überspringen</EHButton>
            </form>
          </EHPanel>
        )}
        {state.step === 'contact' && (
          <EHPanel title="Wie dürfen wir dich erreichen?">
            <p>Nur für Termine und Rückfragen zu deinen Aufträgen. Optional.</p>
            <form action={saveOnboardingContactAction}>
              <EHField id="ob-channel" label="Bevorzugter Kanal"><EHSelect id="ob-channel" name="preferredChannel" defaultValue={state.preferredChannel || 'email'}>
                <option value="email">E-Mail</option>
                <option value="phone">Telefon</option>
                <option value="whatsapp">WhatsApp</option>
              </EHSelect></EHField>
              <EHSubmitButton>Fertig</EHSubmitButton>
              <EHButton type="submit" name="skip" value="1" variant="secondary">Überspringen</EHButton>
            </form>
          </EHPanel>
        )}
      </div>
    </AppShell>
  );
}
