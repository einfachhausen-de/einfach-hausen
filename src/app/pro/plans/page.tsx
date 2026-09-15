import { BadgeCheck,CircleAlert,ShieldCheck } from 'lucide-react';
import { AppShell,SectionTitle } from '@/components/shell';
import { ProviderPageIntro,ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { EHPanel, EHList, EHErrorState, EHCallout } from '@/design-system';
import { db } from '@/lib/db';
import { euro } from '@/lib/format';
import { startPartnerPlanCheckoutAction } from '@/app/actions';
import { getProviderContext } from '@/lib/provider';

export default async function PartnerPlans({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const u=await requireUser('provider'); const ctx=getProviderContext(u.id); if(!ctx)return null; const sp=await searchParams;
  const plans=db.prepare('SELECT * FROM partner_plans WHERE active=1 ORDER BY monthly_amount').all() as any[];
  const current=db.prepare(`SELECT s.*,p.title FROM partner_subscriptions s JOIN partner_plans p ON p.slug=s.plan_slug WHERE s.provider_id=?`).get(ctx.providerId) as any;
  return <AppShell role="provider" active="/pro/plans" title="Partner-Tarife" subtitle="0 % Provision · keine Gebühr pro Auftrag">
    <ProviderPageIntro eyebrow="Tarif" title="Planbar statt Provision" description="Alle Partner behalten 100 % ihres Auftragswertes. Ein Tarif beeinflusst niemals die fachliche Reihenfolge im Matching."/>
    {sp.error&&<EHErrorState text={sp.error} />}{sp.checkout==='success'&&<div className="alert success"><BadgeCheck/>Tarif wurde aktiviert.</div>}{sp.checkout==='processing'&&<div className="alert success"><BadgeCheck/>Zahlung eingegangen. Tarifstatus folgt erst nach bestätigtem Stripe-Webhook.</div>}{sp.checkout==='unavailable'&&<ProviderState icon={<CircleAlert size={21}/>} title="Tarifwechsel derzeit nicht verfügbar" description="Die Onlinezahlung ist aktuell nicht vollständig konfiguriert. Es wurde kein Tarifstatus geändert; dein bestehender Zugang bleibt unverändert." tone="unavailable"/>}
    <EHCallout title="100 % des Auftragswerts bleiben beim Betrieb."><p>Einfach Hausen monetarisiert Partner über planbare Monatsgebühren — nicht über Provision. Bezahlte Tarife kaufen keine bessere Position im Qualitätsmatching.</p></EHCallout>
    {current&&<div className="current-plan pro-current-plan"><ShieldCheck/><div><strong>{current.title} · {current.status}</strong><p>{current.trial_end?`Testphase bis ${new Date(current.trial_end).toLocaleDateString('de-DE')}`:'Aktueller Unternehmenstarif'}</p></div></div>}
    <SectionTitle>Tarife</SectionTitle>{plans.map(p=><EHPanel key={p.slug} title={`${p.title}${p.slug==='pro'?' (beliebt)':''} — ${euro(p.monthly_amount)}/Monat`}><p>{p.description}</p><EHList label={p.title} items={[{ id: p.slug + '-prov', title: '0 % Provision' },{ id: p.slug + '-geb', title: 'Keine Gebühr pro Auftrag' },...(p.monthly_lead_limit?[{ id: p.slug + '-limit', title: `Bis zu ${p.monthly_lead_limit} neue Anfragen/Monat` }]:[{ id: p.slug + '-vol', title: 'Unbegrenztes Anfragevolumen gemäß Qualitäts- und Kapazitätsmatching' }]),...(p.trial_days?[{ id: p.slug + '-trial', title: `Erste ${Math.round(p.trial_days/30)} Monate kostenlos` }]:[{ id: p.slug + '-free', title: 'Dauerhaft kostenlos' }])]} />{ctx.isOwner?<form action={startPartnerPlanCheckoutAction.bind(null,p.slug)}><button className="btn primary" disabled={current?.plan_slug===p.slug&&(current.status==='active'||current.status==='trialing')}>{current?.plan_slug===p.slug&&(current.status==='active'||current.status==='trialing')?'Aktiv':`${p.title} wählen`}</button></form>:<small>Nur das Firmenkonto kann den Tarif ändern.</small>}</EHPanel>)}
  </AppShell>;
}
