"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { BackIcon } from "@/components/icons";
import { VisualAuftraege, VisualGebiet, VisualFertig } from "@/components/onboard-visuals";
import { EHScope, EHWorkflowStack, EHPageHeader, EHPanel, EHCheckbox, EHField, EHInput, EHSelect, EHButton, EHActions } from "@/design-system";

const leistungen = [
  { id: "bad", emoji: "🛁", titel: "Badezimmer", sub: "Fliesen, Sanitär, Umbau" },
  { id: "renovierung", emoji: "🔨", titel: "Renovierung", sub: "Maler, Boden, Türen" },
  { id: "garten", emoji: "🌿", titel: "Garten", sub: "Pflege, Bäume, Teich" },
  { id: "elektro", emoji: "⚡", titel: "Elektro", sub: "Installation, Reparatur" },
  { id: "heizung", emoji: "🔥", titel: "Heizung", sub: "Wartung, Einbau" },
  { id: "dach", emoji: "🏠", titel: "Dach & Fassade", sub: "Dach, Dämmung, Anstrich" },
];

const UMKREIS_OPTIONEN = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);

export default function OnboardingProSchrittPage() {
  const params = useParams();
  const schritt = Array.isArray((params as any).schritt) ? (params as any).schritt[0] : (params as any).schritt;
  const router = useRouter();
  const { user } = useAuth();
  const [sel, setSel] = useState<string[]>([]);
  const [plz, setPlz] = useState("");
  const [umkreis, setUmkreis] = useState(25);
  const [busy, setBusy] = useState(false);
  const step = schritt as string;

  async function saveMeta(patch: object) {
    const supabase = await getSupabase();
    await supabase.auth.updateUser({ data: { ...(user as any)?.user_metadata, ...patch } as any });
  }

  async function finish() {
    setBusy(true);
    await saveMeta({ leistungen: sel, plz_liste: plz ? [plz] : [], umkreis_km: umkreis, onboarding_done: true });
    setBusy(false);
    router.replace("/pro");
  }

  const heads: Record<string, { h: string; p: string }> = {
    auftraege: { h: "Was bietest du an?", p: "Wähle deine Leistungen – wir zeigen dir nur passende Anfragen." },
    gebiet: { h: "Wo arbeitest du?", p: "Definiere dein Einzugsgebiet per Postleitzahl." },
    fertig: { h: "Alles bereit! 🎉", p: "Dein Profil ist eingerichtet. Los geht's!" },
  };
  const head = heads[step] ?? heads.auftraege;

  return (
    <EHScope app>
      <EHWorkflowStack>
        <EHButton variant="quiet" onClick={() => router.back()} aria-label="Zurück"><BackIcon /></EHButton>
        {step === "auftraege" && <VisualAuftraege />}
        {step === "gebiet" && <VisualGebiet />}
        {step === "fertig" && <VisualFertig />}
        <EHPageHeader title={head.h} context={head.p} />
        {step === "auftraege" && (
          <>
            <EHPanel title="Leistungen">
              {leistungen.map((l) => (
                <EHCheckbox
                  key={l.id}
                  label={<span>{l.emoji} <strong>{l.titel}</strong> — {l.sub}</span>}
                  checked={sel.includes(l.id)}
                  onChange={() => setSel((s) => (s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id]))}
                />
              ))}
            </EHPanel>
            <EHActions><EHButton disabled={sel.length === 0} onClick={async () => { await saveMeta({ leistungen: sel }); router.push("/onboarding/pro/gebiet"); }}>Weiter ({sel.length} ausgewählt)</EHButton></EHActions>
          </>
        )}
        {step === "gebiet" && (
          <>
            <EHPanel title="Einsatzgebiet">
              <EHField id="ob-plz" label="Postleitzahl (Einsatzgebiet)">
                <EHInput id="ob-plz" inputMode="numeric" maxLength={5} value={plz} onChange={(e) => setPlz(e.target.value)} placeholder="z. B. 22587" />
              </EHField>
              <EHField id="ob-umkreis" label={`Umkreis: ${umkreis} km`}>
                <EHSelect id="ob-umkreis" value={umkreis} onChange={(e) => setUmkreis(Number(e.target.value))}>
                  {UMKREIS_OPTIONEN.map((km) => <option key={km} value={km}>{km} km</option>)}
                </EHSelect>
              </EHField>
            </EHPanel>
            <EHActions><EHButton disabled={plz.length !== 5} onClick={async () => { await saveMeta({ plz_liste: [plz], umkreis_km: umkreis }); router.push("/onboarding/pro/fertig"); }}>Weiter</EHButton></EHActions>
          </>
        )}
        {step === "fertig" && (
          <EHActions><EHButton disabled={busy} onClick={finish}>{busy ? "Speichere…" : "Zum Dashboard"}</EHButton></EHActions>
        )}
      </EHWorkflowStack>
    </EHScope>
  );
}
