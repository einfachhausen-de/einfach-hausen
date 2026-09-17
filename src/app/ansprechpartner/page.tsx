"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { BackIcon, PlusIcon2 } from "@/components/icons";
import { EHScope, EHWorkflowStack, EHPageHeader, EHRecordList, EHWorkSection, EHButton, EHDialog, EHField, EHInput, EHEmptyState, type EHRecordEntry } from "@/design-system";

function roleIcon(rolle: string) {
  return rolle === "Elektriker" ? "⚡" : rolle === "Schornsteinfeger" ? "🧹" : rolle === "Verwaltung" ? "🏢" : "👤";
}

export default function AnsprechpartnerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [liste, setListe] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", rolle: "", telefon: "", email: "", notiz: "" });
  useEffect(() => { if (!user) return; getSupabase().then((supabase) => supabase.from("ansprechpartner").select("*").order("created_at", { ascending: false }).then(({ data }: any) => setListe(data ?? []))).catch(() => { /* no Supabase client (preview) — list stays empty; Supabase-Tabellenluecke: DDL + RLS siehe db/supabase-tables.sql (docs/SUPABASE_TABLES.md) */ }); }, [user]);
  async function save() {
    const supabase = await getSupabase();
    await supabase.from("ansprechpartner").insert({ user_id: (user as any).id, ...form } as any);
    setAddOpen(false); setForm({ name: "", rolle: "", telefon: "", email: "", notiz: "" });
    const { data }: any = await supabase.from("ansprechpartner").select("*").order("created_at", { ascending: false });
    setListe(data ?? []);
  }
  const items: EHRecordEntry[] = liste.map((p: any) => ({
    id: String(p.id),
    title: p.name,
    detail: p.rolle,
    icon: roleIcon(p.rolle),
    action: p.telefon ? <EHButton size="small" variant="secondary" href={`tel:${p.telefon}`}>📞 {p.telefon}</EHButton> : undefined,
  }));
  return (
    <EHScope app>
      <EHWorkflowStack>
        <EHButton variant="quiet" onClick={() => router.back()} aria-label="Zurück"><BackIcon /></EHButton>
        <EHPageHeader
          title="Ansprechpartner 👤"
          context="Alle wichtigen Kontakte für dein Zuhause."
          actions={<EHButton variant="secondary" size="small" onClick={() => setAddOpen(true)} aria-label="Neuer Kontakt"><PlusIcon2 /></EHButton>}
        />
        <EHWorkSection title="Deine Kontakte">
          {liste.length === 0
            ? <EHEmptyState title="Noch keine Kontakte" text="Noch keine Kontakte gespeichert." />
            : <EHRecordList label="Ansprechpartner" items={items} />}
        </EHWorkSection>
        <EHDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title="Neuer Kontakt"
          actions={<EHButton onClick={save} disabled={!form.name}>Speichern</EHButton>}
        >
          <EHField id="ap-name" label="Name"><EHInput id="ap-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></EHField>
          <EHField id="ap-rolle" label="Rolle"><EHInput id="ap-rolle" value={form.rolle} onChange={(e) => setForm({ ...form, rolle: e.target.value })} placeholder="z. B. Elektriker" /></EHField>
          <EHField id="ap-telefon" label="Telefon"><EHInput id="ap-telefon" inputMode="tel" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} /></EHField>
          <EHField id="ap-email" label="E-Mail"><EHInput id="ap-email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></EHField>
        </EHDialog>
      </EHWorkflowStack>
    </EHScope>
  );
}
