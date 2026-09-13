import { HomeownerHausmeisterComposer } from '@/components/homeowner/homeowner-hausmeister-composer';
import { AppShell } from '@/components/shell';
import { EHButton, EHCallout, EHEmptyState, EHOwnerPageHeader, EHOwnerOverview, EHOwnerWelcome, EHOwnerSection, EHOwnerRecords, EHOwnerComposer, EHOwnerLinks, type EHOwnerRecord } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { primaryProperty } from '@/lib/properties';
import { ownerDate, ownerMaintenanceState } from '@/lib/owner-format';

export default async function Dashboard() {
  const user = await requireUser('homeowner');
  const profile = db.prepare('SELECT address,postcode,onboarding_step FROM homeowner_profiles WHERE user_id=?').get(user.id) as { address?: string; postcode?: string; onboarding_step?: string } | undefined;
  const property = primaryProperty(user.id);
  const address = property?.address || profile?.address || '';
  const postcode = property?.postcode || profile?.postcode || '';
  const context = [address, postcode ? `PLZ ${postcode}` : ''].filter(Boolean).join(' · ');
  const decisions = db.prepare(`SELECT j.id,j.title,COUNT(q.id) quote_count FROM jobs j LEFT JOIN quotes q ON q.job_id=j.id AND q.status='pending' WHERE j.homeowner_id=? AND j.status='quoted' AND j.request_kind='service' GROUP BY j.id ORDER BY j.updated_at DESC`).all(user.id) as {id:number;title:string;quote_count:number}[];
  const maintenance = property ? db.prepare(`SELECT id,title,due_date FROM maintenance_tasks WHERE property_id=? AND status='open' ORDER BY CASE WHEN due_date IS NULL OR due_date='' THEN 1 ELSE 0 END,date(due_date),id LIMIT 3`).all(property.id) as {id:number;title:string;due_date:string|null}[] : [];
  const next = db.prepare(`SELECT a.job_id,a.start_at,j.title,p.business_name FROM appointments a JOIN jobs j ON j.id=a.job_id LEFT JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.homeowner_id=? AND a.status='confirmed' AND datetime(a.start_at)>=datetime('now') ORDER BY datetime(a.start_at) LIMIT 1`).get(user.id) as {job_id:number;start_at:string;title:string;business_name:string|null}|undefined;
  const items: EHOwnerRecord[] = [
    ...decisions.map(item => ({id:`offer-${item.id}`,title:item.title,href:`/app/jobs/${item.id}`,detail:item.quote_count > 0 ? `${item.quote_count} ${item.quote_count === 1 ? 'Angebot wartet' : 'Angebote warten'} auf deine Prüfung.` : 'Der Angebotsstatus braucht eine Prüfung.',status:'Entscheidung offen',tone:'warning' as const,action:item.quote_count > 0 ? 'Angebot prüfen' : 'Stand prüfen'})),
    ...maintenance.filter(item => ownerMaintenanceState(item.due_date) !== 'Wartung geplant').slice(0, 2).map(item => ({id:`maintenance-${item.id}`,title:item.title,href:'/app/year',detail:ownerDate(item.due_date),status:ownerMaintenanceState(item.due_date),tone:ownerMaintenanceState(item.due_date).includes('überfällig') ? 'warning' as const : 'neutral' as const,action:'Wartung ansehen'})),
  ];
  return <AppShell role="homeowner" active="/app" title="Zuhause">
    <EHOwnerWelcome imageSrc="/images/marketing/owner-facade-reference.png" caption="Wohnbeispiel · nicht dein hinterlegtes Hausfoto">
      <EHOwnerPageHeader title="Dein Zuhause" context={context || undefined} text="Offene Entscheidungen, nächste Termine und alles, was dein Haus braucht." />
    </EHOwnerWelcome>
    {profile?.onboarding_step && profile.onboarding_step !== 'done' && <EHCallout title="Einrichtung unvollständig"><p>Ergänze die Angaben zu deinem Zuhause.</p><EHButton href="/app/onboarding" variant="secondary">Einrichtung fortsetzen</EHButton></EHCallout>}
    <EHOwnerOverview main={
    <EHOwnerSection title="Als Nächstes" action={{href:'/app/jobs',label:'Aufträge ansehen'}}>
      {items.length ? <EHOwnerRecords label="Offene Entscheidungen und Wartungen" items={items} /> : <EHEmptyState title="Keine offenen Angebote oder Wartungen" text="Neue Angebote und gespeicherte Wartungen erscheinen hier. Deine laufenden Aufträge findest du unter Aufträge." />}
    </EHOwnerSection>
    } aside={next ? <EHOwnerSection title="Nächster bestätigter Termin"><EHOwnerRecords label="Nächster bestätigter Termin" items={[{id:String(next.job_id),title:next.title,href:`/app/jobs/${next.job_id}`,detail:ownerDate(next.start_at),meta:next.business_name || 'Betrieb im Auftrag ansehen',status:'Bestätigt',tone:'success',action:'Termin ansehen'}]} /></EHOwnerSection> : undefined} />
    <EHOwnerComposer><HomeownerHausmeisterComposer starterHint="Zum Beispiel: Die Heizung macht ungewöhnliche Geräusche." /></EHOwnerComposer>
    <EHOwnerLinks items={[
      {href:'/app/home',title:'Hausakte',text:'Hausdaten und Geschichte deines Zuhauses.'},
      {href:'/app/documents',title:'Dokumente',text:'Pläne, Rechnungen und Nachweise.'},
      {href:'/app/year',title:'Jahresplan',text:'Wartungen und wiederkehrende Aufgaben.'},
      {href:'/app/calendar',title:'Termine',text:'Vereinbarte Termine und vergangene Besuche.'},
      {href:'/app/consultation',title:'Beratung',text:'Vorhaben besprechen und Entscheidungen vorbereiten.'},
      {href:'/app/emergency',title:'Hilfe im Notfall',text:'Sicherheitshinweise und Kontaktwege für dringende Situationen.'},
    ]} />
  </AppShell>;
}
