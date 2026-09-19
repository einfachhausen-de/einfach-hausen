import { requireUser } from '@/lib/auth';
import { loadOnboardingState, saveOnboardingContactAction, saveOnboardingInterestsAction, saveOnboardingProfileAction } from './actions';
import { db } from '@/lib/db';
import { EHPanel, EHField, EHInput, EHSelect, EHCheckbox, EHSubmitButton, EHButton, EHErrorState, EHMetricsBar, EHPageHeader, EHRecordList, EHText, EHWorkSection, EHWorkspaceGrid, EHWorkflowStack } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';

/** Die drei Kanaele, die saveOnboardingContactAction zulaesst (CHANNELS). */
const CHANNEL_LABEL: Record<string, string> = { email: 'E-Mail', phone: 'Telefon', whatsapp: 'WhatsApp' };

/** Was der gerade sichtbare Schritt von dir braucht - einer je Schritt. */
const STEP_ASK: Record<string, string> = {
  profile: 'Trag Straße und PLZ ein, damit Einfach Hausen Betriebe in deiner Region findet.',
  interests: 'Wähle die Bereiche, die dich interessieren. Überspringen ist möglich.',
  contact: 'Sag, über welchen Weg wir dich am besten erreichen.',
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser('homeowner');
  const state = await loadOnboardingState();
  const { error } = await searchParams;
  const categories = [...new Set((db.prepare('SELECT DISTINCT category FROM service_catalog WHERE active=1 ORDER BY category').all() as Array<{ category: string }>).map(r => r.category))];

  return (
    <WerkbankRahmen role="homeowner" active="/app">
      <EHWorkflowStack>
      <EHPageHeader title="Einrichtung" context={`Schritt ${state.stepIndex} von ${state.totalSteps}`} />
      <progress value={state.stepIndex} max={state.totalSteps} aria-label={`Fortschritt: Schritt ${state.stepIndex} von ${state.totalSteps}`} />
      {error && <EHErrorState text={error} />}
      <EHMetricsBar label="Einrichtung" items={[
        { id: 'fortschritt', label: 'Fortschritt', value: `${state.stepIndex} / ${state.totalSteps}`, hint: 'Schritte der Einrichtung' },
        { id: 'adresse', label: 'Adresse', value: state.postcode || '–', hint: state.address ? 'Straße hinterlegt' : 'noch offen' },
        { id: 'interessen', label: 'Interessen', value: String(state.interests.length), hint: `${categories.length} Bereiche zur Auswahl` },
        { id: 'kontaktweg', label: 'Kontaktweg', value: CHANNEL_LABEL[state.preferredChannel] || '–', hint: state.preferredChannel ? 'gewählt' : 'noch offen' },
      ]} />
      <EHWorkspaceGrid main={<>
        {state.step === 'profile' && (
          <EHPanel title="Adresse">
            <form action={saveOnboardingProfileAction}>
              <EHField id="ob-address" label="Straße und Hausnummer"><EHInput id="ob-address" name="address" defaultValue={state.address} required maxLength={200} /></EHField>
              <EHField id="ob-postcode" label="PLZ"><EHInput id="ob-postcode" name="postcode" defaultValue={state.postcode} required inputMode="numeric" pattern="[0-9]{4,5}" /></EHField>
              <EHSubmitButton>Weiter</EHSubmitButton>
            </form>
          </EHPanel>
        )}
        {state.step === 'interests' && (
          <EHPanel title="Interessen">
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
          <EHPanel title="Kontaktweg">
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
      </>} aside={<>
        <EHWorkSection title="Nächster Schritt">
          <EHText>{STEP_ASK[state.step]}</EHText>
        </EHWorkSection>
        <EHWorkSection title="Deine Angaben">
          <EHRecordList label="Angaben aus der Einrichtung" items={[
            { id: 'adresse', title: state.address || 'Noch nicht hinterlegt', detail: 'Straße und Hausnummer' },
            { id: 'plz', title: state.postcode || 'Noch nicht hinterlegt', detail: 'PLZ' },
            { id: 'interessen', title: state.interests.length ? state.interests.join(' · ') : 'Noch keine gewählt', detail: `${state.interests.length} von ${categories.length} Bereichen` },
            { id: 'kontaktweg', title: CHANNEL_LABEL[state.preferredChannel] || 'Noch nicht gewählt', detail: 'Bevorzugter Kontaktweg' },
          ]} />
        </EHWorkSection>
        <EHWorkSection title="Wozu die Angaben dienen">
          <EHText muted>Adresse und Interessen steuern, welche Betriebe und Anliegen dir vorgeschlagen werden. Alles bleibt in deiner Hausakte und lässt sich später im Profil ändern.</EHText>
        </EHWorkSection>
      </>} />
      </EHWorkflowStack>
    </WerkbankRahmen>
  );
}
