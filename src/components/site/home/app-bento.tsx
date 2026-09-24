import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BellRing, FileText, Heart, Phone, Siren, Sparkles, Star, Zap } from 'lucide-react';
import { Container, SectionHeading } from '@/design-system/site';
import { cn } from '@/design-system/site';

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-card border border-hairline bg-white p-7 sm:p-8', className)}>
      {children}
    </article>
  );
}

function CardTitle({ icon: Icon, kicker, title, text, dark }: { icon: typeof Zap; kicker: string; title: string; text: string; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={cn('flex items-center gap-2 text-sm font-semibold', dark ? 'text-lime' : 'text-brand')}>
        <Icon className="size-4" aria-hidden="true" />
        {kicker}
      </p>
      <h3 className={cn('font-display text-2xl font-bold leading-tight tracking-tight', dark ? 'text-white' : 'text-ink')}>{title}</h3>
      <p className={cn('leading-relaxed', dark ? 'text-white/70' : 'text-body')}>{text}</p>
    </div>
  );
}

export function AppBento() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Eine App statt zehn"
          title="Alles, was dein Haus braucht. Endlich an einem Ort."
          text="Schluss mit Vergleichsportal hier, Handwerkerportal da und Aktenordner im Keller. Einfach Hausen bündelt alles – und denkt für dich mit."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <CardTitle
                icon={Zap}
                kicker="Tarife & Verträge"
                title="Vergleichen, wechseln, sparen. Automatisch."
                text="Strom, Gas, Internet, Versicherungen: Wir behalten alle Verträge im Blick und schlagen Alarm, wenn es günstiger geht. Kündigung und Wechsel bereiten wir vor – du bestätigst mit einem Klick."
              />
              <div className="flex flex-col gap-2 rounded-3xl bg-cream p-4" aria-hidden="true">
                <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm">
                  <span className="text-body line-through">Grundversorgung</span>
                  <span className="font-semibold text-coral">1.482 €</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-2 ring-lime">
                  <span className="flex flex-col">
                    <span className="font-semibold">Regio Strom Flex</span>
                    <span className="text-meta text-body">12 Monate Preisgarantie</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-bold">1.070 €</span>
                    <span className="rounded-pill bg-lime px-2 text-meta font-bold">−412 €</span>
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm">
                  <span className="font-semibold">Stadtwerk Öko</span>
                  <span className="font-semibold">1.118 €</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-transparent bg-brand-deep">
            <CardTitle
              dark
              icon={Sparkles}
              kicker="KI-Hausmanager"
              title="Dein Hausmeister in der Hosentasche."
              text="Kennt dein Haus, beantwortet jede Frage und bereitet Dinge für dich vor – rund um die Uhr."
            />
            <div className="mt-6 flex flex-col gap-2 text-sm" aria-hidden="true">
              <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 text-white">Es tropft unter der Spüle.</p>
              <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-lime px-4 py-2.5 text-ink">
                Dreh zuerst das Eckventil zu. Soll ich Angebote von geprüften Betrieben einholen?
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle
              icon={Star}
              kicker="Handwerker"
              title="Geprüfte Profis. Direkt in deiner Nähe."
              text="Beschreib, was los ist. Geprüfte Betriebe machen dir Angebote – du vergleichst und entscheidest."
            />
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream p-3" aria-hidden="true">
              <Image src="/images/site/avatar-elektro.png" alt="" width={44} height={44} className="size-11 rounded-pill object-cover" />
              <span className="flex-1 text-sm">
                <strong className="block">Elektro Kern</strong>
                <span className="flex items-center gap-1 text-meta text-body">
                  <Star className="size-3 fill-coral text-coral" /> 4,9 · 2,3 km entfernt
                </span>
              </span>
              <span className="grid size-9 place-items-center rounded-pill bg-white text-coral">
                <Heart className="size-4 fill-coral" />
              </span>
            </div>
          </Card>

          <Card>
            <CardTitle
              icon={Phone}
              kicker="Deine Ansprechpartner"
              title="Einmal gefunden. Für immer gespeichert."
              text="Dein Heizungsbauer, deine Elektrikerin, dein Dachdecker – alle mit Nummer und Historie in deinem Handwerker-Adressbuch."
            />
            <div className="mt-6 flex -space-x-3" aria-hidden="true">
              {['/images/site/avatar-heizung.png', '/images/site/avatar-elektro.png', '/images/site/avatar-dach.png'].map((src) => (
                <Image key={src} src={src} alt="" width={48} height={48} className="size-12 rounded-pill object-cover ring-4 ring-white" />
              ))}
              <span className="grid size-12 place-items-center rounded-pill bg-brand-soft text-sm font-bold text-brand ring-4 ring-white">+4</span>
            </div>
          </Card>

          <Card>
            <CardTitle
              icon={FileText}
              kicker="Digitale Hausakte"
              title="Jede Rechnung. Jede Garantie. Sofort gefunden."
              text="Fotografiere Unterlagen ab – die KI sortiert, erkennt Garantien und Fristen und erinnert dich rechtzeitig."
            />
            <div className="mt-6 flex flex-col gap-2 text-sm" aria-hidden="true">
              {[
                ['Rechnung Wärmepumpe', 'Garantie bis 2031'],
                ['Wohngebäudeversicherung', 'Kündbar bis 30.11.'],
              ].map(([title, meta]) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-2.5">
                  <FileText className="size-4 text-brand" />
                  <span className="flex-1 font-medium">{title}</span>
                  <span className="text-meta text-body">{meta}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex items-center gap-5 rounded-card bg-lime-soft p-6 sm:p-8">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-lime text-ink">
              <BellRing className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold text-ink">Nie wieder was vergessen</h3>
              <p className="text-body">Wartungen, Fristen, Zählerstände: Die App erinnert dich, bevor es teuer wird.</p>
            </div>
          </div>
          <Link href="/notfall" className="group flex items-center gap-5 rounded-card bg-coral-soft p-6 transition-colors hover:bg-coral/15 sm:p-8">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-coral text-white">
              <Siren className="size-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-ink">Notfall? Sofort Hilfe.</h3>
              <p className="text-body">Rohrbruch, Heizungsausfall, Sturmschaden: Wir priorisieren deinen Fall.</p>
            </div>
            <ArrowRight className="size-5 text-ink transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
