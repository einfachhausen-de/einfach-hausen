"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { BackIcon, ChatBubbleIcon } from "@/components/icons";
import { EHScope, EHWorkflowStack, EHPageHeader, EHRecordList, EHWorkSection, EHButton, EHStatus, EHField, EHInput, EHTextarea, EHFormFeedback, EHLoadingState, type EHRecordEntry } from "@/design-system";

export default function AnfrageDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [anfrage, setAnfrage] = useState<any>(null);
  const [angebote, setAngebote] = useState<any[]>([]);
  const [angebotText, setAngebotText] = useState("");
  const [angebotPreis, setAngebotPreis] = useState("");
  const [gesendet, setGesendet] = useState(false);
  const [proMode, setProMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("eh_role") === "pro") queueMicrotask(() => setProMode(true));
    getSupabase().then((supabase) => {
      supabase.from("anfragen").select("*").eq("id", id as string).single().then(({ data }: any) => setAnfrage(data));
      supabase.from("angebote").select("*").eq("anfrage_id", id as string).then(({ data }: any) => setAngebote((data as any) ?? []));
    }).catch(() => {
      // No Supabase client (preview without env vars) — detail stays empty.
      // Supabase-Tabellenluecke: DDL + RLS siehe db/supabase-tables.sql
      // (docs/SUPABASE_TABLES.md).
    });
  }, [id]);

  async function annehmen(angebotId: string) {
    const supabase = await getSupabase();
    await supabase.from("angebote").update({ status: "angenommen" } as any).eq("id", angebotId);
    await supabase.from("anfragen").update({ status: "in_bearbeitung" } as any).eq("id", id as string);
    setAngebote((a) => a.map((x) => (x.id === angebotId ? { ...x, status: "angenommen" } : x)));
  }

  async function angebotSenden() {
    const supabase = await getSupabase();
    const { data: auth }: any = await supabase.auth.getUser();
    await supabase.from("angebote").insert({ anfrage_id: id as string, pro_id: auth.user?.id, firma: (auth.user as any)?.user_metadata?.company_name || (auth.user as any)?.user_metadata?.full_name || "Dienstleister", text: angebotText, preis: parseFloat(angebotPreis.replace(",", ".")) || 0, bewertung: 4.8, entfernung: 12, status: "offen" } as any);
    setGesendet(true);
    const { data }: any = await supabase.from("angebote").select("*").eq("anfrage_id", id as string);
    setAngebote((data as any) ?? []);
  }

  if (!anfrage) return <EHScope app><EHLoadingState label="Lädt…" /></EHScope>;
  const hasAccepted = angebote.some((a) => a.status === "angenommen");
  const detailItems: EHRecordEntry[] = [
    { id: "beschreibung", title: "Beschreibung", detail: anfrage.beschreibung || "—" },
    { id: "ort", title: "Ort", detail: `${anfrage.plz} ${anfrage.ort}` },
    ...(anfrage.budget ? [{ id: "budget", title: "Budget", detail: anfrage.budget } as EHRecordEntry] : []),
  ];
  const angebotItems: EHRecordEntry[] = angebote.map((ag) => ({
    id: String(ag.id),
    title: ag.firma,
    detail: `${ag.text} · ⭐ ${ag.bewertung} • ${ag.entfernung} km`,
    value: `${ag.preis} €`,
    icon: <ChatBubbleIcon />,
    status: ag.status === "angenommen" ? <EHStatus tone="success">Angenommen</EHStatus> : undefined,
    action: ag.status !== "angenommen" && !proMode
      ? <EHButton size="small" onClick={() => annehmen(ag.id)}>Annehmen</EHButton>
      : undefined,
  }));
  return (
    <EHScope app>
      <EHWorkflowStack>
        <EHButton variant="quiet" onClick={() => router.back()} aria-label="Zurück"><BackIcon /></EHButton>
        <EHPageHeader title={anfrage.titel} context={`${anfrage.plz} ${anfrage.ort}`} />
        <EHWorkSection title="Zusammenfassung">
          <EHRecordList label="Details zur Anfrage" items={detailItems} />
        </EHWorkSection>
        <EHWorkSection title={`Angebote (${angebote.length})`}>
          {angebote.length === 0
            ? <EHFormFeedback kind="info">Noch keine Angebote. Dienstleister prüfen deine Anfrage.</EHFormFeedback>
            : <EHRecordList label="Angebote" items={angebotItems} />}
        </EHWorkSection>
        {!proMode && hasAccepted && (
          <EHButton href={`/chat/${id}`} arrow>💬 Mit Handwerker chatten</EHButton>
        )}
        {proMode && (
          <EHWorkSection title="Angebot abgeben">
            {gesendet ? (
              <EHFormFeedback kind="success">✅ Angebot gesendet!</EHFormFeedback>
            ) : (
              <>
                <EHField id="angebot-text" label="Nachricht an den Eigentümer">
                  <EHTextarea id="angebot-text" rows={4} value={angebotText} onChange={(e) => setAngebotText(e.target.value)} placeholder="Warum bist du der Richtige? Enthaltene Leistungen…" />
                </EHField>
                <EHField id="angebot-preis" label="Preis (€)">
                  <EHInput id="angebot-preis" inputMode="decimal" value={angebotPreis} onChange={(e) => setAngebotPreis(e.target.value)} placeholder="z. B. 1250" />
                </EHField>
                <EHButton disabled={!angebotText || !angebotPreis} onClick={angebotSenden}>Angebot senden</EHButton>
              </>
            )}
          </EHWorkSection>
        )}
      </EHWorkflowStack>
    </EHScope>
  );
}
