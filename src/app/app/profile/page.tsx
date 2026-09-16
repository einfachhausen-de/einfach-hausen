import { EHPageHeader, EHList, EHCallout, EHField, EHInput, EHWorkspaceGrid, EHIdentitySummary, EHWorkflowForm, EHFormSection, EHFieldGrid, EHSubmitButton, EHWorkSection } from '@/design-system';
import { AppShell } from '@/components/shell';
import { ownerAccountTabs } from '@/components/nav-config';
import { InstallAppCard } from '@/components/install-app-card';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logoutAction,saveProfileAction } from '@/app/actions';

export default async function Profile(){
  const u=await requireUser('homeowner'); const p=db.prepare('SELECT * FROM homeowner_profiles WHERE user_id=?').get(u.id) as any;
  const initials=`${u.first_name?.[0]||''}${u.last_name?.[0]||''}`.toUpperCase();
  return <AppShell role="homeowner" active="/app/profile" title="Profil & Einstellungen" subtitle="Konto und Einstellungen"
    breadcrumbs={[{ href: '/app', label: 'Start' }, { label: 'Profil & Einstellungen' }]}
    tabs={ownerAccountTabs.map(tab=>({href:tab.href,label:tab.label,active:tab.href==='/app/profile'}))}>
    <EHPageHeader title="Profil & Einstellungen" context={u.email} />
    <EHWorkspaceGrid main={<EHWorkflowForm action={saveProfileAction}>
      <EHFormSection title="Persönliche Daten" description="So erreichen dich deine Ansprechpartner.">
        <EHFieldGrid>
          <EHField id="profile-first" label="Vorname"><EHInput id="profile-first" name="firstName" autoComplete="given-name" defaultValue={u.first_name}/></EHField>
          <EHField id="profile-last" label="Nachname"><EHInput id="profile-last" name="lastName" autoComplete="family-name" defaultValue={u.last_name}/></EHField>
          <EHField id="profile-phone" label="Mobilnummer" hint="Für direkte Erreichbarkeit; WhatsApp erst nach Freischaltung."><EHInput id="profile-phone" name="phone" type="tel" autoComplete="tel" aria-describedby="profile-phone-hint" defaultValue={u.phone||''} placeholder="+49 …"/></EHField>
          <EHField id="profile-postcode" label="PLZ"><EHInput id="profile-postcode" name="postcode" autoComplete="postal-code" defaultValue={p?.postcode||''}/></EHField>
        </EHFieldGrid>
        <EHField id="profile-address" label="Adresse"><EHInput id="profile-address" name="address" autoComplete="street-address" defaultValue={p?.address||''}/></EHField>
        <EHSubmitButton>Änderungen speichern</EHSubmitButton>
      </EHFormSection>
    </EHWorkflowForm>} aside={<EHIdentitySummary initials={initials} name={`${u.first_name} ${u.last_name}`} email={u.email} />}/>
    <EHWorkSection title="Konto & App">
    <EHList label="Profilbereiche" items={[
      { id: 'plans', title: 'Zahlungen & Mitgliedschaft', href: '/app/plans' },
      { id: 'notifications', title: 'Benachrichtigungen', href: '/notifications' },
      { id: 'help', title: 'Hilfe & Support', text: 'Direkte Unterstützung', href: '/app/hilfe' },
    ]} />

    </EHWorkSection>
    <div data-testid="owner-logout-section">
    <EHWorkflowForm action={logoutAction}><EHSubmitButton pendingLabel="Wird abgemeldet …">Ausloggen</EHSubmitButton></EHWorkflowForm>
    <form action={logoutAction}>
      <button type="submit" className="sm-logout" data-testid="owner-logout-profile" aria-label="Abmelden">Abmelden</button>
    </form>
    </div>
    <InstallAppCard/>
    <EHCallout title="WhatsApp ist noch nicht freigeschaltet"><p>In der App kannst du den Hausmeister bereits nutzen. Der WhatsApp-Kanal wird erst angeboten, sobald der Business-Kanal tatsächlich verfügbar ist.</p></EHCallout>
    <EHCallout title="Deine Hausdaten bleiben privat."><p>Partner sehen nur die Informationen, die für einen konkreten Kontakt oder Auftrag notwendig sind.</p></EHCallout>
  </AppShell>;
}
