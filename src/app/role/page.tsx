"use client";

import { useRouter } from "next/navigation";
import { BriefcaseIcon, ClipboardIcon, HomeSmallIcon, LockIcon, PersonSearchIcon, ShieldSmallIcon } from "@/components/icons";
import { EHScope, EHSection, EHSectionHeading, EHPanel, EHImageFrame, EHRecordList, EHText, EHButton, EHActions, EHCallout, EHLogo } from "@/design-system";

const ownerBenefits = [
  { icon: <HomeSmallIcon />, title: "Haus organisieren", text: "Dokumente, Verträge und Daten sicher verwalten." },
  { icon: <PersonSearchIcon />, title: "Die richtigen finden", text: "Zuverlässige Dienstleister aus deiner Region entdecken." },
  { icon: <ClipboardIcon />, title: "Aufträge verwalten", text: "Anfragen stellen, Angebote vergleichen und Aufträge einfach verwalten." },
  { icon: <ShieldSmallIcon />, title: "Werte erhalten", text: "Wartungen im Blick behalten und den Wert deiner Immobilie sichern." },
];

export default function RolePage() {
  const router = useRouter();
  return (
    <EHScope>
      <EHSection compact>
        <EHLogo />
        <EHText>Dein Zuhause. Alles geregelt.</EHText>
        <EHSectionHeading
          center
          title="Schön, dass du da bist!"
          text="Bitte wähle, in welcher Rolle du einfachhausen nutzen möchtest."
        />
        <EHPanel title="Ich bin Eigentümer">
          <EHImageFrame src="/images/role-house.png" alt="Einfamilienhaus mit Terrasse" />
          <EHText>Behalte dein Zuhause im Blick, finde zuverlässige Dienstleister und verwalte alles an einem Ort.</EHText>
          <EHActions>
            <EHButton onClick={() => router.push("/register-owner")} arrow>Als Eigentümer starten</EHButton>
          </EHActions>
          <EHRecordList
            label="Vorteile für Eigentümer"
            items={ownerBenefits.map((b) => ({ id: b.title, title: b.title, detail: b.text, icon: b.icon }))}
          />
        </EHPanel>
        <EHPanel title="Ich bin Dienstleister">
          <EHText>Erhalte Anfragen, gewinne neue Kunden und verwalte deine Aufträge effizient.</EHText>
          <EHActions>
            <EHButton variant="secondary" onClick={() => router.push("/register-pro")} arrow><BriefcaseIcon /> Als Dienstleister starten</EHButton>
          </EHActions>
        </EHPanel>
        <EHCallout title="Sicher. Einfach. Für dich gemacht.">
          <EHText><LockIcon /> Deine Daten sind bei uns sicher und geschützt.</EHText>
        </EHCallout>
      </EHSection>
    </EHScope>
  );
}
