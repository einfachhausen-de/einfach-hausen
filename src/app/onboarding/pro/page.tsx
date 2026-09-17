"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { categories } from "@/lib/categories";
import { ChevronDown, CatGartenIcon, CatElektroIcon, CatSanitaerIcon, CatDachIcon, CatFensterIcon, CatReinigungIcon, CatInnenIcon, CatMalerIcon, CatPoolIcon, CatMehrIcon, BackIcon } from "@/components/icons";
import { EHScope, EHWorkflowStack, EHPageHeader, EHStepProgress, EHPanel, EHCheckbox, EHField, EHFieldGrid, EHInput, EHSelect, EHTextarea, EHText, EHButton, EHActions, EHLogo } from "@/design-system";

const catIcons: Record<string, React.ReactNode> = {
  garten: <CatGartenIcon />,
  elektro: <CatElektroIcon />,
  sanitaer: <CatSanitaerIcon />,
  dach: <CatDachIcon />,
  fenster: <CatFensterIcon />,
  reinigung: <CatReinigungIcon />,
  innen: <CatInnenIcon />,
  maler: <CatMalerIcon />,
  pool: <CatPoolIcon />,
  mehr: <CatMehrIcon />,
};

const rechtformen = ["GmbH", "GbR", "Einzelunternehmen", "UG", "AG", "Freiberufler"];
const mitarbeiter = ["1", "2–7", "8–15", "16–50", "50+"];

const ONBOARDING_STEPS = [
  { id: "firma", label: "Firmendaten" },
  { id: "leistungen", label: "Leistungen" },
  { id: "gebiet", label: "Arbeitsgebiet" },
  { id: "abschluss", label: "Abschluss" },
];

