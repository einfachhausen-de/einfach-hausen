import { CalendarClock, Wrench } from 'lucide-react';
import {
  EHButton, EHEmptyState, EHText, EHPropertyOverview, EHDetailDisclosure,
  EHWorkspaceGrid, EHWorkSection, EHWorkflowStack,
  EHSubmitButton, EHMetricsBar, EHPageHeader, EHRecordList, EHStatus,
} from '@/design-system';
import { HouseProfileForm, HouseAssetForm, HOUSE_ASSET_KINDS } from '@/components/homeowner/house-profile-forms';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { addHouseAssetAction, completeMaintenanceTaskAction, saveHouseProfileAction } from '@/app/actions';
import { dateLabel } from '@/lib/format';
import { ownerMaintenanceState } from '@/lib/owner-format';
import { primaryProperty } from '@/lib/properties';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';

export default async function MyHome() {
  const u=await requireUser('homeowner'); const p=db.prepare('SELECT * FROM homeowner_profiles WHERE user_id=?').get(u.id) as any; const property=primaryProperty(u.id);
  const assets=property?db.prepare('SELECT * FROM house_assets WHERE property_id=? ORDER BY created_at DESC').all(property.id) as any[]:[];
  const tasks=property?db.prepare("SELECT * FROM maintenance_tasks WHERE property_id=? AND status='open' ORDER BY due_date LIMIT 8").all(property.id) as any[]:[];
  const docs=db.prepare(`SELECT COUNT(*) c FROM documents d JOIN jobs j ON j.id=d.job_id WHERE j.homeowner_id=? AND d.kind!='invoice'`).get(u.id) as any;
  const invoiceCount=(db.prepare(`SELECT COUNT(*) c FROM invoices WHERE homeowner_id=?`).get(u.id) as {c:number}).c;
  // Zwei Kennzahlen: was an Pflege ansteht und was an Belegen da ist.
  const openTaskCount=property?(db.prepare(`SELECT COUNT(*) c FROM maintenance_tasks WHERE property_id=? AND status='open'`).get(property.id) as {c:number}).c:0;
  const overdueTaskCount=property?(db.prepare(`SELECT COUNT(*) c FROM maintenance_tasks WHERE property_id=? AND status='open' AND date(due_date)<date('now')`).get(property.id) as {c:number}).c:0;
  const profileFacts=[p?.address,p?.build_year,p?.living_area,p?.plot_area];
  const profileFilled=profileFacts.filter(value=>value!==null&&value!==undefined&&value!=='').length;
  const profileGaps=[
    ...(p?.address?[]:[{id:'address',title:'Adresse'}]),
    ...(p?.build_year?[]:[{id:'build_year',title:'Baujahr'}]),
    ...(p?.living_area?[]:[{id:'living_area',title:'Wohnfläche'}]),
    ...(p?.plot_area?[]:[{id:'plot_area',title:'Grundstück'}]),
  ];
  const surroundings=[p?.postcode, p?.house_type].filter(Boolean).join(' · ');
  return <WerkbankRahmen role="homeowner" active="/app/home">
    <EHWorkflowStack>
      <EHPageHeader title={p?.address || 'Hausdaten ergänzen'} context={surroundings || undefined}
        actions={<EHButton href="/app/year" variant="secondary">Jahresplan öffnen</EHButton>} />
      <EHMetricsBar label="Mein Haus" items={[
        { id: 'pflege', label: 'Pflege offen', value: String(openTaskCount), hint: overdueTaskCount > 0 ? `${overdueTaskCount} überfällig` : 'nichts überfällig' },
        { id: 'belege', label: 'Belege', value: String(docs.c + invoiceCount), hint: 'Dokumente & Rechnungen' },
      ]} />
      <EHPropertyOverview title="Hausdaten"
        facts={[
          { label: 'Baujahr', value: p?.build_year ? String(p.build_year) : 'Nicht erfasst' },
          { label: 'Wohnfläche', value: p?.living_area ? p.living_area + ' m²' : 'Nicht erfasst' },
          { label: 'Grundstück', value: p?.plot_area ? p.plot_area + ' m²' : 'Nicht erfasst' },
          { label: 'Geräte', value: assets.length + ' erfasst' },
        ]} />
      <EHWorkspaceGrid main={<>
        <EHWorkSection title="Technik & Ausstattung">
          {assets.length > 0 ? <EHRecordList label="Deine Geräte" items={assets.map(a => ({
            id: String(a.id), title: a.name,
            detail: [HOUSE_ASSET_KINDS[a.kind] || a.kind, a.installed_year ? `Installiert ${a.installed_year}` : null, a.details].filter(Boolean).join(' · '),
            icon: <Wrench size={20} />,
          }))} /> : <EHEmptyState title="Deine Ausstattung ist noch nicht erfasst" text="Beginne zum Beispiel mit deiner Heizung oder PV-Anlage. Hersteller und Modell kannst du direkt ergänzen." />}
          <EHDetailDisclosure id="technik-anlegen" title="Gerät hinzufügen" description="Heizung, PV-Anlage oder anderes Gerät erfassen">
            <HouseAssetForm action={addHouseAssetAction} />
          </EHDetailDisclosure>
        </EHWorkSection>
        {tasks.length > 0 && <EHWorkSection title="Anstehende Pflege" link={{ href: '/app/year', label: 'Alle ansehen' }}>
          <EHRecordList label="Anstehende Pflege" items={tasks.slice(0, 4).map(t => {
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
      </>} aside={<>
        <EHWorkSection title="Noch fehlt" link={{ href: '#hausprofil', label: 'Hausdaten bearbeiten' }}>
          <EHText muted>{assets.length} {assets.length === 1 ? 'Gerät' : 'Geräte'} · {profileFilled} von 4 Hausdaten erfasst</EHText>
          <EHRecordList label="Fehlende Hausdaten" items={profileGaps} empty="Alle Hausdaten sind erfasst." />
        </EHWorkSection>
      </>} />
      <EHDetailDisclosure id="hausprofil" title="Hausdaten bearbeiten" description="Adresse, Gebäude und Flächen">
        <HouseProfileForm action={saveHouseProfileAction} profile={p} />
      </EHDetailDisclosure>
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
