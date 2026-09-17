"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { categories } from "@/lib/categories";
import { CameraIcon, MicIcon, BackIcon } from "@/components/icons";
import { EHScope, EHWorkflowStack, EHPageHeader, EHStepProgress, EHPanel, EHCheckbox, EHField, EHFieldGrid, EHInput, EHTextarea, EHButton, EHActions, EHRecordList, EHEmptyState, type EHRecordEntry } from "@/design-system";

const STEPS = [
  { id: "kategorie", label: "Kategorie" },
  { id: "beschreibung", label: "Beschreibung" },
  { id: "ort", label: "Ort & Termin" },
  { id: "zusammenfassung", label: "Zusammenfassung" },
];

export default function NeueAnfragePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cat, setCat] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [termin, setTermin] = useState("");
  const [budget, setBudget] = useState("");
  const [dringend, setDringend] = useState(false);
  const [sent, setSent] = useState(false);
  // Redirect timer must not outlive this page: if the component unmounts
  // (Fast Refresh, user navigates back) before it fires, the late
  // router.replace starts a transition that React immediately aborts with
  // "AbortError: Transition was skipped" (unhandled rejection in dev).
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (redirectTimer.current) clearTimeout(redirectTimer.current); }, []);
  const selCat = categories.find((c) => c.id === cat);
  async function submit() {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getUser();
    await supabase.from("anfragen").insert({ user_id: (data as any).user?.id, kategorie: cat, unterkategorie: sub, titel, beschreibung, fotos, plz, ort, wunschtermin: termin || null, budget: budget || null, dringend, status: "offen" } as any);
    setSent(true);
    redirectTimer.current = setTimeout(() => router.replace("/app/jobs"), 1400);
  }
  if (sent) {
    return (
      <EHScope app>
        <EHEmptyState title="Anfrage gesendet!" text="Dienstleister in deiner Umgebung werden benachrichtigt." />
      </EHScope>
    );
  }
  const current = STEPS[step - 1].id;
  return (
    <EHScope app>
      <EHWorkflowStack>
        <EHButton variant="quiet" onClick={() => (step === 1 ? router.back() : setStep(step - 1))} aria-label="Zurück"><BackIcon /></EHButton>
        <EHStepProgress steps={STEPS} current={current} />
        {step === 1 && (
          <>
            <EHPageHeader title="Worum geht es?" context="Wähle die passende Kategorie für dein Anliegen." />
            <EHPanel title="Kategorie">
              {categories.slice(0, 9).map((c) => (
                <EHCheckbox key={c.id} label={c.title} checked={cat === c.id} onChange={() => { setCat(c.id); setSub(null); }} />
              ))}
            </EHPanel>
            {selCat && (
              <EHPanel title="Was genau soll gemacht werden?">
                {selCat.subs.map((s) => (
                  <EHCheckbox
                    key={s.id}
                    label={<span><strong>{s.title}</strong> — {s.sub}</span>}
                    checked={sub === s.id}
                    onChange={() => setSub(s.id)}
                  />
                ))}
              </EHPanel>
            )}
            <EHActions><EHButton disabled={!cat || !sub} onClick={() => setStep(2)}>Weiter</EHButton></EHActions>
          </>
        )}
        {step === 2 && (
          <>
            <EHPageHeader title="Beschreibe dein Vorhaben" context="Je mehr Details, desto passende Angebote." />
            <EHPanel title="Details">
              <EHField id="anf-titel" label="Titel">
                <EHInput id="anf-titel" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="z. B. Badezimmer renovieren" />
              </EHField>
              <EHField id="anf-beschreibung" label="Beschreibung" hint={`${beschreibung.length} / 1000`}>
                <EHTextarea id="anf-beschreibung" rows={6} maxLength={1000} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="Was soll gemacht werden? Raumgröße, Materialwünsche, Besonderheiten…" />
              </EHField>
              <EHActions>
                <EHButton variant="secondary" onClick={() => setFotos((f) => [...f, `Foto ${f.length + 1}`])}><CameraIcon /> Foto hinzufügen</EHButton>
                <EHButton variant="secondary"><MicIcon /> Sprache</EHButton>
              </EHActions>
              {fotos.length > 0 && (
                <EHActions>
                  {fotos.map((f, i) => (
                    <EHButton key={i} size="small" variant="secondary" onClick={() => setFotos((p) => p.filter((_, j) => j !== i))}>{f} ✕</EHButton>
                  ))}
                </EHActions>
              )}
            </EHPanel>
            <EHActions><EHButton disabled={!titel} onClick={() => setStep(3)}>Weiter</EHButton></EHActions>
          </>
        )}
        {step === 3 && (
          <>
            <EHPageHeader title="Wo & wann?" context="Wo soll der Auftrag ausgeführt werden?" />
            <EHPanel title="Ort & Termin">
              <EHFieldGrid>
                <EHField id="anf-plz" label="PLZ">
                  <EHInput id="anf-plz" inputMode="numeric" maxLength={5} value={plz} onChange={(e) => setPlz(e.target.value)} placeholder="85609" />
                </EHField>
                <EHField id="anf-ort" label="Ort">
                  <EHInput id="anf-ort" value={ort} onChange={(e) => setOrt(e.target.value)} placeholder="Aschheim" />
                </EHField>
              </EHFieldGrid>
              <EHField id="anf-termin" label="Wunschtermin (optional)">
                <EHInput id="anf-termin" type="date" value={termin} onChange={(e) => setTermin(e.target.value)} />
              </EHField>
              <EHField id="anf-budget" label="Budget (optional)">
                <EHInput id="anf-budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="z. B. 2.000 – 5.000 €" />
              </EHField>
              <EHCheckbox
                label={<span><strong>Dringend</strong> — Soll der Auftrag schnellstmöglich starten?</span>}
                checked={dringend}
                onChange={() => setDringend((v) => !v)}
              />
            </EHPanel>
            <EHActions><EHButton disabled={!plz || !ort} onClick={() => setStep(4)}>Weiter: Zusammenfassung</EHButton></EHActions>
          </>
        )}
        {step === 4 && (
          <>
            <EHPageHeader title="Zusammenfassung" context="Prüfe deine Angaben und sende die Anfrage." />
            <EHRecordList
              label="Zusammenfassung deiner Anfrage"
              items={[
                { id: "kategorie", title: "Kategorie", detail: `${selCat?.title} – ${selCat?.subs.find((s) => s.id === sub)?.title}` },
                { id: "titel", title: "Titel", detail: titel },
                { id: "beschreibung", title: "Beschreibung", detail: beschreibung || "—" },
                { id: "ort", title: "Ort", detail: `${plz} ${ort}` },
                ...(termin ? [{ id: "termin", title: "Wunschtermin", detail: termin } as EHRecordEntry] : []),
                ...(budget ? [{ id: "budget", title: "Budget", detail: budget } as EHRecordEntry] : []),
                { id: "dringend", title: "Dringend", detail: dringend ? "Ja ⚡" : "Nein" },
              ]}
            />
            <EHActions><EHButton onClick={submit} arrow>Anfrage senden</EHButton></EHActions>
          </>
        )}
      </EHWorkflowStack>
    </EHScope>
  );
}
