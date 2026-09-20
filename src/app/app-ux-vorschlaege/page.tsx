import fs from 'node:fs';
import path from 'node:path';
import { EHScope } from '@/design-system';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-auth';
import { IsolatedHtml } from './isolated-html';

export const metadata: Metadata = {
  title: 'App Desktop — Ist und Vorschlag',
  robots: { index: false, follow: false },
};

/** Interne Desktop-Vorschau. Die HTML-Datei trägt den Werkbank-Chrome selbst. Serverseitig nur für Admins (T-0168); robots noindex bleibt. */
export default async function AppUxVorschlaegePage() {
  await requireAdmin();
  const raw = fs.readFileSync(path.join(process.cwd(), 'public/app-ux-vorschlaege/index.html'), 'utf8');
  const style = raw.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  const body = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? '';
  return (
    <EHScope>
      <IsolatedHtml style={style} body={body} />
    </EHScope>
  );
}
