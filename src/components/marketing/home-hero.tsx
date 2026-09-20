import {IntakeForm} from "@/components/home/intake-form";
import {EHPageHero, EHImageFrame, EHButton, EHSection, EHPromiseRow, EHSplitStory, EHPanel, EHFacts} from "@/design-system";

/** Accepted Atelier 02. Existing intake behavior and product facts remain connected. */
export function HomeHero() {
  return <>
    <EHPageHero display eyebrow="Zuhause, mit Überblick." number="01"
      title={<>Dein Haus.<br/>Einfach<br/>geregelt.</>}
      text="Weniger Kümmern. Mehr Zuhause sein. Behalte im Blick, was ansteht, und finde die passenden Menschen für dein Haus."
      actions={<><EHButton href="/hausakte" arrow>Deine Hausakte entdecken</EHButton><EHButton href="#anliegen" variant="quiet">Anliegen starten</EHButton></>}
      media={<EHImageFrame src="/images/marketing/family-home.jpg" alt="Ein Paar vor einem Haus im Garten" caption="Ein Zuhause. Viele Geschichten. · Illustrative Bildwelt" priority/>}
    />
    <EHSection compact><EHPromiseRow items={[{title:"Alles wissen.",text:"Dokumente und die Geschichte deines Hauses."},{title:"Nichts vergessen.",text:"Anstehende Wartungen und wichtige Termine."},{title:"Nicht alles selbst machen.",text:"Passende Ansprechpartner, wenn es Hilfe braucht."}]}/></EHSection>
    <EHSection id="anliegen" tone="white"><EHSplitStory eyebrow="Ein klarer nächster Schritt" title="Ein Satz. Ein nächster Schritt." text="Heizung, Dach, Garten oder Unterlagen: Beschreibe dein Anliegen in deinen Worten. Du entscheidest, wie es weitergeht." media={<EHPanel><IntakeForm variant="hero"/></EHPanel>}/></EHSection>
    <EHSection compact><EHFacts items={[{value:"12",label:"Leistungsbereiche mit geprüften Betrieben"},{value:"1",label:"Ansprechpartner mit Name, Betrieb und Nummer"},{value:"0 %",label:"Provision pro Auftrag – Partner bleiben Rechnungssteller"},{value:"0 €",label:"Hauskonto für Eigentümer – dauerhaft kostenlos"}]}/></EHSection>
  </>;
}
