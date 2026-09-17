import { isFeatureEnabled } from '@/lib/feature-flags';
import { toggleFeatureFlagAction, requeueDeadNotificationAction } from '@/app/actions';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { EHButton, EHField, EHInput, EHMetricsBar, EHPageHeader, EHRecordList, EHScope, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';

/** Die Flags, die diese Seite schaltet; die Kennzahl oben zaehlt genau diese Liste. */
const FLAGS=['ki_chat','pilot_cohort_open'];

export default async function AdminOps({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  await requireAdmin();
  const sp=await searchParams;
  const q=String(sp.q||'').trim();
  let matches: any[] = [];
  if (q) {
    matches = db.prepare(`SELECT u.id,u.email,u.role,u.first_name,u.last_name,u.created_at,u.auth_subject,
      (SELECT COUNT(*) FROM jobs WHERE homeowner_id=u.id) jobs,
      (SELECT COUNT(*) FROM jobs WHERE id IN (SELECT job_id FROM quotes WHERE provider_id=u.id)) quotes
      FROM users u WHERE u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? ORDER BY u.created_at DESC LIMIT 25`).all(`%${q}%`,`%${q}%`,`%${q}%`) as any[];
  }
  const outbox=db.prepare(`SELECT status,COUNT(*) c FROM notifications GROUP BY status`).all() as any[];
  const dead=db.prepare(`SELECT id,kind,title,created_at FROM notifications WHERE status='dead' ORDER BY created_at DESC LIMIT 10`).all() as any[];
  const trace=db.prepare(`SELECT d.job_id,d.decision,d.reason_key,d.detail,d.created_at,p.business_name
    FROM match_decision_trace d JOIN users pr ON pr.id=d.provider_id
    LEFT JOIN provider_profiles p ON p.user_id=d.provider_id
    ORDER BY d.created_at DESC LIMIT 15`).all() as any[];
  // Kennzahlen und rechte Spalte lesen dieselben Zeilen wie die Listen darunter:
  // die Zahl oben ist die Laenge der Warteschlange, nicht eine zweite Zaehlung.
  const flags=FLAGS.map(flag=>({flag,enabled:isFeatureEnabled(flag)}));
  const enabledFlags=flags.filter(f=>f.enabled).length;
  const deliveries=outbox.reduce((sum:number,o:any)=>sum+(typeof o.c==='number'?o.c:0),0);
  const deadCount=Number(outbox.find((o:any)=>o.status==='dead')?.c??0);
  const flagItems:EHRecordEntry[]=flags.map(f=>({
    id:`flag-${f.flag}`,
    title:f.flag,
    detail:f.enabled?'aktiv':'inaktiv',
    status:<EHStatus tone={f.enabled?'success':'neutral'}>{f.enabled?'Aktiv':'Inaktiv'}</EHStatus>,
    action:<form action={toggleFeatureFlagAction.bind(null,f.flag)}><EHButton type="submit" variant="secondary" size="small">{f.enabled?'Deaktivieren':'Aktivieren'}</EHButton></form>,
  }));
  const matchItems:EHRecordEntry[]=matches.map((u:any)=>({
    id:`treffer-${u.id}`,
    title:`${u.first_name} ${u.last_name}`.trim()||u.email,
    detail:[u.email,u.role,`${u.jobs} Aufträge / ${u.quotes} Angebote`,u.auth_subject?'Supabase gebunden':'KEINE Identity gebunden'].filter(Boolean).join(' · '),
    dateLabel:new Date(u.created_at).toLocaleDateString('de-DE'),
  }));
  const outboxItems:EHRecordEntry[]=outbox.map((o:any)=>({
    id:`outbox-${o.status}`,
    title:o.status,
    value:String(o.c),
    status:<EHStatus tone={o.status==='dead'?'error':o.status==='sent'?'success':'warning'}>{o.status==='dead'?'Fehlgeschlagen':o.status==='sent'?'Zugestellt':'Offen'}</EHStatus>,
  }));
  const deadItems:EHRecordEntry[]=dead.map((d:any)=>({
    id:`dead-${d.id}`,
    title:d.title,
    detail:[d.kind,new Date(d.created_at).toLocaleString('de-DE')].filter(Boolean).join(' · '),
    action:<form action={requeueDeadNotificationAction.bind(null,d.id)}><EHButton type="submit" variant="secondary" size="small">Erneut zustellen</EHButton></form>,
  }));
  const traceItems:EHRecordEntry[]=trace.map((t:any,i:number)=>({
    id:`trace-${i}`,
    title:`${t.decision} · ${t.business_name||t.reason_key||'ohne Zuordnung'}`,
    detail:[t.detail,`Job ${t.job_id}`,new Date(t.created_at).toLocaleString('de-DE')].filter(Boolean).join(' · '),
  }));
  return <EHScope app><main className="admin-page">
    <EHPageHeader title="Operations" context="Betriebsverwaltung" />
    <EHMetricsBar label="Operations" items={[
      {id:'flags',label:'Aktive Feature-Flags',value:`${enabledFlags} von ${flags.length}`,hint:'in dieser Umgebung'},
      {id:'zustellungen',label:'Zustellungen',value:String(deliveries),hint:'Benachrichtigungen in der Outbox'},
      {id:'tote-briefe',label:'Tote Briefe',value:String(deadCount),hint:deadCount>0?'brauchen eine Entscheidung':'keine offen'},
      {id:'matching',label:'Matching-Entscheidungen',value:String(trace.length),hint:'zuletzt protokolliert'},
    ]} />
    <EHWorkspaceGrid main={<>
      <EHWorkSection title="Lookup">
        <form action="/admin/ops"><EHField id="ops-q" label="Nutzer suchen"><EHInput id="ops-q" name="q" defaultValue={q} placeholder="E-Mail oder Name"/></EHField><EHButton type="submit">Suchen</EHButton></form>
        <EHRecordList label="Lookup-Treffer" items={matchItems} empty={q?'Keine Treffer.':'Noch keine Suche gestartet.'} />
      </EHWorkSection>
      <EHWorkSection title="Feature-Flags">
        <EHRecordList label="Feature-Flags" items={flagItems} empty="Keine Flags konfiguriert." />
      </EHWorkSection>
      <EHWorkSection title="Intern">
        <EHText muted>Entwickler-Dokumentation, nur für das Operationsteam.</EHText>
        <EHButton href="/docs-internal" variant="secondary" arrow>Entwickler-Docs öffnen</EHButton>
      </EHWorkSection>
    </>} aside={<>
      <EHWorkSection title="Zustellstatus">
        <EHRecordList label="Zustellstatus der Outbox" items={outboxItems} empty="Keine Benachrichtigungen vorhanden." />
      </EHWorkSection>
      <EHWorkSection title="Tote Briefe">
        <EHRecordList label="Tote Briefe" items={deadItems} empty="Keine toten Briefe." />
      </EHWorkSection>
      <EHWorkSection title="Matching-Trace">
        <EHRecordList label="Letzte Matching-Entscheidungen" items={traceItems} empty="Keine Entscheidungen protokolliert." />
      </EHWorkSection>
    </>} />
  </main></EHScope>;
}
