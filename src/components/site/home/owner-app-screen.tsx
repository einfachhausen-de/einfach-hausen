import Image from 'next/image';
import { Bell, CalendarClock, FileText, Home, Sparkles, Wrench, Zap } from 'lucide-react';
import { cn } from '@/design-system/site';

const TASKS = [
  { title: 'Heizungswartung', meta: 'in 12 Tagen', dot: 'bg-coral' },
  { title: 'Rauchmelder prüfen', meta: 'November', dot: 'bg-lime-strong' },
] as const;

const CONTACTS = ['/images/site/avatar-heizung.png', '/images/site/avatar-elektro.png', '/images/site/avatar-dach.png'] as const;

const NAV = [
  { icon: Home, label: 'Start' },
  { icon: Zap, label: 'Tarife' },
  { icon: Wrench, label: 'Handwerker' },
  { icon: FileText, label: 'Hausakte' },
] as const;

/** Illustrative Startansicht der Eigentümer-App (aria-hidden, im PhoneFrame als Beispiel gekennzeichnet). */
export function OwnerAppScreen() {
  return (
    <div className="flex h-full flex-col text-ink" aria-hidden="true">
      <div className="flex items-center justify-between px-6 pb-1 pt-3.5 text-meta font-semibold">
        <span>9:41</span>
        <span className="flex gap-1">
          <span className="h-2 w-4 rounded-sm bg-ink" />
          <span className="size-2 rounded-pill bg-ink" />
        </span>
      </div>

      <div className="flex items-center justify-between px-5 pt-4">
        <div>
          <p className="text-meta text-body">Guten Morgen, Julia</p>
          <p className="font-display text-lg font-bold leading-tight">Lindenweg 7</p>
        </div>
        <span className="relative grid size-9 place-items-center rounded-pill bg-white">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-pill bg-coral" />
        </span>
      </div>

      <div className="mx-4 mt-4 rounded-3xl bg-brand-deep p-4 text-white">
        <p className="flex items-center gap-1.5 text-meta text-white/75">
          <Zap className="size-3.5 text-lime" />
          Sparpotenzial gefunden
        </p>
        <p className="mt-1 font-display text-3xl font-extrabold">
          412 €<span className="text-sm font-semibold text-white/70"> / Jahr</span>
        </p>
        <div className="mt-3 flex h-9 items-center justify-center rounded-pill bg-lime text-meta font-bold text-ink">Tarife ansehen</div>
      </div>

      <div className="mx-4 mt-3 rounded-3xl bg-white p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-sm font-bold">Steht an</p>
          <CalendarClock className="size-4 text-body" />
        </div>
        <ul className="flex flex-col gap-2.5">
          {TASKS.map((task) => (
            <li key={task.title} className="flex items-center gap-2.5 text-meta">
              <span className={cn('size-2 shrink-0 rounded-pill', task.dot)} />
              <span className="flex-1 font-semibold">{task.title}</span>
              <span className="text-body">{task.meta}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-4 mt-3 flex items-center justify-between rounded-3xl bg-white p-4">
        <p className="text-sm font-bold">Meine Handwerker</p>
        <div className="flex -space-x-2">
          {CONTACTS.map((src) => (
            <Image key={src} src={src} alt="" width={32} height={32} className="size-8 rounded-pill object-cover ring-2 ring-white" />
          ))}
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center gap-2 rounded-pill bg-white py-2.5 pl-4 pr-2 text-meta text-body">
        <Sparkles className="size-4 text-brand" />
        <span className="flex-1">Frag deinen Hausmanager …</span>
      </div>

      <nav className="mt-auto grid grid-cols-4 border-t border-hairline bg-white px-2 pb-5 pt-2.5">
        {NAV.map(({ icon: Icon, label }, index) => (
          <span key={label} className={cn('flex flex-col items-center gap-0.5 text-meta', index === 0 ? 'font-semibold text-brand' : 'text-body')}>
            <Icon className="size-5" />
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}
