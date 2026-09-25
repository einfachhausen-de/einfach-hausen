import { BadgeCheck, CalendarDays, Heart, MapPin, Phone } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/components/marketing/service-catalog';
import { CheckList, ExampleNote, SectionHeading, TradeAvatar } from '@/design-system/site';
import { CtaRow, DemoFrame, FeatureSplit, ServiceTiles } from '@/components/site/page/blocks';

const OFFERS = [
  { company: 'Betrieb A', price: '189 €', date: 'Do, 9:00', distance: '3,1 km', badge: 'Meine Empfehlung', recommended: true },
  { company: 'Betrieb B', price: '165 €', date: 'Mo, 14:00', distance: '5,4 km', badge: 'Günstigstes Angebot', recommended: false },
  { company: 'Betrieb C', price: '210 €', date: 'Morgen, 8:00', distance: '7,8 km', badge: 'Schnellster Termin', recommended: false },
] as const;

function OffersDemo() {
  return (
    <div className="flex flex-col gap-4">
      <DemoFrame tone="cream" context="Heizungswartung · Gas-Brennwert" title="3 Angebote für dich">
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
      </DemoFrame>

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
  );
}

export function CraftsmenFeature() {
  return (
    <FeatureSplit
      id="handwerker"
      tone="white"
      media={<OffersDemo />}
      footer={<ServiceTiles title="Wobei brauchst du Hilfe?" items={SERVICE_CATEGORIES} />}
    >
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
      <CtaRow href="/register?role=homeowner" note="Keine Provision auf deinen Auftrag">
        Angebote einholen
      </CtaRow>
    </FeatureSplit>
  );
}
