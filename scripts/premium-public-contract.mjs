#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routes = [
  'src/app/preise/page.tsx',
  'src/app/partner/page.tsx',
  'src/app/sicherheit/page.tsx',
  'src/app/ueber-uns/page.tsx',
  'src/app/hilfe/page.tsx',
];
// /pilotphase ist keine oeffentliche Marketingseite mehr: das Pilot- und
// Rabattmodell auf kostenpflichtige Pakete entfaellt (Issue #132), die Route
// leitet nur noch auf /preise um und hat daher keinen Editorial-Hero.

const failures = [];
for (const file of routes) {
  const full = path.join(root, file);
  const source = fs.readFileSync(full, 'utf8');
  if (!source.includes('HeroEditorialPhoto')) {
    failures.push(`${file}: missing shared photo-led HeroEditorialPhoto anchor`);
  }
  if (!source.includes('aside={<HeroEditorialPhoto')) {
    failures.push(`${file}: PageHero is not wired to the shared photo-led hero anchor`);
  }
}

const visualSource = fs.readFileSync(path.join(root, 'src/components/marketing/hero-visuals.tsx'), 'utf8');
if (!visualSource.includes('export function HeroEditorialPhoto')) {
  failures.push('src/components/marketing/hero-visuals.tsx: missing reusable HeroEditorialPhoto component');
}
if (!visualSource.includes('premium.editorialHeroPhoto')) {
  failures.push('src/components/marketing/hero-visuals.tsx: HeroEditorialPhoto must use the shared premium visual namespace');
}

if (failures.length) {
  console.error('PREMIUM PUBLIC CONTRACT: RED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PREMIUM PUBLIC CONTRACT: GREEN (${routes.length} routes + shared hero visual)`);
