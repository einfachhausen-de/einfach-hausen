'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EHActions } from '@/design-system';
import styles from '@/app/app/eigentuemer-start.module.css';

/**
 * CompareRail - die Vergleichs-Chips bleiben in einer einzigen Zeile und
 * wandern seitlich, statt umzubrechen: bedient wird die Reihe mit denselben
 * runden Pfeilknöpfen wie der Vorschlags-Slider.
 *
 * Die Chips selbst kommen fertig gerendert aus der Seite (children), hier
 * liegt nur das Verschieben. Die Pfeile erscheinen ausschliesslich dann,
 * wenn die Reihe breiter ist als ihr Platz - sonst wären sie Attrappen.
 * Am Anfang bzw. Ende ist der jeweilige Pfeil abgeschaltet.
 */
export function CompareRail({ children, label }: { children: ReactNode; label: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ overflow: false, left: false, right: false });

  const sync = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdge({
      overflow: el.scrollWidth > el.clientWidth + 1,
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    sync();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  const move = (direction: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(260, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <div className={styles.rail}>
      <div className={styles.railScroll} ref={scroller}>
        {children}
      </div>
      {edge.overflow && (
        <EHActions>
          <div className={styles.railControls}>
            <button
              type="button"
              className={styles.suggestNav}
              aria-label={`${label}: vorherige`}
              disabled={!edge.left}
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.suggestNav}
              aria-label={`${label}: weitere`}
              disabled={!edge.right}
              onClick={() => move(1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </EHActions>
      )}
    </div>
  );
}
