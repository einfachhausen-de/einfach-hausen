// Affiliate comparison routing for the contracts area.
//
// This module is the single source of truth for comparison partners. UI pages
// never carry their own partner URL: they ask for a category and receive either
// an internal entry href (our own redirect endpoint) or an honest
// "not available" state.
//
// Fail-closed by design: AFFILIATE_PARTNERS is empty until a partner is
// contractually approved and documented. A missing or disabled partner never
// produces an invented link and never a free redirect.
//
// No personal data leaves the app through this module: the outgoing URL is
// built exclusively from the reviewed server-side configuration plus an
// optional random click reference. User, house, contract, job and document
// data, e-mail addresses, phone numbers, postcodes and contract amounts are
// never part of a target URL, sub-id, event or click log.

export const AFFILIATE_CATEGORIES = ['strom', 'gas', 'dsl', 'mobilfunk', 'versicherung'] as const;
export type AffiliateCategory = (typeof AFFILIATE_CATEGORIES)[number];

export function isAffiliateCategory(value: string | null | undefined): value is AffiliateCategory {
  return typeof value === 'string' && (AFFILIATE_CATEGORIES as readonly string[]).includes(value);
}

/** Visible names of the five comparison categories. */
export const AFFILIATE_CATEGORY_LABELS: Record<AffiliateCategory, string> = {
  strom: 'Strom',
  gas: 'Gas',
  dsl: 'Internet & Festnetz',
  mobilfunk: 'Mobilfunk',
  versicherung: 'Versicherungen',
};

/** Exactly one primary comparison action per category. */
export const AFFILIATE_CATEGORY_ACTIONS: Record<AffiliateCategory, string> = {
  strom: 'Stromtarife vergleichen',
  gas: 'Gastarife vergleichen',
  dsl: 'Internettarife vergleichen',
  mobilfunk: 'Mobilfunktarife vergleichen',
  versicherung: 'Versicherungen vergleichen',
};

/** Short explanation shown next to each category in the overview. */
export const AFFILIATE_CATEGORY_HINTS: Record<AffiliateCategory, string> = {
  strom: 'Stromtarif beim Partner vergleichen und dort abschließen.',
  gas: 'Gastarif beim Partner vergleichen und dort abschließen.',
  dsl: 'DSL, Kabel oder Glasfaser im Umfang des angebundenen Partners.',
  mobilfunk: 'Mobilfunktarife vergleichen – Festnetz bleibt unter Internet.',
  versicherung: 'Tarifvergleich beim Partner. Ansprechpartner und Schadenfall laufen getrennt.',
};

/**
 * Where a comparison was started. Deliberately a fixed, small set: the value
 * ends up in the click measurement and must never be a free-form string.
 */
export const AFFILIATE_SOURCES = ['vergleichsuebersicht', 'sparcheck', 'vertragskontext'] as const;
export type AffiliateSource = (typeof AFFILIATE_SOURCES)[number];

export function isAffiliateSource(value: string | null | undefined): value is AffiliateSource {
  return typeof value === 'string' && (AFFILIATE_SOURCES as readonly string[]).includes(value);
}

export type AffiliateTrackingMode = 'none' | 'click';

export type AffiliatePartner = {
  /** Stable internal id. Never rendered as a link and never user-derived. */
  readonly id: string;
  /** Public partner name, as approved for display. */
  readonly name: string;
  readonly categories: readonly AffiliateCategory[];
  /** Only an enabled partner with a documented approval is ever linked. */
  readonly enabled: boolean;
  /** Reference to the documented business approval (contract/ticket/date). */
  readonly approvalRef: string;
  /** Absolute HTTPS target. The only place an external address is defined. */
  readonly targetUrl: string;
  /** Exact hostnames; compared against the parsed host, never as a substring. */
  readonly allowedHosts: readonly string[];
  /** Allowed path prefixes on that host. */
  readonly allowedPathPrefixes: readonly string[];
  /** Fixed, approved publisher parameters. */
  readonly publisherParams: Readonly<Record<string, string>>;
  /** Documented sub-id parameter, required as soon as tracking is enabled. */
  readonly subIdParam?: string;
  readonly trackingMode: AffiliateTrackingMode;
  /**
   * Whether an explicitly approved untracked route exists. Without it a
   * refused consent means "not available" instead of a silent tracked redirect.
   */
  readonly untrackedAllowed: boolean;
};

/**
 * Production partner configuration.
 *
 * Empty on purpose: real categories stay disabled until, per partner, the
 * business approval, publisher assignment, allowed placements, concrete target
 * URLs, transparency notices and the approved tracking/privacy mode are
 * documented. See docs/affiliate-partner-config.md.
 */
export const AFFILIATE_PARTNERS: readonly AffiliatePartner[] = [];

/** Text template from the issue; the placeholder is replaced by a real name. */
export const AFFILIATE_DISCLOSURE_TEMPLATE = 'Vergleich bei {partner}. Bei einem Abschluss können wir eine Vergütung erhalten.';

export function affiliateDisclosure(partnerName: string): string {
  return AFFILIATE_DISCLOSURE_TEMPLATE.replace('{partner}', partnerName);
}

