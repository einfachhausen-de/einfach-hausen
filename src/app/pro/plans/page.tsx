import { BadgeCheck,CircleAlert } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { EHButton, EHFormFeedback, EHErrorState, EHMetricsBar, EHPageHeader, EHRecordList, EHStatus, EHSubmitButton, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';
import { euro } from '@/lib/format';
import { startPartnerPlanCheckoutAction } from '@/app/actions';
import { getProviderContext } from '@/lib/provider';

/** Tarifstand des Partnerbereichs; 'trialing' fehlt in der allgemeinen Statusliste. */
const SUBSCRIPTION_LABEL: Record<string,string> = { pending:'Noch nicht gebucht', trialing:'Testphase', active:'Aktiv', past_due:'Zahlung offen', cancelled:'Beendet' };
/** Stand des Partnervertrags; Tarif und Vertrag sind zwei getrennte Dinge. */
const CONTRACT_LABEL: Record<string,string> = { pending:'In Vorbereitung', active:'Aktiv', suspended:'Pausiert', ended:'Beendet' };
const subscriptionLabel = (status?: string | null) => status ? (SUBSCRIPTION_LABEL[status] ?? status) : '–';
const contractLabel = (status?: string | null) => status ? (CONTRACT_LABEL[status] ?? status) : '–';
const subscriptionTone = (status?: string | null) => status === 'past_due' ? 'warning' as const : status === 'cancelled' || status === 'pending' ? 'neutral' as const : 'success' as const;
const contractTone = (status?: string | null) => status === 'active' ? 'success' as const : status === 'suspended' ? 'warning' as const : 'neutral' as const;

/** Kurzes Datum; die Kennzahl und die rechte Spalte lesen denselben Wert. */
function day(value: string | null | undefined): string {
  if (!value) return '';
  const raw = String(value);
  return new Date(raw.length === 10 ? raw + 'T12:00:00' : raw).toLocaleDateString('de-DE');
}

export default async function PartnerPlans({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const u=await requireUser('provider'); const ctx=getProviderContext(u.id);
  if(!ctx)return <WerkbankRahmen role="provider" active="/pro/plans">
    <ProviderState icon={<BadgeCheck size={21}/>} title="Keinem Unternehmen zugeordnet" description="Dein Zugang ist aktuell keinem aktiven Partnerunternehmen zugeordnet. Tarife und Abrechnung können deshalb nicht angezeigt werden." action={{href:'/pro/hilfe',label:'Hilfe & Kontakt'}} tone="unavailable"/>
  </WerkbankRahmen>;
  const sp=await searchParams;
  const plans=db.prepare('SELECT * FROM partner_plans WHERE active=1 ORDER BY monthly_amount').all() as any[];
  // Der gebuchte Tarif traegt seinen Preis mit: die Kennzahl nennt denselben
  // Betrag, den die Zeile in der Liste zeigt.
  const current=db.prepare(`SELECT s.*,p.title,p.monthly_amount,p.monthly_lead_limit FROM partner_subscriptions s JOIN partner_plans p ON p.slug=s.plan_slug WHERE s.provider_id=?`).get(ctx.providerId) as any;
  const contract=db.prepare('SELECT status,starts_at,ends_at FROM partner_contracts WHERE provider_id=?').get(ctx.providerId) as any;
  const isCurrent=(p:any)=>current?.plan_slug===p.slug&&(current.status==='active'||current.status==='trialing');
  const planItems:EHRecordEntry[]=plans.map(p=>({
    id: String(p.slug),
    title: `${p.title} — ${euro(p.monthly_amount)}/Monat`,
    detail: [p.monthly_lead_limit?`Bis zu ${p.monthly_lead_limit} neue Anfragen/Monat`:'Unbegrenzte Anfragen',p.trial_days?`Erste ${Math.round(p.trial_days/30)} Monate kostenlos`:'Dauerhaft kostenlos'].join(' · '),
    status: isCurrent(p)?<EHStatus tone="success">Aktiv</EHStatus>:undefined,
    action: ctx.isOwner
      ? <form action={startPartnerPlanCheckoutAction.bind(null,p.slug)}><EHSubmitButton disabled={isCurrent(p)}>{isCurrent(p)?'Aktiv':`${p.title} wählen`}</EHSubmitButton></form>
      : <EHText size="meta" muted>Nur das Firmenkonto kann den Tarif ändern.</EHText>,
  }));
  const periodEnd = current?.trial_end || current?.current_period_end;
  return <WerkbankRahmen role="provider" active="/pro/plans">
    <EHPageHeader title="Partner-Tarife" context={current?.title?`Gebucht: ${current.title}`:undefined}/>
    {sp.error&&<EHErrorState text={sp.error} />}{sp.checkout==='success'&&<EHFormFeedback kind="success"><BadgeCheck/>Tarif wurde aktiviert.</EHFormFeedback>}{sp.checkout==='processing'&&<EHFormFeedback kind="success"><BadgeCheck/>Zahlung eingegangen. Tarifstatus folgt erst nach bestätigtem Stripe-Webhook.</EHFormFeedback>}{sp.checkout==='unavailable'&&<ProviderState icon={<CircleAlert size={21}/>} title="Tarifwechsel derzeit nicht verfügbar" description="Die Onlinezahlung ist aktuell nicht vollständig konfiguriert. Es wurde kein Tarifstatus geändert; dein bestehender Zugang bleibt unverändert." tone="unavailable"/>}
    <EHMetricsBar label="Partner-Tarife" items={[
      {id:'tarife',label:'Tarife',value:String(plans.length),hint:'im Tarifkatalog'},
      {id:'gebucht',label:'Gebuchter Tarif',value:current?.title||'–',hint:current?`${euro(current.monthly_amount)}/Monat`:'kein Tarif gebucht'},
      {id:'zahlung',label:'Zahlungsstatus',value:subscriptionLabel(current?.status),hint:current?.trial_end?`Testphase bis ${day(current.trial_end)}`:current?.current_period_end?`Laufzeit bis ${day(current.current_period_end)}`:'keine Zahlung hinterlegt'},
      {id:'vertrag',label:'Partnervertrag',value:contractLabel(contract?.status),hint:contract?(contract.ends_at?`endet ${day(contract.ends_at)}`:'ohne hinterlegtes Ende'):'kein Partnervertrag hinterlegt'},
    ]} />
    <EHWorkspaceGrid main={
      <EHWorkSection title={`Tarife · ${plans.length}`}>
        <EHRecordList label="Partner-Tarife" items={planItems} empty="Keine Tarife verfügbar."/>
      </EHWorkSection>
    } aside={<>
      <EHWorkSection title="Gebuchter Tarif">
        {current ? <>
          <EHText>{current.title} · {euro(current.monthly_amount)}/Monat</EHText>
          <EHStatus tone={subscriptionTone(current.status)}>{subscriptionLabel(current.status)}</EHStatus>
          <EHText muted>{current.trial_end
            ? `Die Testphase läuft bis ${day(current.trial_end)}. Danach wird der Tarif zum hinterlegten Betrag fortgeführt.`
            : current.current_period_end
              ? `Die aktuelle Laufzeit endet am ${day(current.current_period_end)}.`
              : 'Für diesen Tarif ist kein Laufzeitende hinterlegt.'}</EHText>
        </> : <EHText muted>Für {ctx.businessName} ist noch kein Tarif gebucht. Wähle links einen Tarif; freigeschaltet wird er erst nach bestätigter Zahlung.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Zahlungsstatus">
        {current ? <>
          <EHStatus tone={subscriptionTone(current.status)}>{subscriptionLabel(current.status)}</EHStatus>
          <EHText muted>{current.trial_end
            ? `Bis ${day(current.trial_end)} wird nichts berechnet. Der Status wechselt erst mit der bestätigten Zahlung.`
            : periodEnd
              ? `Nächster Zahlungstermin: ${day(periodEnd)}. Der Status wechselt erst mit der bestätigten Zahlung.`
              : 'Für diesen Tarif ist kein Zahlungstermin hinterlegt.'}</EHText>
        </> : <EHText muted>Ohne gebuchten Tarif entsteht kein Zahlungsvorgang. Es fallen keine Kosten an.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Kündigung &amp; Laufzeit">
        {contract ? <>
          <EHStatus tone={contractTone(contract.status)}>{contractLabel(contract.status)}</EHStatus>
          <EHText muted>{contract.ends_at
            ? `Der Partnervertrag endet am ${day(contract.ends_at)}. Eine Kündigung wirkt zum Vertragsende.`
            : 'Der Partnervertrag läuft ohne hinterlegtes Ende. Eine Kündigung wirkt zum Vertragsende.'}</EHText>
        </> : <EHText muted>Für den Betrieb ist kein Partnervertrag hinterlegt. Tarif und Vertrag sind getrennt: der Tarif regelt die monatliche Zahlung, der Vertrag die Zusammenarbeit.</EHText>}
        {!ctx.isOwner&&<EHText muted>Tarif und Kündigung verwaltet nur das Firmenkonto.</EHText>}
        <EHButton href="/pro/profile" variant="secondary" arrow>Profil &amp; Einstellungen</EHButton>
      </EHWorkSection>
    </>} />
  </WerkbankRahmen>;
}
