import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, MessageSquare, Phone, Star } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/components/marketing/service-catalog';
import { ButtonLink, CheckList, Container, SectionHeading } from '../ui';

const CONTACTS = [
  { src: '/images/site/avatar-heizung.png', name: 'Thomas Bauer', company: 'Bauer Haustechnik', trade: 'Heizung & Sanitär', rating: '4,9', jobs: '3 Aufträge' },
  { src: '/images/site/avatar-elektro.png', name: 'Lena Kern', company: 'Elektro Kern', trade: 'Elektro & Wallbox', rating: '5,0', jobs: '1 Auftrag' },
  { src: '/images/site/avatar-dach.png', name: 'Jonas Weber', company: 'Dach Weber', trade: 'Dach & Dachrinne', rating: '4,8', jobs: '2 Aufträge' },
] as const;

export function CraftsmenFeature() {
  return (
    <section id="handwerker" className="scroll-mt-24 bg-white py-20 lg:py-28">
      <Container className="flex flex-col gap-16">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Handwerker finden"
              title="Nie wieder „Wen ruf ich da eigentlich an?“"
              text="Beschreib einfach, was los ist – in deinen Worten, mit Foto oder per Sprachnachricht. Wir finden den passenden, geprüften Betrieb aus deiner Region. Und wenn du zufrieden bist, speicherst du ihn als festen Ansprechpartner."
            />
            <CheckList
              items={[
                'Persönlich geprüfte Betriebe mit echten Bewertungen',
                'Kostenrahmen vor dem Termin – keine bösen Überraschungen',
                'Dein Anliegen wird nicht an fünf Betriebe verkauft',
                'Rechnung und Garantie landen automatisch in deiner Hausakte',
              ]}
            />
            <ButtonLink href="/register?role=homeowner" size="lg" arrow className="w-fit">
              Handwerker finden
            </ButtonLink>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] bg-cream p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-lg font-bold">Meine Handwerker</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-body">7 gespeichert</span>
              </div>
              <ul className="flex flex-col gap-3">
                {CONTACTS.map((contact) => (
                  <li key={contact.name} className="flex items-center gap-4 rounded-2xl bg-white p-4">
                    <Image src={contact.src} alt={`Porträt ${contact.name}`} width={56} height={56} className="size-14 rounded-2xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-semibold">
                        {contact.company}
                        <BadgeCheck className="size-4 text-brand" aria-label="Geprüfter Betrieb" />
                      </p>
                      <p className="truncate text-sm text-body">
                        {contact.name} · {contact.trade}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-body">
                        <Star className="size-3 fill-coral text-coral" aria-hidden="true" />
                        <span className="font-semibold text-ink">{contact.rating}</span> · {contact.jobs} bei dir
                      </p>
                    </div>
                    <div className="flex gap-2" aria-hidden="true">
                      <span className="grid size-10 place-items-center rounded-full bg-cream text-ink">
                        <MessageSquare className="size-4" />
                      </span>
                      <span className="grid size-10 place-items-center rounded-full bg-ink text-white">
                        <Phone className="size-4" />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <p className="absolute -bottom-5 right-6 rounded-full bg-lime px-4 py-2 text-sm font-bold text-ink shadow-lg">
              Einmal gefunden. Immer erreichbar.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="font-display text-2xl font-bold tracking-tight">Wobei brauchst du Hilfe?</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SERVICE_CATEGORIES.map(({ slug, shortTitle, description, icon: Icon }) => (
              <li key={slug}>
                <Link
                  href={`/leistungen/${slug}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-hairline p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_12px_30px_-16px_rgba(14,79,85,0.4)]"
                >
                  <span className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <ArrowUpRight className="size-4 text-body opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </span>
                  <span>
                    <strong className="block text-sm font-semibold text-ink">{shortTitle}</strong>
                    <span className="line-clamp-2 text-xs leading-snug text-body">{description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
