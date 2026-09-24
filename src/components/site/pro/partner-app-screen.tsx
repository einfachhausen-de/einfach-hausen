import { Calendar, Camera, Home, Inbox, MapPin, Receipt, Users } from 'lucide-react';

const REQUESTS = [
  { title: 'Heizungswartung', place: 'Musterweg 12 · 4,2 km', budget: '160–220 €', tag: 'Neu', highlight: true },
  { title: 'Thermostat tauschen', place: 'Lindenallee 3 · 2,8 km', budget: '90–140 €', tag: 'Stammkunde', highlight: false },
] as const;

export function PartnerAppScreen() {
  return (
    <div className="flex h-full flex-col text-ink" aria-hidden="true">
      <div className="flex items-center justify-between px-6 pb-2 pt-4 text-[11px] font-semibold">
        <span>7:30</span>
        <span className="flex gap-1">
          <span className="h-2 w-4 rounded-sm bg-ink" />
          <span className="h-2 w-2 rounded-full bg-ink" />
        </span>
      </div>

      <div className="px-5 pt-3">
        <p className="text-[11px] text-body">Bauer Haustechnik</p>
        <p className="font-display text-lg font-bold leading-tight">3 neue Anfragen</p>
      </div>

      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        {[
          ['12', 'Aufträge'],
          ['4,9', 'Bewertung'],
          ['38', 'Stammkunden'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-white p-2.5 text-center">
            <p className="font-display text-base font-extrabold">{value}</p>
            <p className="text-[10px] text-body">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-4">
        {REQUESTS.map((request) => (
          <div key={request.title} className={request.highlight ? 'rounded-3xl bg-white p-4 ring-2 ring-lime-strong' : 'rounded-3xl bg-white p-4'}>
            <div className="flex items-center justify-between">
              <span className={request.highlight ? 'rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold' : 'rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand'}>
                {request.tag}
              </span>
              <span className="text-[11px] font-bold text-save">{request.budget}</span>
            </div>
            <p className="mt-2 text-sm font-bold">{request.title}</p>
            <p className="flex items-center gap-1 text-[11px] text-body">
              <MapPin className="size-3" />
              {request.place}
            </p>
            {request.highlight && (
              <>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-body">
                  <Camera className="size-3" />3 Fotos · Baujahr 2011 · Gas-Brennwert
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <span className="flex h-8 items-center justify-center rounded-full bg-cream text-[11px] font-semibold">Ablehnen</span>
                  <span className="flex h-8 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">Annehmen</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mx-4 mt-2.5 flex items-center gap-3 rounded-3xl bg-white p-3">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
          <Calendar className="size-4" />
        </span>
        <span className="flex-1 text-[11px]">
          <strong className="block text-xs">Heute, 9:00</strong>
          Wartung · Familie Schneider
        </span>
      </div>

      <nav className="mt-auto flex items-center justify-around border-t border-hairline bg-white px-4 pb-5 pt-3">
        {[Home, Inbox, Calendar, Users, Receipt].map((Icon, index) => (
          <span key={index} className={index === 1 ? 'text-brand' : 'text-body/50'}>
            <Icon className="size-5" />
          </span>
        ))}
      </nav>
    </div>
  );
}
