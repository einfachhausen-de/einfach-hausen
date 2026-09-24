import { Quote, Star } from 'lucide-react';
import { Container, SectionHeading } from '../ui';

// Platzhalter-Stimmen: vor dem Livegang durch echte, freigegebene Kundenstimmen ersetzen (UWG).
const TESTIMONIALS = [
  {
    quote: 'Ich hab zum ersten Mal seit Jahren meinen Stromtarif gewechselt. Hat drei Minuten gedauert und spart uns 380 € im Jahr.',
    name: 'Sandra M.',
    place: 'Eigentümerin, Reihenhaus',
    highlight: '380 € gespart',
  },
  {
    quote: 'Heizung ausgefallen, Freitagabend. Der Hausmanager hat mir sofort erklärt, was ich tun kann – und am Samstag kam der Techniker.',
    name: 'Michael R.',
    place: 'Eigentümer, Einfamilienhaus',
    highlight: 'Hilfe in 1 Tag',
  },
  {
    quote: 'Endlich weiß ich, wo die Garantie für die Wärmepumpe liegt. Und meinen Dachdecker hab ich jetzt fest gespeichert.',
    name: 'Aylin & Jan K.',
    place: 'Eigentümer, Neubau',
    highlight: 'Alles an einem Ort',
  },
] as const;

export function SocialProof() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="Stimmen aus der Pilotphase" title="Weniger Stress. Mehr Zuhause." />
          <div className="flex items-center gap-4 rounded-2xl bg-cream px-5 py-4">
            <span className="flex text-coral" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-5 fill-current" />
              ))}
            </span>
            <span className="text-sm">
              <strong className="block text-ink">Begeisterte Pilotkunden</strong>
              <span className="text-body">aus unserer Startregion</span>
            </span>
          </div>
        </div>

        <ul className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <li key={item.name} className="flex flex-col gap-6 rounded-[2rem] border border-hairline p-7">
              <div className="flex items-center justify-between">
                <Quote className="size-8 text-brand/20" aria-hidden="true" />
                <span className="rounded-full bg-lime-soft px-3 py-1 text-xs font-bold text-save">{item.highlight}</span>
              </div>
              <blockquote className="flex-1 text-lg leading-relaxed text-ink">„{item.quote}“</blockquote>
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden="true">
                  {item.name.charAt(0)}
                </span>
                <span className="text-sm">
                  <strong className="block text-ink">{item.name}</strong>
                  <span className="text-body">{item.place}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
