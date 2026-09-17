"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeadsetIcon, HeartIcon, LoginIcon, PinIcon, ShieldIcon, UserPlusIcon } from "@/components/icons";
import { useAuth } from "@/components/AuthContext";
import { EHScope, EHSection, EHSectionHeading, EHImageFrame, EHRecordList, EHText, EHButton, EHActions, EHLogo } from "@/design-system";

const benefits = [
  { icon: <ShieldIcon />, title: "Sicher & vertraulich", text: "Deine Daten sind bei uns sicher und geschützt." },
  { icon: <PinIcon />, title: "Regional verbunden", text: "Finde Dienstleister aus deiner Nähe." },
  { icon: <HeartIcon />, title: "Einfach & praktisch", text: "Alle Infos und Services für dein Zuhause." },
];

export default function WelcomePage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      // Canonical role resolution happens server-side from the application
      // identity. Providers entering /app are redirected to /pro by requireUser.
      router.replace("/app");
    }
  }, [session, loading, router]);

  return (
    <EHScope>
      <EHSection compact>
        <EHLogo />
        <EHText>Dein Zuhause. Alles geregelt.</EHText>
        <EHSectionHeading
          center
          title="Willkommen bei einfachhausen 👋"
          text="Dein Zuhause verwalten, dokumentieren und die richtigen Dienstleister finden – alles an einem Ort."
        />
        <EHImageFrame src="/images/welcome-house.png" alt="Modernes Einfamilienhaus am Abend" />
        <EHActions>
          <EHButton href="/login" arrow><LoginIcon /> Log in — Melde dich an und greife auf dein Konto zu.</EHButton>
          <EHButton href="/role" variant="secondary" arrow><UserPlusIcon /> Neues Konto — Erstelle ein neues Konto und lege direkt los.</EHButton>
        </EHActions>
        <EHRecordList
          label="Deine Vorteile"
          items={benefits.map((b) => ({ id: b.title, title: b.title, detail: b.text, icon: b.icon }))}
        />
        <EHActions>
          <EHButton href="/kontakt" variant="secondary"><HeadsetIcon /> Hilfe benötigt? Unser Support-Team ist für dich da.</EHButton>
        </EHActions>
      </EHSection>
    </EHScope>
  );
}
