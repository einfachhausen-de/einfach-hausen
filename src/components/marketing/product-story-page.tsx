import { SiteShell } from '@/components/site/site-shell';
import { AlertPanel, ClosingCta, Heading, HonestLimits, ImageSplit, LinkCards, PageHero, Section, StepList } from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { ButtonLink, CheckList } from '@/design-system/site';

export type ProductStory = {
  eyebrow: string;
  title: string;
  text: string;
  primaryHref: string;
  primaryLabel: string;
  proofLabel?: string;
  proofTitle: string;
  proofText: string;
  points: readonly string[];
  steps: ReadonlyArray<{ title: string; text: string }>;
  limits: readonly string[];
  faq: ReadonlyArray<{ q: string; a: string }>;
  ctaTitle: string;
  ctaText: string;
  mood?: 'calm' | 'urgent' | 'careful';
  alert?: { title: string; text: string };
  image?: { src: string; alt: string; title: string; text: string };
  related?: ReadonlyArray<{ href: string; title: string; text: string }>;
};

export function ProductStoryPage({ story, breadcrumb }: { story: ProductStory; breadcrumb?: React.ReactNode }) {
  const urgent = story.mood === 'urgent';

  return (
    <SiteShell>
      {breadcrumb}
      <PageHero
        eyebrow={story.eyebrow}
        title={story.title}
        text={story.text}
        notice={
          story.alert ? (
            <AlertPanel tone={urgent ? 'warn' : 'info'} title={story.alert.title}>
              {story.alert.text}
            </AlertPanel>
          ) : undefined
        }
        actions={
          <>
            <ButtonLink href={story.primaryHref} size="lg" arrow>
              {story.primaryLabel}
            </ButtonLink>
            <ButtonLink href="/so-funktionierts" variant="outline" size="lg">
              So funktioniert&apos;s
            </ButtonLink>
          </>
        }
        aside={
          <div className="flex flex-col gap-6 rounded-card bg-ink p-7 text-white shadow-lift sm:p-9">
            <p className="text-meta font-semibold uppercase tracking-wider text-lime">{story.proofLabel ?? 'Was du davon hast'}</p>
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{story.proofTitle}</h2>
            <p className="leading-relaxed text-white/75">{story.proofText}</p>
            <CheckList items={story.points} tone="dark" />
          </div>
        }
      />

      {story.image && (
        <Section tone="white">
          <ImageSplit src={story.image.src} alt={story.image.alt} reverse={urgent} note="Illustrative Bildwelt, keine Kundenaussage.">
            <Heading eyebrow="Konkret" title={story.image.title} text={story.image.text} />
          </ImageSplit>
        </Section>
      )}

      <Section tone={story.image ? 'cream' : 'white'}>
        <Heading eyebrow="Ablauf" title="Klar getrennte Schritte." />
        <StepList steps={story.steps} />
      </Section>

      <Section tone={story.image ? 'white' : 'cream'}>
        <Heading eyebrow="Wichtig" title="Klare Grenzen statt falscher Versprechen." />
        <HonestLimits title="So ist es im Produkt" items={story.limits} />
      </Section>

      {story.related && story.related.length > 0 && (
        <Section tone="cream">
          <Heading eyebrow="Weiter" title="Der passende nächste Weg." />
          <LinkCards items={story.related} />
        </Section>
      )}

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Häufige Fragen" title={`Zu ${story.eyebrow}.`} />
          <PageFaq items={story.faq} />
        </div>
      </Section>

      <ClosingCta
        title={story.ctaTitle}
        text={story.ctaText}
        primary={{ href: story.primaryHref, label: story.primaryLabel }}
        secondary={{ href: '/#anliegen', label: 'Anliegen starten' }}
      />
    </SiteShell>
  );
}
