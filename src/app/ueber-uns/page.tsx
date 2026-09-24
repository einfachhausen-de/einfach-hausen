import type { Metadata } from 'next';
import { BrainCircuit, HeartHandshake, Home } from 'lucide-react';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, FeatureCards, Heading, ImageSplit, PageHero, Section } from '@/components/site/page/blocks';
import { Stagger } from '@/components/marketing/motion';
import { ButtonLink, HouseEdgeImage } from '@/design-system/site';

export const metadata: Metadata = {
  title: 'Über uns',
  description: 'Mission und Arbeitsweise hinter Einfach Hausen: eine ruhige Eingangstür für Eigentümer und Partnerbetriebe.',
  alternates: { canonical: canonical('/ueber-uns') },
};

const PRINCIPLES = [
  { title: 'Nutzen vor Technologie', text: 'Jede Funktion beginnt mit einem konkreten Nutzen für das Haus. KI ist ein leises Werkzeug im Hintergrund, kein lautes Werbeversprechen.' },
  { title: 'Entscheidung bleibt beim Menschen', text: 'Einordnen, vorbereiten, prüfen: ja. Beauftragung, Freigabe und Vereinbarungen bleiben bewusste Entscheidungen zwischen Eigentümer und Betrieb.' },
  { title: 'Region vor Skalierung', text: 'Wir wachsen mit geprüften Partnerbetrieben vor Ort. Verlässliche Arbeit und kurze Wege sind uns wichtiger als eine anonyme Vermittlungsplattform.' },
  { title: 'Hauswissen bleibt erhalten', text: 'Das Haus ist der langlebige Zusammenhang. Technik, Wartungen, Rechnungen und bewährte Kontakte gehören dauerhaft an einen Ort.' },
] as const;

export default function Page() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Über uns"
        title="Die ruhige Eingangstür für dein Eigenheim."
        text="Kein unübersichtliches Handwerkerverzeichnis und keine komplizierte Software: eine verlässliche Anlaufstelle, die Anliegen versteht, geprüfte Betriebe aus der Region verbindet und das Wissen deines Hauses bewahrt."
        actions={
          <ButtonLink href="/register?role=homeowner" size="lg" arrow>
            Hauskonto anlegen
          </ButtonLink>
        }
        aside={
          <div className="relative aspect-[4/5] w-full">
            <HouseEdgeImage
              src="/images/premium/hero-homeowner.jpg"
              alt="Eine Eigentümerin steht entspannt vor ihrem Haus"
              sizes="(min-width: 1024px) 40vw, 100vw"
              priority
              className="absolute inset-0"
            />
          </div>
        }
      />

      <Section>
        <Heading eyebrow="Leitbild" title="Vier Grundsätze, an denen wir jede Entscheidung messen." />
        <Stagger className="grid gap-5 md:grid-cols-2" y={20}>
          {PRINCIPLES.map((p, index) => (
            <div key={p.title} className="flex h-full gap-5 rounded-card bg-cream p-7 sm:p-8">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink font-display text-lg font-bold text-lime" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-xl font-bold text-ink">{p.title}</h3>
                <p className="leading-relaxed text-body">{p.text}</p>
              </div>
            </div>
          ))}
        </Stagger>
      </Section>

      <Section tone="dark">
        <Heading
          tone="dark"
          eyebrow="Transparenz"
          title="Regionale Partner und 0 % Provision."
          text="Eigentümer nutzen Einfach Hausen kostenlos. Wir verdienen über planbare Tarife der Partnerbetriebe – nicht an deinem Auftragswert."
        />
        <FeatureCards
          tone="dark"
          items={[
            { icon: HeartHandshake, title: 'Keine Lead-Auktionen', text: 'Betriebe ersteigern keine Anfragen. Dein Anliegen geht gezielt an einen passenden Betrieb, wenn einer verfügbar ist.' },
            { icon: BrainCircuit, title: 'Assistenz statt Show', text: 'Der Hausmanager hilft bei Beschreibung und Organisation, nimmt dir aber keine Entscheidung ab.' },
            { icon: Home, title: 'Dauerhafter Werterhalt', text: 'Hinterlegte Rechnungen, Wartungen und Kontakte bleiben in der digitalen Hausakte deines Hauses.' },
          ]}
        />
      </Section>

      <Section>
        <ImageSplit src="/images/marketing/family-home.jpg" alt="Familie auf der Terrasse ihres Hauses">
          <Heading
            eyebrow="Unser Versprechen"
            title="Ein Ansprechpartner für alles rund ums Eigenheim."
            text="Weniger im Kopf behalten, weniger suchen, weniger hinterhertelefonieren. Und bei jeder Entscheidung wissen, worauf du dich einlässt."
          />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/so-funktionierts" variant="outline">
              So funktioniert&apos;s
            </ButtonLink>
            <ButtonLink href="/sicherheit" variant="outline">
              Sicherheit & Daten
            </ButtonLink>
          </div>
        </ImageSplit>
      </Section>

      <ClosingCta
        title="Lerne Einfach Hausen für dein Zuhause kennen."
        text="Erstelle in wenigen Minuten dein kostenloses Hauskonto und behalte den Kopf frei."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/kontakt', label: 'Kontakt aufnehmen' }}
      />
    </SiteShell>
  );
}
