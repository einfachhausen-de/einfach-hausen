import { AppShell } from '@/components/shell';
import { EHButton, EHCheckbox, EHEmptyState, EHErrorState, EHFormFeedback, EHMetricsBar, EHPageHeader, EHRecordList, EHRecordViews, EHStatus, EHSubmitButton, EHText, EHWorkSection, EHWorkspaceGrid } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { purchasePackageAction, startMembershipCheckoutAction } from '@/app/actions';
import { euroExact, statusLabel } from '@/lib/format';

type Plan = { slug: string; title: string; monthly_amount: number; description: string; annual_house_check: number };
type Package = { slug: string; title: string; price_amount: number; description: string; services_json: string };
type Subscription = { plan_slug: string; title: string; status: string; stripe_subscription_id: string | null; monthly_amount: number };

export default async function Plans({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const pilot = db.prepare('SELECT discount_bps FROM pilot_cohort WHERE user_id=?').get(user.id) as { discount_bps: number } | undefined;
  const plans = db.prepare('SELECT * FROM membership_plans WHERE active=1 ORDER BY monthly_amount').all() as Plan[];
  const packages = db.prepare('SELECT * FROM service_packages WHERE active=1 ORDER BY price_amount').all() as Package[];
  const current = db.prepare('SELECT s.*,p.title,p.monthly_amount FROM subscriptions s JOIN membership_plans p ON p.slug=s.plan_slug WHERE s.homeowner_id=?').get(user.id) as Subscription | undefined;
  const orders = db.prepare('SELECT o.*,p.title FROM package_orders o JOIN service_packages p ON p.slug=o.package_slug WHERE o.homeowner_id=? ORDER BY o.created_at DESC').all(user.id) as { id: number; title: string; status: string }[];
  const price = (amount: number) => pilot ? Math.max(0, Math.round(amount * (10000 - pilot.discount_bps) / 10000)) : amount;
  const stateText: Record<string, string> = {
    active: 'Deine Mitgliedschaft ist aktiv.',
    pending: 'Die Aktivierung ist noch nicht bestätigt. Bitte starte nicht mehrfach denselben Abschluss.',
    past_due: 'Für deine Mitgliedschaft ist eine Zahlung offen. Kläre den Zahlungsstatus, bevor du einen neuen Tarif abschließt.',
    cancelled: 'Deine Mitgliedschaft ist gekündigt. Du kannst dein Hauskonto weiterhin nutzen.',
  };
  const stateLabel: Record<string, string> = { active: 'Aktiv', pending: 'Bestätigung ausstehend', past_due: 'Zahlung offen', cancelled: 'Gekündigt' };
  const statusHint = current
    ? stateText[current.status] || 'Bitte lass den Mitgliedschaftsstatus prüfen.'
    : 'Du brauchst kein kostenpflichtiges Abo, um mit deinem Hauskonto zu beginnen.';

  return <AppShell role="homeowner" active="/app/plans" title="Tarif & Pakete" subtitle="Mitgliedschaft und einzelne Leistungen">
    <EHPageHeader
      title="Tarif & Pakete"
      context={current ? `${current.title} · ${stateLabel[current.status] || 'Status prüfen'}` : 'Kostenloses Hauskonto'}
      actions={<>
        {current?.status === 'past_due'
          ? <EHButton href="/kontakt">Zahlungsstatus klären</EHButton>
          : <EHButton href="/kontakt" variant="secondary">Leistungsumfang klären</EHButton>}
        <EHButton href="/preise" variant="secondary">Öffentliche Tarifübersicht</EHButton>
      </>}
    />
    {sp.error && <EHErrorState text={sp.error} />}
    {(sp.checkout === 'success' || sp.checkout === 'processing') && <EHFormFeedback kind="info">Du bist vom Abschluss zurückgekehrt. Entscheidend ist der bestätigte Status deiner Mitgliedschaft oder Paketbuchung unten; die Rückkehr allein bestätigt keine Zahlung.</EHFormFeedback>}
    {sp.checkout === 'cancelled' && <EHFormFeedback kind="info">Der Bezahlvorgang wurde abgebrochen. Prüfe unten deinen aktuellen Status, bevor du erneut startest.</EHFormFeedback>}
    {sp.checkout === 'unavailable' && <EHErrorState text="Onlinezahlung ist gerade nicht verfügbar. Bitte versuche es später erneut." />}
    {sp.switch === 'done' && <EHFormFeedback kind="success">Deine bezahlte Mitgliedschaft wurde beendet und der Wechsel auf Free bestätigt. Dein Hauskonto bleibt kostenlos nutzbar.</EHFormFeedback>}

    <EHMetricsBar label="Dein Hauskonto" items={[
      { id: 'status', label: 'Status', value: <EHStatus tone={current?.status === 'past_due' ? 'warning' : current?.status === 'active' ? 'success' : 'neutral'}>{current ? stateLabel[current.status] || 'Status prüfen' : 'Ohne bezahlte Mitgliedschaft'}</EHStatus> },
      { id: 'mitgliedschaft', label: 'Mitgliedschaft', value: current ? current.title : 'Kostenloses Hauskonto', hint: statusHint },
      { id: 'kosten', label: 'Kosten pro Monat', value: current ? `${euroExact(price(current.monthly_amount))} / Monat` : '0 €', hint: pilot ? `inkl. ${(pilot.discount_bps / 100).toLocaleString('de-DE')} % Pilot-Vorteil` : 'dein Mitgliedsbeitrag' },
      { id: 'pakete', label: 'Gebuchte Pakete', value: String(orders.length), hint: orders.length === 1 ? 'Einzelpaket' : 'Einzelpakete' },
    ]} />

    <EHWorkspaceGrid main={<>
    <EHWorkSection title="Monatliche Mitgliedschaften">
      {plans.length === 0 && <EHEmptyState title="Gerade keine Tarife auswählbar" text="Dein aktueller Status bleibt oben sichtbar. Bitte versuche es später erneut." />}
      {plans.length > 0 && <EHRecordViews label="Monatliche Mitgliedschaften" storageKey="tarife" defaultView="liste" switcherLabel="Tarife: Ansicht wechseln" items={plans.map(plan => {
        const isCurrent = current?.status === 'active' && current.plan_slug === plan.slug;
        const downgrading = plan.monthly_amount === 0 && Boolean(current?.stripe_subscription_id);
        return {
          id: plan.slug,
          title: plan.title,
          detail: [
            plan.description,
            Boolean(plan.annual_house_check) ? 'Hauscheck: Umfang vor Abschluss klären' : null,
            pilot && plan.monthly_amount > 0 ? `Regulär ${euroExact(plan.monthly_amount)} / Monat` : null,
          ].filter(Boolean).join(' · '),
          value: `${euroExact(price(plan.monthly_amount))} / Monat`,
          status: isCurrent ? <EHStatus tone="success">Dein aktueller Tarif</EHStatus> : undefined,
          action: (
            <form action={startMembershipCheckoutAction.bind(null, plan.slug)}>
              {downgrading && <EHCheckbox name="confirmFreeSwitch" required label="Ich möchte meine bestehende bezahlte Mitgliedschaft beenden und auf Free wechseln." />}
              <EHSubmitButton disabled={isCurrent} pendingLabel="Wird geöffnet …">{isCurrent ? 'Aktueller Tarif' : downgrading ? 'Auf Free wechseln' : plan.monthly_amount === 0 ? 'Free aktivieren' : plan.title + ' · zum Abschluss'}</EHSubmitButton>
            </form>
          ),
        };
      })} />}
    </EHWorkSection>

    <EHWorkSection title="Einzelpakete">
      {packages.length === 0 && <EHEmptyState title="Derzeit keine Einzelpakete" text="Bei einem konkreten Anliegen hilft dir dein Hausmeister weiter." />}
      {packages.length > 0 && <EHRecordViews label="Einzelpakete" storageKey="pakete" defaultView="liste" switcherLabel="Pakete: Ansicht wechseln" items={packages.map(pkg => {
        let services: string[] = [];
        try { const parsed: unknown = JSON.parse(pkg.services_json); if (Array.isArray(parsed)) services = parsed.filter((item): item is string => typeof item === 'string'); } catch {}
        return {
          id: pkg.slug,
          title: pkg.title,
          detail: [
            pkg.description,
            services.join(' · '),
            pilot && pkg.price_amount > 0 ? `Regulär ${euroExact(pkg.price_amount)}` : null,
          ].filter(Boolean).join(' · '),
          value: `${euroExact(price(pkg.price_amount))} einmalig`,
          action: <form action={purchasePackageAction.bind(null, pkg.slug)}><EHSubmitButton pendingLabel="Wird geöffnet …">Paket · zum Abschluss</EHSubmitButton></form>,
        };
      })} />}
    </EHWorkSection>

    </>} aside={<>
      <EHWorkSection title="Deine Mitgliedschaft">
        {current ? <>
          <EHText>{current.title}</EHText>
          <EHStatus tone={current.status === 'past_due' ? 'warning' : current.status === 'active' ? 'success' : 'neutral'}>{stateLabel[current.status] || 'Status prüfen'}</EHStatus>
          <EHText muted>{`${euroExact(price(current.monthly_amount))} pro Monat${pilot ? ` · inkl. ${(pilot.discount_bps / 100).toLocaleString('de-DE')} % Pilot-Vorteil` : ''}`}</EHText>
          <EHText muted>{statusHint}</EHText>
        </> : <>
          <EHText>Kostenloses Hauskonto</EHText>
          <EHText muted>{statusHint}</EHText>
          <EHButton href="/preise" variant="secondary" arrow>Tarife ansehen</EHButton>
        </>}
      </EHWorkSection>
      <EHWorkSection title="Deine Paketbuchungen">
        {orders.length > 0
          ? <EHRecordList label="Gebuchte Pakete" items={orders.map(order => ({ id: String(order.id), title: order.title, status: <EHStatus>{statusLabel(order.status)}</EHStatus> }))} />
          : <EHEmptyState title="Noch keine Pakete gebucht" text="Nach einer Buchung siehst du hier den gespeicherten Status." />}
      </EHWorkSection>
      <EHWorkSection title="Leistungsumfang">
        <EHText muted>Arbeit und Material sind in keiner Mitgliedschaft enthalten. Zusätzliche Handwerkerleistungen buchst du als Einzelpaket oder klärst sie direkt mit dem Betrieb.</EHText>
        <EHButton href="/preise" variant="secondary" arrow>Öffentliche Tarifübersicht</EHButton>
      </EHWorkSection>
    </>} />
  </AppShell>;
}