/** How long click references are kept before deletion. See the ops doc. */
export const AFFILIATE_CLICK_RETENTION_DAYS = 90;

export type AffiliateAvailability =
  | {
      readonly status: 'available';
      readonly category: AffiliateCategory;
      readonly partnerId: string;
      readonly partnerName: string;
      readonly disclosure: string;
      /** Internal entry point without measurement. Never an external address. */
      readonly entryHref: string;
      /**
       * Internal entry point that additionally approves the measurement. Only
       * set when the approved mode measures the click.
       */
      readonly consentEntryHref: string | null;
      /** True when the approved mode measures the click and needs consent. */
      readonly needsConsent: boolean;
      /** True when an approved untracked route exists as a fallback. */
      readonly untrackedAllowed: boolean;
    }
  | {
      readonly status: 'unavailable';
      readonly category: AffiliateCategory;
      readonly reason: 'no-partner' | 'disabled' | 'no-approval';
    }
  | {
      /** Technical problem: broken configuration or an unknown category. */
      readonly status: 'error';
      readonly category: string;
      readonly reason: 'invalid-configuration' | 'unknown-category';
    };

const HOST_LABEL = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const PARAM_KEY = /^[a-z0-9_]{1,32}$/;
const PARAM_VALUE = /^[A-Za-z0-9._~-]{1,64}$/;
const CLICK_REF = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function normalizedHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, '');
}

/**
 * Structural check of a partner definition. Returns null when the partner may
 * be used, otherwise a coarse code. Details stay server-side.
 */
export function validateAffiliatePartner(partner: AffiliatePartner): 'invalid-configuration' | null {
  if (!partner.id || !partner.name || !partner.approvalRef) return 'invalid-configuration';
  if (partner.categories.length === 0) return 'invalid-configuration';
  if (partner.categories.some((category) => !isAffiliateCategory(category))) return 'invalid-configuration';
  if (partner.allowedHosts.length === 0 || partner.allowedPathPrefixes.length === 0) return 'invalid-configuration';

  for (const host of partner.allowedHosts) {
    if (!HOST_LABEL.test(normalizedHost(host))) return 'invalid-configuration';
  }
  for (const prefix of partner.allowedPathPrefixes) {
    if (!prefix.startsWith('/')) return 'invalid-configuration';
  }
  for (const [key, value] of Object.entries(partner.publisherParams)) {
    if (!PARAM_KEY.test(key) || !PARAM_VALUE.test(value)) return 'invalid-configuration';
  }
  if (partner.trackingMode === 'click') {
    if (!partner.subIdParam || !PARAM_KEY.test(partner.subIdParam)) return 'invalid-configuration';
    if (partner.subIdParam in partner.publisherParams) return 'invalid-configuration';
  }

  // HTTPS, no credentials, no unexpected port, exact host, allowed path.
  let url: URL;
  try {
    url = new URL(partner.targetUrl);
  } catch {
    return 'invalid-configuration';
  }
  if (url.protocol !== 'https:') return 'invalid-configuration';
  if (url.username || url.password) return 'invalid-configuration';
  if (url.port && url.port !== '443') return 'invalid-configuration';
  if (!partner.allowedHosts.some((host) => normalizedHost(host) === normalizedHost(url.hostname))) {
    return 'invalid-configuration';
  }
  if (!partner.allowedPathPrefixes.some((prefix) => pathMatches(url.pathname, prefix))) {
    return 'invalid-configuration';
  }
  return null;
}

function pathMatches(pathname: string, prefix: string): boolean {
  if (pathname === prefix) return true;
  const base = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return pathname.startsWith(base);
}

/** Only an approved, active click reference is forwarded as a sub-id. */
export function isValidClickRef(value: string | null | undefined): value is string {
  return typeof value === 'string' && CLICK_REF.test(value);
}

export function affiliateEntryHref(category: AffiliateCategory, source: AffiliateSource): string {
  return `/api/affiliate/${category}?source=${source}`;
}

export type AffiliateClickReference = {
  readonly ref: string;
  readonly tracked: boolean;
};

type ResolveOptions = {
  /** Test/ops injection. Defaults to the production configuration. */
  readonly partners?: readonly AffiliatePartner[];
  /** Explicit, per-action consent for the approved tracking mode. */
  readonly consent?: boolean;
  /** A validated random reference, or nothing. Never derived from user data. */
  readonly clickRef?: string | null;
};

function pickPartner(
  category: AffiliateCategory,
  partners: readonly AffiliatePartner[],
): { partner: AffiliatePartner } | { reason: 'no-partner' | 'disabled' | 'no-approval' | 'invalid-configuration' } {
  const candidates = partners.filter((entry) => entry.categories.includes(category));
  if (candidates.length === 0) return { reason: 'no-partner' };

  let sawDisabled = false;
  let sawUnapproved = false;
  for (const candidate of candidates) {
    if (!candidate.enabled) {
      sawDisabled = true;
      continue;
    }
    if (!candidate.approvalRef) {
      sawUnapproved = true;
      continue;
    }
    const problem = validateAffiliatePartner(candidate);
    if (problem) return { reason: 'invalid-configuration' };
    return { partner: candidate };
  }
  if (sawUnapproved) return { reason: 'no-approval' };
  if (sawDisabled) return { reason: 'disabled' };
  return { reason: 'no-partner' };
}

