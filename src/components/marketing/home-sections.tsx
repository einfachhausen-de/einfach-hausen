import {
  EHSection, EHSectionHeading, EHProblemNotes, EHComparison, EHProcess,
  EHProductExcerpt, EHBenefitStories, EHSplitStory, EHImageFrame,
  EHFeatureRows, EHServiceIndex, EHFAQ, EHText, EHTextLink, EHButton,
  EHActions, EHCallout, EHFacts,
} from "@/design-system";
import { IntakeForm } from "@/components/home/intake-form";
import { FACTS, HOME_FAQ, PRINCIPLES } from "./content";
import { SERVICE_CATEGORIES } from "./service-catalog";
export { HomeHero } from "./home-hero";
export { Statement } from "./ui";

export function ProblemMirror() {
  return <EHSection><EHSectionHeading eyebrow="Kennst du das?"
    title="Ein Haus ist wunderbar. Und ein Job, den niemand dir beigebracht hat."
    text="Nicht die Reparatur ist anstrengend. Anstrengend ist das Drumherum: wissen, wen man braucht, jemanden erreichen, dranbleiben, und am Ende nichts wiederfinden."/>
    <EHProblemNotes items={[
      {title:"Seit Monaten aufgeschoben",text:"Die Dachrinne müsste mal … aber wen ruf ich da eigentlich an?"},
      {title:"Verlorenes Wissen",text:"Wie hieß der Heizungsmensch von damals nochmal? Und war da nicht noch Garantie drauf?"},
      {title:"Zettelwirtschaft",text:"Die Rechnung von 2022 liegt irgendwo im Ordner. Oder in einer Mail. Oder gar nicht."},
    ]}/>
  </EHSection>;
}

export function TheSwitch() {
  return <EHSection tone="white"><EHSectionHeading eyebrow="Der Unterschied"
    title="Du musst nicht wissen, welches Gewerk. Du musst es nur sagen."/>
    <EHComparison left={{title:"Bisher",items:[
      "Googeln, drei Betriebe anrufen, zwei rufen nie zurück",
      "Termine per WhatsApp, Angebote per Mail, Rechnung auf Papier",
      "Nach zwei Jahren weiß niemand mehr, was gemacht wurde",
    ]}} right={{title:"Mit Einfach Hausen",items:[
      "Ein Satz reicht: „Heizung macht Geräusche“",
      "Ein geprüfter Partner, ein Ansprechpartner, ein Kostenrahmen vorab",
      "Alles landet automatisch in deiner Hausakte",
    ]}}/>
  </EHSection>;
}

export function HowItWorks() {
  return <EHSection id="so-funktionierts"><EHSectionHeading eyebrow="So funktioniert's"
    title="Drei Schritte. Danach kümmert sich ein Mensch."
    text="Kein Formular-Marathon, kein Vergleichsportal. Du sagst, was los ist. Der Rest ist unsere Arbeit."/>
    <EHProcess items={[
      {title:"Du beschreibst, was ansteht",text:"In deinen Worten, per Text, Foto oder Sprachnachricht. Wir ordnen ein.",
        media:<EHProductExcerpt label="Anliegen" title="Die Dachrinne läuft über." rows={[{title:"Deine Beschreibung",text:"Bei Regen läuft das Wasser neben der Haustür herunter."},{title:"Hilfreich, wenn vorhanden",text:"Ein Foto von der betroffenen Stelle."}]}/>},
      {title:"Wir organisieren",text:"Passender Partnerbetrieb aus deiner Region, Kostenrahmen, Terminvorschlag. Du bestätigst oder lehnst ab.",
        media:<EHProductExcerpt label="Vorschlag" title="Alles vor deiner Entscheidung." rows={[{title:"Leistung und Kostenrahmen",text:"Dachrinne reinigen · 160–200 €"},{title:"Terminvorschlag",text:"Donnerstag, 14 Uhr"}]}/>},
      {title:"Ein Mensch übernimmt",text:"Dein Ansprechpartner hat Namen, Betrieb und Telefonnummer. Rechnung und Dokumente bleiben beim Vorgang.",
        media:<EHProductExcerpt label="Hausakte" title="Auch danach nachvollziehbar." rows={[{title:"Dein Ansprechpartner",text:"Der ausführende Partnerbetrieb bleibt am Vorgang gespeichert."},{title:"Deine Unterlagen",text:"Rechnung, Leistungsnachweis und Verlauf an einem Ort."}]}/>},
    ]}/>
    <EHTextLink href="/so-funktionierts">Den ganzen Ablauf ansehen</EHTextLink>
  </EHSection>;
}

