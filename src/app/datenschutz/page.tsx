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
// Belege fuer die Aussagen hier (vollstaendige Geraetespeicher-Inventur:
// docs/privacy/DEVICE_STORAGE_INVENTORY.md, Stand 2026-09-21):
//   src/lib/auth.ts:81-83,110           Eigentuemer-Session-Cookie (httpOnly, sameSite lax, 30 Tage)
//   src/lib/admin-auth.ts:70,95         Admin-Session-Cookie (httpOnly, sameSite strict, 12 h)
//   src/lib/supabase.ts:56-96           Supabase-Auth-Cookie: bewusst NICHT httpOnly, sameSite lax
//   src/components/ui/sidebar.tsx:85    sidebar_state (Bedienpraeferenz, 7 Tage, nicht erforderlich)
//   src/components/homeowner/homeowner-hausmeister-composer.tsx:25,38  localStorage-Entwurf mit Nutzereingabe
//   packages/eh-design/src/workspace-views.tsx:28      localStorage Ansichtsmodus
//   packages/eh-design/src/workspace-sidebar.tsx:16    localStorage Sidebar-Zustand
//   public/sw.js:1-7,39-46,82-98        Service Worker: nur vier Icons im Cache, Navigation network-only
//   src/components/telemetry/cwv-telemetry.tsx:25      Ladezeitmessung same-origin (/api/telemetry)
//   src/app/error.tsx:19                Fehlerbericht same-origin (/api/errors)
//   src/lib/request-ai.ts:119           KI-Standardpfad: AI_BASE_URL || 127.0.0.1:20128 (selbst gehostet)
//   src/lib/ai-engine.ts:122-124        BYOK: Basis-URL + Modell kommen aus user_settings
//   src/app/app/settings/ai-settings.tsx  Nutzer-Eingabe von Basis-URL und Modell
//   src/lib/mailer.ts:10-19             E-Mail ueber konfigurierbaren SMTP-Host
//   src/app/api/stripe/webhook/route.ts Zahlungsabwicklung ueber Stripe (Betriebs-Tarife)
//   src/app/app/profile/page.tsx:42     WhatsApp-Kanal ausdruecklich noch nicht freigeschaltet
//   src/lib/geocode.ts:44               Nominatim: nur Postleitzahl + Land, serverseitig
//   src/lib/affiliate.ts:94-99          Affiliate: AFFILIATE_PARTNERS leer, kein Partner aktiv

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
    title: '4. Cookies, Gerätespeicher und Sitzungen',
    content: [
      'Es gibt keine Werbe-Tracking-, Marketing-Pixel- oder Analyse-Skripte Dritter auf dieser Seite, und es werden keine Schrift- oder Skriptdateien von fremden Servern geladen. Unsere Content-Security-Policy erlaubt im Browser ausschließlich unsere eigene Herkunft sowie den Ursprung unserer selbst betriebenen Anmeldung.',
      'Im Einzelnen setzen wir: ein Sitzungs-Cookie für die Anmeldung im Kunden- und Partnerbereich (gesetzt über unsere selbst betriebene Authentifizierung, httpOnly, sameSite=lax, Ablauf nach 30 Tagen), ein Sitzungs-Cookie für den internen Verwaltungsbereich (httpOnly, sameSite=strict, Ablauf nach 12 Stunden) und die Sitzungs-Cookies unserer Anmeldung, die für den Anmeldeablauf technisch im Browser lesbar sein müssen und deshalb nicht httpOnly sind.',
      'Zusätzlich speichern wir eine Bedienpräferenz: ob die Seitenleiste des Arbeitsbereichs ein- oder ausgeklappt ist (Cookie „sidebar_state“, 7 Tage).',
      'Auf deinem Gerät speichern wir außerdem lokal, ohne Übertragung an uns: den Entwurf eines noch nicht abgesendeten Anfragetextes im Hausmeisterbereich (wird nach dem Absenden gelöscht), die von dir gewählte Darstellung einer Liste (Liste, Karten oder Chronik) und den Zustand der Seitenleiste. Eine App-Installation legt zusätzlich einen technischen Zwischenspeicher an, der ausschließlich unsere Symboldateien enthält; angemeldete Seiten und Inhalte werden darin nicht gespeichert.',
      'Zur Verbesserung der Ladezeiten messen wir anonym und ausschließlich auf unseren eigenen Servern die Ladezeit einzelner Seiten (Metrikname, Messwert, Bewertung, Pfad). Diese Messung enthält keinen Nutzerbezug und wird nicht an Dritte übermittelt. Technische Fehlerberichte werden ebenso ausschließlich auf unseren Servern erfasst.',
      'Rechtsgrundlage für die technisch notwendigen Sitzungs-Cookies ist § 25 Abs. 2 TDDDG (unbedingt erforderlich) in Verbindung mit Art. 6 Abs. 1 lit. f DSGVO. Für die Bedienpräferenzen stützen wir uns auf Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer funktionierenden Bedienung). Sobald wir Reichweitenmessung mit Nutzerbezug oder Werbe-Tracking einsetzen, holen wir vorher deine Einwilligung ein.',
      'Für die Vermittlung in unserem freiwilligen Vergleichsbereich (Strom, Gas, Internet, Mobilfunk, Versicherungen) zählen wir aus, dass ein Vergleich aufgerufen wurde. Dabei werden nur die Kategorie, die Partnerkennung, eine zufällige Referenz und der Zeitpunkt gespeichert — kein Bezug zu deiner Person, deinem Haus, deinen Verträgen oder deinen Kontaktdaten. Derzeit ist kein Partner freigegeben, sodass keine Ausleitung stattfindet.',
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
      '· Stripe — Abwicklung der kostenpflichtigen Tarife unserer teilnehmenden Fachbetriebe sowie der Auftragszahlungen. Zahlungsdaten werden direkt bei Stripe verarbeitet; wir erhalten keine vollständigen Zahlungsdaten. Für Eigentümer fallen keine Kosten an, daher gibt es für sie keinen Zahlungsvorgang.',
      '· Unser E-Mail-Versand — für transaktionale Benachrichtigungen zu Angeboten und Aufträgen über einen konfigurierten SMTP-Anbieter. Wir versenden dabei keine Werbung und keine Newsletter. E-Mail-Benachrichtigungen erhältst du nur zu Vorgängen, die du selbst ausgelöst hast.',
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
