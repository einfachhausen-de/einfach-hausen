import type { Metadata } from 'next';
import { canonical } from '@/lib/seo';
import Image from 'next/image';
import { FileText, Home, UserRound, Wallet } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/site-shell';
import { AppFrame, HomeScreen, MiniContact, MiniHausakte, MiniReminder } from '@/components/marketing/app-frames';
import { EHScope, EHSection, EHPageHero, EHSplitStory, EHFeatureRows, EHServiceIndex, EHPanel, EHList, EHFacts, EHClosing, EHButton, EHEyebrow, EHHeading, EHText, EHProse, EHCallout, EHTextLink } from '@/design-system';
import { FACTS } from '@/components/marketing/content';

export const metadata: Metadata = { title: 'Für Eigenheimbesitzer', description: 'Weniger im Kopf, mehr im Griff: ein Ort für Anliegen, Ansprechpartner, Erinnerungen und die Geschichte deines Hauses.' , alternates: { canonical: canonical('/eigenheimbesitzer') } };

const MIRROR = [
  { tag: 'Sonntagabend', quote: 'Ich müsste mich mal um die Heizung kümmern. Nächste Woche. Bestimmt.' },
  { tag: 'Beim Verkauf', quote: 'Der Makler fragt nach Rechnungen und Garantien. Ich habe zwei von zwölf gefunden.' },
  { tag: 'Nach dem Umzug', quote: 'Welcher Betrieb hat damals das Dach gemacht? Keine Ahnung. Die Vorbesitzer auch nicht.' },
] as const;

