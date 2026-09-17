import { Bell, CircleHelp, MessageCircle, Sparkles, UserRound, WalletCards } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { ownerAccountItems, ownerAreas } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel, statusLabel } from '@/lib/format';
import { EHButton, EHMetricsBar, EHPageHeader, EHRecordList, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';

// "Mehr" is no longer a main-navigation entry: every area has its own place
// now. The page survives as a flat directory so old links and bookmarks keep
// working.
const ACTIONS = [
  { href: '/app/hausmeister', title: 'Hausmeisterservice', icon: <MessageCircle /> },
  { href: '/app/hausmanager', title: 'KI-Hausmanager', icon: <Sparkles /> },
] as const;

type OpenJob = { id: number; title: string; status: string; created_at: string };

export default async function More(){
  const user = await requireUser('homeowner');
  const accountIcons = [UserRound,Bell,WalletCards,CircleHelp];
  const areas: EHRecordEntry[] = ownerAreas.map(area=>{const Icon=area.icon;return {id:area.href,title:area.label,href:area.href,icon:<Icon/>};});
  const direct: EHRecordEntry[] = ACTIONS.map(action=>({id:action.href,title:action.title,href:action.href,icon:action.icon}));
  const account: EHRecordEntry[] = ownerAccountItems.map((item,index)=>{const Icon=accountIcons[index]??UserRound;return {id:item.href,title:item.label,href:item.href,icon:<Icon/>};});

  // Das Verzeichnis zaehlt seine echten Eintraege; die beiden persoenlichen
  // Kennzahlen kommen aus den laufenden Vorgaengen und den Mitteilungen.
  const openJobs = db.prepare(`SELECT id,title,status,created_at FROM jobs WHERE homeowner_id=? AND status IN ('open','quoted','accepted','in_progress') ORDER BY created_at DESC`).all(user.id) as OpenJob[];
  const unread = (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(user.id) as { c: number }).c;
  const noticeTotal = (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=?').get(user.id) as { c: number }).c;

  const openJobItems: EHRecordEntry[] = openJobs.slice(0, 4).map(job => ({
    id: String(job.id),
    title: job.title,
    detail: 'Laufender Vorgang',
    date: String(job.created_at).slice(0, 10),
    dateLabel: dateLabel(job.created_at),
    status: <EHStatus tone={job.status === 'open' ? 'info' : 'success'}>{statusLabel(job.status)}</EHStatus>,
    href: `/app/jobs/${job.id}`,
  }));

  return <AppShell role="homeowner" active="/app/more" title="Mehr" breadcrumbs={[{ href: '/app', label: 'Start' }, { label: 'Bereiche & Konto' }]}>
    <EHPageHeader title="Bereiche & Konto" context={unread > 0 ? `${unread} ungelesene ${unread === 1 ? 'Mitteilung' : 'Mitteilungen'}` : undefined} />
    <EHMetricsBar label="Bereiche & Konto" items={[
      { id: 'bereiche', label: 'Bereiche', value: String(ownerAreas.length), hint: 'Wege in der App' },
      { id: 'konto', label: 'Konto-Einträge', value: String(ownerAccountItems.length), hint: 'Profil, Mitteilungen, Pakete, Hilfe' },
      { id: 'auftraege', label: 'Offene Aufträge', value: String(openJobs.length), hint: 'laufende Vorgänge' },
      { id: 'mitteilungen', label: 'Ungelesen', value: String(unread), hint: noticeTotal > 0 ? `${noticeTotal} Mitteilungen gesamt` : 'noch keine Mitteilung' },
    ]} />
    <EHWorkspaceGrid main={<>
      <EHWorkSection title="Bereiche"><EHRecordList label="Bereiche" items={areas} /></EHWorkSection>
      <EHWorkSection title="Direkt starten"><EHRecordList label="Direkt starten" items={direct} /></EHWorkSection>
    </>} aside={<>
      <EHWorkSection title="Dein Konto">
        <EHRecordList label="Dein Konto" items={account} />
      </EHWorkSection>
      <EHWorkSection title="Deine laufenden Vorgänge">
        <EHRecordList label="Deine laufenden Vorgänge" items={openJobItems} empty="Zurzeit läuft kein Vorgang. Ein neues Anliegen startest du beim Hausmeisterservice." />
        <EHButton href="/app/jobs" variant="secondary" arrow>Alle Aufträge ansehen</EHButton>
      </EHWorkSection>
      <EHWorkSection title="Wenn es dringend ist">
        <EHText muted>Bei Lebensgefahr, Brand oder Gasgeruch gilt der öffentliche Notruf 112. Für dringende Schäden ohne Lebensgefahr melde den Notfall in der App.</EHText>
        <EHButton href="/app/emergency" variant="secondary" arrow>Notfall melden</EHButton>
      </EHWorkSection>
    </>} />
  </AppShell>}
