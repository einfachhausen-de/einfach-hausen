import type { Metadata } from 'next';
import { canonical, ogBlock } from '@/lib/seo';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import { MarketingShell } from '@/components/marketing/site-shell';
import { EHScope, EHSection, EHPageHero, EHFAQ, EHClosing, EHButton, EHText, EHRecordCover, EHPricing, EHSectionHeading, EHPromiseRow, EHComparison, EHActions } from '@/design-system';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Preise – dein Hauskonto und optionale Betreuung',
  description: 'Kostenloses Hauskonto, optionale Mitgliedschaften und transparente Betriebstarife. Handwerkerleistungen werden separat vereinbart.',
  alternates: { canonical: canonical('/preise') },
  openGraph: ogBlock({ url: '/preise', title: 'Preise · Einfach Hausen', description: 'Kostenloses Hauskonto, optionale Mitgliedschaften und transparente Betriebstarife.', motiv: 'preise' }),
};

type Plan = { slug: string; title: string; monthly_amount: number };
type PartnerPlan = Plan & { monthly_lead_limit: number | null; trial_days: number };

export default function Page() {
  const owner = db.prepare('SELECT slug,title,monthly_amount FROM membership_plans WHERE active=1 ORDER BY monthly_amount').all() as Plan[];
  const partner = db.prepare('SELECT slug,title,monthly_amount,monthly_lead_limit,trial_days FROM partner_plans WHERE active=1 ORDER BY monthly_amount').all() as PartnerPlan[];
  const ownerCopy: Record<string, { text: string; features: string[] }> = {
    free: { text: 'Dein Einstieg: Hauswissen sammeln und Hilfe organisieren.', features: ['Digitale Hausakte und Dokumente', 'Wartungen und Jahresübersicht', 'Anliegen beschreiben und Angebote prüfen', 'KI-Nutzung im verfügbaren Kontingent'] },
    plus: { text: 'Für zusätzliche Unterstützung bei der Organisation deines Hauses.', features: ['Alles aus dem kostenlosen Hauskonto', 'Zusätzlicher Organisations- und Prioritätsservice', 'Leistungsumfang vor Abschluss gemeinsam klären', 'Handwerkerleistungen separat vereinbaren'] },
    premium: { text: 'Für persönliche Begleitung und einen geplanten Hauscheck.', features: ['Alles aus dem kostenlosen Hauskonto', 'Persönliche Betreuung im vereinbarten Umfang', 'Jährlicher Hauscheck laut Tarif', 'Umfang und Durchführung vor Abschluss klären'] },
  };
  return <MarketingShell><EHScope>
    <EHPageHero eyebrow="Einfachhausen · Preise" title="Dein Haus. Dein Tempo. Dein Tarif."
      text="Beginne mit einem kostenlosen Hauskonto. Wenn du mehr Unterstützung möchtest, wählst du sie bewusst dazu. Die Arbeit am Haus vereinbarst du separat mit dem Betrieb."
      actions={<><EHButton href="#hauskonto" arrow>Tarife für mein Haus</EHButton><EHButton href="#betriebe" variant="secondary">Ich bin Partnerbetrieb</EHButton></>}
      media={<EHRecordCover eyebrow="Der Anfang ist einfach" title="0 € fürs Hauskonto." subtitle="Unterlagen, Wartungen und deine Anliegen an einem Ort." number="01">
        <EHText>Kein kostenpflichtiges Abo für den Einstieg. Keine Auftragsprovision an Einfachhausen.</EHText>
      </EHRecordCover>} />
    <EHSection compact id="hauskonto">
      <EHSectionHeading eyebrow="Für dein Zuhause" title="Erst Überblick. Dann mehr Unterstützung."
        text="Das kostenlose Hauskonto ist ein eigenständiger Einstieg. Ein bezahlter Tarif ergänzt die Betreuung – er ersetzt nicht die Rechnung des Handwerksbetriebs." />
      <EHPricing plans={owner.map(plan => ({
        name: plan.title, price: euroExact(plan.monthly_amount), period: ' / Monat',
        text: ownerCopy[plan.slug]?.text || 'Den konkreten Leistungsumfang besprechen wir vor dem Abschluss.',
        features: ownerCopy[plan.slug]?.features || ['Leistungsumfang vor Abschluss klären'],
        href: plan.monthly_amount === 0 ? '/register?role=homeowner' : '/kontakt',
        action: plan.monthly_amount === 0 ? 'Kostenloses Hauskonto anlegen' : plan.title + ' besprechen',
      }))} note="Bestehende Tarife im Überblick. Persönliche Betreuung und Hauscheck haben einen vereinbarten Umfang; Reparaturen, Material und zusätzliche Arbeiten sind nicht pauschal enthalten." />
      <EHText size="meta">Pilotphase: Für berechtigte Haushalte wird der bestehende 15-%-Vorteil im Konto berücksichtigt. <a href="/pilotphase">Zu den Bedingungen</a>.</EHText>
      <EHActions><EHButton href="/app/plans" variant="secondary">Meine Mitgliedschaft im Konto ansehen</EHButton></EHActions>
    </EHSection>
    <EHSection tone="white">
      <EHSectionHeading eyebrow="Zwei klare Vereinbarungen" title="Hausorganisation und Handwerk. Sauber getrennt."
        text="Du sollst vor deiner Entscheidung wissen, wofür du zahlst." />
      <EHComparison left={{ title: 'Dein Einfachhausen-Tarif', items: [
        'Das Hauskonto beginnt kostenlos.',
        'Zusätzliche Betreuung ist eine eigene, bewusste Entscheidung.',
        'Umfang, Laufzeit und Preis vor dem Abschluss prüfen.',
      ] }} right={{ title: 'Dein Auftrag beim Betrieb', items: [
        'Leistung und Preis vereinbarst du mit dem ausführenden Betrieb.',
        'Arbeit, Material und Anfahrt richten sich nach dem Angebot.',
        'Einfachhausen erhebt keine Provision auf den Auftragswert.',
      ] }} />
    </EHSection>
    <EHSection tone="deep">
      <EHSectionHeading eyebrow="Unser Preisprinzip" title="Du bezahlst für Unterstützung. Nicht für Druck." />
      <EHPromiseRow items={[
        { title: 'Deine Entscheidung zählt.', text: 'Eine Frage ist noch kein Auftrag. Du entscheidest über den nächsten Schritt.' },
        { title: 'Deine Hausakte bleibt der Anfang.', text: 'Du kannst kostenlos starten und später entscheiden, ob zusätzliche Betreuung sinnvoll ist.' },
        { title: 'Eignung vor Tarif.', text: 'Ein zahlender Partner kauft keine bessere Position im Qualitätsmatching.' },
      ]} />
    </EHSection>
    <EHSection id="betriebe">
      <EHSectionHeading eyebrow="Für Partnerbetriebe" title="Ein Arbeitsbereich. Ein planbarer Tarif."
        text="Wähle den Umfang für deinen Betrieb. Die Tarifgrenze für neue Anfragen ist keine Zusage über tatsächlich eingehende Aufträge." />
      <EHPricing plans={partner.map(plan => ({
        name: plan.title, price: euroExact(plan.monthly_amount), period: ' / Monat',
        text: plan.monthly_amount === 0 ? 'Den Partnerbereich kennenlernen.' : 'Für die Zusammenarbeit mit Kunden und deinem Betrieb.',
        features: [
          plan.monthly_lead_limit === null ? 'Keine tarifliche Monatsgrenze für neue Anfragen' : 'Bis zu ' + plan.monthly_lead_limit + ' neue Anfragen pro Monat',
          '0 % Auftragsprovision an Einfachhausen',
          'Tarifneutrales Qualitätsmatching',
          ...(plan.trial_days > 0 ? [plan.trial_days + ' Tage Testphase laut Tarif'] : []),
        ],
        href: plan.monthly_amount === 0 ? '/register?role=provider' : '/kontakt',
        action: plan.monthly_amount === 0 ? 'Als Betrieb starten' : plan.title + ' besprechen',
      }))} note="Betriebstarife getrennt von den Eigentümer-Mitgliedschaften. Konkrete Funktionen, Abrechnung und Bedingungen vor Abschluss prüfen." />
    </EHSection>
    <EHSection tone="white">
      <EHSectionHeading eyebrow="Vor deiner Entscheidung" title="Die wichtigen Fragen. Klar beantwortet." />
      <EHFAQ items={[
        { q: 'Brauche ich ein Abo, um Hilfe anzufragen?', a: 'Nein. Du kannst mit dem kostenlosen Hauskonto beginnen, dein Anliegen beschreiben und passende Angebote prüfen. KI-Funktionen richten sich nach dem verfügbaren Kontingent.' },
        { q: 'Sind Reparaturen im Monatspreis enthalten?', a: 'Nein. Die Mitgliedschaft ist kein Reparatur-Flatrate-Vertrag. Handwerkerleistungen, Material und zusätzliche Arbeiten werden gesondert vereinbart.' },
        { q: 'Welcher Tarif passt zu mir?', a: 'Beginne kostenlos, wenn du Unterlagen sammeln und Anliegen organisieren möchtest. Für zusätzliche Betreuung besprechen wir zunächst deinen Bedarf und den konkreten Leistungsumfang.' },
        { q: 'Bekomme ich als zahlender Betrieb garantiert Aufträge?', a: 'Nein. Tarifgrenzen regeln das mögliche Anfragevolumen. Ob Anfragen passen, hängt unter anderem von Region, Leistung, Verfügbarkeit und Qualität ab.' },
        { q: 'Wie verdient Einfachhausen Geld?', a: 'Über optionale Mitgliedschaften und Betriebstarife. Auf den vereinbarten Handwerker-Auftragswert erheben wir keine Provision.' },
      ]} />
    </EHSection>
    <EHClosing title="Ein gutes Zuhause beginnt mit Überblick." text="Starte mit deiner Hausakte. Zusätzliche Unterstützung entscheidest du später." href="/register?role=homeowner" label="Kostenloses Hauskonto anlegen" secondary={<EHButton href="/kontakt" variant="secondary">Eine Frage zu den Tarifen stellen</EHButton>} />
  </EHScope></MarketingShell>;
}
