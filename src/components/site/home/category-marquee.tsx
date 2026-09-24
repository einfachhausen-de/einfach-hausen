import {
  Car, Droplets, Flame, Hammer, HeartPulse, Home, Paintbrush, Plug, ShieldCheck, Smartphone, Snowflake, ThermometerSun, Trees, Wifi, Zap,
} from 'lucide-react';

const ITEMS = [
  { label: 'Strom', icon: Zap },
  { label: 'Gas', icon: Flame },
  { label: 'Internet & DSL', icon: Wifi },
  { label: 'Mobilfunk', icon: Smartphone },
  { label: 'Wohngebäudeversicherung', icon: ShieldCheck },
  { label: 'Hausrat', icon: Home },
  { label: 'Haftpflicht', icon: HeartPulse },
  { label: 'Heizung & Wärmepumpe', icon: ThermometerSun },
  { label: 'Sanitär', icon: Droplets },
  { label: 'Elektriker', icon: Plug },
  { label: 'Dach & Fenster', icon: Hammer },
  { label: 'Maler', icon: Paintbrush },
  { label: 'Garten', icon: Trees },
  { label: 'Winterdienst', icon: Snowflake },
  { label: 'Wallbox', icon: Car },
] as const;

export function CategoryMarquee() {
  return (
    <section aria-label="Alles, was du in der App regeln kannst" className="border-b border-hairline bg-white py-6">
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ul className="flex w-max gap-3 motion-safe:animate-marquee hover:[animation-play-state:paused]">
          {[...ITEMS, ...ITEMS].map(({ label, icon: Icon }, index) => (
            <li
              key={`${label}-${index}`}
              aria-hidden={index >= ITEMS.length}
              className="flex items-center gap-2 whitespace-nowrap rounded-full border border-hairline bg-cream/60 px-4 py-2 text-sm font-medium text-ink"
            >
              <Icon className="size-4 text-brand" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
