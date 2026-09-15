import { Building2, UserRound } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { ProviderPageIntro, ProviderSectionHeader, ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { EHPanel, EHCallout, EHField, EHSelect } from '@/design-system';
import { db } from '@/lib/db';
import { getProviderContext } from '@/lib/provider';
import { providerHasCategory } from '@/lib/provider-categories';
import { euro } from '@/lib/format';
import { updateBrokerLeadStatusAction } from '@/app/actions';

export default async function ProLeads() {
  const user = await requireUser('provider');
  const ctx = getProviderContext(user.id);
  if (!ctx) return null;
  const broker = providerHasCategory(ctx.providerId, 'makler');

  if (!broker) {
    return (
      <AppShell role="provider" active="/pro" title="Immobilien-Leads" subtitle="Nur für passende Anbieter">
        <ProviderPageIntro eyebrow="Immobilien" title="Freigegebene Kontakte" description="Immobilienkontakte werden nur angezeigt, wenn die passende Tätigkeit aktiv ist und der Eigentümer ausdrücklich freigegeben hat." />
        <ProviderState
          icon={<Building2 size={21} />}
          title="Keine Makler-Kategorie aktiv"
          description="Wenn dein Unternehmen auch Immobilienvermittlung anbietet, kannst du die Tätigkeit im Partnerprofil ergänzen. Es bleibt dasselbe Konto."
          action={{ href: '/pro/profile', label: 'Partnerprofil öffnen' }}
        />
      </AppShell>
    );
  }

  const matches = db.prepare(`SELECT m.*,l.status lead_status,l.property_id,pr.address,pr.postcode,pr.property_type,pr.living_area,pr.plot_area,pr.estimated_value_min,pr.estimated_value_max,u.first_name,u.last_name,u.email,u.phone,s.permissions_json FROM broker_lead_matches m JOIN sale_leads l ON l.id=m.sale_lead_id JOIN properties pr ON pr.id=l.property_id JOIN users u ON u.id=l.homeowner_id JOIN property_shares s ON s.property_id=l.property_id AND s.provider_id=m.provider_id AND s.purpose='sale' AND s.status='active' WHERE m.provider_id=? ORDER BY m.updated_at DESC`).all(ctx.providerId) as any[];

  return (
    <AppShell role="provider" active="/pro/leads" title="Immobilien-Leads" subtitle="Nur ausdrücklich freigegebene Kontakte">
      <ProviderPageIntro
        eyebrow="Immobilien"
        title="Freigegebene Kontakte"
        description="Hier erscheint nur, was ein Eigentümer für diesen Verkaufszweck ausdrücklich freigegeben hat."
      />
      <EHCallout title="Nur freigegebene Daten"><p>Private Dokumente und vollständige Hausakten bleiben gesperrt. Die Freigabe ist zweckgebunden.</p></EHCallout>

      <ProviderSectionHeader title="Anfragen" description={`${matches.length} ${matches.length === 1 ? 'freigegebener Kontakt' : 'freigegebene Kontakte'}`} />
      {matches.map((match: any) => (
        <EHPanel key={match.id} title={`${match.property_type || 'Immobilie'} in ${match.postcode} — Passung ${Math.round(match.match_score)} % · Status ${match.status}`}>
          {/* The email is the contact detail the owner releases ("Ich gebe
              {Betrieb} meine Kontaktdaten und die Objektzusammenfassung ...").
              The move onto design-system blocks in db6acb0 dropped it from the
              render while the query kept selecting u.email - so a released lead
              carried no contact channel at all whenever the owner had no phone.
              Keep it next to the name, as it was before. */}
          <p>{match.address || match.postcode} · {match.first_name} {match.last_name}{match.email ? ` · ${match.email}` : ''}{match.phone ? ` · ${match.phone}` : ''} · {match.living_area ? `${match.living_area} m² Wohnfläche` : 'Fläche offen'} · {match.estimated_value_min != null && match.estimated_value_max != null ? `${euro(match.estimated_value_min)} – ${euro(match.estimated_value_max)}` : 'Noch nicht bewertet'}</p>
          <form action={updateBrokerLeadStatusAction.bind(null, match.id)}>
            <EHField id={`lead-status-${match.id}`} label="Nächster Schritt"><EHSelect id={`lead-status-${match.id}`} name="status" defaultValue={match.status === 'contact_released' ? 'interested' : match.status}>
              <option value="interested">Interesse bestätigt</option>
              <option value="inspection">Besichtigung</option>
              <option value="mandate">Auftrag erhalten</option>
              <option value="sold">Verkauft</option>
              <option value="rejected">Nicht passend</option>
            </EHSelect></EHField>
            <button className="btn primary">Status speichern</button>
          </form>
        </EHPanel>
      ))}
        {matches.length === 0 && (
          <ProviderState
            icon={<UserRound size={21} />}
            title="Noch keine freigegebenen Immobilienanfragen"
            description="Passende Eigentümer sehen dein Unternehmen zunächst als Vorschlag. Erst nach deren ausdrücklicher Freigabe erscheint der Kontakt hier."
          />
        )}
    </AppShell>
  );
}
