import Link from 'next/link';
import { breadcrumbJsonLd, canonical, SITE_URL } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import {
  ClosingCta,
  Heading,
  HeroPhoto,
  HonestLimits,
  JsonLd,
  LinkCards,
  OWNER_ASSURANCES,
  PageHero,
  Section,
  StepList,
} from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { Reveal } from './motion';
import { SERVICE_CATEGORIES, type ServiceCategory } from './service-catalog';
import { ButtonLink } from '@/design-system/site';

const requestHref = (text: string) => '/register?role=homeowner&request=' + encodeURIComponent(text);

/** Jede Leistungsseite bekommt ihr eigenes Motiv, damit sich die zwölf Seiten auf den ersten Blick unterscheiden. */
const SERVICE_IMAGES: Record<string, string> = {
  'haus-technik': '/images/services/haus-technik.jpg',
  'elektro-smart-home': '/images/premium/category-elektro.jpg',
  heizung: '/images/premium/category-heizung.jpg',
  'sanitaer-wasser': '/images/services/sanitaer-wasser.jpg',
  'dach-fenster-tueren': '/images/premium/category-dach.jpg',
  'innenausbau-sanierung': '/images/services/innenausbau-sanierung.jpg',
  'garten-aussenbereich': '/images/premium/category-garten.jpg',
  'reinigung-pflege': '/images/services/reinigung-pflege.jpg',
  'saisonale-dienste': '/images/services/saisonale-dienste.jpg',
  spezialfaelle: '/images/services/spezialfaelle.jpg',
  'umzug-entruempelung': '/images/services/umzug-entruempelung.jpg',
  'beratung-notfall': '/images/site/story-beratung.png',
};
const FALLBACK_IMAGE = '/images/site/craftsman-at-work.png';

export function ServiceDetailPage({ service }: { service: ServiceCategory }) {
  const servicePath = `/leistungen/${service.slug}`;
  const serviceJsonLd = {
    '@context': 'https://schema.org', '@type': 'Service', name: service.title,
    serviceType: service.title, url: canonical(servicePath),
    provider: { '@type': 'HomeAndConstructionBusiness', '@id': `${SITE_URL}/leistungen#anbieter`, name: 'Einfach Hausen', url: canonical('/leistungen') },
    areaServed: 'Regionale Pilotgebiete in Deutschland — konkrete Verfügbarkeit hängt vom aktiven Partnernetz vor Ort ab',
  };
  const Icon = service.icon;
  const position = SERVICE_CATEGORIES.findIndex((item) => item.slug === service.slug);
  const heroTone = position % 2 === 0 ? 'cream' : 'white';
  const others = SERVICE_CATEGORIES.filter((item) => item.slug !== service.slug).slice(0, 4);
  const hasRelated = service.related.length > 0;

  return (
    <SiteShell>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Leistungen', path: '/leistungen' }, { name: service.shortTitle, path: servicePath }])} />
      <JsonLd data={serviceJsonLd} />

      <PageHero
        tone={heroTone}
        eyebrow={`Leistungen · ${service.shortTitle}`}
        title={service.title}
        text={`${service.description}. Du musst das Gewerk nicht kennen. Beschreib, was du bemerkst oder vorhast — wir helfen bei der Einordnung, bevor ein Auftrag entsteht.`}
        actions={
          <>
            <ButtonLink href="#situationen" size="lg" arrow>
              Situation auswählen
            </ButtonLink>
            <ButtonLink href="/leistungen" variant="outline" size="lg">
              Alle Leistungen
            </ButtonLink>
          </>
        }
        assurances={OWNER_ASSURANCES}
        aside={
          <HeroPhoto
            src={SERVICE_IMAGES[service.slug] ?? FALLBACK_IMAGE}
            alt={`Illustrative Szene zum Bereich ${service.title}, ohne lesbare Marken oder Namen`}
            badge={{ label: 'Leistungsbereich', title: service.description, icon: Icon }}
          />
        }
      />

      <Section id="situationen">
        <Heading
          eyebrow="Typische Situationen"
          title="Klingt eins davon nach dir?"
          text="Tippe auf einen Satz. Er wird dein erstes Anliegen, und du kannst ihn danach in deinen eigenen Worten anpassen."
        />
        <LinkCards
          variant="prompt"
          items={service.situations.map((situation, index) => ({
            label: `Situation ${index + 1}`,
            title: situation,
            text: 'Als Anliegen übernehmen',
            href: requestHref(situation),
          }))}
        />
        <Reveal y={12}>
          <p className="text-meta text-body">
            Dein Fall klingt anders?{' '}
            <Link href="/#anliegen" className="font-semibold text-brand underline underline-offset-4">
              Beschreib ihn frei
            </Link>
            . Die Beispiele sind nur Orientierung.
          </p>
        </Reveal>
      </Section>

      <Section tone="dark">
        <Heading
          tone="dark"
          eyebrow="So läuft es"
          title="Ein Betrieb aus der Region. Du entscheidest."
          text="Wir suchen im aktiven Partnernetz. Ein Foto oder eine Beschreibung reicht zum Einordnen. Ein Auftrag entsteht erst, wenn du ihn ausdrücklich bestätigst."
        />
        <StepList steps={service.steps} tone="dark" />
      </Section>

      <Section tone="cream">
        <HonestLimits title="Was wir versprechen — und was nicht." items={service.limits} />
      </Section>

      {hasRelated && (
        <Section>
          <Heading eyebrow="Weiterlesen" title="Passend zu diesem Bereich." />
          <LinkCards items={service.related.map((item) => ({ label: 'Ratgeber', title: item.label, href: item.href }))} />
        </Section>
      )}

      <Section tone={hasRelated ? 'cream' : 'white'}>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Häufige Fragen" title={`Zu ${service.shortTitle}.`} />
          <PageFaq items={service.faq} tone={hasRelated ? 'white' : 'cream'} />
        </div>
      </Section>

      <Section tone={hasRelated ? 'white' : 'cream'}>
        <Heading eyebrow="Weitere Bereiche" title="Auch das organisieren wir für dich." />
        <LinkCards
          columns={4}
          items={others.map((item) => ({ icon: item.icon, title: item.title, text: item.description, href: `/leistungen/${item.slug}` }))}
        />
      </Section>

      <ClosingCta
        title={service.cta}
        text="Kostenlos und unverbindlich starten. Wir ordnen ein, du entscheidest über jeden nächsten Schritt."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/#anliegen', label: 'Anliegen starten' }}
        points={OWNER_ASSURANCES}
      />
    </SiteShell>
  );
}
