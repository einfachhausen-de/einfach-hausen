import { Fragment } from 'react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankKennzahlen, WerkbankKopf, WerkbankRaster } from '@/components/werkbank-seite';
import { requireUser } from '@/lib/auth';
import { EHStatus, EHButton, EHField, EHInput, EHCheckbox, EHWorkflowStack, EHWorkflowForm, EHFormSection, EHFormFeedback, EHSubmitButton, EHText, EHEmptyState } from '@/design-system';
import { addProviderMemberAction, updateProviderMemberAction } from '@/app/actions';
import { getProviderContext, getProviderMembers } from '@/lib/provider';

export default async function Team({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const u = await requireUser('provider');
  const ctx = getProviderContext(u.id);
  if (!ctx) return <WerkbankRahmen role="provider" active="/pro/team"><WerkbankKopf title="Team" /><EHEmptyState title="Kein Betrieb zugeordnet" text="Für die Teamverwaltung ist ein zugeordneter Betrieb erforderlich." /></WerkbankRahmen>;
  const sp = await searchParams;
  const members = getProviderMembers(ctx.providerId);
  // Die vier Kennzahlen lesen dieselbe Mitgliederliste wie die Formulare
  // darunter: jede Zahl ist eine echte Zeile aus getProviderMembers.
  const activeMembers = members.filter(member => member.active);
  const managingMembers = members.filter(member => member.can_manage_jobs);

  const memberSection = <WerkbankAbschnitt title={`Team · ${members.length}`}>
      {members.map(member => {
        const firmAccount = member.user_id === ctx.providerId;
        return <EHWorkflowForm key={member.user_id} action={updateProviderMemberAction.bind(null, member.user_id)}>
          <EHFormSection title={`${member.first_name} ${member.last_name}${firmAccount ? ' · Firmenkonto' : ''}`}>
            <EHStatus tone={member.active ? 'success' : 'neutral'}>{member.active ? 'Zugang aktiv' : 'Zugang deaktiviert'}</EHStatus>
            {/* An e-mail address is one unbreakable token: at 390px a long one
                set this column's min-content width to ~410px and pushed the
                whole page into horizontal overflow (Firefox measured 449 vs
                390). <wbr> marks the natural break opportunities of an address.
                Markup rather than styling on purpose - the design guard forbids
                both new page stylesheets and inline styles. */}
            <EHText>{String(member.email).split(/([-@])/).map((part, index) => <Fragment key={index}>{part}{/^[-@]$/.test(part) ? <wbr /> : null}</Fragment>)}</EHText>
            {member.phone && <EHText>{member.phone}</EHText>}
            <EHField id={'member-title-' + member.user_id} label="Bezeichnung">
              <EHInput id={'member-title-' + member.user_id} name="jobTitle" defaultValue={member.job_title || ''} placeholder="z. B. Kundendienst, Techniker, Disposition" disabled={!ctx.canManageJobs} />
            </EHField>
            <EHCheckbox label="Aufträge verwalten" name="canManageJobs" defaultChecked={!!member.can_manage_jobs} disabled={!ctx.canManageJobs || firmAccount} />
            <EHCheckbox label="App-Zugang aktiv" name="active" defaultChecked={!!member.active} disabled={!ctx.canManageJobs || firmAccount} />
            {firmAccount && <EHText>Beim Firmenkonto bleiben Auftragsverwaltung und App-Zugang aktiv.</EHText>}
            {ctx.canManageJobs && <EHSubmitButton>Änderungen speichern</EHSubmitButton>}
          </EHFormSection>
        </EHWorkflowForm>;
      })}
      {members.length === 0 && <EHEmptyState title="Noch kein Ansprechpartner angelegt" text="Hier erscheinen die Menschen, die Kunden betreuen oder Aufträge ausführen." />}
    </WerkbankAbschnitt>;

  const addMemberForm = ctx.canManageJobs && <div id="team-anlegen"><EHWorkflowForm action={addProviderMemberAction}>
      <EHFormSection title="Ansprechpartner hinzufügen" description="Ein eigener Zugang mit klarer Auftragsberechtigung.">
        <EHWorkflowStack>
          <EHField id="team-first" label="Vorname" required><EHInput id="team-first" name="firstName" autoComplete="given-name" required /></EHField>
          <EHField id="team-last" label="Nachname" required><EHInput id="team-last" name="lastName" autoComplete="family-name" required /></EHField>
          <EHField id="team-job" label="Funktion"><EHInput id="team-job" name="jobTitle" placeholder="z. B. Techniker" /></EHField>
          <EHField id="team-email" label="E-Mail" required><EHInput id="team-email" name="email" type="email" autoComplete="email" required /></EHField>
          <EHField id="team-phone" label="Telefon"><EHInput id="team-phone" name="phone" type="tel" autoComplete="tel" /></EHField>
          <EHField id="team-pass" label="Startpasswort" required hint="Mindestens 8 Zeichen. Damit kann sich der Ansprechpartner direkt anmelden."><EHInput id="team-pass" name="password" type="password" autoComplete="new-password" minLength={8} aria-describedby="team-pass-hint" required /></EHField>
        </EHWorkflowStack>
        <EHCheckbox label="Aufträge verwalten" name="canManageJobs" />
        <EHSubmitButton pendingLabel="Zugang wird angelegt …">Ansprechpartner anlegen</EHSubmitButton>
      </EHFormSection>
    </EHWorkflowForm></div>;

  const rolesSection = <WerkbankAbschnitt title="Rollen &amp; Rechte">
    <EHText muted>Jeder Ansprechpartner hat einen eigenen Zugang. „Aufträge verwalten“ erlaubt Angebote, Termine und Teampflege; ohne dieses Recht bleibt die Ansicht auf die eigenen zugewiesenen Vorgänge beschränkt.</EHText>
    <EHText muted>{ctx.canManageJobs
      ? `${managingMembers.length} von ${members.length} Zugängen dürfen Aufträge steuern.`
      : 'Dein Zugang sieht die Teamübersicht, Änderungen bleiben der Betriebsleitung vorbehalten.'}</EHText>
  </WerkbankAbschnitt>;

  return <WerkbankRahmen role="provider" active="/pro/team">
    <EHWorkflowStack>
      <WerkbankKopf title="Team" context={ctx.businessName} actions={ctx.canManageJobs ? <EHButton href="#team-anlegen" arrow>Ansprechpartner hinzufügen</EHButton> : undefined} />
      <WerkbankKennzahlen label="Team" items={[
        { id: 'personen', label: 'Ansprechpartner', value: members.length, hint: 'im Betrieb geführt' },
        { id: 'aktiv', label: 'Aktive Zugänge', value: activeMembers.length, hint: 'können sich anmelden' },
        { id: 'verwaltung', label: 'Auftragsverwaltung', value: managingMembers.length, hint: 'dürfen Aufträge steuern' },
        { id: 'deaktiviert', label: 'Deaktivierte Zugänge', value: members.length - activeMembers.length, hint: 'ohne App-Zugang' },
      ]} />
      {!ctx.canManageJobs && <EHFormFeedback kind="info">Du kannst die Teamübersicht ansehen. Änderungen sind Personen mit der Berechtigung „Aufträge verwalten“ vorbehalten.</EHFormFeedback>}
      {sp.error && <EHFormFeedback kind="error">{sp.error}</EHFormFeedback>}
      {sp.member === 'created' && <EHFormFeedback kind="success">Ansprechpartner wurde angelegt und kann sich direkt einloggen.</EHFormFeedback>}
      {/* Das Anlegeformular steht nur mit Auftragsverwaltung zur Verfügung.
          Die rechte Spalte bleibt trotzdem belegt: sie erklärt die Rollen. */}
      <WerkbankRaster main={memberSection} aside={<EHWorkflowStack>{rolesSection}{addMemberForm}</EHWorkflowStack>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
