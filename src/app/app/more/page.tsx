import { Bell, CircleHelp, MessageCircle, Sparkles, UserRound, WalletCards } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { ownerAccountItems, ownerAreas } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import { EHAppHeader, EHServiceDirectory, EHCallout } from '@/design-system';

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

export default async function More(){await requireUser('homeowner');return <AppShell role="homeowner" active="/app/more" title="Mehr" subtitle="Alle Bereiche auf einen Blick" breadcrumbs={[{ href: '/app', label: 'Start' }, { label: 'Alle Bereiche' }]}>
    <EHAppHeader eyebrow="Navigation" title="Alle Bereiche" text="Jeder Bereich ist über die Hauptnavigation erreichbar. Diese Seite ist nur die flache Übersicht." />
    <EHServiceDirectory groups={[
      {title:"Bereiche",items:ownerAreas.map(area=>{const Icon=area.icon;return {href:area.href,title:area.label,text:AREA_TEXT[area.href]||'',icon:<Icon/>};})},
      {title:"Direkt starten",items:ACTIONS.map(a=>({href:a.href,title:a.title,text:a.text,icon:a.icon}))},
      {title:"Dein Konto",items:ownerAccountItems.map((item,index)=>{const Icon=[UserRound,Bell,WalletCards,CircleHelp][index]??UserRound;return {href:item.href,title:item.label,text:'',icon:<Icon/>};})},
    ]}/>
    <EHCallout title="Hilfe & Support"><p>Wenn ein Vorgang festhängt, kannst du ihn direkt im Auftrag als Servicefall melden.</p></EHCallout>
  </AppShell>}
