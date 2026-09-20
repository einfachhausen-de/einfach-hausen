import type { Metadata } from 'next';
import { canonical, ogBlock } from '@/lib/seo';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import { MarketingShell } from '@/components/marketing/site-shell';
import { EHScope, EHSection, EHPageHero, EHFAQ, EHClosing, EHButton, EHText, EHRecordCover, EHPricing, EHSectionHeading, EHPromiseRow, EHComparison, EHActions } from '@/design-system';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Preise – dein kostenloses Hauskonto und Betriebstarife',
  description: 'Das Hauskonto für Eigentümer ist kostenlos. Transparente Betriebstarife für Handwerksbetriebe. Handwerkerleistungen werden separat vereinbart.',
  alternates: { canonical: canonical('/preise') },
  openGraph: ogBlock({ url: '/preise', title: 'Preise · Einfach Hausen', description: 'Kostenloses Hauskonto für Eigentümer und transparente Betriebstarife.', motiv: 'preise' }),
};

type PartnerPlan = { slug: string; title: string; monthly_amount: number; monthly_lead_limit: number | null; trial_days: number };

export default function Page() {
  const partner = db.prepare('SELECT slug,title,monthly_amount,monthly_lead_limit,trial_days FROM partner_plans WHERE active=1 ORDER BY monthly_amount').all() as PartnerPlan[];
  return <MarketingShell><EHScope>
    <EHPageHero eyebrow="Einfachhausen · Preise" title="Dein Haus. Dein Tempo. Kostenlos."
      text="Dein Hauskonto ist kostenlos – dauerhaft. Es gibt keine Mitgliedschaft und kein Abo für Eigentümer. Die Arbeit am Haus vereinbarst du separat mit dem Betrieb."
      actions={<><EHButton href="#hauskonto" arrow>Was kostenlos ist</EHButton><EHButton href="#betriebe" variant="secondary">Ich bin Partnerbetrieb</EHButton></>}
      media={<EHRecordCover eyebrow="Der Anfang ist einfach" title="0 € fürs Hauskonto." subtitle="Unterlagen, Wartungen und deine Anliegen an einem Ort." number="01">
        <EHText>Kein Abo für Eigentümer. Keine Auftragsprovision an Einfachhausen.</EHText>
      </EHRecordCover>} />
    <EHSection compact id="hauskonto">
      <EHSectionHeading eyebrow="Für dein Zuhause" title="Kostenlos. Ohne Tarifwahl."
        text="Das Hauskonto ist vollständig kostenlos: Hausakte, Dokumente, Wartungen, Anliegen und Angebote prüfen. Es gibt keine Mitgliedschaftsstufe und keine Freischaltung, die du kaufen müsstest. Die Rechnung des Handwerksbetriebs zahlst du direkt an den Betrieb." />
      <EHPricing plans={[{
        name: 'Hauskonto',
        price: '0 €',
        period: ' / dauerhaft',
        text: 'Alle freigegebenen Kernfunktionen für Eigentümer, ohne Abo und ohne versteckte Gebühr.',
        features: [
          'Digitale Hausakte und Dokumente',
          'Wartungen und Jahresübersicht',
          'Anliegen beschreiben und Angebote prüfen',
          'Ansprechpartner verwalten und finden',
          'Keine Mitgliedschaft als Zugangsvoraussetzung',
        ],
        href: '/register?role=homeowner',
        action: 'Kostenloses Hauskonto anlegen',
      }]} note="Kein kostenpflichtiger Eigentümer-Tarif, keine Vermittlungs- oder Servicegebühr auf Handwerkeraufträge. Reparaturen, Material und zusätzliche Arbeiten rechnest du direkt mit dem Betrieb ab." />
      <EHActions><EHButton href="/register?role=homeowner" arrow>Kostenloses Hauskonto anlegen</EHButton></EHActions>
    </EHSection>
    <EHSection tone="white">
      <EHSectionHeading eyebrow="Zwei klare Vereinbarungen" title="Hausorganisation und Handwerk. Sauber getrennt."
        text="Du sollst vor deiner Entscheidung wissen, wofür du zahlst." />
      <EHComparison left={{ title: 'Dein Hauskonto', items: [
        'Das Hauskonto ist kostenlos und bleibt kostenlos.',
        'Keine Mitgliedschaft, kein Abo, keine Freischaltung.',
        'Keine Vermittlungs- oder Servicegebühr auf Aufträge.',
      ] }} right={{ title: 'Dein Auftrag beim Betrieb', items: [
        'Leistung und Preis vereinbarst du mit dem ausführenden Betrieb.',
        'Arbeit, Material und Anfahrt richten sich nach dem Angebot.',
        'Einfachhausen erhebt keine Provision auf den Auftragswert.',
      ] }} />
    </EHSection>
    <EHSection tone="deep">
      <EHSectionHeading eyebrow="Unser Preisprinzip" title="Du bezahlst für Handwerk. Nicht für Zugang." />
      <EHPromiseRow items={[
        { title: 'Deine Entscheidung zählt.', text: 'Eine Frage ist noch kein Auftrag. Du entscheidest über den nächsten Schritt.' },
        { title: 'Kein Zugang gegen Geld.', text: 'Hausakte, Anliegen und Ansprechpartner sind kostenlos. Es gibt keinen Tarif, der sie freischaltet.' },
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
      }))} note="Betriebstarife betreffen ausschließlich Handwerksbetriebe. Das Hauskonto für Eigentümer ist kostenlos und hat keinen Tarif. Konkrete Funktionen, Abrechnung und Bedingungen vor Abschluss prüfen." />
    </EHSection>
    <EHSection tone="white">
      <EHSectionHeading eyebrow="Vor deiner Entscheidung" title="Die wichtigen Fragen. Klar beantwortet." />
      <EHFAQ items={[
        { q: 'Brauche ich ein Abo, um Hilfe anzufragen?', a: 'Nein. Das Hauskonto ist kostenlos und bleibt kostenlos. Du kannst dein Anliegen beschreiben und passende Angebote prüfen, ohne einen Tarif zu wählen.' },
        { q: 'Sind Reparaturen im Preis enthalten?', a: 'Es gibt keinen Monatspreis für Eigentümer. Handwerkerleistungen, Material und zusätzliche Arbeiten rechnest du direkt mit dem ausführenden Betrieb ab.' },
        { q: 'Welcher Tarif passt zu mir?', a: 'Es gibt keine Tarifwahl für Eigentümer. Du legst dein Hauskonto an und nutzt die Kernfunktionen vollständig; eine Mitgliedschaft musst du nicht abschließen.' },
        { q: 'Bekomme ich als zahlender Betrieb garantiert Aufträge?', a: 'Nein. Tarifgrenzen regeln das mögliche Anfragevolumen. Ob Anfragen passen, hängt unter anderem von Region, Leistung, Verfügbarkeit und Qualität ab.' },
        { q: 'Wie verdient Einfachhausen Geld?', a: 'Über die Betriebstarife der teilnehmenden Handwerksbetriebe und über Vergütungen aus dem freiwilligen Vergleichsbereich für Verträge. Für Eigentümer ist die Nutzung kostenlos; auf den Handwerker-Auftragswert erheben wir keine Provision.' },
      ]} />
    </EHSection>
    <EHClosing title="Ein gutes Zuhause beginnt mit Überblick." text="Starte kostenlos mit deiner Hausakte. Ohne Tarifwahl, ohne Abo." href="/register?role=homeowner" label="Kostenloses Hauskonto anlegen" secondary={<EHButton href="/kontakt" variant="secondary">Eine Frage stellen</EHButton>} />
  </EHScope></MarketingShell>;
}
