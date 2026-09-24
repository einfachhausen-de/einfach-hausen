import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, CalendarDays, Heart, MapPin, Phone } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/components/marketing/service-catalog';
import { ButtonLink, CheckList, Container, ExampleBadge, ExampleNote, SectionHeading, TradeAvatar } from '@/design-system/site';

const OFFERS = [
  { company: 'Betrieb A', price: '189 €', date: 'Do, 9:00', distance: '3,1 km', badge: 'Meine Empfehlung', recommended: true },
  { company: 'Betrieb B', price: '165 €', date: 'Mo, 14:00', distance: '5,4 km', badge: 'Günstigstes Angebot', recommended: false },
  { company: 'Betrieb C', price: '210 €', date: 'Morgen, 8:00', distance: '7,8 km', badge: 'Schnellster Termin', recommended: false },
] as const;

export function CraftsmenFeature() {
  return (
    <section id="handwerker" className="scroll-mt-24 bg-white py-20 lg:py-28">
      <Container className="flex flex-col gap-16">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Handwerker finden"
              title="Angebote vergleichen wie Tarife. Den Besten behalten."
              text="Beschreib, was los ist – in deinen Worten, mit Foto oder Sprachnachricht. Geprüfte Betriebe aus deiner Region machen dir Angebote, du vergleichst Preis, Termin und Entfernung auf einen Blick. Wer gut war, bleibt als fester Ansprechpartner in deiner App."
            />
            <CheckList
              items={[
                'Nur persönlich geprüfte Betriebe – kein offener Lead-Marktplatz',
                'Preis, Termin und Entfernung übersichtlich nebeneinander',
                'Kein Auftrag ohne deine ausdrückliche Freigabe',
                'Rechnung und Garantie legst du mit einem Klick in deiner Hausakte ab',
              ]}
            />
            <ButtonLink href="/register?role=homeowner" size="lg" arrow className="w-fit">
              Angebote einholen
            </ButtonLink>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-card bg-cream p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-body">Heizungswartung · Gas-Brennwert</p>
                  <p className="font-display text-lg font-bold">3 Angebote für dich</p>
                </div>
                <ExampleBadge className="bg-white">Beispielansicht</ExampleBadge>
              </div>
              <ul className="flex flex-col gap-3">
                {OFFERS.map((offer) => (
                  <li
                    key={offer.company}
                    className={
                      offer.recommended
                        ? 'flex items-center gap-4 rounded-2xl bg-white p-4 ring-2 ring-lime-strong'
                        : 'flex items-center gap-4 rounded-2xl bg-white p-4'
                    }
                  >
                    <TradeAvatar trade="heizung" size="lg" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          offer.recommended
                            ? 'w-fit rounded-pill bg-lime px-2 py-0.5 text-meta font-bold text-ink'
                            : 'w-fit rounded-pill bg-brand-soft px-2 py-0.5 text-meta font-semibold text-brand'
                        }
                      >
                        {offer.badge}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 font-semibold">
                        <span className="truncate">{offer.company}</span>
                        <BadgeCheck className="size-4 shrink-0 text-brand" aria-label="Geprüfter Betrieb" />
                      </p>
                      <p className="flex flex-wrap items-center gap-x-3 text-meta text-body">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden="true" />
                          {offer.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" aria-hidden="true" />
                          {offer.date}
                        </span>
                      </p>
                    </div>
                    <p className="font-display text-xl font-bold">{offer.price}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-4 rounded-card bg-ink p-5 text-white">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime text-ink">
                <Heart className="size-5 fill-ink" aria-hidden="true" />
              </span>
              <p className="flex-1 text-sm leading-snug text-white/85">
                <strong className="block text-base text-white">Betrieb A gespeichert</strong>
                Ab jetzt dein Ansprechpartner für Heizung – mit Nummer, Verlauf und Rechnungen.
              </p>
              <span className="hidden size-10 place-items-center rounded-pill bg-white/10 sm:grid" aria-hidden="true">
                <Phone className="size-4" />
              </span>
            </div>
            <ExampleNote>Beispielansicht mit illustrativen Betrieben und Preisen. Echte Angebote siehst du nach deiner Anfrage.</ExampleNote>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="font-display text-2xl font-bold tracking-tight">Wobei brauchst du Hilfe?</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SERVICE_CATEGORIES.map(({ slug, shortTitle, description, icon: Icon }) => (
              <li key={slug}>
                <Link
                  href={`/leistungen/${slug}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-hairline p-4 transition-[border-color,box-shadow] hover:border-brand hover:shadow-card"
                >
                  <span className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <ArrowUpRight className="size-4 text-body opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </span>
                  <span>
                    <strong className="block text-sm font-semibold text-ink">{shortTitle}</strong>
                    <span className="line-clamp-2 text-meta leading-snug text-body">{description}</span>
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
