import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, Heading, HonestLimits, PageHero, Section, StepList } from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { ButtonLink, CheckList } from '@/design-system/site';

export type ProductStory = {
  eyebrow: string;
  title: string;
  text: string;
  primaryHref: string;
  primaryLabel: string;
  proofTitle: string;
  proofText: string;
  points: readonly string[];
  steps: ReadonlyArray<{ title: string; text: string }>;
  limits: readonly string[];
  faq: ReadonlyArray<{ q: string; a: string }>;
  ctaTitle: string;
  ctaText: string;
};

export function ProductStoryPage({ story, breadcrumb }: { story: ProductStory; breadcrumb?: React.ReactNode }) {
  return (
    <SiteShell>
      {breadcrumb}
      <PageHero
        eyebrow={story.eyebrow}
        title={story.title}
        text={story.text}
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
            <p className="text-meta font-semibold uppercase tracking-wider text-lime">Was du davon hast</p>
            <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{story.proofTitle}</h2>
            <p className="leading-relaxed text-white/75">{story.proofText}</p>
            <CheckList items={story.points} tone="dark" />
          </div>
        }
      />

      <Section>
        <Heading eyebrow="Ablauf" title="Klar getrennte Schritte." />
        <StepList steps={story.steps} />
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Wichtig" title="Klare Grenzen statt falscher Versprechen." />
        <HonestLimits title="So ist es im Produkt" items={story.limits} />
      </Section>

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
