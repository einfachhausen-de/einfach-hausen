"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getOffeneAnfragenFuerPro } from "@/lib/anfragen";
import { BackIcon } from "@/components/icons";
import { EHScope, EHWorkflowStack, EHPageHeader, EHTabs, EHRecordList, EHButton, EHStatus, EHText, type EHRecordEntry } from "@/design-system";

export default function AnfragenProPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [liste, setListe] = useState<any[]>([]);
  const [filter, setFilter] = useState("alle");
  useEffect(() => {
    if (!user) return;
    const cats = (user as any).user_metadata?.kategorien || (user as any).user_metadata?.leistungen || [];
    const pls = (user as any).user_metadata?.plz_liste || [];
    getOffeneAnfragenFuerPro(cats, pls).then((data: any) => setListe(data as any));
  }, [user]);
  const toEntry = (a: any): EHRecordEntry => ({
    id: String(a.id),
    title: a.titel,
    detail: `${a.plz} ${a.ort}`,
    status: a.dringend ? <EHStatus tone="warning">Dringend</EHStatus> : undefined,
    href: `/anfrage/${a.id}`,
  });
  const alle = liste.map(toEntry);
  const dringend = liste.filter((a) => a.dringend).map(toEntry);
  return (
    <EHScope app>
      <EHWorkflowStack>
        <EHButton variant="quiet" onClick={() => router.back()} aria-label="Zurück"><BackIcon /></EHButton>
        <EHPageHeader title="Offene Anfragen" context={`${liste.length} passende Anfragen in deinem Gebiet.`} />
        <EHTabs
          label="Anfragen filtern"
          value={filter}
          onValueChange={setFilter}
          tabs={[
            {
              id: "alle",
              label: "Alle",
              content: alle.length === 0
                ? <EHText>Keine offenen Anfragen gefunden.</EHText>
                : <EHRecordList label="Offene Anfragen" items={alle} />,
            },
            {
              id: "dringend",
              label: "Dringend",
              content: dringend.length === 0
                ? <EHText>Keine offenen Anfragen gefunden.</EHText>
                : <EHRecordList label="Dringende Anfragen" items={dringend} />,
            },
          ]}
        />
      </EHWorkflowStack>
    </EHScope>
  );
}
