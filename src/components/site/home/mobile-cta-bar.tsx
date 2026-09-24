'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/design-system/site';

export function MobileCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 transition-transform duration-300 lg:hidden',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
      aria-hidden={!visible}
    >
      <Link
        href="/register?role=homeowner"
        tabIndex={visible ? 0 : -1}
        className="flex h-12 items-center justify-center gap-2 rounded-pill bg-lime font-bold text-ink"
      >
        Kostenlos starten – 0 € für immer
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
