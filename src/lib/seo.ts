/**
 * SEO-Fundament (P0) — zentrale Konstanten + JSON-LD-Bausteine.
 * Quelle: /tmp/seo-research.md Abschnitt 7.2 P0. Keine visuellen Effekte,
 * nur Head-/Metadata-/JSON-LD-Bausteine. Keine erfundenen Claims:
 * areaServed bleibt ehrlich (regionale Pilotphase, kein Bundesweit-Versprechen),
 * keine Bewertungen (keine verifizierten Reviews im Code), keine Preise im Schema.
 */
export const SITE_URL = 'https://einfachhausen.de';

/** Absolute Canonical-URL fuer einen App-Router-Pfad. */
export function canonical(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/**
 * Social-Preview-Bild (1200x630). Motive liegen als PNG unter public/og/ und werden
 * von scripts/eh-og-image.mjs aus tokens.json erzeugt — dieselbe Farbquelle wie
 * tokens.css, damit die Vorschau nicht von der Marke abdriftet.
 *
 * Wichtig: Next merged Metadata nur FLACH. Eine Seite mit eigenem `openGraph`-Block
 * ersetzt den des Layouts komplett — inklusive `images`. Deshalb muss jede Seite, die
 * `openGraph` setzt, hier `images: ogImages('<motiv>')` mitgeben, sonst hat sie wieder
 * keine Vorschau. Twitter faellt automatisch auf `openGraph.images` zurueck.
 */
export type OgMotiv = 'default' | 'leistungen' | 'lexikon' | 'blog' | 'partner' | 'hilfe' | 'preise';

const OG_ALT: Record<OgMotiv, string> = {
  default: 'Einfach Hausen — alles rund ums Eigenheim',
  leistungen: 'Leistungen bei Einfach Hausen: alles, was ein Haus braucht',
  lexikon: 'Einfach Hausen Lexikon: Fachbegriffe rund ums Haus',
  blog: 'Einfach Hausen Ratgeber rund ums Eigenheim',
  partner: 'Einfach Hausen für Handwerksbetriebe',
  hilfe: 'Einfach Hausen Hilfe und FAQ',
  preise: 'Einfach Hausen Preise und Hauskonto',
};

export function ogImages(motiv: OgMotiv = 'default'): Array<{ url: string; width: number; height: number; alt: string }> {
  return [{ url: `/og/${motiv}.png`, width: 1200, height: 630, alt: OG_ALT[motiv] }];
}

/**
 * Vollstaendiger openGraph-Block fuer Seiten, die bisher keinen hatten.
 * Alle Felder an einer Stelle, weil eine Seiten-eigene `openGraph`-Angabe die des
 * Layouts komplett ersetzt: locale und siteName wuerden sonst stillschweigend fehlen.
 */
export function ogBlock(o: { url: string; title: string; description: string; motiv?: OgMotiv; type?: 'website' | 'article' }) {
  return {
    type: o.type ?? 'website',
    locale: 'de_DE',
    siteName: 'Einfach Hausen',
    title: o.title,
    description: o.description,
    url: o.url,
    images: ogImages(o.motiv),
  };
}

/** Globaler Graph: Organization + WebSite (ohne sameAs — keine Social-Profile im Code belegt). */
export function orgWebsiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organisation`,
        name: 'Einfach Hausen',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icons/icon-192.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Einfach Hausen',
        url: `${SITE_URL}/`,
        inLanguage: 'de',
        publisher: { '@id': `${SITE_URL}/#organisation` },
      },
    ],
  };
}

/** BreadcrumbList fuer Content-Seiten. items: [Anzeigename, Pfad]. */
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

/**
 * HomeAndConstructionBusiness + Service fuer /leistungen.
 * Leistungsnamen = CATEGORIES aus src/components/marketing/content.tsx (1:1).
 * areaServed ehrlich als Text: regionale Pilotphase, Verfügbarkeit hängt
 * vom Partnernetz vor Ort ab (vgl. /leistungen-FAQ "Wir starten regional").
 */
export function leistungenServiceJsonLd(): Record<string, unknown> {
  const services = [
    'Haus & Technik',
    'Elektro & Smart Home',
    'Heizung, Klima & Energie',
    'Sanitär & Wasser',
    'Dach, Fenster & Türen',
    'Innenausbau & Sanierung',
    'Garten & Außenbereich',
    'Reinigung & Pflege',
    'Saisonale Dienste',
    'Spezialfälle',
    'Umzug & Entrümpelung',
    'Beratung & dringende Fälle',
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${SITE_URL}/leistungen#anbieter`,
    name: 'Einfach Hausen',
    url: `${SITE_URL}/leistungen`,
    description:
      'Einfach Hausen organisiert alles rund ums Eigenheim: Anliegen beschreiben, geprüfte regionale Partner finden, Vorgänge in der Hausakte behalten.',
    areaServed:
      'Regionale Pilotgebiete in Deutschland — konkrete Verfügbarkeit hängt vom aktiven Partnernetz vor Ort ab',
    makesOffer: services.map((serviceType) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: serviceType,
        provider: { '@id': `${SITE_URL}/leistungen#anbieter` },
        url: `${SITE_URL}/leistungen`,
      },
    })),
  };
}
