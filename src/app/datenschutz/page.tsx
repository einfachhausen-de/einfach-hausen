import type { Metadata } from 'next';
import { canonical } from '@/lib/seo';
import { MarketingShell } from '@/components/marketing/site-shell';
import { EHScope, EHSection, EHPageHero, EHPanel, EHButton, EHActions, EHEyebrow, EHHeading, EHText } from '@/design-system';

// HINWEIS (intern, 2026-09-14): Diese Fassung beschreibt den tatsaechlichen
// technischen Stand (selbst gehostete Infrastruktur, BYOK als Nutzerentscheidung,
// nur technisch notwendige Cookies). Sie ist eine technische Bestandsaufnahme und
// ersetzt keine Rechtsberatung. Vor Veroeffentlichung anwaltlich pruefen lassen,
// insbesondere Art. 13 Abs. 2 DSGVO, die Auftragsverarbeitung mit dem
// Hosting-Anbieter und die Formulierung zur Drittlanduebermittlung bei BYOK.
//
// Belege fuer die Aussagen hier:
//   src/lib/admin-auth.ts:94            Admin-Session-Cookie (httpOnly, sameSite strict)
//   src/lib/supabase.ts:96              Supabase-Auth-Cookie im Browser
//   src/lib/request-ai.ts:119           KI-Standardpfad: AI_BASE_URL || 127.0.0.1:20128 (selbst gehostet)
//   src/lib/ai-engine.ts:122-124        BYOK: Basis-URL + Modell kommen aus user_settings
//   src/app/app/settings/ai-settings.tsx  Nutzer-Eingabe von Basis-URL und Modell
//   src/lib/mailer.ts:10-19             E-Mail ueber konfigurierbaren SMTP-Host
//   src/app/api/stripe/webhook/route.ts Zahlungsabwicklung ueber Stripe
//   src/app/app/profile/page.tsx:42     WhatsApp-Kanal ausdruecklich noch nicht freigeschaltet
//   src/lib/geocode.ts:44               Nominatim: nur Postleitzahl + Land, serverseitig

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung von Einfach Hausen: Welche Daten verarbeitet werden, wo sie liegen, wie sie geschützt sind und deine Rechte.',
  alternates: { canonical: canonical('/datenschutz') }
};

