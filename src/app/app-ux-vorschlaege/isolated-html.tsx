'use client';

import { useEffect, useRef } from 'react';

/** Hält die Werkbank-Vorschau von den App-Stilen getrennt. */
export function IsolatedHtml({ style, body }: { style: string; body: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const shadow = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>:host{display:block}${style.replaceAll(':root', ':host')}</style>${body}`;
  }, [style, body]);

  return <div ref={host} />;
}
