import { Bell, CircleHelp, MessageCircle, Sparkles, UserRound, WalletCards } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { ownerAccountItems, ownerAreas } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import { EHMetricsBar, EHOwnerSection, EHPageHeader, EHRecordList, EHCallout, type EHRecordEntry } from '@/design-system';

// "Mehr" is no longer a main-navigation entry: every area has its own place
// now. The page survives as a flat directory so old links and bookmarks keep
// working.
const AREA_TEXT: Record<string, string> = {
  '/app': 'Was heute ansteht: offene Aufträge, Termine und nächste Schritte.',
  '/app/home': 'Hausdaten, Technik, Historie, Dokumente und Wartung – deine digitale Hausakte.',
  '/app/contracts': 'Laufende Verträge mit Kosten, Laufzeit und Kündigungsfrist, plus Spar-Check.',
  '/app/jobs': 'Beauftragte Arbeiten, abgeschlossene Aufträge und Termine.',
  '/app/messages': 'Dein persönliches Netzwerk fürs Haus.',
};

const ACTIONS = [
  { href: '/app/hausmeister', title: 'Hausmeisterservice', text: 'Fragen klären und den nächsten Schritt organisieren', icon: <MessageCircle /> },
  { href: '/app/hausmanager', title: 'KI-Hausmanager', text: 'Alte Gespräche, Aufgaben & Automatisierungen', icon: <Sparkles /> },
] as const;

export default async function More(){
  await requireUser('homeowner');
  const accountIcons = [UserRound,Bell,WalletCards,CircleHelp];
  const areas: EHRecordEntry[] = ownerAreas.map(area=>{const Icon=area.icon;return {id:area.href,title:area.label,detail:AREA_TEXT[area.href]||undefined,href:area.href,icon:<Icon/>};});
  const direct: EHRecordEntry[] = ACTIONS.map(action=>({id:action.href,title:action.title,detail:action.text,href:action.href,icon:action.icon}));
  const account: EHRecordEntry[] = ownerAccountItems.map((item,index)=>{const Icon=accountIcons[index]??UserRound;return {id:item.href,title:item.label,href:item.href,icon:<Icon/>};});
  return <AppShell role="homeowner" active="/app/more" title="Mehr" subtitle="Alle Bereiche auf einen Blick" breadcrumbs={[{ href: '/app', label: 'Start' }, { label: 'Alle Bereiche' }]}>
    <EHPageHeader title="Alle Bereiche" context={`${areas.length + direct.length + account.length} Einträge`} />
    <EHMetricsBar label="Alle Bereiche" items={[
      {id:'bereiche',label:'Bereiche',value:areas.length},
      {id:'start',label:'Direkt starten',value:direct.length},
      {id:'konto',label:'Dein Konto',value:account.length},
    ]} />
    <EHOwnerSection title="Bereiche"><EHRecordList label="Bereiche" items={areas} /></EHOwnerSection>
    <EHOwnerSection title="Direkt starten"><EHRecordList label="Direkt starten" items={direct} /></EHOwnerSection>
    <EHOwnerSection title="Dein Konto"><EHRecordList label="Dein Konto" items={account} /></EHOwnerSection>
    <EHCallout title="Hilfe & Support"><p>Wenn ein Vorgang festhängt, kannst du ihn direkt im Auftrag als Servicefall melden.</p></EHCallout>
  </AppShell>}
