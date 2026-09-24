import Image from 'next/image';
import {
  BadgeCheck, BellRing, Calendar, Check, ClipboardCheck, FileCheck2, Handshake, Heart, Plus, Receipt, Repeat, ShieldCheck, Sparkles,
  Star, Target, UserPlus, Users, X,
} from 'lucide-react';
import { ButtonLink, Container, SectionHeading } from '../ui';
import { PhoneFrame } from '../phone-frame';
import { PartnerAppScreen } from './partner-app-screen';

export function ProHero({ trialDays }: { trialDays: number }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_80%_30%,rgba(190,242,100,0.12),transparent_70%)]"
      />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="flex flex-col gap-7">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/85">
            <BadgeCheck className="size-4 text-lime" aria-hidden="true" />
            Für Handwerks- und Servicebetriebe
          </p>
          <h1 className="font-display text-balance text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Mehr Stammkunden.
            <br />
            <span className="text-lime">Null Provision.</span>
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/70 sm:text-xl">
            Einfach Hausen bringt dir passende Aufträge aus deiner Region – und Eigentümer speichern dich als festen Ansprechpartner.
            Keine Lead-Auktion. Kein Preiskampf. Kein Papierkram.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/register?role=provider" size="lg" arrow>
              Kostenlos Partner werden
            </ButtonLink>
            <ButtonLink href="#tarife" variant="outline-dark" size="lg">
              Tarife ansehen
            </ButtonLink>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-4">
            {[
              ['0 %', 'Provision auf Aufträge'],
              ['100 %', 'deines Umsatzes bleibt bei dir'],
              ['1', 'Betrieb pro Anfrage'],
              [`${trialDays} Tage`, 'kostenlos testen'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-3xl font-extrabold text-white">{value}</dd>
                <dd className="text-sm text-white/55">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative hidden h-[680px] items-center justify-center lg:flex">
          <div className="absolute inset-x-4 bottom-4 top-8 overflow-hidden rounded-[2.5rem]">
            <Image
              src="/images/site/pro-workshop.png"
              alt="Handwerksmeister mit Smartphone vor seinem Transporter"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 0px"
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
          </div>
          <PhoneFrame className="relative z-10 motion-safe:animate-float-slow">
            <PartnerAppScreen />
          </PhoneFrame>
          <div className="absolute -left-4 top-20 z-20 flex w-64 items-center gap-3 rounded-2xl bg-white p-3 text-ink shadow-2xl motion-safe:animate-float">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral-soft text-coral">
              <Heart className="size-5 fill-current" aria-hidden="true" />
            </span>
            <span className="text-xs leading-snug">
              <strong className="block text-sm">Neuer Stammkunde</strong>
              Familie Schneider hat dich als Ansprechpartner gespeichert
            </span>
          </div>
          <div className="absolute -right-2 bottom-24 z-20 flex w-56 items-center gap-3 rounded-2xl bg-lime p-3 text-ink shadow-2xl motion-safe:animate-float-slow">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-lime">
              <Repeat className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xs leading-snug">
              <strong className="block text-sm">Folgeauftrag</strong>
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
  'Fünf Betriebe bekommen dieselbe Anfrage',
  'Wer am billigsten ist, gewinnt – nicht wer am besten ist',
  'Nach dem Auftrag ist der Kunde wieder weg',
] as const;

const NEW_WAY = [
  'Fester Monatsbeitrag, 0 % Provision – egal wie groß der Auftrag',
  'Eine Anfrage geht an genau einen passenden Betrieb',
  'Matching nach Qualität, Nähe, Fachgebiet und Verfügbarkeit',
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
          text="Klassische Portale verkaufen dieselbe Anfrage an mehrere Betriebe. Wir verbinden dich mit Eigentümern, die zu dir passen – und bei dir bleiben."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-cream p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-body">Klassische Lead-Portale</p>
            <ul className="mt-6 flex flex-col gap-4">
              {OLD_WAY.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-coral-soft text-coral" aria-hidden="true">
                    <X className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed text-body">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] bg-brand-deep p-8 text-white sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-lime">Einfach Hausen</p>
            <ul className="mt-6 flex flex-col gap-4">
              {NEW_WAY.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-ink" aria-hidden="true">
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

const BENEFITS = [
  { icon: Target, title: 'Nur passende Anfragen', text: 'Region, Gewerk, Qualifikation und Kapazität müssen passen – sonst kommt die Anfrage gar nicht erst bei dir an.' },
  { icon: Sparkles, title: 'Vorsortiert von der KI', text: 'Fotos, Baujahr, Anlage, Kostenrahmen: Du weißt vor dem Anruf, worum es geht. Weniger Rückfragen, weniger Leerfahrten.' },
  { icon: Heart, title: 'Der Stammkunden-Effekt', text: 'Zufriedene Kunden speichern dich in ihrer App. Wartung, Reparatur, nächstes Projekt – die Anfrage landet direkt bei dir.' },
  { icon: Receipt, title: 'Du bleibst Rechnungssteller', text: 'Preis, Vertrag und Rechnung laufen direkt zwischen dir und dem Kunden. Wir verdienen nichts an deinem Auftrag.' },
  { icon: Star, title: 'Reputation, die bleibt', text: 'Echte Bewertungen von echten Aufträgen – und dein Profil zeigt, wer hinter dem Betrieb steht.' },
  { icon: Users, title: 'Für dein ganzes Team', text: 'Mitarbeitende bekommen eigenen Zugang, du steuerst mit einem Schalter, wer neue Anfragen annehmen darf.' },
] as const;

export function ProBenefits() {
  return (
    <section id="vorteile" className="scroll-mt-24 bg-white pb-20 text-ink lg:pb-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading eyebrow="Deine Vorteile" title="Gemacht für Betriebe, die lieber arbeiten als akquirieren." />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-4 rounded-[2rem] border border-hairline p-7">
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
            <li key={title} className="relative flex flex-col gap-4 rounded-[2rem] bg-white p-7">
              <span className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-ink text-lime">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="font-display text-4xl font-extrabold text-hairline">0{index + 1}</span>
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

export function ProAppFeature() {
  return (
    <section id="partner-app" className="scroll-mt-24 py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <SectionHeading
            tone="dark"
            eyebrow="Die Partner-App"
            title="Dein Büro in der Hosentasche. Ohne Mini-ERP-Wahnsinn."
            text="Anfragen, Termine, Team, Dokumentation und Rechnung – alles, was du für den nächsten Schritt brauchst. Und nichts, was dich aufhält."
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: ClipboardCheck, title: 'Anfragen mit einem Tipp annehmen' },
              { icon: Calendar, title: 'Termine direkt mit dem Kunden abstimmen' },
              { icon: FileCheck2, title: 'Fotos & Protokolle am Auftrag' },
              { icon: Receipt, title: 'Rechnung schreiben & ablegen' },
            ].map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <Icon className="size-5 shrink-0 text-lime" aria-hidden="true" />
                <span className="text-sm font-medium">{title}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <PhoneFrame>
            <PartnerAppScreen />
          </PhoneFrame>
        </div>
      </Container>
    </section>
  );
}

type Plan = { slug: string; title: string; monthly_amount: number; monthly_lead_limit: number | null; trial_days: number };

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function ProPricing({ plans }: { plans: Plan[] }) {
  const featured = plans.find((plan) => plan.slug === 'pro')?.slug;
  return (
    <section id="tarife" className="scroll-mt-24 bg-white py-20 text-ink lg:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Tarife"
          title="Planbar. Fair. Ohne Provision."
          text="Ein fester Monatsbeitrag statt Gebühr pro Lead oder Prozent vom Auftrag. Dein Tarif kauft dir übrigens keine bessere Position – das Matching bleibt qualitätsbasiert."
        />
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isFeatured = plan.slug === featured;
            return (
              <li
                key={plan.slug}
                className={
                  isFeatured
                    ? 'relative flex flex-col gap-6 rounded-[2rem] bg-ink p-7 text-white'
                    : 'relative flex flex-col gap-6 rounded-[2rem] border border-hairline p-7'
                }
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">Beliebteste Wahl</span>
                )}
                <div>
                  <h3 className="font-display text-xl font-bold">{plan.title}</h3>
                  <p className="mt-3 font-display text-5xl font-extrabold tracking-tight">
                    {euro.format(plan.monthly_amount / 100)}
                    <span className={isFeatured ? 'text-base font-semibold text-white/60' : 'text-base font-semibold text-body'}> / Monat</span>
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
                    '0 % Provision auf Aufträge',
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
        <p className="text-center text-sm text-body">
          Alle Preise zzgl. MwSt. Die Anfragegrenze ist keine Zusage über tatsächlich eingehende Aufträge.
        </p>
      </Container>
    </section>
  );
}

const PRO_FAQ = [
  { q: 'Muss ich pro Auftrag etwas abgeben?', a: 'Nein. Du zahlst ausschließlich deinen Monatstarif – im Free-Tarif gar nichts. Auf den Auftragswert erheben wir 0 % Provision, du bleibst Rechnungssteller.' },
  { q: 'Wie werden Anfragen verteilt?', a: 'Nach Eignung: Entfernung, Fachgebiet, Qualifikation, Verfügbarkeit, Kapazität, Kundenzufriedenheit und bestehende Kundenbeziehungen. Ein höherer Tarif kauft keine bessere Position.' },
  { q: 'Was wird bei der Prüfung verlangt?', a: 'Gewerbenachweis, erforderliche Qualifikationen und Zulassungen, Betriebshaftpflicht und Referenzen bzw. vorhandene Bewertungen – plus ein aktiver Partnervertrag.' },
  { q: 'Kann ich Anfragen ablehnen?', a: 'Jederzeit. Du entscheidest, welche Aufträge du annimmst, und kannst deine Kapazität in der App anpassen.' },
  { q: 'Kann ich jederzeit kündigen?', a: 'Ja. Die bezahlten Tarife sind monatlich planbar und starten mit einer kostenlosen Testphase.' },
] as const;

export function ProFaq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-cream py-20 text-ink lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="FAQ" title="Was Betriebe uns am häufigsten fragen." />
        <div className="flex flex-col gap-3">
          {PRO_FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl bg-white p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream transition-transform group-open:rotate-45">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-body">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function ProFinalCta() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-lime px-6 py-16 text-center text-ink sm:px-12 lg:py-20">
          <h2 className="max-w-3xl font-display text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Weniger akquirieren. Mehr arbeiten.
          </h2>
          <p className="max-w-xl text-lg text-ink/75">
            Starte kostenlos im Free-Tarif. Die aktive Vermittlung beginnt nach deiner Prüfung.
          </p>
          <ButtonLink href="/register?role=provider" variant="ink" size="lg" arrow>
            Jetzt Partner werden
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
