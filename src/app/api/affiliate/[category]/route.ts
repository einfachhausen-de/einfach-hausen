import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  buildAffiliateTarget, isAffiliateCategory, isAffiliateSource, isValidClickRef,
} from '@/lib/affiliate';

// The comparison entry is a deliberate user action, never a prefetch: the
// decision has to be re-evaluated on the server for every single request.
export const dynamic = 'force-dynamic';

const COMPARISON_TAB = '/app/contracts#vergleiche';

/**
 * Sends the browser back into the app instead of to an external page. Used for
 * every state that must not leave the app: missing partner, disabled partner,
 * invalid configuration, missing consent.
 */
function backToComparison(req: NextRequest, category: string, notice: string) {
  const url = new URL(COMPARISON_TAB, req.nextUrl.origin);
  url.searchParams.set('vergleich', category);
  url.searchParams.set('hinweis', notice);
  return NextResponse.redirect(url, { status: 303 });
}

/**
 * Data-minimal click measurement: category, partner, timestamp, fixed source
 * and a random reference. No user, house, contract, job or document id, no
 * e-mail, phone, postcode or amount. A failing measurement must never block an
 * otherwise approved redirect, so failures are swallowed on purpose.
 */
function recordClick(category: string, partnerId: string, source: string, clickRef: string) {
  try {
    db.prepare(
      `INSERT INTO affiliate_clicks (category, partner_id, source, click_ref) VALUES (?,?,?,?)
       ON CONFLICT(partner_id, click_ref) DO NOTHING`,
    ).run(category, partnerId, source, clickRef);
  } catch {
    // Measurement is best effort. Security and configuration errors are handled
    // above and are never bypassed by a fallback.
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  if (user.role !== 'homeowner') return new NextResponse('Forbidden', { status: 403 });

  const { category } = await params;
  // The client may only name an allowed category, never a target URL.
  if (!isAffiliateCategory(category)) return new NextResponse('Unknown category', { status: 400 });

  const rawSource = req.nextUrl.searchParams.get('source');
  const source = isAffiliateSource(rawSource) ? rawSource : 'vergleichsuebersicht';
  const consent = req.nextUrl.searchParams.get('consent') === '1';
  const rawRef = req.nextUrl.searchParams.get('ref');
  // A reference is only ever accepted in the strict random shape. Anything else
  // is dropped instead of being forwarded to a partner.
  const clickRef = isValidClickRef(rawRef) ? rawRef : null;

  const target = buildAffiliateTarget(category, { consent, clickRef });
  if (!target.ok) {
    if (target.reason === 'unknown-category') return new NextResponse('Unknown category', { status: 400 });
    if (target.reason === 'invalid-configuration') return backToComparison(req, category, 'fehler');
    if (target.reason === 'consent-required') return backToComparison(req, category, 'einwilligung');
    return backToComparison(req, category, 'nicht-verfuegbar');
  }

  if (target.tracked && clickRef) recordClick(category, target.partnerId, source, clickRef);

  // No internal path, query string or contract id may reach the partner, and no
  // partner resource of any kind is loaded before this deliberate step.
  return NextResponse.redirect(target.href, {
    status: 303,
    headers: {
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
    },
  });
}
