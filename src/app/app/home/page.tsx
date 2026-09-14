import { CalendarDays, FileText, History, House, NotebookPen, Receipt, TrendingUp, Wrench } from 'lucide-react';
import { AppShell } from '@/components/shell';
import {
  EHAppHeader, EHList, EHEmptyState, EHButton, EHText, EHPropertyOverview, EHDetailDisclosure,
  EHWorkspaceGrid, EHWorkSection, EHWorkMetrics, EHWorkflowStack,
  EHServiceDirectory, EHSubmitButton,
} from '@/design-system';
import { HouseProfileForm, HouseAssetForm, HOUSE_ASSET_KINDS } from '@/components/homeowner/house-profile-forms';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { addHouseAssetAction, completeMaintenanceTaskAction, saveHouseProfileAction } from '@/app/actions';
import { dateLabel } from '@/lib/format';
import { primaryProperty } from '@/lib/properties';

export default async function MyHome() {
  const u=await requireUser('homeowner'); const p=db.prepare('SELECT * FROM homeowner_profiles WHERE user_id=?').get(u.id) as any; const property=primaryProperty(u.id);
  const assets=property?db.prepare('SELECT * FROM house_assets WHERE property_id=? ORDER BY created_at DESC').all(property.id) as any[]:[];
  const tasks=property?db.prepare("SELECT * FROM maintenance_tasks WHERE property_id=? AND status='open' ORDER BY due_date LIMIT 8").all(property.id) as any[]:[];
  const appointments=db.prepare(`SELECT a.*,j.title,p.business_name FROM appointments a JOIN jobs j ON j.id=a.job_id JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.homeowner_id=? AND a.status='confirmed' ORDER BY a.start_at LIMIT 3`).all(u.id) as any[];
  const docs=db.prepare(`SELECT COUNT(*) c FROM documents d JOIN jobs j ON j.id=d.job_id WHERE j.homeowner_id=?`).get(u.id) as any;
  const invoiceCount=(db.prepare(`SELECT COUNT(*) c FROM invoices WHERE homeowner_id=?`).get(u.id) as {c:number}).c;
  const historyCount=property?(db.prepare(`SELECT COUNT(*) c FROM house_history_entries WHERE property_id=?`).get(property.id) as {c:number}).c:0;
  return <AppShell role="homeowner" active="/app/home" title="Mein Haus" subtitle="Deine digitale Hausakte">
    <EHWorkflowStack>
      <EHAppHeader eyebrow="Digitale Hausakte" title="Mein Haus" text="Dein Gebäude, deine Technik und die nächsten Schritte im Überblick."
        actions={<EHButton href="/app/year" variant="secondary">Jahresplan öffnen</EHButton>} />
      <EHPropertyOverview title={p?.address || 'Hausdaten ergänzen'} subtitle={[p?.postcode, p?.house_type].filter(Boolean).join(' · ')}
        facts={[
          { label: 'Baujahr', value: p?.build_year ? String(p.build_year) : 'Nicht erfasst' },
          { label: 'Wohnfläche', value: p?.living_area ? p.living_area + ' m²' : 'Nicht erfasst' },
          { label: 'Grundstück', value: p?.plot_area ? p.plot_area + ' m²' : 'Nicht erfasst' },
          { label: 'Technik', value: assets.length + ' erfasst' },
        ]} />
      <EHWorkMetrics items={[
        { label: 'Technik & Geräte', value: assets.length, href: '#technik' },
        { label: 'Dokumente & Rechnungen', value: docs.c + invoiceCount, href: '/app/documents' },
        { label: 'Frühere Arbeiten', value: historyCount, href: '/app/home/history' },
      ]} />
      <section id="technik" aria-label="Technik und Ausstattung">
        <EHWorkspaceGrid main={<EHWorkSection title="Technik & Ausstattung">
          {assets.length > 0 ? <EHList label="Hinterlegte Technik" items={assets.map(a => ({
            id: String(a.id), title: a.name,
            text: [HOUSE_ASSET_KINDS[a.kind] || a.kind, a.installed_year ? `Installiert ${a.installed_year}` : null, a.details].filter(Boolean).join(' · '),
          }))} /> : <EHEmptyState title="Deine Ausstattung ist noch nicht erfasst" text="Beginne zum Beispiel mit deiner Heizung oder PV-Anlage. Hersteller und Modell kannst du direkt ergänzen." />}
          {tasks.length > 0 && <EHWorkSection title="Nächste Wartungen" link={{ href: '/app/year', label: 'Alle ansehen' }}>
            <EHList label="Offene Wartungen" items={tasks.slice(0, 4).map(t => ({
              id: String(t.id), title: t.title, text: `Fällig ${dateLabel(t.due_date)}`,
              action: <form action={completeMaintenanceTaskAction.bind(null, t.id)} aria-label={`${t.title} abschließen`}>
                <EHSubmitButton pendingLabel="Wird abgeschlossen …">Erledigt</EHSubmitButton>
              </form>,
            }))} />
          </EHWorkSection>}
        </EHWorkSection>} aside={<EHWorkSection title="Termine" link={{ href: '/app/year', label: 'Jahresplan' }}>
          {appointments.length ? <EHList label="Bestätigte Termine" items={appointments.map(a => ({
            id: String(a.id), title: a.title, text: a.business_name + ' · ' + dateLabel(a.start_at), href: '/app/jobs/' + a.job_id,
          }))} /> : <EHText muted>Keine bestätigten Termine hinterlegt.</EHText>}
          <EHDetailDisclosure id="technik-anlegen" title="Technik hinzufügen" description="Gerät, Anlage oder Ausstattung erfassen">
            <HouseAssetForm action={addHouseAssetAction} />
          </EHDetailDisclosure>
        </EHWorkSection>} />
      </section>
      <EHDetailDisclosure id="hausprofil" title="Hausdaten bearbeiten" description="Adresse, Gebäude und Flächen">
        <HouseProfileForm action={saveHouseProfileAction} profile={p} />
      </EHDetailDisclosure>
      <EHWorkSection title="Deine Hausakte weiterführen">
          <EHServiceDirectory groups={[{ title: 'Wissen & Unterlagen', items: [
            { href: '/app/home/history', title: 'Hausgeschichte', text: 'Frühere Arbeiten, Kosten und Ansprechpartner dokumentieren.', icon: <History /> },
            { href: '/app/home/passport', title: 'Hauspass', text: 'Deine Hausdaten als druckbare Übersicht ansehen.', icon: <House /> },
          ] }, { title: 'Kosten & Verträge', items: [
            { href: '/app/contracts', title: 'Verträge & Tarife', text: 'Laufende Verträge, Kündigungsfristen und Spar-Check.', icon: <Receipt /> },
            { href: '/app/documents', title: 'Dokumente & Rechnungen', text: 'Nachweise und Unterlagen wiederfinden.', icon: <FileText /> },
          ] }, { title: 'Planen & Vorbereiten', items: [
            { href: '/app/year', title: 'Mein Jahr', text: 'Anstehende Arbeiten und Wartungen im Blick behalten.', icon: <CalendarDays /> },
            { href: '#technik', title: 'Technik & Geräte', text: 'Ausstattung und Modellangaben nachschlagen.', icon: <Wrench /> },
            { href: '/app/home/sale', title: 'Verkauf & Bewertung', text: 'Hauswert festhalten und einen möglichen Verkauf vorbereiten.', icon: <TrendingUp /> },
          ] }]} />
          <EHText muted><NotebookPen aria-hidden="true" size={18} /> Notizen: noch nicht verfügbar. Hinweise zu Geräten kannst du bereits bei der Technik hinterlegen.</EHText>
        </EHWorkSection>
    </EHWorkflowStack>
  </AppShell>;
}