const SECTIONS: { title: string; content: string[] }[] = [
  {
    title: '1. Verantwortliche Stelle',
    content: [
      'Verantwortlich für die Datenverarbeitung auf dieser Plattform ist der Betreiber von Einfach Hausen. Anfragen zum Datenschutz richtest du direkt über das Kundenportal oder an datenschutz@einfachhausen.de.'
    ]
  },
  {
    title: '2. Zweck und Umfang der Datenverarbeitung',
    content: [
      'Wir verarbeiten personenbezogene Daten (z. B. Name, E-Mail-Adresse, Postleitzahl, Objektdaten, Anfragetexte und Schadensfotos) ausschließlich zur Bereitstellung der Plattformfunktionen, der digitalen Hausakte und zur Vermittlung regionaler Fachbetriebe (Art. 6 Abs. 1 lit. b DSGVO).',
      'Zusätzlich verarbeiten wir technische Zugriffsdaten (gekürzte IP-Adresse, Zeitpunkt, aufgerufene Seite, Fehlerkennung), um den Betrieb abzusichern und Störungen nachzuvollziehen (Art. 6 Abs. 1 lit. f DSGVO).'
    ]
  },
  {
    title: '3. Hosting und Infrastruktur',
    content: [
      'Die Plattform läuft auf einer virtuellen Maschine der Oracle Cloud Infrastructure (OCI) innerhalb der Europäischen Union.',
      'Datenbank, Authentifizierung und Dateispeicher betreiben wir mit Supabase als quelloffener Software selbst auf dieser Maschine. Eine Übermittlung an einen separaten Datenbank- oder Auth-Anbieter findet nicht statt. Oracle ist als Hosting-Anbieter Auftragsverarbeiter nach Art. 28 DSGVO; mit Oracle besteht ein Auftragsverarbeitungsvertrag.',
      'Der Assistent („KI-Hausmeister“) läuft im Standardbetrieb über ein von uns selbst betriebenes Gateway auf derselben Infrastruktur. Deine Eingaben verlassen diesen Bereich dabei nicht.'
    ]
  },
  {
    title: '4. Cookies und Sitzungen',
    content: [
      'Wir setzen ausschließlich technisch notwendige Cookies. Es gibt keine Reichweitenmessung, kein Werbe-Tracking, keine Marketing-Pixel und keine externen Skripte Dritter auf dieser Seite.',
      'Im Einzelnen: ein Sitzungs-Cookie für die Anmeldung im Kunden- und Partnerbereich (gesetzt über unsere selbst betriebene Authentifizierung) sowie ein Sitzungs-Cookie für den internen Verwaltungsbereich. Beide sind als httpOnly und sameSite=strict ausgelegt und laufen mit der Sitzung ab.',
      'Rechtsgrundlage ist § 25 Abs. 2 TDDDG (unbedingt erforderlich) in Verbindung mit Art. 6 Abs. 1 lit. f DSGVO. Weil kein einwilligungspflichtiger Zugriff erfolgt, zeigen wir kein Cookie-Banner. Sobald wir Reichweitenmessung einsetzen, holen wir vorher deine Einwilligung ein.',
      'Zur Sprachauswahl speichern wir derzeit nichts auf deinem Gerät.'
    ]
  },
  {
    title: '5. KI-Hausmeister und Assistenzfunktionen',
    content: [
      'Der integrierte Assistent unterstützt bei der präzisen Formulierung von Anfragen und der Gewerke-Zuordnung. Im Standardbetrieb läuft diese Verarbeitung auf unserer eigenen Infrastruktur innerhalb der EU (siehe Abschnitt 3).',
      'Optional kannst du in den Einstellungen einen eigenen API-Schlüssel und eine eigene Basis-URL hinterlegen („BYOK“). Dann bestimmst du selbst, welcher Anbieter deine Eingaben verarbeitet — das kann ein Anbieter außerhalb der Europäischen Union sein. Diese Übermittlung geschieht ausschließlich auf deine ausdrückliche Entscheidung hin (Art. 49 Abs. 1 lit. a DSGVO). Es gelten zusätzlich die Datenschutzbestimmungen des von dir gewählten Anbieters. Ohne deine Angabe findet keine solche Übermittlung statt.',
      'Bitte übermittle in Freitextfeldern keine hochsensiblen Daten. Deine Eingaben werden nicht zum Training von Drittanbietermodellen verwendet.'
    ]
  },
  {
    title: '6. Empfänger von Daten',
    content: [
      'Wir geben personenbezogene Daten nur weiter, soweit das zur Erbringung der Leistung erforderlich ist:',
      '· Oracle Cloud Infrastructure — Hosting innerhalb der EU, Auftragsverarbeiter nach Art. 28 DSGVO.',
      '· Stripe — Abwicklung kostenpflichtiger Pakete. Zahlungsdaten werden direkt bei Stripe verarbeitet; wir erhalten keine vollständigen Zahlungsdaten.',
      '· Unser E-Mail-Versand — für Benachrichtigungen, über einen konfigurierten SMTP-Anbieter.',
      '· OpenStreetMap (Nominatim) — zur Regionszuordnung wird ausschließlich die Postleitzahl und das Land übermittelt, keine personenbezogenen Daten.',
      '· WhatsApp Business (Meta) — dieser Kanal ist technisch vorbereitet, aber derzeit ausdrücklich noch nicht freigeschaltet. Bevor wir ihn anbieten, ergänzen wir diese Erklärung.',
      'Eine Weitergabe zu Werbezwecken oder ein Verkauf von Daten findet nicht statt.'
    ]
  },
  {
    title: '7. Speicherdauer und Löschung',
    content: [
      'Anfrage- und Auftragsdaten löschen wir, sobald der Vorgang abgeschlossen und die gesetzliche Aufbewahrungsfrist abgelaufen ist. Inhalte der Hausakte bleiben gespeichert, bis du sie löschst oder dein Konto schließt.',
      'Rechnungs- und Buchungsbelege unterliegen den handels- und steuerrechtlichen Aufbewahrungsfristen (§ 257 HGB, § 147 AO) und werden für die Dauer dieser Fristen aufbewahrt.',
      'Technische Server-Protokolle werden nach kurzer Frist gelöscht, sofern sie nicht zur Aufklärung eines konkreten Störungs- oder Sicherheitsvorfalls benötigt werden.'
    ]
  },
  {
    title: '8. Rechte betroffener Personen',
    content: [
      'Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Datenübertragbarkeit deiner gespeicherten Hausdaten (DSGVO Art. 15–21). Die Hausakte kann jederzeit vollständig exportiert werden.',
      'Wenn du der Ansicht bist, dass wir deine Daten unrechtmäßig verarbeiten, kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO). Zuständig ist die Behörde deines gewöhnlichen Aufenthaltsorts oder unseres Sitzes.'
    ]
  }
];

export default function Page() {
  return (
    <MarketingShell>
      <EHScope>
      <EHPageHero
        eyebrow="Datenschutz"
        title="Deine Hausdaten gehören dir. Punkt."
        text="Wir behandeln Angaben zu deinem Zuhause, Rechnungen und Dokumenten mit höchster Vertraulichkeit. Keine Weitergabe ohne deine bewusste Freigabe."
      />

      <EHSection compact>
        <EHEyebrow>Transparenz</EHEyebrow>
        <EHHeading>Datenschutzhinweise nach DSGVO.</EHHeading>
        {SECTIONS.map((sec) => (
          <EHPanel key={sec.title} title={sec.title}>
            {sec.content.map((paragraph, index) => (
              <EHText key={index}>{paragraph}</EHText>
            ))}
          </EHPanel>
        ))}
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Rechtliche Navigation</EHEyebrow>
        <EHHeading>Weitere Angaben</EHHeading>
        <EHActions>
          <EHButton href="/impressum">Impressum</EHButton>
          <EHButton href="/sicherheit" variant="secondary">Sicherheitsstandards</EHButton>
          <EHButton href="/agb" variant="secondary">AGB</EHButton>
        </EHActions>
      </EHSection>
    </EHScope>
    </MarketingShell>
  );
}