export function Benefits() {
  return <EHSection tone="white"><EHSectionHeading eyebrow="Was du bekommst" title="Weniger im Kopf. Mehr im Griff."
    text="Einfach Hausen ist der Ort, an dem dein Haus verwaltet wird, damit du es nicht tun musst."/>
    <EHBenefitStories items={[
      {title:"Eine Hausakte, die mitdenkt",text:"Jede Reparatur, jede Rechnung, jede Garantie an einem Ort. Die Geschichte deines Hauses bleibt nachvollziehbar.",
       action:<EHTextLink href="/hausakte">Zur Hausakte</EHTextLink>,
       media:<EHProductExcerpt label="Unterlagen" title="Dein Haus hat ein Gedächtnis." rows={[{title:"Wärmepumpe",text:"Garantie, Wartungsprotokoll und Rechnung gehören zusammen."},{title:"Dach",text:"Ausgeführte Arbeiten und zuständiger Betrieb bleiben auffindbar."}]}/>},
      {title:"Erinnerungen, bevor es teuer wird",text:"Heizungswartung, Dachrinnen vor dem Winter, Rauchmelder. Behalte anstehende Aufgaben im Blick und lass dir bei der Organisation helfen.",
       action:<EHTextLink href="/so-funktionierts">Wie das funktioniert</EHTextLink>,
       media:<EHProductExcerpt label="Erinnerungen" title="Was als Nächstes ansteht." rows={[{title:"Heizungswartung",text:"Den nächsten Wartungstermin planen."},{title:"Dachrinnen",text:"Vor dem Winter prüfen und bei Bedarf reinigen lassen."}]}/>},
      {title:"Ein Mensch, kein Ticket",text:"Du kennst Namen, Betrieb und Nummer deines Ansprechpartners. Der Kontakt bleibt auch für das nächste Anliegen erhalten.",
       action:<EHTextLink href="/so-funktionierts#ansprechpartner">Dein Ansprechpartner</EHTextLink>,
       media:<EHProductExcerpt label="Kontakt" title="Der Mensch hinter dem Auftrag." rows={[{title:"Direkter Kontakt",text:"Kontaktdaten des ausführenden Betriebs am Vorgang."},{title:"Gemeinsamer Verlauf",text:"Absprachen und Unterlagen im selben Zusammenhang."}]}/>},
      {title:"Kostenrahmen vor dem Termin",text:"Du siehst vorher, womit du rechnen musst, und entscheidest, ob du den Auftrag freigibst.",
       action:<EHTextLink href="/preise">Zu den Preisen</EHTextLink>,
       media:<EHProductExcerpt label="Kosten" title="Du gibst den Auftrag frei." rows={[{title:"Vorgeschlagener Umfang",text:"Dachrinne reinigen"},{title:"Kostenrahmen im Beispiel",text:"160–200 €"}]} note="Illustratives Beispiel, kein verbindliches Angebot."/>},
    ]}/>
  </EHSection>;
}

export function Trust() {
  return <EHSection><EHSectionHeading eyebrow="Warum du uns vertrauen kannst" title="Klare Regeln. Ein konkreter Ansprechpartner."/>
    <EHFacts items={FACTS.map(f=>({value:f.value,label:f.label}))}/>
    <EHSplitStory title="Persönlich verbunden. Nachvollziehbar organisiert."
      media={<EHImageFrame src="/images/marketing/partner-doorstep.jpg" alt="Gespräch an einer Haustür" caption="Illustrative Bildwelt: persönliche Zusammenarbeit."/>}>
      <EHFeatureRows items={PRINCIPLES.map(p=>({title:p.title,text:p.text}))}/>
      <EHActions><EHTextLink href="/partner">Für Betriebe: Partner werden</EHTextLink><EHTextLink href="/sicherheit">Sicherheit und Daten</EHTextLink></EHActions>
    </EHSplitStory>
  </EHSection>;
}

export function CategoriesCompact() {
  return <EHSection tone="white"><EHSectionHeading eyebrow="Wofür du uns fragen kannst" title="Alles, was ein Haus so braucht."
    text="Du musst dein Anliegen keiner Kategorie zuordnen. Zur Orientierung: so breit ist das Netz."/>
    <EHServiceIndex items={SERVICE_CATEGORIES.slice(0,11).map(c=>({title:c.title,href:`/leistungen/${c.slug}`}))}/>
    <EHTextLink href="/leistungen">Alle Leistungen ansehen</EHTextLink>
  </EHSection>;
}

export function PilotBand() {
  return <EHSection tone="sand"><EHSectionHeading eyebrow="Regionaler Aufbau" title="Dein Hauskonto ist kostenlos. Dauerhaft."
    text="Wir bauen Einfach Hausen Region für Region auf. Wer jetzt sein Hauskonto anlegt, nutzt die Kernfunktionen vollständig – ohne Mitgliedschaft und ohne Abo."/>
    <EHCallout tone="paper" title="Kein Tarif für Eigentümer"><EHText>Es gibt keine Mitgliedschaft und keine kostenpflichtigen Pakete für Eigentümer. Handwerkerleistungen rechnest du direkt mit dem ausführenden Betrieb ab; auf den Auftragswert erheben wir keine Provision.</EHText></EHCallout>
    <EHActions><EHButton href="/register?role=homeowner" arrow>Hauskonto kostenlos anlegen</EHButton><EHTextLink href="/preise">Preise ansehen</EHTextLink></EHActions>
  </EHSection>;
}

export function HomeFaq() {
  return <EHSection><EHSectionHeading eyebrow="Häufige Fragen" title="Was du vorher wissen willst."/>
    <EHFAQ items={[...HOME_FAQ]}/><EHTextLink href="/hilfe">Alle Fragen und Antworten</EHTextLink>
  </EHSection>;
}

export function FinalCta() {
  return <EHSection tone="sand" id="final-cta"><EHSectionHeading eyebrow="Dein nächster Schritt"
    title="Sag uns, was ansteht." text="Unverbindlich und in deinen Worten. Ein Satz reicht."/>
    <IntakeForm variant="band"/>
    <EHTextLink href="/register?role=homeowner">Noch kein konkretes Anliegen? Hauskonto anlegen</EHTextLink>
  </EHSection>;
}