export default function Page() {
  return (
    <MarketingShell>
      <EHScope>
      <EHPageHero
        eyebrow="Für Eigenheimbesitzer"
        title="Dein Haus hat viele Themen. Du brauchst trotzdem nur eine Eingangstür."
        text="Ein Haus zu besitzen heißt, ständig Dinge im Kopf zu haben: Wartungen, Betriebe, Termine, Rechnungen. Einfach Hausen nimmt dir diese Last ab und bewahrt das Wissen, das sonst verloren geht."
        actions={<><EHButton href="/#anliegen" arrow>Anliegen starten</EHButton><EHButton href="/register?role=homeowner" variant="secondary">Hauskonto kostenlos anlegen</EHButton></>}
        media={<AppFrame label="Startbildschirm der App mit fälligen Aufgaben, laufendem Auftrag und Hausakte"><HomeScreen /></AppFrame>}
      />

      <EHSection compact>
        <EHEyebrow>Kennst du das?</EHEyebrow>
        <EHHeading>Nicht die Reparatur ist das Problem. Das Drumherum ist es.</EHHeading>
        <EHText size="lead">Die meisten Dinge am Haus sind lösbar. Anstrengend ist, dass alles an dir hängt: erinnern, suchen, anrufen, dranbleiben, aufheben.</EHText>
        {MIRROR.map((m) => (
          <EHCallout key={m.tag} title={m.tag}>
            <EHText>{m.quote}</EHText>
          </EHCallout>
        ))}
      </EHSection>

      <EHSection compact>
          <EHProse>
            <p><strong>Der Kern.</strong> Dein Haus bekommt ein Gedächtnis. <mark>Du behältst die Kontrolle.</mark></p>
          </EHProse>
        </EHSection>

      <EHSection compact>
        <EHEyebrow>Was sich ändert</EHEyebrow>
        <EHHeading>Vier Dinge, die du nicht mehr selbst machen musst.</EHHeading>
        <EHSplitStory title="Wissen, wen man anruft." text="Du musst weder Gewerk noch Fachbegriff kennen. Beschreib, was du siehst. Wir ordnen ein und finden den passenden geprüften Betrieb aus deiner Region." media={<MiniContact />}>
          <EHTextLink href="/so-funktionierts">So läuft ein Vorgang ab</EHTextLink>
        </EHSplitStory>
        <EHSplitStory title="Rechtzeitig dran denken." text="Heizungswartung, Dachrinnen, Rauchmelder, Garantiefristen. Wir erinnern dich, bevor es teuer wird, und du kannst mit einem Tipp organisieren lassen." media={<MiniReminder />} reverse />
        <EHSplitStory title="Nichts mehr suchen." text="Rechnungen, Garantien, Protokolle, Fotos: alles liegt am richtigen Vorgang und am richtigen Bauteil. Nach einem Auftrag automatisch, ohne dass du abheftest." media={<MiniHausakte />}>
          <EHTextLink href="/hausakte">Zur digitalen Hausakte</EHTextLink>
        </EHSplitStory>
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Ein Thema, drei Entscheidungen</EHEyebrow>
        <EHHeading>Erst verstehen. Dann bewusst entscheiden.</EHHeading>
        <EHText size="lead">Einfach Hausen macht aus einer Frage nicht sofort einen Auftrag.</EHText>
        <EHPanel title="Wenn du nur Rat brauchst">
          <EHHeading as="h3" scale="item">Frage klären oder Ansprechpartner finden.</EHHeading>
          <EHText>Du bekommst eine fachliche Einordnung und kannst auf Wunsch einen passenden Menschen sprechen. Ein Auftrag entsteht dadurch nicht.</EHText>
          <EHList label="Wenn du nur Rat brauchst" items={['Kein Auftrag durch eine normale Frage', 'Persönlicher Kontakt auch ohne Buchung', 'Beauftragen bleibt eine eigene Entscheidung'].map((b, k) => ({ id: 'eigen-rat-' + k, title: b }))} />
        </EHPanel>
        <EHPanel title="Wenn etwas erledigt werden soll">
          <EHHeading as="h3" scale="item">Organisiert statt selbst koordiniert.</EHHeading>
          <EHText>Wir vervollständigen die Auftragsdaten, suchen passende Partner und führen Kostenrahmen, Termin und Dokumente an einem Ort zusammen.</EHText>
          <EHList label="Wenn etwas erledigt werden soll" items={['Passende Partner statt offene Firmenliste', 'Kostenrahmen vor dem Termin', 'Konkreter Ansprechpartner beim Betrieb'].map((b, k) => ({ id: 'eigen-tun-' + k, title: b }))} />
        </EHPanel>
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Direkte Wege</EHEyebrow>
        <EHHeading>Je nach Situation anders starten.</EHHeading>
        <EHText size="lead">Eine fachliche Frage, ein dringender Fall und ein Verkaufswunsch sind unterschiedliche Entscheidungen. Deshalb haben sie getrennte Einstiege.</EHText>
        <EHServiceIndex items={[
          { title: 'Erst beraten lassen', text: 'Einen passenden Ansprechpartner sprechen, ohne dass automatisch ein Auftrag entsteht.', href: '/beratung' },
          { title: 'Dringenden Fall einordnen', text: 'Bei einem Notfall wird nach passender verfügbarer Hilfe im regionalen Netzwerk gesucht.', href: '/notfall' },
          { title: 'Verkauf vorbereiten', text: 'Bewertung, Makler-Matching und Datenfreigabe bleiben nachvollziehbar unter deiner Kontrolle.', href: '/immobilienverkauf' },
        ]} />
      </EHSection>

      <EHSection compact>
        <EHSplitStory eyebrow="Langfristig" title="Ein Haus ist die größte Investition deines Lebens. Behandle es so." text="Wer die Geschichte seines Hauses kennt, entscheidet besser, spart bei Wartung und Verkauf und übergibt irgendwann sauber." media={<Image src="/images/marketing/family-home.jpg" alt="Familie entspannt auf der Terrasse ihres Hauses" width={1024} height={1024} sizes="(min-width: 900px) 540px, 100vw" />}>
          <EHFeatureRows items={[
            { icon: <Home size={20} />, title: 'Technik & Ausstattung', text: 'Heizung, PV, Wallbox, Dach, Fenster: strukturiert am Haus geführt, mit Garantien und Ansprechpartnern.' },
            { icon: <FileText size={20} />, title: 'Arbeiten & Wartung', text: 'Erledigte Arbeiten, Kosten, Hinweise und zukünftige Aufgaben in einer Historie.' },
            { icon: <UserRound size={20} />, title: 'Beziehungen', text: 'Bewährte Betriebe und konkrete Menschen bleiben Teil deines Hauswissens.' },
            { icon: <Wallet size={20} />, title: 'Wert beim Verkauf', text: 'Eine lückenlose Hausakte ist beim Verkauf ein Argument, das Käufer und Makler verstehen.' },
          ]} />
        </EHSplitStory>
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Klare Regeln</EHEyebrow>
        <EHHeading>Was du von uns erwarten kannst.</EHHeading>
        <EHFacts items={FACTS.map((f) => ({ value: f.value, label: f.label }))} />
      </EHSection>

      <EHClosing title="Dein Hauskonto startet bei 0 €." text="Beschreibe dein erstes Anliegen oder leg einfach los und bau die Hausakte auf. Beides ist kostenlos." href="/register?role=homeowner" label="Hauskonto kostenlos anlegen" secondary={<EHButton href="/#anliegen" variant="secondary">Anliegen starten</EHButton>} />
      </EHScope>
    </MarketingShell>
  );
}
