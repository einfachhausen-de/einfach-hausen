import {
  BadgeCheck, BellRing, Calendar, Check, ClipboardCheck, FileCheck2, Handshake, Heart, Receipt, Repeat, ShieldCheck, Sparkles,
  Star, Target, ToggleRight, UserPlus, X,
} from 'lucide-react';
import Link from 'next/link';
import { ButtonLink, Container, ExampleBadge, HouseEdgeImage, PhoneFrame, SectionHeading, cn, houseEdgeClass } from '@/design-system/site';
import { SiteFaq } from '@/design-system/site-faq';
import { PartnerAppScreen } from './partner-app-screen';

export function ProHero({ trialDays, promise }: { trialDays: number; promise: string }) {
  return (
    <section>
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="flex flex-col gap-7">
          <p className="inline-flex w-fit items-center gap-2 rounded-pill border border-white/15 px-4 py-1.5 text-sm text-white/85">
            <BadgeCheck className="size-4 text-lime" aria-hidden="true" />
            Für Handwerks- und Servicebetriebe
          </p>
          <h1 className="font-display text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Mehr Stammkunden.
            <br />
            <span className="text-lime">Null Provision.</span>
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/80 sm:text-xl">
            Einfach Hausen bringt dir passende Anfragen aus deiner Region – und Eigentümer speichern dich als festen Ansprechpartner
            für ihr Haus. Keine gekauften Leads. Kein offener Marktplatz. Kein Papierkram.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/register?role=provider" size="lg" arrow>
              Kostenlos Partner werden
            </ButtonLink>
            <ButtonLink href="#tarife" variant="outline-dark" size="lg">
              Tarife ansehen
            </ButtonLink>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
            {[
              ['0 %', promise.replace(/^0\s?%\s*/, '')],
              ['100 %', 'deines Auftragswerts bleibt bei dir'],
              ['0 €', 'pro Anfrage oder Lead'],
              [`${trialDays} Tage`, 'bezahlte Tarife kostenlos testen'],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-white/70">{label}</dt>
                <dd className="font-display text-3xl font-bold text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative hidden h-[700px] lg:block">
          <HouseEdgeImage
            src="/images/site/pro-workshop.png"
            alt="Handwerker greift in die geordneten Werkzeugregale seines Transporters vor einem Einfamilienhaus"
            sizes="(min-width: 1024px) 34vw, 0px"
            priority
            className="absolute inset-y-8 left-16 right-0"
          />
          <PhoneFrame className="absolute bottom-0 left-0 z-10" label="Beispielansicht der Partner-App">
            <PartnerAppScreen />
          </PhoneFrame>
          <div className="absolute right-6 top-20 z-20 flex w-72 items-center gap-3 rounded-2xl bg-white p-3.5 text-ink shadow-lift">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral-soft text-coral">
              <Heart className="size-5 fill-coral" aria-hidden="true" />
            </span>
            <span className="text-meta leading-snug">
              <span className="flex items-center justify-between gap-2">
                <strong className="text-sm">Neuer Stammkunde</strong>
                <ExampleBadge />
              </span>
              Ein Eigentümer hat dich als festen Ansprechpartner gespeichert
            </span>
          </div>
          <div className="absolute bottom-24 right-4 z-20 flex w-60 items-center gap-3 rounded-2xl bg-lime p-3.5 text-ink shadow-lift">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-lime">
              <Repeat className="size-5" aria-hidden="true" />
            </span>
            <span className="text-meta leading-snug">
              <span className="flex items-center justify-between gap-2">
                <strong className="text-sm">Folgeauftrag</strong>
                <ExampleBadge className="bg-white/60 ring-ink/10" />
              </span>
              Jährliche Wartung direkt bei dir angefragt
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

const OLD_WAY = [
  'Du zahlst pro Lead – auch wenn nie ein Auftrag daraus wird',
  'Dieselbe Anfrage geht an viele Betriebe gleichzeitig',
  'Wer am billigsten ist, gewinnt – nicht wer am besten ist',
  'Nach dem Auftrag ist der Kunde wieder weg',
] as const;

const NEW_WAY = [
  'Fester Monatsbeitrag, 0 % Provision – egal wie groß der Auftrag',
  'Nur ein kleiner Kreis passender, geprüfter Betriebe – kein offener Marktplatz',
  'Matching nach Qualität, Nähe, Fachgebiet und Verfügbarkeit – nie nach Tarif',
  'Kunden speichern dich – Folgeaufträge kommen direkt zu dir',
] as const;

export function ProComparison() {
  return (
    <section className="bg-white py-20 text-ink lg:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Der Unterschied"
          title="Schluss mit Lead-Roulette."
          text="Klassische Portale verkaufen dieselbe Anfrage an viele Betriebe. Wir verbinden dich mit Eigentümern, die zu dir passen – und bei dir bleiben."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-card bg-cream p-8 sm:p-10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-body">Klassische Lead-Portale</h3>
            <ul className="mt-6 flex flex-col gap-4">
              {OLD_WAY.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-pill bg-coral-soft text-coral" aria-hidden="true">
                    <X className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed text-body">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card bg-brand-deep p-8 text-white sm:p-10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-lime">Einfach Hausen</h3>
            <ul className="mt-6 flex flex-col gap-4">
              {NEW_WAY.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-pill bg-lime text-ink" aria-hidden="true">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed text-white/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function ProBenefits({ teamSwitch }: { teamSwitch: string }) {
  const benefits = [
    { icon: Target, title: 'Nur passende Anfragen', text: 'Region, Gewerk, Qualifikation und Kapazität müssen passen – sonst kommt die Anfrage gar nicht erst bei dir an.' },
    { icon: Sparkles, title: 'Vorsortiert von der KI', text: 'Fotos, Baujahr, Anlage und Beschreibung: Du weißt vor dem Anruf, worum es geht. Weniger Rückfragen, weniger Leerfahrten.' },
    { icon: Heart, title: 'Der Stammkunden-Effekt', text: 'Zufriedene Kunden speichern dich in ihrer App. Wartung, Reparatur, nächstes Projekt – die Anfrage landet direkt bei dir.' },
    { icon: Receipt, title: 'Du bleibst Rechnungssteller', text: 'Preis, Vertrag und Rechnung laufen direkt zwischen dir und dem Kunden. Wir verdienen nichts an deinem Auftrag.' },
    { icon: Star, title: 'Reputation, die bleibt', text: 'Bewertungen aus echten Aufträgen – und dein Profil zeigt, wer hinter dem Betrieb steht.' },
    { icon: ToggleRight, title: 'Keine Rechte-Verwaltung', text: teamSwitch },
  ] as const;

  return (
    <section id="vorteile" className="scroll-mt-24 bg-white pb-20 text-ink lg:pb-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading eyebrow="Deine Vorteile" title="Gemacht für Betriebe, die lieber arbeiten als akquirieren." />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-4 rounded-card border border-hairline p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="font-display text-xl font-bold">{title}</h3>
              <p className="leading-relaxed text-body">{text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

const STEPS = [
  { icon: UserPlus, title: 'Kostenlos registrieren', text: 'Betrieb, Gewerke und Einsatzgebiet anlegen. Dauert keine 5 Minuten.' },
  { icon: ShieldCheck, title: 'Prüfung bestehen', text: 'Gewerbe, Qualifikationen, Haftpflicht und Referenzen – persönlich geprüft.' },
  { icon: BellRing, title: 'Anfragen erhalten', text: 'Passende Anfragen annehmen oder ablehnen. Du entscheidest, wie viel du machst.' },
  { icon: Handshake, title: 'Kunden behalten', text: 'Nach dem Auftrag bleibst du als Ansprechpartner am Haus gespeichert.' },
] as const;

export function ProSteps() {
  return (
    <section id="ablauf" className="scroll-mt-24 bg-cream py-20 text-ink lg:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading eyebrow="So funktioniert’s" title="In vier Schritten zum Partnerbetrieb." />
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex flex-col gap-4 rounded-card bg-white p-7">
              <span className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-ink text-lime">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="font-display text-4xl font-bold text-body" aria-hidden="true">
                  0{index + 1}
                </span>
              </span>
              <h3 className="font-display text-xl font-bold">{title}</h3>
              <p className="leading-relaxed text-body">{text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

const APP_FEATURES = [
  { icon: ClipboardCheck, title: 'Anfragen mit einem Tipp annehmen' },
  { icon: Calendar, title: 'Termine direkt mit dem Kunden abstimmen' },
  { icon: FileCheck2, title: 'Fotos & Protokolle am Auftrag' },
  { icon: Receipt, title: 'Rechnung schreiben & ablegen' },
] as const;

export function ProAppFeature() {
  return (
    <section id="partner-app" className="scroll-mt-24 py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <SectionHeading
            tone="dark"
            eyebrow="Die Partner-App"
            title="Dein Büro in der Hosentasche. Ohne Mini-ERP-Wahnsinn."
            text="Anfragen, Termine, Dokumentation und Rechnung – alles, was du für den nächsten Schritt brauchst. Und nichts, was dich aufhält."
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {APP_FEATURES.map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-3 rounded-2xl border border-white/15 p-4">
                <Icon className="size-5 shrink-0 text-lime" aria-hidden="true" />
                <span className="text-sm font-medium">{title}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <PhoneFrame label="Beispielansicht der Partner-App">
            <PartnerAppScreen />
          </PhoneFrame>
        </div>
      </Container>
    </section>
  );
}

type Plan = { slug: string; title: string; monthly_amount: number; monthly_lead_limit: number | null; trial_days: number };

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function ProPricing({ plans, promise }: { plans: Plan[]; promise: string }) {
  const featured = plans.find((plan) => plan.slug === 'pro')?.slug;
  return (
    <section id="tarife" className="scroll-mt-24 bg-white py-20 text-ink lg:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Tarife"
          title="Planbar. Fair. Ohne Provision."
          text="Ein fester Monatsbeitrag statt Gebühr pro Lead oder Prozent vom Auftrag. Dein Tarif kauft dir keine bessere Position – das Matching bleibt qualitätsbasiert."
        />
        {plans.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-card bg-cream p-8 text-center text-body">
            Die aktuellen Partner-Tarife werden gerade aktualisiert. Registriere dich kostenlos – wir informieren dich vor jeder
            Kostenpflicht. Alle Tarife mit Preisen findest du auf der{' '}
            <Link href="/preise#betriebe" className="font-semibold text-brand underline underline-offset-4">
              Preisseite
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isFeatured = plan.slug === featured;
              return (
                <li
                  key={plan.slug}
                  className={
                    isFeatured
                      ? 'relative flex flex-col gap-6 rounded-card bg-ink p-7 text-white'
                      : 'relative flex flex-col gap-6 rounded-card border border-hairline p-7'
                  }
                >
                  {isFeatured && (
                    <span className="absolute -top-3 left-7 rounded-pill bg-lime px-3 py-1 text-meta font-bold text-ink">Beliebteste Wahl</span>
                  )}
                  <div>
                    <h3 className="font-display text-xl font-bold">{plan.title}</h3>
                    <p className="mt-3 font-display text-5xl font-bold tracking-tight">
                      {euro.format(plan.monthly_amount / 100)}
                      <span className={isFeatured ? 'text-base font-semibold text-white/70' : 'text-base font-semibold text-body'}> / Monat</span>
                    </p>
                    {plan.trial_days > 0 && (
                      <p className={isFeatured ? 'mt-1 text-sm font-semibold text-lime' : 'mt-1 text-sm font-semibold text-save'}>
                        {plan.trial_days} Tage kostenlos testen
                      </p>
                    )}
                  </div>
                  <ul className="flex flex-1 flex-col gap-3 text-sm">
                    {[
                      plan.monthly_lead_limit === null ? 'Unbegrenzt neue Anfragen' : `Bis zu ${plan.monthly_lead_limit} neue Anfragen / Monat`,
                      promise,
                      'Profil & Bewertungen',
                      'Partner-App für dein Team',
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className={isFeatured ? 'mt-0.5 size-4 shrink-0 text-lime' : 'mt-0.5 size-4 shrink-0 text-save'} strokeWidth={3} aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    href={plan.monthly_amount === 0 ? '/register?role=provider' : `/register?role=provider&plan=${plan.slug}`}
                    variant={isFeatured ? 'lime' : 'outline'}
                    className="w-full"
                  >
                    {plan.monthly_amount === 0 ? 'Kostenlos starten' : `${plan.title} testen`}
                  </ButtonLink>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-center text-sm text-body">
          Alle Preise zzgl. MwSt. Die Anfragegrenze ist keine Zusage über tatsächlich eingehende Aufträge.{' '}
          <Link href="/preise#betriebe" className="font-semibold text-brand underline underline-offset-4">
            Alle Preise im Überblick
          </Link>
        </p>
      </Container>
    </section>
  );
}

export function ProFaq({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <section id="faq" className="scroll-mt-24 bg-cream py-20 text-ink lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="FAQ" title="Was Betriebe uns am häufigsten fragen." />
        <SiteFaq items={items} />
      </Container>
    </section>
  );
}

export function ProFinalCta() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className={cn('flex flex-col items-center gap-6 bg-lime px-6 py-16 text-center text-ink sm:px-12 lg:py-20', houseEdgeClass)}>
          <h2 className="max-w-3xl font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Weniger akquirieren. Mehr arbeiten.
          </h2>
          <p className="max-w-xl text-lg text-ink/80">Starte kostenlos im Free-Tarif. Die aktive Vermittlung beginnt nach deiner Prüfung.</p>
          <ButtonLink href="/register?role=provider" variant="ink" size="lg" arrow>
            Jetzt Partner werden
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
