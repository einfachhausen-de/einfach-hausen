import { notFound } from 'next/navigation';
import { Home, Link2, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { Logo } from '@/components/logo';
import { EHScope, EHSection, EHHeading, EHText, EHButton, EHFormFeedback, EHActions, EHCallout } from '@/design-system';

export default async function PartnerInvite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = db.prepare(`SELECT i.*,u.first_name,u.last_name,h.address FROM provider_invites i JOIN users u ON u.id=i.homeowner_id JOIN homeowner_profiles h ON h.user_id=i.homeowner_id WHERE i.token=?`).get(token) as any;
  if (!invite) notFound();
  return (
    <EHScope>
      <EHSection compact>
        <Logo />
        <EHHeading as="h1" scale="page">Als Ansprechpartner fürs Haus verbinden</EHHeading>
        <EHText><Link2 size={16} /> {invite.first_name} {invite.last_name} hat <strong>{invite.company_name || invite.email}</strong> für den Bereich <strong>{invite.category || 'Haus'}</strong> in der digitalen Hausakte vorgemerkt.</EHText>
        <EHCallout title="So wird dein Betrieb verbunden">
          <EHText><ShieldCheck size={16} /> Wenn du dein Partnerkonto mit <strong>{invite.email}</strong> anlegst, wird dein Betrieb nach der Registrierung automatisch als Ansprechpartner mit diesem Haus verbunden. Kunden entscheiden weiterhin selbst, ob daraus später ein Auftrag wird.</EHText>
        </EHCallout>
        {invite.status === 'linked'
          ? <EHFormFeedback kind="success">Der Betrieb wurde bereits mit der Hausakte verbunden.</EHFormFeedback>
          : invite.status !== 'pending'
            ? <EHFormFeedback kind="error">Diese Einladung ist nicht mehr aktiv.</EHFormFeedback>
            : <EHActions><EHButton href={`/register?role=provider&invite=${token}`}>Partnerkonto erstellen</EHButton></EHActions>}
        <EHActions><EHButton href="/" variant="secondary"><Home size={16} />Mehr über Einfach Hausen</EHButton></EHActions>
      </EHSection>
    </EHScope>
  );
}
