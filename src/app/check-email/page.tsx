"use client";

import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { EHScope, EHSection, EHAppHeader, EHActions, EHButton } from "@/design-system";

export default function CheckEmailPage() {
  const router = useRouter();
  return (
    <EHScope>
      <EHSection compact>
        <EHButton variant="quiet" onClick={() => router.back()} aria-label="Zurück"><BackIcon /></EHButton>
        <EHAppHeader title="Fast fertig!" text="Wir haben dir einen Bestätigungslink geschickt. Öffne deine E-Mails und bestätige dein Konto." />
        <EHActions>
          <EHButton onClick={() => router.replace("/login")}>Zur Anmeldung</EHButton>
        </EHActions>
      </EHSection>
    </EHScope>
  );
}
