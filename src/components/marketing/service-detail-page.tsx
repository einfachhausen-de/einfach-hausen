import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { breadcrumbJsonLd, canonical, SITE_URL } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, Heading, HonestLimits, JsonLd, LinkCards, PageHero, Section, StepList } from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { Stagger } from './motion';
import { SERVICE_CATEGORIES, type ServiceCategory } from './service-catalog';
import { ButtonLink, HouseEdgeImage } from '@/design-system/site';

const requestHref = (text: string) => '/register?role=homeowner&request=' + encodeURIComponent(text);

export function ServiceDetailPage({ service }: { service: ServiceCategory }) {
  const servicePath = `/leistungen/${service.slug}`;
  const serviceJsonLd = {
    '@context': 'https://schema.org', '@type': 'Service', name: service.title,
    serviceType: service.title, url: canonical(servicePath),
    provider: { '@type': 'HomeAndConstructionBusiness', '@id': `${SITE_URL}/leistungen#anbieter`, name: 'Einfach Hausen', url: canonical('/leistungen') },
    areaServed: 'Regionale Pilotgebiete in Deutschland — konkrete Verfügbarkeit hängt vom aktiven Partnernetz vor Ort ab',
  };
  const Icon = service.icon;
  const others = SERVICE_CATEGORIES.filter((item) => item.slug !== service.slug).slice(0, 4);

  return (
    <SiteShell>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Leistungen', path: '/leistungen' }, { name: service.shortTitle, path: servicePath }])} />
      <JsonLd data={serviceJsonLd} />

      <PageHero
        eyebrow={`Leistungen · ${service.shortTitle}`}
        title={service.title}
        text={`${service.description}. Du musst das Gewerk nicht kennen. Beschreib, was du bemerkst oder vorhast — wir helfen bei der Einordnung, bevor ein Auftrag entsteht.`}
        actions={
          <>
            <ButtonLink href="/#anliegen" size="lg" arrow>
              Anliegen beschreiben
            </ButtonLink>
            <ButtonLink href="/leistungen" variant="outline" size="lg">
              Alle Leistungen
            </ButtonLink>
          </>
        }
        aside={
          <div className="flex flex-col gap-5 rounded-card bg-white p-6 shadow-lift ring-1 ring-hairline sm:p-8">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-lime text-ink" aria-hidden="true">
                <Icon className="size-6" />
              </span>
              <div>
                <p className="text-meta font-semibold uppercase tracking-wider text-brand">Typische Situationen</p>
                <h2 className="font-display text-xl font-bold text-ink">Damit kannst du zu uns kommen.</h2>
              </div>
            </div>
            <Stagger className="flex flex-col gap-2" y={12}>
              {service.situations.map((situation) => (
                <Link
                  key={situation}
                  href={requestHref(situation)}
                  className="group flex items-start justify-between gap-4 rounded-2xl bg-cream p-4 transition-colors hover:bg-lime-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span className="flex flex-col gap-1">
                    <span className="font-medium leading-snug text-ink">{situation}</span>
                    <span className="text-meta font-semibold text-brand">Als Anliegen übernehmen</span>
                  </span>
                  <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-body transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </Stagger>
            <p className="text-meta text-body">
              Die Beispiele sind Orientierung. Wenn dein Fall anders klingt, beschreib ihn trotzdem in deinen Worten.
            </p>
          </div>
        }
      />

      <Section>
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <HouseEdgeImage
            src="/images/site/craftsman-at-work.png"
            alt="Handwerker bei der Arbeit an einem Haus, ohne lesbare Marken oder Namen"
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="min-h-72"
          />
          <div className="flex flex-col gap-4">
            <p className="text-meta font-semibold uppercase tracking-wider text-brand">Vor Ort</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Ein Betrieb aus der Region. Du entscheidest.</h2>
            <p className="text-lg leading-relaxed text-body">
              Wir suchen im aktiven Partnernetz. Ein Foto oder eine Beschreibung reicht zum Einordnen. Ein Auftrag entsteht erst, wenn du ihn ausdrücklich bestätigst.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <Heading eyebrow="So läuft es" title="Du beschreibst. Wir ordnen ein. Du entscheidest." />
        <StepList steps={service.steps} />
      </Section>

      <Section tone="cream">
        <HonestLimits title="Was wir versprechen — und was nicht." items={service.limits} />
      </Section>

      {service.related.length > 0 && (
        <Section>
          <Heading eyebrow="Weiterlesen" title="Passend zu diesem Bereich." />
          <LinkCards items={service.related.map((item) => ({ label: 'Ratgeber', title: item.label, href: item.href }))} />
        </Section>
      )}

      <Section tone={service.related.length > 0 ? 'cream' : 'white'}>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Häufige Fragen" title={`Zu ${service.shortTitle}.`} />
          <PageFaq items={service.faq} tone={service.related.length > 0 ? 'white' : 'cream'} />
        </div>
      </Section>

      <Section tone="white">
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
      />
    </SiteShell>
  );
}
