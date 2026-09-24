import {
  Car, Droplets, Flame, Hammer, HeartPulse, Home, Paintbrush, Plug, ShieldCheck, Smartphone, ThermometerSun, Trees, Wifi, Zap,
} from 'lucide-react';
import { Container } from '@/design-system/site';

const GROUPS = [
  {
    title: 'Tarife & Verträge',
    items: [
      { label: 'Strom', icon: Zap },
      { label: 'Gas', icon: Flame },
      { label: 'Internet & DSL', icon: Wifi },
      { label: 'Mobilfunk', icon: Smartphone },
      { label: 'Wohngebäude', icon: ShieldCheck },
      { label: 'Hausrat', icon: Home },
      { label: 'Haftpflicht', icon: HeartPulse },
    ],
  },
  {
    title: 'Handwerker & Service',
    items: [
      { label: 'Heizung & Wärmepumpe', icon: ThermometerSun },
      { label: 'Sanitär', icon: Droplets },
      { label: 'Elektro', icon: Plug },
      { label: 'Dach & Fenster', icon: Hammer },
      { label: 'Maler', icon: Paintbrush },
      { label: 'Garten', icon: Trees },
      { label: 'Wallbox', icon: Car },
    ],
  },
] as const;

export function CategoryStrip() {
  return (
    <section aria-labelledby="category-strip-title" className="border-b border-hairline bg-white py-8">
      <Container className="flex flex-col gap-5">
        <h2 id="category-strip-title" className="text-sm font-semibold text-body">
          Alles, was du in der App regelst – an einem Ort:
        </h2>
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
          {GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2.5">
              <p className="text-meta font-semibold uppercase tracking-wider text-brand">{group.title}</p>
              <ul className="flex flex-wrap gap-2">
                {group.items.map(({ label, icon: Icon }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 rounded-pill border border-hairline bg-cream px-3.5 py-1.5 text-sm font-medium text-ink"
                  >
                    <Icon className="size-4 text-brand" aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
