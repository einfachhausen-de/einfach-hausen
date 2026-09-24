import { Handshake, HandCoins, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { Container, SectionHeading } from '@/design-system/site';

const PROMISES = [
  {
    icon: ShieldCheck,
    title: 'Nichts passiert ohne dich',
    text: 'Kein Tarifwechsel, kein Auftrag, keine Weitergabe deiner Daten ohne deine ausdrückliche Freigabe.',
  },
  {
    icon: HandCoins,
    title: 'Kostenlos für Eigentümer',
    text: 'Hauskonto, Tarifvergleich, Handwerkersuche und Hausakte kosten dich nichts. Keine Provision auf deinen Auftrag.',
  },
  {
    icon: UserRound,
    title: 'Ein echter Mensch als Ansprechpartner',
    text: 'Nach der Buchung hast du einen konkreten Kontakt mit Name und Nummer – kein Callcenter, kein Ticketsystem.',
  },
  {
    icon: Handshake,
    title: 'Nur geprüfte Betriebe',
    text: 'Gewerbe, Qualifikation, Versicherung und Referenzen werden geprüft, bevor ein Betrieb dir ein Angebot machen darf.',
  },
  {
    icon: LockKeyhole,
    title: 'Deine Daten bleiben deine',
    text: 'Gehostet in der EU. Kein Lead-Handel, kein Verkauf an Dritte. Löschen kannst du jederzeit selbst.',
  },
] as const;

export function Promises() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading
          eyebrow="Unser Versprechen"
          title="Du behältst die Kontrolle. Immer."
          text="Wir sind in der Pilotphase und zeigen dir hier keine erfundenen Bewertungen. Stattdessen das, worauf du dich verlassen kannst."
        />
        <ol className="flex flex-col">
          {PROMISES.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex gap-5 border-t border-hairline py-6 last:border-b">
              <span className="w-8 shrink-0 pt-1 font-display text-sm font-bold text-body">{String(index + 1).padStart(2, '0')}</span>
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime-soft text-save">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <strong className="font-display text-lg font-bold text-ink">{title}</strong>
                <span className="leading-relaxed text-body">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
