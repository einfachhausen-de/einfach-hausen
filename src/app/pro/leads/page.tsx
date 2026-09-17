import { Building2 } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { requireUser } from '@/lib/auth';
import { EHMetricsBar, EHButton, EHEmptyState, EHPageHeader, EHRecordList, EHStatus, EHCallout, EHField, EHSelect, EHSubmitButton, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';
import { getProviderContext } from '@/lib/provider';
import { providerHasCategory } from '@/lib/provider-categories';
import { euro } from '@/lib/format';
import { updateBrokerLeadStatusAction } from '@/app/actions';

const NEXT_STEPS = [
  { value: 'interested', label: 'Interesse bestätigt' },
  { value: 'inspection', label: 'Besichtigung' },
  { value: 'mandate', label: 'Auftrag erhalten' },
  { value: 'sold', label: 'Verkauft' },
  { value: 'rejected', label: 'Nicht passend' },
] as const;

/** Status der Freigabe; 'contact_released' ist der Startpunkt jedes Kontakts. */
const STATUS_LABEL: Record<string, string> = {
  contact_released: 'Freigegeben',
  ...Object.fromEntries(NEXT_STEPS.map((step) => [step.value, step.label] as const)),
};

export default async function ProLeads() {
  const user = await requireUser('provider');
  const ctx = getProviderContext(user.id);

  if (!ctx) {
    return (
      <WerkbankRahmen role="provider" active="/pro/leads">
        <EHEmptyState
          title="Keinem Unternehmen zugeordnet"
          text="Dein Zugang ist aktuell keinem aktiven Partnerunternehmen zugeordnet. Freigegebene Immobilienkontakte können deshalb nicht angezeigt werden."
          action={<EHButton href="/pro/hilfe" variant="secondary">Hilfe & Kontakt</EHButton>}
        />
      </WerkbankRahmen>
    );
  }

  const broker = providerHasCategory(ctx.providerId, 'makler');

  if (!broker) {
    return (
      <WerkbankRahmen role="provider" active="/pro/leads">
        <EHPageHeader title="Freigegebene Kontakte" context="Nur für passende Anbieter" />
        <EHEmptyState
          title="Keine Makler-Kategorie aktiv"
          text="Wenn dein Unternehmen auch Immobilienvermittlung anbietet, kannst du die Tätigkeit im Partnerprofil ergänzen. Es bleibt dasselbe Konto."
          action={<EHButton href="/pro/profile" variant="secondary">Partnerprofil öffnen</EHButton>}
        />
      </WerkbankRahmen>
    );
  }

  const matches = db.prepare(`SELECT m.*,l.status lead_status,l.property_id,pr.address,pr.postcode,pr.property_type,pr.living_area,pr.plot_area,pr.estimated_value_min,pr.estimated_value_max,u.first_name,u.last_name,u.email,u.phone,s.permissions_json FROM broker_lead_matches m JOIN sale_leads l ON l.id=m.sale_lead_id JOIN properties pr ON pr.id=l.property_id JOIN users u ON u.id=l.homeowner_id JOIN property_shares s ON s.property_id=l.property_id AND s.provider_id=m.provider_id AND s.purpose='sale' AND s.status='active' WHERE m.provider_id=? ORDER BY m.updated_at DESC`).all(ctx.providerId) as any[];

  const items: EHRecordEntry[] = matches.map((match: any) => {
    const title = `${match.property_type || 'Immobilie'} in ${match.postcode}`;
    return {
      id: String(match.id),
      title,
      // The email is the contact detail the owner releases ("Ich gebe
      //     {Betrieb} meine Kontaktdaten und die Objektzusammenfassung ...").
      // Keep it next to the name, together with the phone: a released lead
      // carried no contact channel at all whenever the owner had no phone.
      detail: [match.address || match.postcode, `${match.first_name} ${match.last_name}`, match.email, match.phone, match.living_area ? `${match.living_area} m² Wohnfläche` : 'Fläche offen', match.estimated_value_min != null && match.estimated_value_max != null ? `${euro(match.estimated_value_min)} – ${euro(match.estimated_value_max)}` : 'Noch nicht bewertet'].filter(Boolean).join(' · '),
      value: `Passung ${Math.round(match.match_score)} %`,
      status: <EHStatus>{match.status}</EHStatus>,
      icon: <Building2 size={20} />,
      action: (
        <form action={updateBrokerLeadStatusAction.bind(null, match.id)}>
          <EHField id={`lead-status-${match.id}`} label="Nächster Schritt">
            <EHSelect id={`lead-status-${match.id}`} name="status" defaultValue={match.status === 'contact_released' ? 'interested' : match.status}>
              {NEXT_STEPS.map((step) => <option key={step.value} value={step.value}>{step.label}</option>)}
            </EHSelect>
          </EHField>
          <EHSubmitButton pendingLabel="Wird gespeichert…">Status speichern</EHSubmitButton>
        </form>
      ),
    };
  });

  // Die Verteilung liest denselben Status wie die Auswahlliste in jeder Zeile:
  // sie zeigt, wie weit die freigegebenen Kontakte gediehen sind.
  const byStatus = new Map<string, number>();
  for (const match of matches) {
    const key = String(match.status);
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
  }

  return (
    <WerkbankRahmen role="provider" active="/pro/leads">
      <EHPageHeader title="Freigegebene Kontakte" context={`${matches.length} ${matches.length === 1 ? 'freigegebener Kontakt' : 'freigegebene Kontakte'}`} />
      <EHCallout title="Nur freigegebene Daten"><EHText>Private Dokumente und vollständige Hausakten bleiben gesperrt. Die Freigabe ist zweckgebunden.</EHText></EHCallout>

      {matches.length > 0 && (
        <EHMetricsBar label="Freigegebene Kontakte" items={[
          { id: 'kontakte', label: 'Freigegebene Kontakte', value: matches.length },
          { id: 'besichtigung', label: 'Besichtigung', value: matches.filter((match) => match.status === 'inspection').length },
          { id: 'mandat', label: 'Auftrag erhalten', value: matches.filter((match) => match.status === 'mandate').length },
          { id: 'verkauft', label: 'Verkauft', value: matches.filter((match) => match.status === 'sold').length },
        ]} />
      )}

      <EHWorkspaceGrid main={matches.length > 0
        ? <EHRecordList label="Freigegebene Immobilienkontakte" items={items} />
        : <EHEmptyState
            title="Noch keine freigegebenen Immobilienanfragen"
            text="Passende Eigentümer sehen dein Unternehmen zunächst als Vorschlag. Erst nach deren ausdrücklicher Freigabe erscheint der Kontakt hier."
          />} aside={<>
        <EHWorkSection title="Nach Status">
          <EHRecordList label="Freigegebene Kontakte nach Status" empty="Noch kein Kontakt freigegeben." items={Array.from(byStatus.entries()).sort((a, b) => b[1] - a[1]).map(([status, count]) => ({
            id: `status-${status}`,
            title: STATUS_LABEL[status] ?? status,
            detail: `${count} ${count === 1 ? 'Kontakt' : 'Kontakte'}`,
          }))} />
        </EHWorkSection>
        <EHWorkSection title="Vermittlung">
          <EHText muted>Ein Kontakt entsteht erst mit der Freigabe durch den Eigentümer. Den Fortgang hältst du in der Zeile links fest; die Hausakte des Eigentümers bleibt davon getrennt.</EHText>
          <EHButton href="/pro/profile" variant="secondary" arrow>Partnerprofil prüfen</EHButton>
        </EHWorkSection>
      </>} />
    </WerkbankRahmen>
  );
}
