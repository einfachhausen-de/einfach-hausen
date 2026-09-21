import {IntakeForm} from "@/components/home/intake-form";
import {
  EHPageHero, EHImageFrame, EHButton, EHSection, EHMetricsBar, EHFeatureRows,
  EHSplitStory, EHPanel,
} from "@/design-system";

/**
 * Werkbank-Komposition der Startseite (Betreiberentscheidung 2026-09-21).
 *
 * Geaendert ist ausschliesslich die Anordnung, nicht die Designsprache:
 * der Kopf kommt ohne Display-Typografie und mit genau einer Aktion aus,
 * die Kachelwand aus EHFacts wird zur Kennzahlenzeile (EHMetricsBar), die
 * Kartenreihe aus EHPromiseRow zu dichten Zeilen (EHFeatureRows). Die
 * Fokuszeile der Seite ist der Intake-Abschnitt #anliegen darunter.
 *
 * Bausteine, Farben und Schrift bleiben unveraendert aus @/design-system.
 * Intake-Formular, Anker und Auth-Redirect bleiben produktiv angebunden.
 */
export function HomeHero() {
  return <>
    <EHPageHero eyebrow="Zuhause, mit Überblick."
      title={<>Dein Haus. Einfach geregelt.</>}
      text="Weniger Kümmern. Mehr Zuhause sein. Behalte im Blick, was ansteht, und finde die passenden Menschen für dein Haus."
      actions={<EHButton href="#anliegen" arrow>Anliegen starten</EHButton>}
      media={<EHImageFrame src="/images/marketing/family-home.jpg" alt="Ein Paar vor einem Haus im Garten" caption="Ein Zuhause. Viele Geschichten. · Illustrative Bildwelt" priority/>}
    />
    <EHSection compact>
      <EHMetricsBar label="Überblick" items={[
        {id: 'leistungen', label: 'Leistungsbereiche', value: '12', hint: 'mit geprüften Betrieben'},
        {id: 'ansprechpartner', label: 'Ansprechpartner', value: '1', hint: 'Name, Betrieb und Nummer'},
        {id: 'provision', label: 'Provision pro Auftrag', value: '0 %', hint: 'Partner bleiben Rechnungssteller'},
        {id: 'hauskonto', label: 'Hauskonto', value: '0 €', hint: 'dauerhaft kostenlos'},
      ]} />
      <EHFeatureRows items={[
        {title: 'Alles wissen.', text: 'Dokumente und die Geschichte deines Hauses.'},
        {title: 'Nichts vergessen.', text: 'Anstehende Wartungen und wichtige Termine.'},
        {title: 'Nicht alles selbst machen.', text: 'Passende Ansprechpartner, wenn es Hilfe braucht.'},
      ]} />
    </EHSection>
    <EHSection id="anliegen" tone="white"><EHSplitStory eyebrow="Ein klarer nächster Schritt" title="Ein Satz. Ein nächster Schritt." text="Heizung, Dach, Garten oder Unterlagen: Beschreibe dein Anliegen in deinen Worten. Du entscheidest, wie es weitergeht." media={<EHPanel><IntakeForm variant="hero"/></EHPanel>}/></EHSection>
  </>;
}
