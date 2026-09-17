"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { BackIcon, ArrowRightWhite } from "@/components/icons";
import { EHScope, EHWorkflowStack, EHConversation, EHButton, EHField, EHInput } from "@/design-system";

type Msg = { id: string; sender_id: string; text: string; created_at: string };

export default function ChatPage() {
  const { anfrageId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [partnerName, setPartnerName] = useState("Chat");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(true);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cleanup: (() => void) | undefined;
    // T-0118: browser Supabase client is lazy (async chunk) — the realtime
    // channel lives inside this effect scope so cleanup stays correct.
    getSupabase().then((supabase) => {
      supabase
        .from("anfragen")
        .select("user_id, titel")
        .eq("id", anfrageId as string)
        .single()
        .then(async ({ data: anfrage }: any) => {
          if (!anfrage) return;
          const owner = anfrage.user_id === user.id;
          setIsOwner(owner);
          let otherId = anfrage.user_id;
          if (owner) {
            const { data: ag }: any = await supabase.from("angebote").select("pro_id, firma").eq("anfrage_id", anfrageId as string).limit(1).single();
            if (ag) {
              otherId = ag.pro_id;
              setPartnerName(ag.firma);
            }
          } else {
            setPartnerName("Eigentümer");
          }
          setPartnerId(otherId);
        });
      supabase.from("anfrage_messages").select("*").eq("anfrage_id", anfrageId as string).order("created_at").then(({ data }: any) => setMsgs((data as any) ?? []));
      const channel = supabase
        .channel(`chat-${anfrageId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "anfrage_messages", filter: `anfrage_id=eq.${anfrageId}` }, (payload: any) => setMsgs((m) => [...m, payload.new as Msg]))
        .subscribe();
      cleanup = () => {
        supabase.removeChannel(channel);
      };
    }).catch(() => {
      // No Supabase client (preview without env vars) — chat stays empty.
      // Tabellen + RLS: db/supabase-tables.sql (docs/SUPABASE_TABLES.md).
    });
    return () => { cleanup?.(); };
  }, [user, anfrageId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text || !partnerId || !user) return;
    setInput("");
    const supabase = await getSupabase();
    await supabase.from("anfrage_messages").insert({ anfrage_id: anfrageId as string, sender_id: user.id, empfaenger_id: partnerId, text } as any);
  }

  return (
    <EHScope app>
      <EHWorkflowStack>
        <EHButton variant="quiet" onClick={() => router.back()} aria-label="Zurück"><BackIcon /></EHButton>
        <EHConversation
          role={isOwner ? "owner" : "provider"}
          name={partnerName}
          detail={`Anfrage ${anfrageId}`}
          messages={msgs.map((m) => ({
            id: m.id,
            mine: m.sender_id === user?.id,
            author: m.sender_id === user?.id ? "Du" : partnerName,
            body: m.text,
          }))}
          composer={
            <EHField id="chat-input" label={`Nachricht an ${partnerName}`}>
              <EHInput
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Nachricht schreiben…"
              />
              <EHButton onClick={send} aria-label="Nachricht senden"><ArrowRightWhite /></EHButton>
            </EHField>
          }
        />
        <div ref={endRef} />
      </EHWorkflowStack>
    </EHScope>
  );
}
