import { LEXIKON_EINTRAEGE } from '@/lib/lexikon';
import { SiteShell } from '@/components/site/site-shell';
import { Heading, PageHero, Section } from '@/components/site/page/blocks';
import { ButtonLink } from '@/design-system/site';
import { EntryGrid } from './lexikon-sections';

export function LexikonNotFound() {
  const suggestions = [...LEXIKON_EINTRAEGE].sort((a, b) => b.stufen.dringlichkeit - a.stufen.dringlichkeit).slice(0, 3);

  return (
    <SiteShell>
      <PageHero
        eyebrow="404 · Lexikon"
        title="Diesen Begriff führen wir (noch) nicht."
        text="Vielleicht ein Tippfehler in der Adresse – oder ein Thema, das wir noch aufnehmen sollten. Du musst den Fachbegriff aber nicht kennen, um Hilfe zu bekommen."
        actions={
          <>
            <ButtonLink href="/lexikon" size="lg" arrow>
              Lexikon durchsuchen
            </ButtonLink>
            <ButtonLink href="/#anliegen" variant="outline" size="lg">
              Anliegen in eigenen Worten beschreiben
            </ButtonLink>
          </>
        }
      />
      <Section>
        <Heading eyebrow="Häufig relevant" title="Begriffe, die Eigentümer selten aufschieben sollten." />
        <EntryGrid entries={suggestions} />
      </Section>
    </SiteShell>
  );
}
