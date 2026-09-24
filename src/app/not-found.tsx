import Link from 'next/link';
import { headers } from 'next/headers';
import { LexikonNotFound } from '@/components/site/lexikon/lexikon-not-found';
import { SiteShell } from '@/components/site/site-shell';
import { LinkCards, PageHero } from '@/components/site/page/blocks';
import { ButtonLink } from '@/design-system/site';

export default async function NotFound() {
  const originalPath = (await headers()).get('x-original-path') ?? '';
  if (originalPath.startsWith('/lexikon/')) return <LexikonNotFound />;

  return (
    <SiteShell>
      <PageHero
        eyebrow="404"
        title="Das gibt es hier nicht."
        text="Diese Seite oder dieser Auftrag existiert nicht (mehr). Von der Startseite, der Hilfe oder einem der Wege unten findest du wieder hinein."
        actions={
          <>
            <ButtonLink href="/" size="lg" arrow>
              Zur Startseite
            </ButtonLink>
            <ButtonLink href="/hilfe" variant="outline" size="lg">
              Zur Hilfe
            </ButtonLink>
          </>
        }
      />
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 sm:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">Wohin als Nächstes.</h2>
          <LinkCards
            items={[
              { title: 'Leistungen', text: 'Beschreib, was an deinem Haus ansteht.', href: '/leistungen' },
              { title: 'Lexikon', text: 'Fachbegriffe in Alltagssprache.', href: '/lexikon' },
              { title: 'Kontakt', text: 'Ein Anliegen in eigenen Worten starten.', href: '/kontakt' },
              { title: 'Anmelden', text: 'Hausakte und laufende Vorgänge öffnen.', href: '/login' },
            ]}
          />
          <p className="text-sm text-body">
            Oder direkt{' '}
            <Link href="/" className="font-semibold text-brand underline underline-offset-4">
              zur Startseite
            </Link>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
