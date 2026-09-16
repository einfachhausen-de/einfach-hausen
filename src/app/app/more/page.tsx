import { Bell, CircleHelp, MessageCircle, Sparkles, UserRound, WalletCards } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { ownerAccountItems, ownerAreas } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import { EHPageHeader, EHRecordList, EHWorkSection, type EHRecordEntry } from '@/design-system';

// "Mehr" is no longer a main-navigation entry: every area has its own place
// now. The page survives as a flat directory so old links and bookmarks keep
// working.
const ACTIONS = [
  { href: '/app/hausmeister', title: 'Hausmeisterservice', icon: <MessageCircle /> },
  { href: '/app/hausmanager', title: 'KI-Hausmanager', icon: <Sparkles /> },
] as const;

export default async function More(){
  await requireUser('homeowner');
  const accountIcons = [UserRound,Bell,WalletCards,CircleHelp];
  const areas: EHRecordEntry[] = ownerAreas.map(area=>{const Icon=area.icon;return {id:area.href,title:area.label,href:area.href,icon:<Icon/>};});
  const direct: EHRecordEntry[] = ACTIONS.map(action=>({id:action.href,title:action.title,href:action.href,icon:action.icon}));
  const account: EHRecordEntry[] = ownerAccountItems.map((item,index)=>{const Icon=accountIcons[index]??UserRound;return {id:item.href,title:item.label,href:item.href,icon:<Icon/>};});
  return <AppShell role="homeowner" active="/app/more" title="Mehr" breadcrumbs={[{ href: '/app', label: 'Start' }, { label: 'Bereiche & Konto' }]}>
    <EHPageHeader title="Bereiche & Konto" />
    <EHWorkSection title="Bereiche"><EHRecordList label="Bereiche" items={areas} /></EHWorkSection>
    <EHWorkSection title="Direkt starten"><EHRecordList label="Direkt starten" items={direct} /></EHWorkSection>
    <EHWorkSection title="Dein Konto"><EHRecordList label="Dein Konto" items={account} /></EHWorkSection>
  </AppShell>}
