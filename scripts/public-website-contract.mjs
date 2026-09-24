import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const expectedSlugs = [
  'haus-technik',
  'elektro-smart-home',
  'heizung',
  'sanitaer-wasser',
  'dach-fenster-tueren',
  'innenausbau-sanierung',
  'garten-aussenbereich',
  'reinigung-pflege',
  'saisonale-dienste',
  'spezialfaelle',
  'umzug-entruempelung',
  'beratung-notfall',
];

assert.ok(exists('src/components/marketing/service-catalog.tsx'), 'service catalog must exist');
const catalog = read('src/components/marketing/service-catalog.tsx');
for (const slug of expectedSlugs) assert.match(catalog, new RegExp(`slug:\\s*['\"]${slug}['\"]`));
assert.match(catalog, /SERVICE_PATHS/);
assert.match(catalog, /getServiceCategory/);

// The public chrome (header with Leistungen megamenu + footer) is shared by the
// homepage and every subpage; MarketingShell composes it.
const marketingShell = read('src/components/marketing/site-shell.tsx');
assert.match(marketingShell, /SiteHeader/);
assert.match(marketingShell, /SiteFooter/);
const shell = read('src/components/site/site-header.tsx') + read('src/components/site/site-footer.tsx');
assert.match(shell, /MegaMenu/);
assert.match(shell, /Alle Leistungen/);
assert.match(shell, /Beratung/);
assert.match(shell, /Notfall/);
assert.match(shell, /\/blog/);
assert.match(shell, /Lexikon/);
assert.match(shell, /Sicherheit/);
assert.match(shell, /Was steht bei dir an\?/);
assert.match(shell, /Noch nicht sicher, was du brauchst\?/);
assert.ok(shell.includes('href="\/#anliegen"'), 'megamenu must expose the homeowner intake CTA');


assert.ok(exists('src/components/marketing/service-detail-page.tsx'), 'shared service detail page must exist');
assert.ok(exists('src/app/leistungen/[slug]/page.tsx'), 'dynamic service route must exist');
const dynamicServicePage = read('src/app/leistungen/[slug]/page.tsx');
assert.match(dynamicServicePage, /generateStaticParams/);
assert.match(dynamicServicePage, /generateMetadata/);
const sitemap = read('src/app/sitemap.ts');
assert.match(sitemap, /SERVICE_PATHS/);
const serviceIndex = read('src/app/leistungen/page.tsx');
assert.match(serviceIndex, /SERVICE_CATEGORIES/);
assert.ok(serviceIndex.includes('href={`/leistungen/${slug}`}') || serviceIndex.includes("'/leistungen/' + slug"), 'service index must link every category by slug');
const heatingPage = read('src/app/leistungen/heizung/page.tsx');
assert.match(heatingPage, /ServiceDetailPage/);


const productRoutes = [
  ['beratung', /kein Auftrag/i],
  ['notfall', /Bereitschaft|24\/7/],
  ['versicherung', /nicht automatisch/i],
  ['immobilienverkauf', /Freigabe|Makler/],
];
for (const [slug, pattern] of productRoutes) {
  const rel = `src/app/${slug}/page.tsx`;
  assert.ok(exists(rel), `public product page /${slug} must exist`);
  assert.match(read(rel), pattern);
  assert.ok(sitemap.includes(`/${slug}`), `sitemap must include /${slug}`);
}


assert.ok(exists('src/components/marketing/home-hero.tsx'), 'canonical homepage hero v2 must exist');
const homeHero = read('src/components/marketing/home-hero.tsx');
assert.match(homeHero, /EHPageHero/);
assert.match(homeHero, /EHImageFrame/);
assert.match(homeHero, /Dein Haus/);
assert.doesNotMatch(homeHero, /HeroOrchestration|gsap/);
assert.match(homeHero, /IntakeForm/);
assert.doesNotMatch(homeHero, /Nichts wird ohne dich beauftragt/, 'homepage hero must not repeat the removed no-order proof line');
const intakeForm = read('src/components/home/intake-form.tsx');
assert.match(intakeForm, /EHRequestForm/, 'intake form must use the canonical EHRequestForm controls');
assert.match(intakeForm, /role:"homeowner"/, 'intake form must keep the role=homeowner GET funnel');

const homeSections = read('src/components/marketing/home-sections.tsx');
assert.ok(homeSections.includes('export { HomeHero } from '), 'homepage sections must export canonical hero v2');
assert.match(homeSections, /SERVICE_CATEGORIES/);
assert.ok(homeSections.includes('/leistungen/${'), 'homepage sections must link services by slug');
const helpPage = read('src/app/hilfe/page.tsx');
for (const href of ['/sicherheit','/blog','/lexikon','/kontakt']) assert.ok(helpPage.includes(href), `help hub must link ${href}`);
const houseFilePage = read('src/app/hausakte/page.tsx');
assert.ok(houseFilePage.includes('/versicherung'));
assert.ok(houseFilePage.includes('/immobilienverkauf'));
const ownerPage = read('src/app/eigenheimbesitzer/page.tsx');
for (const href of ['/beratung','/notfall','/immobilienverkauf']) assert.ok(ownerPage.includes(href), `owner page must discover ${href}`);
const howPage = read('src/app/so-funktionierts/page.tsx');
assert.ok(howPage.includes('/beratung'));
assert.ok(howPage.includes('/notfall'));
const partnerPage = read('src/app/partner/page.tsx');
assert.match(partnerPage, /0 % Auftragsprovision/);
assert.match(partnerPage, /Aufträge verwalten AN \/ AUS/);

const imprint = read('src/app/impressum/page.tsx');
assert.match(imprint, /Gina Schulze/, 'public imprint must name Gina Schulze');
assert.match(imprint, /Inhaberin/, 'public imprint must identify Gina as owner');
assert.match(imprint, /Geschäftsführerin/, 'public imprint must identify Gina as managing director');
assert.doesNotMatch(imprint, /(?:Betreiber|Inhaber|Geschäftsführ)[^\n<]*Jeremy Schulze/i, 'Jeremy must not be presented as platform owner/operator');

const authLegalModal = read('src/components/auth-v2/LegalModal.tsx');
assert.match(authLegalModal, /Gina Schulze/, 'auth imprint modal must name Gina Schulze');
assert.doesNotMatch(authLegalModal, /M\. Schmidt|T\. Weber|HRB 189234|DE 349 812 765|einfachhausen GmbH/, 'auth imprint modal must not contain placeholder legal identity');

assert.ok(exists('docs/COMPANY_IDENTITY.md'), 'canonical company identity doc must exist');
const companyIdentity = read('docs/COMPANY_IDENTITY.md');
assert.match(companyIdentity, /Gina Schulze/);
assert.match(companyIdentity, /Inhaberin/);
assert.match(companyIdentity, /Geschäftsführerin/);
assert.match(companyIdentity, /Jeremy Schulze/);
assert.match(companyIdentity, /Developer|Entwickler/);
assert.ok(read('README.md').includes('docs/COMPANY_IDENTITY.md'), 'README must link canonical company identity');
assert.ok(read('AGENTS.md').includes('docs/COMPANY_IDENTITY.md'), 'AGENTS must link canonical company identity');

console.log(JSON.stringify({ ok: true, services: expectedSlugs.length, productRoutes: productRoutes.length, checks: ['catalog','megamenu','help-discovery','service-routes','sitemap','product-pages','core-discovery','company-identity'] }, null, 2));
