import { SiteShell } from '@/components/site/site-shell';
import {
  AlertPanel,
  ClosingCta,
  ExampleCard,
  Heading,
  HeroPhoto,
  HonestLimits,
  ILLUSTRATIVE_IMAGE_NOTE,
  ImageSplit,
  LinkCards,
  MOOD_HERO_TONE,
  NumberedPoints,
  PageHero,
  type PageMood,
  ProofPanel,
  Section,
  StepList,
  WideFigure,
} from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { Reveal } from '@/components/marketing/motion';
import { ButtonLink, CheckList } from '@/design-system/site';

type Mood = PageMood;

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
  /**
   * Bestimmt die Dramaturgie der Seite: ruhig (Foto vorn), dringend (dunkel, Hinweis zuerst),
   * sorgfältig (Aktenumschlag mit Ablauf) oder wertorientiert (zentrierter Kopf mit Breitbild).
   */
  mood?: Mood;
  alert?: { title: string; text: string };
  image?: { src: string; alt: string; title: string; text: string };
  related?: ReadonlyArray<{ href: string; title: string; text: string }>;
};

export function ProductStoryPage({ story, breadcrumb }: { story: ProductStory; breadcrumb?: React.ReactNode }) {
  const mood: Mood = story.mood ?? 'calm';
  const urgent = mood === 'urgent';
  const heroTone = MOOD_HERO_TONE[mood];
  const proofLabel = story.proofLabel ?? 'Was du davon hast';
  const hasRelated = Boolean(story.related && story.related.length > 0);
  const limitsTone = mood === 'calm' || mood === 'value' ? 'cream' : 'white';
  const altTone = limitsTone === 'cream' ? 'white' : 'cream';
  const faqTone = hasRelated ? limitsTone : altTone;

  const hero = {
    calm: story.image ? (
      <HeroPhoto src={story.image.src} alt={story.image.alt} badge={{ label: proofLabel, title: story.proofTitle }} caption={ILLUSTRATIVE_IMAGE_NOTE} />
    ) : (
      <ProofPanel label={story.proofLabel} title={story.proofTitle} text={story.proofText} points={story.points} tone="ink" />
    ),
    urgent: <ProofPanel label={story.proofLabel} title={story.proofTitle} text={story.proofText} points={story.points} tone="light" />,
    careful: <ExampleCard label="Ablauf auf einen Blick" title={story.proofTitle} rows={story.steps} note={story.proofText} />,
    value: undefined,
  }[mood];

  return (
    <SiteShell>
      {breadcrumb}
      <PageHero
        tone={heroTone}
        layout={mood === 'value' ? 'center' : 'split'}
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
            <ButtonLink href="/so-funktionierts" variant={heroTone === 'dark' ? 'outline-dark' : 'outline'} size="lg">
              So funktioniert&apos;s
            </ButtonLink>
          </>
        }
        aside={hero}
      >
        {mood === 'value' && story.image ? <WideFigure src={story.image.src} alt={story.image.alt} priority /> : undefined}
      </PageHero>

      {mood === 'calm' && (
        <Section tone="dark">
          <Heading tone="dark" eyebrow={proofLabel} title={story.image?.title ?? story.proofTitle} text={story.image?.text ?? story.proofText} />
          <NumberedPoints points={story.points} />
        </Section>
      )}

      {mood === 'value' && (
        <Section>
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-8">
              <Heading eyebrow={proofLabel} title={story.proofTitle} text={story.image?.text ?? story.proofText} />
              <Reveal y={12}>
                <CheckList items={story.points} />
              </Reveal>
            </div>
            <Reveal y={20}>
              <ExampleCard label="Ablauf auf einen Blick" title={story.image?.title ?? 'Schritt für Schritt, unter deiner Kontrolle.'} rows={story.steps} />
            </Reveal>
          </div>
        </Section>
      )}

      {mood === 'careful' && story.image && (
        <Section tone="cream">
          <ImageSplit src={story.image.src} alt={story.image.alt} note={ILLUSTRATIVE_IMAGE_NOTE}>
            <Heading eyebrow="Konkret" title={story.image.title} text={story.image.text} />
            <Reveal y={12}>
              <CheckList items={story.points} />
            </Reveal>
          </ImageSplit>
        </Section>
      )}

      {(mood === 'calm' || urgent) && (
        <Section id="ablauf">
          <Heading eyebrow="Ablauf" title={urgent ? 'Was jetzt passiert.' : 'Klar getrennte Schritte.'} />
          <StepList steps={story.steps} />
        </Section>
      )}

      {urgent && story.image && (
        <Section tone="cream">
          <ImageSplit src={story.image.src} alt={story.image.alt} reverse note={ILLUSTRATIVE_IMAGE_NOTE}>
            <Heading eyebrow="Konkret" title={story.image.title} text={story.image.text} />
          </ImageSplit>
        </Section>
      )}

      <Section tone={limitsTone}>
        <Heading eyebrow="Wichtig" title="Klare Grenzen statt falscher Versprechen." />
        <HonestLimits title="So ist es im Produkt" items={story.limits} />
      </Section>

      {hasRelated && story.related && (
        <Section tone={altTone}>
          <Heading eyebrow="Weiter" title="Der passende nächste Weg." />
          <LinkCards items={story.related} />
        </Section>
      )}

      <Section tone={faqTone}>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Häufige Fragen" title={`Zu ${story.eyebrow}.`} />
          <PageFaq items={story.faq} tone={faqTone === 'cream' ? 'white' : 'cream'} />
        </div>
      </Section>

      <ClosingCta
        title={story.ctaTitle}
        text={story.ctaText}
        primary={{ href: story.primaryHref, label: story.primaryLabel }}
        secondary={{ href: '/#anliegen', label: 'Anliegen starten' }}
        tone={urgent || mood === 'value' ? 'dark' : 'lime'}
        points={mood === 'careful' || mood === 'value' ? story.points : undefined}
      />
    </SiteShell>
  );
}
