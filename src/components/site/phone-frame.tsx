import { cn } from './cn';

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative w-[300px] rounded-[2.9rem] bg-ink p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55),inset_0_0_0_1.5px_rgba(255,255,255,0.12)]',
        className,
      )}
    >
      <div className="relative h-[620px] overflow-hidden rounded-[2.4rem] bg-cream">
        <div className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
