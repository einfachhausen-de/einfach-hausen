"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-Navigation fuer plain `<a>`-Zeilen aus den versiegelten
 * EH-Komponenten (EHList, EHRecordList, EHWorkSection-Links, EHButton-href
 * …): Das Designpaket ist bewusst routerlos (gleiches Markup fuer Web und
 * natives HTML/CRM), deshalb wuerde jeder Klick auf solche Zeilen das
 * Dokument neu laden. Dieser Horcher faengt gleichartige In-App-Klicks ab
 * und navigiert clientseitig — ohne versiegelte Dateien anzufassen.
 * Next-Links, neue Tabs, Downloads, Modifier-Tasten und Anker bleiben
 * unberuehrt (Link-behandelte Klicks sind bereits defaultPrevented).
 */
export function ClientNav() {
  const router = useRouter();
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      if (anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return;
      event.preventDefault();
      router.push(href);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [router]);
  return null;
}
