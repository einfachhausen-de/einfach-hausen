import { displayFont } from './fonts';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { cn } from './cn';

export function SiteShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(displayFont.variable, 'min-h-screen bg-white font-sans text-ink antialiased', className)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Zum Inhalt springen
      </a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