export default function ProOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [firma, setFirma] = useState("");
  const [rechtform, setRechtform] = useState("GmbH");
  const [gruendung, setGruendung] = useState("");
  const [mitarbeiterZahl, setMitarbeiterZahl] = useState("2–7");
  const [telefon, setTelefon] = useState("");
  const [webseite, setWebseite] = useState("");
  const [adresse, setAdresse] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [meister, setMeister] = useState(true);

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [openSubCat, setOpenSubCat] = useState<string | null>(null);
  const [weitere, setWeitere] = useState<string[]>([]);
  const [weitereInput, setWeitereInput] = useState("");

  useEffect(() => {
    getSupabase().then((supabase) =>
      supabase.auth.getUser().then(({ data }: any) => {
        const meta: any = data.user?.user_metadata;
        if (meta?.company_name) setFirma(meta.company_name);
      })
    ).catch(() => {
      // No Supabase client (preview without env vars) — form stays empty.
    });
  }, []);

  const subsOfSelected = useMemo(() => categories.filter((c) => selectedCats.includes(c.id)), [selectedCats]);

  function toggleCat(id: string) {
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    setOpenSubCat(id);
  }

  async function saveStep1() {
    const supabase = await getSupabase();
    await supabase.auth.updateUser({
      data: {
        company_name: firma,
        legal_form: rechtform,
        founded: gruendung,
        employees: mitarbeiterZahl,
        phone: telefon,
        website: webseite,
        address: adresse,
        description: beschreibung,
        master_company: meister,
      },
    } as any);
    setStep(2);
  }

  async function saveStep2() {
    const supabase = await getSupabase();
    await supabase.auth.updateUser({
      data: { categories: selectedCats, subcategories: selectedSubs, extra_services: weitere } as any,
    });
    router.push("/onboarding/pro/gebiet");
  }

  return (
    <EHScope app>
      <EHWorkflowStack>
        <EHButton variant="quiet" onClick={() => (step === 1 ? router.back() : setStep(1))} aria-label="Zurück"><BackIcon /></EHButton>
        <EHLogo />
        <EHStepProgress steps={ONBOARDING_STEPS} current={step === 1 ? "firma" : "leistungen"} />
        {step === 1 && (
          <>
            <EHPageHeader title="1. Firmendaten" context="Erzähle uns etwas über dein Unternehmen." />
            <EHPanel title="Unternehmen">
              <EHField id="pro-firma" label="Firmenname">
                <EHInput id="pro-firma" value={firma} onChange={(e) => setFirma(e.target.value)} placeholder="Muster & Sohn GmbH" />
              </EHField>
              <EHField id="pro-rechtform" label="Rechtsform">
                <EHSelect id="pro-rechtform" value={rechtform} onChange={(e) => setRechtform(e.target.value)}>
                  {rechtformen.map((r) => <option key={r} value={r}>{r}</option>)}
                </EHSelect>
              </EHField>
              <EHFieldGrid>
                <EHField id="pro-gruendung" label="Gründungsjahr">
                  <EHInput id="pro-gruendung" inputMode="numeric" value={gruendung} onChange={(e) => setGruendung(e.target.value)} placeholder="2012" />
                </EHField>
                <EHField id="pro-mitarbeiter" label="Mitarbeiterzahl">
                  <EHSelect id="pro-mitarbeiter" value={mitarbeiterZahl} onChange={(e) => setMitarbeiterZahl(e.target.value)}>
                    {mitarbeiter.map((m) => <option key={m} value={m}>{m}</option>)}
                  </EHSelect>
                </EHField>
              </EHFieldGrid>
              <EHField id="pro-telefon" label="Telefonnummer">
                <EHInput id="pro-telefon" inputMode="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="+49 123 4567890" />
              </EHField>
              <EHField id="pro-webseite" label="Webseite (optional)">
                <EHInput id="pro-webseite" value={webseite} onChange={(e) => setWebseite(e.target.value)} placeholder="www.muster-sohn.de" />
              </EHField>
              <EHField id="pro-adresse" label="Firmensitz / Adresse">
                <EHInput id="pro-adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Musterstraße 12, 12345 Musterstadt" />
              </EHField>
            </EHPanel>
            <EHPanel title="Über dein Unternehmen">
              <EHField id="pro-beschreibung" label="Kurzbeschreibung">
                <EHTextarea id="pro-beschreibung" rows={5} maxLength={500} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="Wir sind ein zuverlässiger Meisterbetrieb mit langjähriger Erfahrung…" />
              </EHField>
              <EHText size="meta">{beschreibung.length} / 500</EHText>
              <EHCheckbox
                label={<span><strong>Meisterbetrieb</strong> — Ist dein Unternehmen ein eingetragener Meisterbetrieb?</span>}
                checked={meister}
                onChange={() => setMeister((v) => !v)}
              />
            </EHPanel>
            <EHActions>
              <EHButton onClick={saveStep1} arrow>Weiter: Leistungen auswählen</EHButton>
              <EHButton variant="quiet">Speichern & später fortfahren</EHButton>
            </EHActions>
          </>
        )}
        {step === 2 && (
          <>
            <EHPageHeader title="2. Leistungen" context="Wähle die Kategorien und Leistungen, die du anbietest." />
            <EHPanel title="Kategorien">
              <EHText muted>Wähle eine oder mehrere Kategorien aus</EHText>
              {categories.map((c) => (
                <EHCheckbox
                  key={c.id}
                  label={<span>{catIcons[c.icon]} {c.title}</span>}
                  checked={selectedCats.includes(c.id)}
                  onChange={() => toggleCat(c.id)}
                />
              ))}
            </EHPanel>
            <EHPanel title="Unterkategorien">
              <EHText muted>Wähle aus, was du konkret anbietest.</EHText>
              {subsOfSelected.map((cat) => (
                <div key={cat.id}>
                  <EHActions>
                    <EHButton variant="secondary" onClick={() => setOpenSubCat(openSubCat === cat.id ? null : cat.id)}>
                      {catIcons[cat.icon]} {cat.title} <ChevronDown />
                    </EHButton>
                  </EHActions>
                  {openSubCat === cat.id && cat.subs.map((s) => (
                    <EHCheckbox
                      key={s.id}
                      label={<span><strong>{s.title}</strong> — {s.sub}</span>}
                      checked={selectedSubs.includes(s.id)}
                      onChange={() => setSelectedSubs((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]))}
                    />
                  ))}
                </div>
              ))}
              <EHField id="pro-weitere" label="Weitere Leistungen (optional)">
                <EHInput id="pro-weitere" value={weitereInput} onChange={(e) => setWeitereInput(e.target.value)} placeholder="z. B. Winterdienst, Grünflächenpflege…" />
              </EHField>
              <EHActions>
                <EHButton
                  variant="secondary"
                  onClick={() => { if (weitereInput.trim()) { setWeitere((w) => [...w, weitereInput.trim()]); setWeitereInput(""); } }}
                  aria-label="Weitere Leistung hinzufügen"
                >
                  +
                </EHButton>
              </EHActions>
              {weitere.length > 0 && (
                <EHActions>
                  {weitere.map((w, i) => (
                    <EHButton key={i} size="small" variant="secondary" onClick={() => setWeitere((p) => p.filter((_, j) => j !== i))}>{w} ✕</EHButton>
                  ))}
                </EHActions>
              )}
            </EHPanel>
            <EHActions>
              <EHButton onClick={saveStep2} arrow>Weiter: Arbeitsgebiet festlegen</EHButton>
              <EHButton variant="quiet">Speichern & später fortfahren</EHButton>
            </EHActions>
          </>
        )}
      </EHWorkflowStack>
    </EHScope>
  );
}
