import { BadgeCheck, CreditCard, FileCheck2, ShieldCheck } from 'lucide-react';
import { AppShell, SectionTitle } from '@/components/shell';
import { ProviderAccessBoundary, ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createStripeOnboardingAction, logoutAction } from '@/app/actions';
import { saveProviderProfileLifecycleAction, submitProviderVerificationAction } from './actions';
import { statusLabel } from '@/lib/format';
import { getProviderContext } from '@/lib/provider';
import { getPartnerActivationCheck } from '@/lib/partner-config';
import { InstallAppCard } from '@/components/install-app-card';
import {
  EHPanel, EHList, EHErrorState, EHStatus, EHText, EHActions, EHFormFeedback, EHPageHeader,
  EHWorkflowForm, EHFormSection, EHFieldGrid, EHField, EHInput, EHTextarea, EHSelect, EHCheckbox, EHSubmitButton,
} from '@/design-system';

function trustStatus(ok: boolean, label: string) {
  return <EHStatus tone={ok ? 'success' : 'warning'}>{ok ? `${label} geprüft` : `${label} offen`}</EHStatus>;
}

export default async function ProProfile({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const u = await requireUser('provider'); const sp = await searchParams; const ctx = getProviderContext(u.id);
  if (!ctx) {
    return <AppShell role="provider" active="/pro/profile" title="Profil & Vertrauen" subtitle="Zugang prüfen">
      <EHPageHeader title="Profil & Vertrauen" context="Zugang prüfen" />
      <ProviderState
        icon={<ShieldCheck size={21} />}
        title="Profil derzeit nicht verfügbar"
        description="Deinem Zugang ist kein aktiver Betrieb zugeordnet oder dein Teamzugang wurde deaktiviert. Bitte lass die Zuordnung durch deine Betriebsleitung prüfen."
        tone="unavailable"
        action={{ href: '/pro/hilfe', label: 'Hilfe zum Partnerzugang' }}
      />
    </AppShell>;
  }
  const p = db.prepare(`SELECT p.*,c.status contract_status,c.customer_discount_bps,c.insurance_verified,c.qualification_verified,c.contract_verified,c.quality_standard_verified,c.response_target_minutes,c.notes contract_notes
    FROM provider_profiles p LEFT JOIN partner_contracts c ON c.provider_id=p.user_id WHERE p.user_id=?`).get(ctx.providerId) as any;
  const v = db.prepare('SELECT * FROM verification_requests WHERE provider_id=?').get(ctx.providerId) as any;
  const activation = getPartnerActivationCheck(ctx.providerId);
  const subscription = db.prepare(`SELECT s.status,s.plan_slug,s.trial_end,p.title FROM partner_subscriptions s JOIN partner_plans p ON p.slug=s.plan_slug WHERE s.provider_id=?`).get(ctx.providerId) as any;
  const prefs = db.prepare('SELECT * FROM provider_preferences WHERE provider_id=?').get(ctx.providerId) as any;
  const emergencyDays = new Set(String(prefs?.emergency_days || '1,2,3,4,5,6,0').split(','));
  const categories = db.prepare(`SELECT slug,title,description FROM provider_categories WHERE active=1 ORDER BY CASE slug WHEN 'handwerk' THEN 1 WHEN 'dienstleistung' THEN 2 WHEN 'makler' THEN 3 WHEN 'gutachter' THEN 4 ELSE 9 END,title`).all() as any[];
  const selectedCategories = new Set((db.prepare(`SELECT category_slug FROM provider_category_assignments WHERE provider_id=?`).all(ctx.providerId) as Array<{ category_slug: string }>).map(r => r.category_slug));
  const services = db.prepare('SELECT slug,title,category FROM service_catalog WHERE active=1 ORDER BY category,title').all() as any[];
  const selectedServices = new Set((db.prepare(`SELECT service_slug FROM provider_service_offerings WHERE provider_id=? AND active=1`).all(ctx.providerId) as Array<{ service_slug: string }>).map(r => r.service_slug));
  const brokerProfile = db.prepare('SELECT * FROM broker_search_profiles WHERE provider_id=?').get(ctx.providerId) as any;
  return <AppShell role="provider" active="/pro/profile" title="Profil & Vertrauen" subtitle={p?.business_name || ctx.businessName}>
    <EHPageHeader title="Profil & Vertrauen" context={[p?.business_name || ctx.businessName, ctx.canManageJobs ? 'Änderungen möglich' : 'Nur Ansicht'].join(' · ')} />
    <ProviderAccessBoundary canManageJobs={ctx.canManageJobs} />
    <InstallAppCard />
    {sp.verification === 'submitted' && <EHFormFeedback kind="success">Unternehmensnachweise wurden eingereicht. Bis zur erneuten Freigabe werden keine neuen Anfragen verteilt.</EHFormFeedback>}
    {sp.verification === 'file' && <EHErrorState text="Bitte lade ein PDF, JPG, PNG oder WebP bis 12 MB hoch." />}
    {sp.verification === 'owner' && <EHFormFeedback kind="error">Unternehmensnachweise kann nur der Firmeninhaber verwalten.</EHFormFeedback>}
    {sp.profile === 'saved' && <EHFormFeedback kind="success">Profil und Anfrage-Einstellungen wurden gespeichert.</EHFormFeedback>}
    {sp.profile === 'review' && <EHFormFeedback kind="error">Firmen- oder Leistungsdaten wurden geändert. Die Partnerfreigabe ist pausiert, bis die Nachweise und Vertrags-/Qualitätschecks erneut bestätigt sind.</EHFormFeedback>}
    {sp.stripe === 'ready' && <EHFormFeedback kind="success">Auszahlungen sind vollständig eingerichtet.</EHFormFeedback>}
    {sp.stripe === 'incomplete' && <EHErrorState text="Stripe-Onboarding ist noch nicht vollständig abgeschlossen." />}
    {sp.stripe === 'missing' && <ProviderState icon={<CreditCard size={21} />} title="Auszahlungen derzeit nicht verfügbar" description="Die Stripe-Integration ist auf der Plattform noch nicht vollständig konfiguriert. Es wurde nichts an deinem Auszahlungsstatus geändert." tone="unavailable" />}
    {sp.stripe === 'owner' && <EHFormFeedback kind="error">Auszahlungen kann nur der Firmeninhaber einrichten.</EHFormFeedback>}

    <EHPanel title={p?.verified ? 'Unternehmen geprüft' : 'Unternehmensprüfung erforderlich'}>
      <EHText>{p?.verified ? 'Identität und eingereichte Unternehmensnachweise sind geprüft.' : v ? `Prüfstatus: ${statusLabel(v.status)}` : 'Gewerbe-, Qualifikations- und Versicherungsnachweise müssen geprüft werden.'}</EHText>
      {v?.admin_note && <EHText>Rückmeldung: {v.admin_note}</EHText>}
    </EHPanel>
    {ctx.isOwner && !p?.verified && <EHPanel title="Nachweise einreichen">
      <EHWorkflowForm action={submitProviderVerificationAction}>
        <EHField id="prov-doc" label="Nachweis" hint="PDF, JPG, PNG oder WebP bis 12 MB." required>
          <EHInput id="prov-doc" type="file" name="document" accept="application/pdf,image/jpeg,image/png,image/webp" required />
        </EHField>
        <EHField id="prov-note" label="Hinweis">
          <EHTextarea id="prov-note" name="note" rows={3} placeholder="Gewerbeanmeldung, Meister-/Qualifikationsnachweis, Versicherung …" />
        </EHField>
        <EHActions><EHSubmitButton pendingLabel="Wird eingereicht …">Zur Prüfung einreichen</EHSubmitButton></EHActions>
      </EHWorkflowForm>
    </EHPanel>}

    <SectionTitle>Firmenprofil & Leistungen</SectionTitle><EHList label="Firmenprofil" items={[{ id: 'wizard', title: 'Firmendaten-Wizard', text: 'Firmendaten, Leistungen und Arbeitsgebiet strukturiert pflegen', href: '/pro/onboarding' }]} />
    <SectionTitle>Partnervertrag & Standards</SectionTitle>
    <EHPanel title={activation.receivesNewJobs ? 'Aktiver Einfach-Hausen-Vertragspartner' : (p?.contract_status === 'active' ? 'Freigabe unvollständig' : `Vertragsstatus: ${statusLabel(p?.contract_status || 'pending')}`)}>
      {activation.receivesNewJobs ? <BadgeCheck aria-hidden="true" /> : <FileCheck2 aria-hidden="true" />}
      <EHText>Neue Anfragen gibt es nur bei freigegebener Unternehmensprüfung, aktivem Vertrag und vollständig bestätigten Qualitätschecks. Das Qualitätsmatching ist unabhängig vom gebuchten Partner-Tarif.</EHText>
      <EHActions>
        {trustStatus(activation.insuranceVerified, 'Versicherung')}
        {trustStatus(activation.qualificationVerified, 'Qualifikation')}
        {trustStatus(activation.contractVerified, 'Partnervertrag')}
        {trustStatus(activation.qualityStandardVerified, 'Qualitätsstandard')}
      </EHActions>
      {activation.missing.length > 0 && <EHText>Noch offen: {activation.missing.join(' · ')}</EHText>}
      {activation.receivesNewJobs && <EHText>0 % Provision · Reaktionsziel {p.response_target_minutes} Min.</EHText>}
    </EHPanel>

    <SectionTitle>Partner-Tarif</SectionTitle><EHList label="Partner-Tarif" items={[{ id: 'tarif', title: subscription?.title || 'Free', text: `${subscription?.status === 'trialing' ? 'Kostenlose Testphase aktiv.' : subscription?.status === 'active' ? 'Tarif aktiv.' : 'Free ist der Standardtarif.'} Alle Tarife: 0 % Provision und keine Gebühr pro Auftrag. Tarife ansehen oder ändern.`, href: '/pro/plans' }]} />

    <SectionTitle>Team</SectionTitle><EHList label="Team" items={[{ id: 'team', title: ctx.canManageJobs ? 'Ansprechpartner verwalten' : 'Team ansehen', text: ctx.canManageJobs ? 'Eigener App-Zugang für jeden Ansprechpartner. Nur ein Schalter entscheidet, wer neue Aufträge annehmen und verteilen darf.' : 'Du kannst die Ansprechpartner des Betriebs sehen. Änderungen an Zugängen und Auftragsberechtigungen sind für dich nicht verfügbar.', href: '/pro/team' }]} />

    {ctx.isOwner && <><SectionTitle>Auszahlungen</SectionTitle>
      <EHPanel title={p?.stripe_onboarded ? 'Stripe Connect aktiv' : 'Stripe Connect einrichten'}>
        <EHText>{p?.stripe_onboarded ? 'Der Betrieb erhält 100 % des Auftragswertes. Einfach Hausen berechnet keine Auftragsprovision.' : 'Für zentrale Plattformzahlungen muss der Firmeninhaber das Auszahlungs-Onboarding abschließen.'}</EHText>
        {!p?.stripe_onboarded && <EHActions><EHWorkflowForm action={createStripeOnboardingAction}><EHSubmitButton pendingLabel="Wird eingerichtet …">Stripe einrichten</EHSubmitButton></EHWorkflowForm></EHActions>}
      </EHPanel></>}

    <SectionTitle>Mein Profil</SectionTitle>
    <EHWorkflowForm action={saveProviderProfileLifecycleAction}>
      <EHFormSection title="Persönliche Angaben">
        <EHFieldGrid>
          <EHField id="prof-first" label="Vorname" required><EHInput id="prof-first" name="firstName" defaultValue={u.first_name} autoComplete="given-name" /></EHField>
          <EHField id="prof-last" label="Nachname" required><EHInput id="prof-last" name="lastName" defaultValue={u.last_name} autoComplete="family-name" /></EHField>
        </EHFieldGrid>
        <EHField id="prof-phone" label="Telefon"><EHInput id="prof-phone" name="phone" type="tel" defaultValue={u.phone || ''} autoComplete="tel" /></EHField>
      </EHFormSection>
      {ctx.canManageJobs && <>
        <EHFormSection title="Unternehmen" description="Firmendaten und Kontakt für Rechnungen und Kundenauftritte.">
          <EHField id="prof-business" label="Firmenname"><EHInput id="prof-business" name="businessName" defaultValue={p?.business_name || ''} /></EHField>
          <EHField id="prof-logo" label="Firmenlogo" hint="Optional."><EHInput id="prof-logo" name="logo" type="file" accept="image/*" /></EHField>
          <EHField id="prof-trades" label="Gewerke / Leistungen"><EHInput id="prof-trades" name="trades" defaultValue={p?.trades || ''} placeholder="z. B. Garten, Elektro, SHK" /></EHField>
          <EHField id="prof-address" label="Firmenanschrift" hint="Wird auf Rechnungen verwendet."><EHInput id="prof-address" name="streetAddress" defaultValue={p?.street_address || ''} placeholder="Straße Hausnr., PLZ Ort" /></EHField>
          <EHFieldGrid>
            <EHField id="prof-postcode" label="PLZ Einsatzgebiet"><EHInput id="prof-postcode" name="postcode" inputMode="numeric" defaultValue={p?.postcode || ''} /></EHField>
            <EHField id="prof-radius" label="Einsatzradius km"><EHInput id="prof-radius" name="radius" type="number" min={1} max={200} defaultValue={p?.radius_km || 25} /></EHField>
          </EHFieldGrid>
          <EHFieldGrid>
            <EHField id="prof-tax" label="Steuernummer"><EHInput id="prof-tax" name="taxId" defaultValue={p?.tax_id || ''} /></EHField>
            <EHField id="prof-vat" label="USt-IdNr."><EHInput id="prof-vat" name="vatId" defaultValue={p?.vat_id || ''} /></EHField>
          </EHFieldGrid>
          <EHField id="prof-description" label="Beschreibung"><EHTextarea id="prof-description" name="description" rows={4} defaultValue={p?.description || ''} /></EHField>
        </EHFormSection>
        <input type="hidden" name="providerCategoriesPresent" value="1" />
        <EHFormSection title="Was macht ihr?" description="Ein Konto, beliebig erweiterbar. Die Auswahl steuert passende Funktionen – nicht den Login.">
          {categories.map((c) => (
            <EHCheckbox key={c.slug} name="providerCategory" value={c.slug} defaultChecked={selectedCategories.has(c.slug)} label={<span><strong>{c.title}</strong>{c.description ? ` — ${c.description}` : ''}</span>} />
          ))}
        </EHFormSection>
        <input type="hidden" name="serviceProfilePresent" value="1" />
        <EHFormSection title="Konkretes Leistungsprofil" description="Damit passende Anfragen präziser gefunden werden können.">
          {services.map((s) => (
            <EHCheckbox key={s.slug} name="serviceSlug" value={s.slug} defaultChecked={selectedServices.has(s.slug)} label={s.title} />
          ))}
        </EHFormSection>
        <EHFormSection title="Anfragen-Einstellungen">
          <EHCheckbox name="acceptsNormalJobs" defaultChecked={prefs?.accepts_normal_jobs !== 0} label="Normale Aufträge" />
          <EHCheckbox name="acceptsShortNotice" defaultChecked={prefs?.accepts_short_notice !== 0} label="Kurzfristige Aufträge" />
          <EHCheckbox name="acceptsConsultation" defaultChecked={prefs?.accepts_consultation !== 0} label="Beratung / fachliche Fragen" />
          <EHCheckbox name="acceptsEmergencies" defaultChecked={!!prefs?.accepts_emergencies} label="Notfälle" />
          <EHFieldGrid>
            <EHField id="prof-opening" label="Öffnungszeiten"><EHInput id="prof-opening" name="openingHours" defaultValue={prefs?.opening_hours_text || ''} placeholder="Mo–Fr 08:00–18:00" /></EHField>
            <EHField id="prof-bookable" label="Terminzeiten"><EHInput id="prof-bookable" name="bookableHours" defaultValue={prefs?.bookable_hours_text || ''} placeholder="Mo–Fr 09:00–17:00" /></EHField>
          </EHFieldGrid>
        </EHFormSection>
        <EHFormSection title="Notfall-Bereitschaft">
          <EHFieldGrid>
            <EHField id="prof-em-mode" label="Modell">
              <EHSelect id="prof-em-mode" name="emergencyMode" defaultValue={prefs?.emergency_mode || 'local'}>
                <option value="local">Nur eigene Notfallzeiten</option>
                <option value="24_7">24/7 Notdienst</option>
              </EHSelect>
            </EHField>
            <EHField id="prof-em-start" label="Von"><EHInput id="prof-em-start" name="emergencyStart" type="time" defaultValue={prefs?.emergency_start || '18:00'} /></EHField>
            <EHField id="prof-em-end" label="Bis"><EHInput id="prof-em-end" name="emergencyEnd" type="time" defaultValue={prefs?.emergency_end || '22:00'} /></EHField>
          </EHFieldGrid>
          <div role="group" aria-label="Notfalltage">
            <EHText>Notfalltage</EHText>
            {([['1', 'Mo'], ['2', 'Di'], ['3', 'Mi'], ['4', 'Do'], ['5', 'Fr'], ['6', 'Sa'], ['0', 'So']] as Array<[string, string]>).map(([value, label]) => (
              <EHCheckbox key={value} name="emergencyDay" value={value} defaultChecked={emergencyDays.has(value)} label={label} />
            ))}
          </div>
          <EHField id="prof-em-markup" label="Max. Notfallzuschlag %"><EHInput id="prof-em-markup" name="emergencyMarkup" type="number" min={0} max={100} defaultValue={(prefs?.emergency_markup_bps || 0) / 100} /></EHField>
          <EHCheckbox name="instantBooking" defaultChecked={!!prefs?.instant_booking} label="Sofort buchbare Termine anbieten" />
          <EHField id="prof-capacity" label="Wöchentliche Kapazität (Aufträge)" hint="Leer = unbegrenzt."><EHInput id="prof-capacity" name="weeklyCapacity" type="number" min={1} max={200} defaultValue={prefs?.weekly_capacity ?? ''} placeholder="unbegrenzt" /></EHField>
        </EHFormSection>
        <details open={selectedCategories.has('makler')}>
          <summary>Makler-Suchprofil</summary>
          <input type="hidden" name="brokerProfilePresent" value="1" />
          <EHText>Nur relevant, wenn „Immobilienmakler“ als Tätigkeit aktiv ist. Dieses Profil wird für passende Immobilienanfragen verwendet.</EHText>
            <EHField id="prof-broker-regions" label="Regionen / PLZ"><EHInput id="prof-broker-regions" name="brokerRegions" defaultValue={brokerProfile?.regions_text || p?.postcode || ''} placeholder="z. B. 12, 13, Berlin, Potsdam" /></EHField>
            <EHField id="prof-broker-types" label="Immobilientypen"><EHInput id="prof-broker-types" name="brokerPropertyTypes" defaultValue={brokerProfile?.property_types_text || ''} placeholder="Einfamilienhaus, Wohnung, Mehrfamilienhaus" /></EHField>
            <EHFieldGrid>
              <EHField id="prof-broker-min-price" label="Kaufpreis ab €"><EHInput id="prof-broker-min-price" name="brokerMinPrice" type="number" min={0} step={10000} defaultValue={brokerProfile?.min_price != null ? brokerProfile.min_price / 100 : ''} /></EHField>
              <EHField id="prof-broker-max-price" label="Kaufpreis bis €"><EHInput id="prof-broker-max-price" name="brokerMaxPrice" type="number" min={0} step={10000} defaultValue={brokerProfile?.max_price != null ? brokerProfile.max_price / 100 : ''} /></EHField>
            </EHFieldGrid>
            <EHFieldGrid>
              <EHField id="prof-broker-min-living" label="Wohnfläche ab m²"><EHInput id="prof-broker-min-living" name="brokerMinLivingArea" type="number" min={0} defaultValue={brokerProfile?.min_living_area ?? ''} /></EHField>
              <EHField id="prof-broker-max-living" label="Wohnfläche bis m²"><EHInput id="prof-broker-max-living" name="brokerMaxLivingArea" type="number" min={0} defaultValue={brokerProfile?.max_living_area ?? ''} /></EHField>
            </EHFieldGrid>
            <EHFieldGrid>
              <EHField id="prof-broker-min-plot" label="Grundstück ab m²"><EHInput id="prof-broker-min-plot" name="brokerMinPlotArea" type="number" min={0} defaultValue={brokerProfile?.min_plot_area ?? ''} /></EHField>
              <EHField id="prof-broker-max-plot" label="Grundstück bis m²"><EHInput id="prof-broker-max-plot" name="brokerMaxPlotArea" type="number" min={0} defaultValue={brokerProfile?.max_plot_area ?? ''} /></EHField>
            </EHFieldGrid>
            <EHCheckbox name="brokerResidential" defaultChecked={brokerProfile?.residential !== 0} label="Wohnen" />
            <EHCheckbox name="brokerCommercial" defaultChecked={!!brokerProfile?.commercial} label="Gewerbe" />
            <EHField id="prof-broker-spec" label="Spezialisierungen"><EHTextarea id="prof-broker-spec" name="brokerSpecialties" rows={3} defaultValue={brokerProfile?.specialties || ''} placeholder="z. B. Altbau, Kapitalanlage, Luxusimmobilien" /></EHField>
        </details>
        <EHFormSection title="Datenschutzvereinbarung">
          <EHCheckbox name="privacyConsent" defaultChecked={!!brokerProfile?.privacyConsent} label="Ich stimme der Datenverarbeitung gemäß Art. 6 DSGVO zu" />
        </EHFormSection>
      </>}
      <EHActions><EHSubmitButton pendingLabel="Wird gespeichert …">Profil speichern</EHSubmitButton></EHActions>
    </EHWorkflowForm>
    <EHActions><EHWorkflowForm action={logoutAction}><EHSubmitButton pendingLabel="Wird abgemeldet …">Ausloggen</EHSubmitButton></EHWorkflowForm></EHActions>
  </AppShell>;
}
