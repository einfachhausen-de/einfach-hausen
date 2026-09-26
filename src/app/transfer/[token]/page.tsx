import { notFound } from 'next/navigation';
import { Home, ShieldCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { acceptHouseTransferAction } from '@/app/actions';
import { Logo } from '@/components/logo';
import { EHScope, EHSection, EHHeading, EHText, EHButton, EHErrorState, EHCallout, EHActions } from '@/design-system';

export default async function Transfer({ params, searchParams }: { params: Promise<{ token: string }>, searchParams: Promise<Record<string, string>> }) {
  const { token } = await params;
  const sp = await searchParams;
  const transfer = db.prepare(`SELECT t.*,u.first_name,u.last_name,p.address FROM house_transfers t JOIN users u ON u.id=t.homeowner_id LEFT JOIN properties p ON p.id=t.property_id WHERE t.token=?`).get(token) as any;
  if (!transfer) notFound();
  const user = await getCurrentUser();
  return (
    <EHScope>
      <EHSection compact>
        <Logo />
        <EHHeading as="h1" scale="page">Hausakte übernehmen</EHHeading>
        <EHText><Home size={16} /> {transfer.first_name} {transfer.last_name} hat die digitale Hausakte für <strong>{transfer.address || 'das Zuhause'}</strong> zur Übergabe vorbereitet.</EHText>
        <EHCallout title="Was übertragen wird">
          <EHText><ShieldCheck size={16} /> Übertragen werden Hausprofil, Technik, Historie, offene Wartungen und gespeicherte Ansprechpartner. Alte private Nachrichten, Auftragszahlungen und persönliche Kommunikation bleiben beim bisherigen Eigentümer.</EHText>
        </EHCallout>
        {sp.error && <EHErrorState text={sp.error} />}
        {transfer.status !== 'active'
          ? <EHCallout title="Übergabe abgeschlossen"><EHText>Diese Hausakte wurde bereits übernommen oder die Freigabe ist nicht mehr aktiv.</EHText></EHCallout>
          : !user
            ? <>
              <EHActions><EHButton href="/login">Einloggen</EHButton></EHActions>
              <EHActions><EHButton href="/register" variant="secondary">Neues Eigentümerkonto erstellen</EHButton></EHActions>
              <EHText size="meta">Danach diesen Übergabelink erneut öffnen.</EHText>
            </>
            : user.role !== 'homeowner'
              ? <EHErrorState text="Für die Übernahme brauchst du ein Eigentümerkonto." />
              : <form action={acceptHouseTransferAction.bind(null, token)}><EHButton type="submit">Hausakte jetzt übernehmen</EHButton></form>}
      </EHSection>
    </EHScope>
  );
}
