import { Calendar, Camera, Home, Inbox, MapPin, Receipt } from 'lucide-react';
import { cn } from '@/design-system/site';

const NAV = [
  { icon: Home, label: 'Start' },
  { icon: Inbox, label: 'Anfragen' },
  { icon: Calendar, label: 'Termine' },
  { icon: Receipt, label: 'Rechnungen' },
] as const;

/** Illustrative Ansicht der Partner-App (aria-hidden, im PhoneFrame als Beispiel gekennzeichnet). */
export function PartnerAppScreen() {
  return (
    <div className="flex h-full flex-col text-ink" aria-hidden="true">
      <div className="flex items-center justify-between px-6 pb-1 pt-3.5 text-meta font-semibold">
        <span>7:30</span>
        <span className="flex gap-1">
          <span className="h-2 w-4 rounded-sm bg-ink" />
          <span className="size-2 rounded-pill bg-ink" />
        </span>
      </div>

      <div className="px-5 pt-4">
        <p className="text-meta text-body">Bauer Haustechnik</p>
        <p className="font-display text-lg font-bold leading-tight">2 neue Anfragen</p>
      </div>

      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        {[
          ['12', 'Aufträge im Monat'],
          ['38', 'Stammkunden'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-white p-3">
            <p className="font-display text-xl font-extrabold">{value}</p>
            <p className="text-meta text-body">{label}</p>
          </div>
        ))}
      </div>

      <div className="mx-4 mt-3 rounded-3xl bg-white p-4 ring-2 ring-lime-strong">
        <div className="flex items-center justify-between">
          <span className="rounded-pill bg-lime px-2 py-0.5 text-meta font-bold">Neu</span>
          <span className="flex items-center gap-1 text-meta text-body">
            <MapPin className="size-3.5" />
            4,2 km
          </span>
        </div>
        <p className="mt-2 text-base font-bold">Heizungswartung</p>
        <p className="flex items-center gap-1.5 text-meta text-body">
          <Camera className="size-3.5" />3 Fotos · Gas-Brennwert, 2011
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="flex h-9 items-center justify-center rounded-pill bg-cream text-meta font-semibold">Ablehnen</span>
          <span className="flex h-9 items-center justify-center rounded-pill bg-ink text-meta font-bold text-white">Annehmen</span>
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center gap-3 rounded-3xl bg-white p-3.5">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
          <Calendar className="size-4" />
        </span>
        <span className="flex-1 text-meta leading-snug">
          <strong className="block text-sm">Heute, 9:00</strong>
          Wartung · Familie Schneider
        </span>
        <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-meta font-semibold text-brand">Stammkunde</span>
      </div>

      <nav className="mt-auto grid grid-cols-4 border-t border-hairline bg-white px-2 pb-5 pt-2.5">
        {NAV.map(({ icon: Icon, label }, index) => (
          <span key={label} className={cn('flex flex-col items-center gap-0.5 text-meta', index === 1 ? 'font-semibold text-brand' : 'text-body')}>
            <Icon className="size-5" />
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}
