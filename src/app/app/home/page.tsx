import { CalendarClock, CalendarDays, Wrench } from 'lucide-react';
import { AppShell } from '@/components/shell';
import {
  EHButton, EHEmptyState, EHText, EHPropertyOverview, EHDetailDisclosure,
  EHWorkspaceGrid, EHWorkSection, EHWorkflowStack,
  EHSubmitButton, EHMetricsBar, EHPageHeader, EHRecordViews, EHStatus,
} from '@/design-system';
import { HouseProfileForm, HouseAssetForm, HOUSE_ASSET_KINDS } from '@/components/homeowner/house-profile-forms';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { addHouseAssetAction, completeMaintenanceTaskAction, saveHouseProfileAction } from '@/app/actions';
import { dateLabel } from '@/lib/format';
import { ownerMaintenanceState } from '@/lib/owner-format';
import { primaryProperty } from '@/lib/properties';

export default async function MyHome() {
  const u=await requireUser('homeowner'); const p=db.prepare('SELECT * FROM homeowner_profiles WHERE user_id=?').get(u.id) as any; const property=primaryProperty(u.id);
  const assets=property?db.prepare('SELECT * FROM house_assets WHERE property_id=? ORDER BY created_at DESC').all(property.id) as any[]:[];
  const tasks=property?db.prepare("SELECT * FROM maintenance_tasks WHERE property_id=? AND status='open' ORDER BY due_date LIMIT 8").all(property.id) as any[]:[];
  const appointments=db.prepare(`SELECT a.*,j.title,p.business_name FROM appointments a JOIN jobs j ON j.id=a.job_id JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.homeowner_id=? AND a.status='confirmed' ORDER BY a.start_at LIMIT 3`).all(u.id) as any[];
  const docs=db.prepare(`SELECT COUNT(*) c FROM documents d JOIN jobs j ON j.id=d.job_id WHERE j.homeowner_id=?`).get(u.id) as any;
  const invoiceCount=(db.prepare(`SELECT COUNT(*) c FROM invoices WHERE homeowner_id=?`).get(u.id) as {c:number}).c;
  const historyCount=property?(db.prepare(`SELECT COUNT(*) c FROM house_history_entries WHERE property_id=?`).get(property.id) as {c:number}).c:0;
  const surroundings=[p?.postcode, p?.house_type].filter(Boolean).join(' · ');
  return <AppShell role="homeowner" active="/app/home" title="Hausakte">
    <EHWorkflowStack>
      <EHPageHeader title={p?.address || 'Hausdaten ergänzen'} context={surroundings || undefined}
        actions={<EHButton href="/app/year" variant="secondary">Jahresplan öffnen</EHButton>} />
      <EHMetricsBar label="Hausakte" items={[
        { id: 'assets', label: 'Technik & Geräte', value: assets.length },
        { id: 'papers', label: 'Dokumente & Rechnungen', value: docs.c + invoiceCount },
        { id: 'works', label: 'Frühere Arbeiten', value: historyCount },
      ]} />
      <EHPropertyOverview title="Hausdaten"
        facts={[
          { label: 'Baujahr', value: p?.build_year ? String(p.build_year) : 'Nicht erfasst' },
          { label: 'Wohnfläche', value: p?.living_area ? p.living_area + ' m²' : 'Nicht erfasst' },
          { label: 'Grundstück', value: p?.plot_area ? p.plot_area + ' m²' : 'Nicht erfasst' },
          { label: 'Technik', value: assets.length + ' erfasst' },
        ]} />
      <section id="technik" aria-label="Technik und Ausstattung">
        <EHWorkspaceGrid main={<>
          <EHWorkSection title="Technik & Ausstattung">
            {assets.length > 0 ? <EHRecordViews label="Hinterlegte Technik" storageKey="hausakte" items={assets.map(a => ({
              id: String(a.id), title: a.name,
              detail: [HOUSE_ASSET_KINDS[a.kind] || a.kind, a.installed_year ? `Installiert ${a.installed_year}` : null, a.details].filter(Boolean).join(' · '),
              icon: <Wrench size={20} />,
            }))} /> : <EHEmptyState title="Deine Ausstattung ist noch nicht erfasst" text="Beginne zum Beispiel mit deiner Heizung oder PV-Anlage. Hersteller und Modell kannst du direkt ergänzen." />}
            {tasks.length > 0 && <EHWorkSection title="Nächste Wartungen" link={{ href: '/app/year', label: 'Alle ansehen' }}>
              <EHRecordViews label="Offene Wartungen" storageKey="hausakte" items={tasks.slice(0, 4).map(t => {
                const state = ownerMaintenanceState(t.due_date);
                return {
                  id: String(t.id), title: t.title, detail: `Fällig ${dateLabel(t.due_date)}`, date: t.due_date ?? undefined,
                  status: state.includes('überfällig') ? <EHStatus tone="warning">{state}</EHStatus> : undefined,
                  icon: <CalendarClock size={20} />,
                  action: <form action={completeMaintenanceTaskAction.bind(null, t.id)} aria-label={`${t.title} abschließen`}>
                    <EHSubmitButton pendingLabel="Wird abgeschlossen …">Erledigt</EHSubmitButton>
                  </form>,
                };
              })} />
            </EHWorkSection>}
          </EHWorkSection>
        </>} aside={<EHWorkSection title="Termine" link={{ href: '/app/year', label: 'Jahresplan' }}>
          {appointments.length ? <EHRecordViews label="Bestätigte Termine" storageKey="hausakte" items={appointments.map(a => ({
            id: String(a.id), title: a.title, detail: a.business_name, dateLabel: dateLabel(a.start_at), href: '/app/jobs/' + a.job_id, icon: <CalendarDays size={20} />,
          }))} /> : <EHText muted>Keine bestätigten Termine hinterlegt.</EHText>}
          <EHDetailDisclosure id="technik-anlegen" title="Technik hinzufügen" description="Gerät, Anlage oder Ausstattung erfassen">
            <HouseAssetForm action={addHouseAssetAction} />
          </EHDetailDisclosure>
        </EHWorkSection>} />
      </section>
      <EHDetailDisclosure id="hausprofil" title="Hausdaten bearbeiten" description="Adresse, Gebäude und Flächen">
        <HouseProfileForm action={saveHouseProfileAction} profile={p} />
      </EHDetailDisclosure>
    </EHWorkflowStack>
  </AppShell>;
}
