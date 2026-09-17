import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { crumbs } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import { EHButton, EHCallout, EHPageHeader, EHErrorState, EHField, EHSelect, EHTextarea, EHSubmitButton, EHMetricsBar, EHRecordList, EHStatus, EHText, EHWorkSection, EHWorkflowForm, EHWorkflowStack, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';
import { dateLabel, statusLabel } from '@/lib/format';
import { createEmergencyAction } from '@/app/actions';

/** Dieselben Notfallarten wie im Formular und in createEmergencyRequest. */
const EMERGENCY_LABELS: Record<string,string> = {water:'Wasserrohrbruch / Wasserschaden',heating:'Heizung ausgefallen',electric:'Stromproblem',roof:'Dach- oder Sturmschaden',lock:'Tür / Schloss',sanitary:'Sanitär-Notfall',other:'Sonstiger Notfall'};

type EmergencyJob = { id:number; title:string; status:string; emergency_type:string|null; created_at:string; updated_at:string };

export default async function Emergency({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const user=await requireUser('homeowner'); const sp=await searchParams; const profile=db.prepare('SELECT postcode,address FROM homeowner_profiles WHERE user_id=?').get(user.id) as any;
  const target=profile?.address||profile?.postcode||'dein hinterlegtes Zuhause';

  // Notfaelle sind Auftraege mit urgency='emergency'. Kennzahlen und rechte
  // Spalte lesen dieselbe Liste, damit oben und rechts dasselbe steht.
  const emergencies = db.prepare(`SELECT id,title,status,emergency_type,created_at,updated_at FROM jobs WHERE homeowner_id=? AND urgency='emergency' ORDER BY created_at DESC`).all(user.id) as EmergencyJob[];
  const active = emergencies.filter(job => job.status !== 'completed' && job.status !== 'cancelled');
  const done = emergencies.filter(job => job.status === 'completed');
  const last = emergencies[0];
  const emergencyTone = (status:string) => status === 'completed' ? 'success' as const : status === 'cancelled' ? 'neutral' as const : 'info' as const;
  const activeItems: EHRecordEntry[] = active.slice(0,4).map(job => ({
    id: String(job.id),
    title: job.title,
    detail: EMERGENCY_LABELS[job.emergency_type || 'other'] ?? 'Notfall',
    date: String(job.created_at).slice(0,10),
    dateLabel: dateLabel(job.created_at),
    status: <EHStatus tone={emergencyTone(job.status)}>{statusLabel(job.status)}</EHStatus>,
    href: `/app/jobs/${job.id}`,
  }));

  return <WerkbankRahmen role="homeowner" active="/app" brandSub={profile?.address} breadcrumbs={crumbs('/app','Notfall')}>
    <EHWorkflowStack>
    <EHPageHeader title="Notfall melden" context={target} />
    <EHMetricsBar label="Notfall" items={[
      { id:'gesamt', label:'Notfälle gemeldet', value:String(emergencies.length), hint:'seit Beginn' },
      { id:'laufend', label:'Laufend', value:String(active.length), hint:active.length>0?'in Bearbeitung':'nichts offen' },
      { id:'erledigt', label:'Abgeschlossen', value:String(done.length), hint:'erledigte Einsätze' },
      { id:'letzter', label:'Letzter Notfall', value:last?dateLabel(last.created_at):'–', hint:last?(EMERGENCY_LABELS[last.emergency_type||'other']??'Notfall'):'noch keiner gemeldet' },
    ]} />
    <EHWorkspaceGrid main={<>
      {sp.error&&<EHErrorState text={sp.error} />}
      <EHCallout title="Lebensgefahr, Brand oder Gasgeruch?">
        <p>Sofort <a href="tel:112">112</a> anrufen. Bei Gasgeruch: Fenster öffnen, keine Schalter betätigen, Gebäude verlassen. Einfach Hausen ersetzt keinen öffentlichen Notruf.</p>
      </EHCallout>
      <EHWorkflowForm action={createEmergencyAction}><EHField id="emg-type" label="Notfall"><EHSelect id="emg-type" name="emergencyType" required defaultValue=""><option value="" disabled>Bitte auswählen</option><option value="water">Wasserrohrbruch / Wasserschaden</option><option value="heating">Heizung ausgefallen</option><option value="electric">Stromproblem</option><option value="roof">Dach- oder Sturmschaden</option><option value="lock">Tür / Schloss</option><option value="sanitary">Sanitär-Notfall</option><option value="other">Sonstiger Notfall</option></EHSelect></EHField><EHField id="emg-desc" label="Was ist passiert?"><EHTextarea id="emg-desc" name="description" rows={5} required placeholder="Zum Beispiel: Unter der Spüle läuft stark Wasser aus …"/></EHField><EHSubmitButton>Jetzt Helfer suchen</EHSubmitButton></EHWorkflowForm>
    </>} aside={<>
      <EHWorkSection title="Dein letzter Notfall">
        {last ? <>
          <EHText>{last.title}</EHText>
          <EHStatus tone={emergencyTone(last.status)}>{statusLabel(last.status)}</EHStatus>
          <EHText muted>{EMERGENCY_LABELS[last.emergency_type || 'other'] ?? 'Notfall'} · gemeldet {dateLabel(last.created_at)}</EHText>
          <EHButton href={`/app/jobs/${last.id}`} variant="secondary" arrow>Vorgang ansehen</EHButton>
        </> : <EHText muted>Noch kein Notfall gemeldet. Wenn etwas akut kaputt ist, beschreibe es links – passende Helfer in deiner Region werden sofort angefragt.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Laufende Notfälle">
        <EHRecordList label="Laufende Notfälle" items={activeItems} empty="Zurzeit läuft kein Notfall. Abgeschlossene Einsätze bleiben in der Auftragsübersicht erhalten." />
        <EHButton href="/app/jobs" variant="secondary" arrow>Alle Aufträge ansehen</EHButton>
      </EHWorkSection>
      <EHWorkSection title="Wenn es lebensgefährlich ist">
        <EHText muted>Diese Meldung ersetzt keinen Notruf. Bei Lebensgefahr, Brand oder Gasgeruch zuerst 112 anrufen und das Gebäude verlassen.</EHText>
        <EHButton href="/app/hilfe" variant="secondary" arrow>Hilfe & Kontakt</EHButton>
      </EHWorkSection>
    </>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
