import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { requireUser } from '@/lib/auth';
import { EHButton, EHCallout, EHPageHeader, EHErrorState, EHField, EHSelect, EHTextarea, EHSubmitButton, EHRecordList, EHStatus, EHWorkSection, EHWorkflowForm, EHWorkflowStack, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';
import { dateLabel, statusLabel } from '@/lib/format';
import { createEmergencyAction } from '@/app/actions';

/** Dieselben Notfallarten wie im Formular und in createEmergencyRequest. */
const EMERGENCY_LABELS: Record<string,string> = {water:'Wasserrohrbruch / Wasserschaden',heating:'Heizung ausgefallen',electric:'Stromproblem',roof:'Dach- oder Sturmschaden',lock:'Tür / Schloss',sanitary:'Bad, WC oder Küche',other:'Sonstiger Notfall'};

type EmergencyJob = { id:number; title:string; status:string; emergency_type:string|null; created_at:string; updated_at:string };

export default async function Emergency({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const user=await requireUser('homeowner'); const sp=await searchParams; const profile=db.prepare('SELECT postcode,address FROM homeowner_profiles WHERE user_id=?').get(user.id) as any;
  const target=profile?.address||profile?.postcode||'dein hinterlegtes Zuhause';

  // Notfaelle sind Auftraege mit urgency='emergency'. Im Notfall zaehlt nur
  // das Formular: keine Kennzahlen, keine zweite Liste.
  const emergencies = db.prepare(`SELECT id,title,status,emergency_type,created_at,updated_at FROM jobs WHERE homeowner_id=? AND urgency='emergency' ORDER BY created_at DESC`).all(user.id) as EmergencyJob[];
  const active = emergencies.filter(job => job.status !== 'completed' && job.status !== 'cancelled');
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

  return <WerkbankRahmen role="homeowner" active="/app" brandSub={profile?.address}>
    <EHWorkflowStack>
    <EHPageHeader title="Notfall melden" context={target} />
    <EHWorkspaceGrid main={<>
      {sp.error&&<EHErrorState text={sp.error} />}
      <EHCallout title="Lebensgefahr, Brand oder Gasgeruch?">
        <p>Sofort <a href="tel:112">112</a> anrufen. Bei Gasgeruch: Fenster öffnen, keine Schalter betätigen, Gebäude verlassen. Einfach Hausen ersetzt keinen öffentlichen Notruf.</p>
      </EHCallout>
      <EHWorkflowForm action={createEmergencyAction}><EHField id="emg-type" label="Art des Notfalls"><EHSelect id="emg-type" name="emergencyType" required defaultValue=""><option value="" disabled>Bitte auswählen</option><option value="water">Wasserrohrbruch / Wasserschaden</option><option value="heating">Heizung ausgefallen</option><option value="electric">Stromproblem</option><option value="roof">Dach- oder Sturmschaden</option><option value="lock">Tür / Schloss</option><option value="sanitary">Bad, WC oder Küche</option><option value="other">Sonstiger Notfall</option></EHSelect></EHField><EHField id="emg-desc" label="Was ist passiert?"><EHTextarea id="emg-desc" name="description" rows={5} required placeholder="Zum Beispiel: Unter der Spüle läuft stark Wasser aus …"/></EHField><EHSubmitButton>Jetzt Helfer suchen</EHSubmitButton></EHWorkflowForm>
    </>} aside={<>
      <EHWorkSection title="Hilfe ist unterwegs">
        <EHRecordList label="Laufende Notfälle" items={activeItems} empty="Zurzeit läuft kein Notfall. Abgeschlossene Einsätze stehen in der Auftragsübersicht." />
        <EHButton href="/app/jobs" variant="secondary" arrow>Alle Aufträge ansehen</EHButton>
      </EHWorkSection>
    </>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
