"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { EHScope, EHWorkflowStack, EHPageHeader, EHStepProgress, EHPanel, EHField, EHInput, EHSelect, EHButton, EHActions, EHEmptyState, EHText } from "@/design-system";

const RADIUS_OPTIONEN = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);

export default function GebietPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"radius" | "plz">("radius");
  const [plzZentrum, setPlzZentrum] = useState("");
  const [radius, setRadius] = useState(30);
  const [plzListe, setPlzListe] = useState<string[]>([]);
  const [plzInput, setPlzInput] = useState("");
  const [done, setDone] = useState(false);
  // Redirect timer must not outlive this page: if the component unmounts
  // (Fast Refresh, user navigates back) before it fires, the late
  // router.replace starts a transition that React immediately aborts with
  // "AbortError: Transition was skipped" (unhandled rejection in dev).
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (redirectTimer.current) clearTimeout(redirectTimer.current); }, []);

  async function finish() {
    const supabase = await getSupabase();
    await supabase.auth.updateUser({ data: { area_mode: mode, area_center: plzZentrum, area_radius_km: mode === "radius" ? radius : null, area_plz: mode === "plz" ? plzListe : null, onboarding_complete: true } as any });
    setDone(true);
    redirectTimer.current = setTimeout(() => router.replace("/pro"), 1200);
  }

  if (done) {
    return (
      <EHScope app>
        <EHEmptyState title="Geschafft!" text="Dein Dienstleister-Profil ist fertig." />
      </EHScope>
    );
  }

  return (
    <EHScope app>
      <EHWorkflowStack>
        <EHPageHeader title="3. Arbeitsgebiet" context="Lege fest, wo du Aufträge annehmen möchtest." />
        <EHStepProgress
          steps={[
            { id: "firma", label: "Firmendaten" },
            { id: "leistungen", label: "Leistungen" },
            { id: "gebiet", label: "Arbeitsgebiet" },
            { id: "abschluss", label: "Abschluss" },
          ]}
          current="gebiet"
        />
        <EHPanel title="Gebietsmodus">
          <EHActions>
            <EHButton variant={mode === "radius" ? "primary" : "secondary"} onClick={() => setMode("radius")}>Umkreis</EHButton>
            <EHButton variant={mode === "plz" ? "primary" : "secondary"} onClick={() => setMode("plz")}>PLZ-Gebiete</EHButton>
          </EHActions>
          {mode === "radius" ? (
            <>
              <EHText muted>Alle Aufträge in einem Radius um deine PLZ</EHText>
              <EHField id="gebiet-plz" label="Postleitzahl des Zentrums">
                <EHInput id="gebiet-plz" inputMode="numeric" maxLength={5} value={plzZentrum} onChange={(e) => setPlzZentrum(e.target.value)} placeholder="85609" />
              </EHField>
              <EHField id="gebiet-radius" label={`Radius: ${radius} km`}>
                <EHSelect id="gebiet-radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                  {RADIUS_OPTIONEN.map((km) => <option key={km} value={km}>{km} km</option>)}
                </EHSelect>
              </EHField>
            </>
          ) : (
            <>
              <EHText muted>Bestimmte Postleitzahlen auswählen</EHText>
              <EHField id="gebiet-plz-add" label="PLZ hinzufügen">
                <EHInput id="gebiet-plz-add" inputMode="numeric" maxLength={5} value={plzInput} onChange={(e) => setPlzInput(e.target.value)} placeholder="81667" />
              </EHField>
              <EHActions>
                <EHButton
                  variant="secondary"
                  onClick={() => { if (plzInput.length === 5 && !plzListe.includes(plzInput)) { setPlzListe((p) => [...p, plzInput]); setPlzInput(""); } }}
                >
                  +
                </EHButton>
              </EHActions>
              {plzListe.length > 0 && (
                <EHActions>
                  {plzListe.map((p) => (
                    <EHButton key={p} size="small" variant="secondary" onClick={() => setPlzListe((l) => l.filter((x) => x !== p))}>{p} ✕</EHButton>
                  ))}
                </EHActions>
              )}
            </>
          )}
        </EHPanel>
        <EHActions><EHButton onClick={finish}>Weiter: Abschluss</EHButton></EHActions>
      </EHWorkflowStack>
    </EHScope>
  );
}
