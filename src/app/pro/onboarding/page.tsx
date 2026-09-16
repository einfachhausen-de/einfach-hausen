import {AppShell} from "@/components/shell";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {getProviderContext} from "@/lib/provider";
import {saveWizardStepAction} from "./actions";
import {WIZARD_STEPS, STEP_LABELS} from "./wizard-steps";
import {
  EHPageHeader, EHWorkflowStack, EHWorkflowForm, EHWorkflowHeading, EHStepProgress,
  EHFormSection, EHFieldGrid, EHField, EHInput, EHSelect, EHTextarea, EHCheckbox,
  EHFormFeedback, EHSubmitButton, EHActions, EHTextLink, EHText, EHPanel, EHEmptyState,
} from "@/design-system";

export default async function ProviderOnboardingWizard({searchParams}: {
  searchParams: Promise<Record<string,string>>;
}) {
  const user=await requireUser("provider");
  const ctx=getProviderContext(user.id);
  if(!ctx || !ctx.isOwner) return <AppShell role="provider" active="/pro" title="Einrichtung">
    <EHPageHeader title="Einrichtung"/>
    <EHEmptyState title="Für den Firmeninhaber" text="Die Einrichtung kann nur der Firmeninhaber bearbeiten. Ansprechpartner erhalten ihre zugewiesenen Aufgaben im Partnerbereich."/>
    <EHTextLink href="/pro">Zum Partnerbereich</EHTextLink>
  </AppShell>;

  const sp=await searchParams;
  const requested=(sp.step || "firmendaten") as typeof WIZARD_STEPS[number];
  const step=WIZARD_STEPS.includes(requested)?requested:"firmendaten";
  const index=WIZARD_STEPS.indexOf(step);
  const profile=db.prepare("SELECT * FROM provider_profiles WHERE user_id=?").get(ctx.providerId) as {
    business_name?:string;legal_form?:string;founded_year?:number;employees?:string;
    website?:string;street_address?:string;description?:string;master_company?:number;
    postcode?:string;radius_km?:number;
  } | undefined;
  const selected=new Set((db.prepare("SELECT service_slug FROM provider_service_offerings WHERE provider_id=? AND active=1")
    .all(ctx.providerId) as {service_slug:string}[]).map(row=>row.service_slug));
  const catalog=db.prepare("SELECT slug,title,category FROM service_catalog WHERE active=1 ORDER BY category,title")
    .all() as {slug:string;title:string;category:string}[];
  const categories=[...new Set(catalog.map(service=>service.category))];
  const nextLabel=step==="abschluss"?"Abschließen":"Weiter";

  return <AppShell role="provider" active="/pro" title="Einrichtung" subtitle={ctx.businessName}>
    <EHWorkflowStack>
      <EHPageHeader title="Einrichtung" context={["Firmenkonto", ctx.businessName].join(" · ")}/>
      <EHStepProgress current={step} steps={WIZARD_STEPS.map(id=>({id,label:STEP_LABELS[id]}))}/>
      {sp.error && <EHFormFeedback kind="error">{sp.error}</EHFormFeedback>}
      <EHWorkflowHeading title={STEP_LABELS[step]}/>
      <EHWorkflowForm action={saveWizardStepAction}>
        <input type="hidden" name="step" value={step}/>
        {step==="firmendaten" && <>
          <EHFormSection title="Dein Betrieb">
            <EHField id="business-name" label="Firmenname" required><EHInput id="business-name" name="businessName" defaultValue={profile?.business_name || ctx.businessName} required maxLength={120} autoComplete="organization"/></EHField>
            <EHFieldGrid>
              <EHField id="legal-form" label="Rechtsform"><EHSelect id="legal-form" name="legalForm" defaultValue={profile?.legal_form || "GmbH"}>{["GmbH","GbR","Einzelunternehmen","UG","AG","Freiberufler"].map(value=><option key={value}>{value}</option>)}</EHSelect></EHField>
              <EHField id="founded-year" label="Gründungsjahr"><EHInput id="founded-year" name="foundedYear" type="number" min={1800} max={2100} defaultValue={profile?.founded_year || ""}/></EHField>
              <EHField id="employees" label="Mitarbeiterzahl"><EHSelect id="employees" name="employees" defaultValue={profile?.employees || "8–15"}>{["1–3","4–7","8–15","16–30","30+"].map(value=><option key={value}>{value}</option>)}</EHSelect></EHField>
              <EHField id="website" label="Webseite"><EHInput id="website" name="website" defaultValue={profile?.website || ""} maxLength={160} autoComplete="url"/></EHField>
            </EHFieldGrid>
            <EHField id="street-address" label="Firmensitz / Adresse"><EHInput id="street-address" name="streetAddress" defaultValue={profile?.street_address || ""} maxLength={160} autoComplete="street-address"/></EHField>
            <EHTextLink href="/pro/profile">Telefonnummer im Profil bearbeiten</EHTextLink>
          </EHFormSection>
          <EHFormSection title="Über dein Unternehmen">
            <EHField id="business-description" label="Beschreibung" hint="Maximal 500 Zeichen."><EHTextarea id="business-description" name="description" defaultValue={profile?.description || ""} maxLength={500} aria-describedby="business-description-hint"/></EHField>
            <EHCheckbox name="masterCompany" label="Eingetragener Meisterbetrieb" defaultChecked={Boolean(profile?.master_company)}/>
          </EHFormSection>
        </>}
        {step==="leistungen" && <>
          {categories.map(category=><EHFormSection key={category} title={category}>
            <EHFieldGrid>{catalog.filter(service=>service.category===category).map(service=>
              <EHCheckbox key={service.slug} name="serviceSlug" value={service.slug} label={service.title} defaultChecked={selected.has(service.slug)}/>
            )}</EHFieldGrid>
          </EHFormSection>)}
          {!catalog.length && <EHFormFeedback kind="info">Der Leistungskatalog ist aktuell leer. Bitte versuche es später erneut.</EHFormFeedback>}
          <EHField id="other-services" label="Weitere Leistungen" hint="Wird als Beschreibung ergänzt, wenn noch keine Unternehmensbeschreibung vorhanden ist.">
            <EHInput id="other-services" name="otherServices" maxLength={400} aria-describedby="other-services-hint"/>
          </EHField>
        </>}
        {step==="arbeitsgebiet" && <EHFormSection title="Wo du arbeitest">
          <EHFieldGrid>
            <EHField id="work-postcode" label="Postleitzahl im Zentrum" required><EHInput id="work-postcode" name="postcode" inputMode="numeric" autoComplete="postal-code" maxLength={10} defaultValue={profile?.postcode || ""} required/></EHField>
            <EHField id="work-radius" label="Einsatzradius in Kilometern" hint="Zwischen 1 und 200 Kilometern."><EHInput id="work-radius" name="radius" type="number" min={1} max={200} step={1} defaultValue={profile?.radius_km || 25} aria-describedby="work-radius-hint"/></EHField>
          </EHFieldGrid>
        </EHFormSection>}
        {step==="abschluss" && <EHPanel title="Deine gespeicherten Betriebsangaben">
          <EHWorkflowStack>
            <EHText>{profile?.business_name || ctx.businessName}</EHText>
            <EHText>{[profile?.legal_form,profile?.founded_year && "Gegründet "+profile.founded_year,profile?.employees && profile.employees+" Mitarbeiter"].filter(Boolean).join(" · ")}</EHText>
            {profile?.street_address && <EHText>{profile.street_address}</EHText>}
            <EHText>{selected.size} Leistungen ausgewählt{profile?.postcode ? " · "+profile.postcode : ""}{profile?.radius_km ? " · "+profile.radius_km+" km Radius" : ""}</EHText>
          </EHWorkflowStack>
        </EHPanel>}
        <EHActions>
          <EHSubmitButton disabled={step==="leistungen" && catalog.length===0}>{nextLabel}</EHSubmitButton>
          {index>0 && <EHTextLink href={"/pro/onboarding?step="+WIZARD_STEPS[index-1]}>Vorheriger Schritt</EHTextLink>}
          <EHTextLink href="/pro">Zur Übersicht ohne diesen Schritt zu speichern</EHTextLink>
        </EHActions>
      </EHWorkflowForm>
    </EHWorkflowStack>
  </AppShell>;
}
