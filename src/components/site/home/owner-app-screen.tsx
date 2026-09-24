import Image from 'next/image';
import { Bell, CalendarClock, FileText, Home, MessageCircle, Sparkles, Wrench, Zap } from 'lucide-react';

const TASKS = [
  { title: 'Heizungswartung', meta: 'in 12 Tagen', dot: 'bg-coral' },
  { title: 'Rauchmelder prüfen', meta: 'November', dot: 'bg-lime-strong' },
  { title: 'Dachrinne reinigen', meta: 'vor dem Winter', dot: 'bg-brand' },
] as const;

const CONTACTS = [
  { src: '/images/site/avatar-heizung.png', name: 'Bauer Haustechnik' },
  { src: '/images/site/avatar-elektro.png', name: 'Elektro Kern' },
  { src: '/images/site/avatar-dach.png', name: 'Dach Weber' },
] as const;

export function OwnerAppScreen() {
  return (
    <div className="flex h-full flex-col text-ink" aria-hidden="true">
      <div className="flex items-center justify-between px-6 pb-2 pt-4 text-[11px] font-semibold">
        <span>9:41</span>
        <span className="flex gap-1">
          <span className="h-2 w-4 rounded-sm bg-ink" />
          <span className="h-2 w-2 rounded-full bg-ink" />
        </span>
      </div>

      <div className="flex items-center justify-between px-5 pt-3">
        <div>
          <p className="text-[11px] text-body">Guten Morgen</p>
          <p className="font-display text-lg font-bold leading-tight">Julia</p>
        </div>
        <span className="relative grid size-9 place-items-center rounded-full bg-white">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-coral" />
        </span>
      </div>

      <div className="mx-4 mt-4 rounded-3xl bg-brand-deep p-4 text-white">
        <div className="flex items-center gap-2 text-[11px] text-white/70">
          <Zap className="size-3.5 text-lime" />
          Sparpotenzial gefunden
        </div>
        <p className="mt-1 font-display text-3xl font-extrabold">
          412 €<span className="text-sm font-semibold text-white/60"> / Jahr</span>
        </p>
        <p className="text-[11px] text-white/60">Strom · Gas · Hausrat</p>
        <div className="mt-3 flex h-9 items-center justify-center rounded-full bg-lime text-xs font-bold text-ink">Mit 1 Klick wechseln</div>
      </div>

      <div className="mx-4 mt-3 rounded-3xl bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold">Steht an</p>
          <CalendarClock className="size-3.5 text-body" />
        </div>
        <ul className="flex flex-col gap-2.5">
          {TASKS.map((task) => (
            <li key={task.title} className="flex items-center gap-2.5 text-[11px]">
              <span className={`size-2 rounded-full ${task.dot}`} />
              <span className="flex-1 font-semibold">{task.title}</span>
              <span className="text-body">{task.meta}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-4 mt-3 rounded-3xl bg-white p-4">
        <p className="mb-2.5 text-xs font-bold">Deine Handwerker</p>
        <div className="flex items-center gap-2">
          {CONTACTS.map((contact) => (
            <Image
              key={contact.name}
              src={contact.src}
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-full object-cover ring-2 ring-white"
            />
          ))}
          <span className="grid size-9 place-items-center rounded-full bg-cream text-[11px] font-bold text-body">+4</span>
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center gap-2 rounded-full bg-white py-2 pl-3 pr-2 text-[11px] text-body">
        <Sparkles className="size-3.5 text-brand" />
        <span className="flex-1">Frag deinen Hausmanager …</span>
        <span className="grid size-7 place-items-center rounded-full bg-ink text-white">
          <MessageCircle className="size-3.5" />
        </span>
      </div>

      <nav className="mt-auto flex items-center justify-around border-t border-hairline bg-white px-4 pb-5 pt-3">
        {[Home, Zap, Wrench, FileText].map((Icon, index) => (
          <span key={index} className={index === 0 ? 'text-brand' : 'text-body/50'}>
            <Icon className="size-5" />
          </span>
        ))}
      </nav>
    </div>
  );
}