/**
 * Resolves the currently approved partner for a category.
 *
 * Called by the UI (to render an honest state) and again by the redirect
 * endpoint (to authorize the actual leaving). Enabling something in the browser
 * alone therefore never leads to an external redirect.
 */
export function resolveAffiliate(
  category: string | null | undefined,
  source: string | null | undefined,
  options: ResolveOptions = {},
): AffiliateAvailability {
  if (!isAffiliateCategory(category)) return { status: 'error', category: String(category ?? ''), reason: 'unknown-category' };
  const partners = options.partners ?? AFFILIATE_PARTNERS;
  const picked = pickPartner(category, partners);

  if ('reason' in picked) {
    if (picked.reason === 'invalid-configuration') {
      return { status: 'error', category, reason: 'invalid-configuration' };
    }
    return { status: 'unavailable', category, reason: picked.reason };
  }

  const partner = picked.partner;
  const tracking = partner.trackingMode === 'click';
  const sourceValue = isAffiliateSource(source) ? source : 'vergleichsuebersicht';
  const entryHref = affiliateEntryHref(category, sourceValue);

  // Ein freigegebener Partner bleibt verfügbar, auch wenn seine Route messt.
  // Sonst könnte die Oberfläche die Zustimmung nie anbieten. Ob ohne
  // Zustimmung überhaupt verlinkt werden darf, sagt untrackedAllowed; der
  // Endpunkt entscheidet das erneut und verbindlich.
  return {
    status: 'available',
    category,
    partnerId: partner.id,
    partnerName: partner.name,
    disclosure: affiliateDisclosure(partner.name),
    entryHref,
    consentEntryHref: tracking ? `${entryHref}&consent=1` : null,
    needsConsent: tracking,
    untrackedAllowed: partner.untrackedAllowed,
  };
}

export type AffiliateOutgoing =
  | { readonly ok: true; readonly href: string; readonly partnerId: string; readonly partnerName: string; readonly tracked: boolean }
  | { readonly ok: false; readonly reason: 'unavailable' | 'invalid-configuration' | 'unknown-category' | 'consent-required' };

/**
 * Builds the outgoing partner URL.
 *
 * The result is composed of the reviewed server-side configuration and nothing
 * else. An incoming query string is never copied over, and the optional click
 * reference is only appended when the approved mode measures it and consent was
 * given explicitly.
 */
export function buildAffiliateTarget(
  category: string | null | undefined,
  options: ResolveOptions = {},
): AffiliateOutgoing {
  if (!isAffiliateCategory(category)) return { ok: false, reason: 'unknown-category' };
  const partners = options.partners ?? AFFILIATE_PARTNERS;
  const picked = pickPartner(category, partners);
  if ('reason' in picked) {
    return { ok: false, reason: picked.reason === 'invalid-configuration' ? 'invalid-configuration' : 'unavailable' };
  }

  const partner = picked.partner;
  const tracking = partner.trackingMode === 'click';
  const consent = options.consent === true;
  // Ohne Zustimmung wird nicht gemessen. Existiert kein freigegebener
  // trackingfreier Weg, wird gar nicht ausgeleitet statt still zu messen.
  if (tracking && !consent && !partner.untrackedAllowed) return { ok: false, reason: 'consent-required' };
  const measure = tracking && consent;

  let url: URL;
  try {
    url = new URL(partner.targetUrl);
  } catch {
    return { ok: false, reason: 'invalid-configuration' };
  }

  // Keep the partner's own configured parameters, then add only approved ones.
  const params = new URLSearchParams(url.search);
  for (const [key, value] of Object.entries(partner.publisherParams)) params.set(key, value);
  if (tracking && consent && partner.subIdParam && isValidClickRef(options.clickRef ?? null)) {
    params.set(partner.subIdParam, String(options.clickRef));
  }
  url.search = params.toString();

  // Defense in depth: the composed URL must still satisfy the same contract.
  if (validateAffiliatePartner({ ...partner, targetUrl: url.toString() }) !== null) {
    return { ok: false, reason: 'invalid-configuration' };
  }
  return { ok: true, href: url.toString(), partnerId: partner.id, partnerName: partner.name, tracked: measure };
}

/** Availability of all five categories, for the comparison overview. */
export function affiliateAvailability(
  source: AffiliateSource,
  options: ResolveOptions = {},
): readonly AffiliateAvailability[] {
  return AFFILIATE_CATEGORIES.map((category) => resolveAffiliate(category, source, options));
}

/** True when at least one category currently has an approved partner. */
export function hasAnyAffiliatePartner(options: ResolveOptions = {}): boolean {
  return AFFILIATE_CATEGORIES.some((category) => resolveAffiliate(category, 'vergleichsuebersicht', options).status === 'available');
}
