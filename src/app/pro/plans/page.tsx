import { BadgeCheck,CircleAlert,ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { EHRecordList, EHErrorState, EHPageHeader, EHStatus, EHWorkSection, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';
import { euro } from '@/lib/format';
import { startPartnerPlanCheckoutAction } from '@/app/actions';
import { getProviderContext } from '@/lib/provider';

export default async function PartnerPlans({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const u=await requireUser('provider'); const ctx=getProviderContext(u.id);
  if(!ctx)return <AppShell role="provider" active="/pro/plans" title="Partner-Tarife" subtitle="Zugang prüfen">
    <ProviderState icon={<BadgeCheck size={21}/>} title="Keinem Unternehmen zugeordnet" description="Dein Zugang ist aktuell keinem aktiven Partnerunternehmen zugeordnet. Tarife und Abrechnung können deshalb nicht angezeigt werden." action={{href:'/pro/hilfe',label:'Hilfe & Kontakt'}} tone="unavailable"/>
  </AppShell>;
  const sp=await searchParams;
  const plans=db.prepare('SELECT * FROM partner_plans WHERE active=1 ORDER BY monthly_amount').all() as any[];
  const current=db.prepare(`SELECT s.*,p.title FROM partner_subscriptions s JOIN partner_plans p ON p.slug=s.plan_slug WHERE s.provider_id=?`).get(ctx.providerId) as any;
  const isCurrent=(p:any)=>current?.plan_slug===p.slug&&(current.status==='active'||current.status==='trialing');
  const planItems:EHRecordEntry[]=plans.map(p=>({
    id: String(p.slug),
    title: `${p.title} — ${euro(p.monthly_amount)}/Monat`,
    detail: [p.monthly_lead_limit?`Bis zu ${p.monthly_lead_limit} neue Anfragen/Monat`:'Unbegrenzte Anfragen',p.trial_days?`Erste ${Math.round(p.trial_days/30)} Monate kostenlos`:'Dauerhaft kostenlos'].join(' · '),
    status: isCurrent(p)?<EHStatus tone="success">Aktiv</EHStatus>:undefined,
    action: ctx.isOwner
      ? <form action={startPartnerPlanCheckoutAction.bind(null,p.slug)}><button className="btn primary" disabled={isCurrent(p)}>{isCurrent(p)?'Aktiv':`${p.title} wählen`}</button></form>
      : <small>Nur das Firmenkonto kann den Tarif ändern.</small>,
  }));
  return <AppShell role="provider" active="/pro/plans" title="Partner-Tarife">
    <EHPageHeader title="Partner-Tarife"/>
    {sp.error&&<EHErrorState text={sp.error} />}{sp.checkout==='success'&&<div className="alert success"><BadgeCheck/>Tarif wurde aktiviert.</div>}{sp.checkout==='processing'&&<div className="alert success"><BadgeCheck/>Zahlung eingegangen. Tarifstatus folgt erst nach bestätigtem Stripe-Webhook.</div>}{sp.checkout==='unavailable'&&<ProviderState icon={<CircleAlert size={21}/>} title="Tarifwechsel derzeit nicht verfügbar" description="Die Onlinezahlung ist aktuell nicht vollständig konfiguriert. Es wurde kein Tarifstatus geändert; dein bestehender Zugang bleibt unverändert." tone="unavailable"/>}
    {current&&<div className="current-plan pro-current-plan"><ShieldCheck/><div><strong>{current.title} · {current.status}</strong><p>{current.trial_end?`Testphase bis ${new Date(current.trial_end).toLocaleDateString('de-DE')}`:'Aktueller Unternehmenstarif'}</p></div></div>}
    <EHWorkSection title={`Tarife · ${plans.length}`}>
      <EHRecordList label="Partner-Tarife" items={planItems} empty="Keine Tarife verfügbar."/>
    </EHWorkSection>
  </AppShell>;
}
