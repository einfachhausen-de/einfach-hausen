import { requireUser } from '@/lib/auth';
import { loadOnboardingState, saveOnboardingContactAction, saveOnboardingInterestsAction, saveOnboardingProfileAction } from './actions';
import { db } from '@/lib/db';
import { EHField, EHInput, EHSelect, EHCheckbox, EHSubmitButton, EHButton, EHErrorState, EHStepProgress, EHText, EHWorkflowStack } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankKopf, WerkbankPanel, WerkbankRaster } from '@/components/werkbank-seite';

/** Was der gerade sichtbare Schritt von dir braucht - einer je Schritt. */
const STEP_ASK: Record<string, string> = {
  profile: 'Trag Straße und PLZ ein, damit Einfach Hausen Betriebe in deiner Region findet.',
  interests: 'Wähle die Bereiche, die dich interessieren. Überspringen geht auch — ergänzen kannst du später im Profil.',
  contact: 'Sag, über welchen Weg wir dich am besten erreichen. Überspringen geht auch.',
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser('homeowner');
  const state = await loadOnboardingState();
  const { error } = await searchParams;
  const categories = [...new Set((db.prepare('SELECT DISTINCT category FROM service_catalog WHERE active=1 ORDER BY category').all() as Array<{ category: string }>).map(r => r.category))];

  return (
    <WerkbankRahmen role="homeowner" active="/app">
      <EHWorkflowStack>
      <WerkbankKopf title="Einrichtung" context={`Schritt ${state.stepIndex} von ${state.totalSteps}`} />
      <EHStepProgress current={state.step} steps={[{ id: 'profile', label: 'Adresse' }, { id: 'interests', label: 'Interessen' }, { id: 'contact', label: 'Erreichbarkeit' }]} />
      {error && <EHErrorState text={error} />}
      <WerkbankRaster main={<>
        {state.step === 'profile' && (
          <WerkbankPanel title="Adresse">
            <form action={saveOnboardingProfileAction}>
              <EHField id="ob-address" label="Straße und Hausnummer"><EHInput id="ob-address" name="address" defaultValue={state.address} required maxLength={200} /></EHField>
              <EHField id="ob-postcode" label="PLZ"><EHInput id="ob-postcode" name="postcode" defaultValue={state.postcode} required inputMode="numeric" pattern="[0-9]{4,5}" /></EHField>
              <EHSubmitButton>Weiter</EHSubmitButton>
            </form>
          </WerkbankPanel>
        )}
        {state.step === 'interests' && (
          <WerkbankPanel title="Interessen">
            <form action={saveOnboardingInterestsAction}>
              {categories.map(category => (
                <EHCheckbox key={category} label={category} name="interest" value={category} defaultChecked={state.interests.includes(category)} />
              ))}
              <EHSubmitButton>Weiter</EHSubmitButton>
              <EHButton type="submit" name="skip" value="1" variant="secondary">Überspringen</EHButton>
            </form>
          </WerkbankPanel>
        )}
        {state.step === 'contact' && (
          <WerkbankPanel title="Wie sollen wir dich erreichen?">
            <form action={saveOnboardingContactAction}>
              <EHField id="ob-channel" label="Bevorzugter Weg"><EHSelect id="ob-channel" name="preferredChannel" defaultValue={state.preferredChannel || 'email'}>
                <option value="email">E-Mail</option>
                <option value="phone">Telefon</option>
                <option value="whatsapp">WhatsApp</option>
              </EHSelect></EHField>
              <EHSubmitButton>Fertig</EHSubmitButton>
              <EHButton type="submit" name="skip" value="1" variant="secondary">Überspringen</EHButton>
            </form>
          </WerkbankPanel>
        )}
      </>} aside={<>
        <WerkbankAbschnitt title="Nächster Schritt">
          <EHText>{STEP_ASK[state.step]}</EHText>
        </WerkbankAbschnitt>
        <WerkbankAbschnitt title="Wozu die Angaben dienen">
          <EHText muted>Adresse und Interessen steuern, welche Betriebe und Anliegen dir vorgeschlagen werden. Alles bleibt in deiner Hausakte und lässt sich später im Profil ändern.</EHText>
        </WerkbankAbschnitt>
      </>} />
      </EHWorkflowStack>
    </WerkbankRahmen>
  );
}
