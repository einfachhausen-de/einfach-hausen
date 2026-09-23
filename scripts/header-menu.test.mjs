import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Betreiber-Vertrag (ausdruecklich bestaetigt 2026-09-23, nachdem die Liste
// mehrfach plattgemacht wurde): Die 12 Bereiche leben als zweite Liste
// (Radix-Sub-Flyout an "Neuer Auftrag": Hover oeffnet, Klick navigiert ohne
// Umweg, Tastatur-Enter oeffnet das Untermenue) — nicht als eine flache Liste.
// Diese Quelle-Anker halten den Vertrag; wer flach macht, sieht hier Rot.
const src = fs.readFileSync(path.join(process.cwd(), 'src/components/header-menu.tsx'), 'utf8');
const e2e = fs.readFileSync(path.join(process.cwd(), 'scripts/e2e.mjs'), 'utf8');

test('header menu shows the 12 areas inside a submenu, never flat', () => {
  for (const marker of ['DropdownMenuSub', 'DropdownMenuSubTrigger', 'DropdownMenuSubContent'])
    assert.ok(src.includes(marker), `header-menu.tsx must use ${marker}`);
  assert.match(src, /SERVICE_CATEGORIES\.map/, 'submenu must render the 12 service categories');
  // Plain Trigger (kein asChild): der Wrapper haengt den Chevron an, asChild
  // wuerfe wegen zweier Slot-Kinder.
  assert.match(src, /event\.detail === 0/, 'keyboard-Enter opens the submenu; mouse-click navigates');
  assert.doesNotMatch(src, /data-testid=\{`bereich-/, 'flat area items are a regression');
});

test('e2e proves the flyout path (hover opens submenu, click navigates)', () => {
  assert.match(e2e, /dropdown-menu-sub-content/, 'e2e must target the submenu content');
  assert.match(e2e, /getByRole\('menuitem',\{name:'Neuer Auftrag'\}\)\.hover\(\)/, 'e2e must open the flyout via hover');
  assert.match(e2e, /Area submenu must list exactly the 12 service areas/, 'e2e must count the 12 areas in the submenu');
  assert.doesNotMatch(e2e, /data-testid\^="bereich-"/, 'flat-area e2e anchor is a regression');
});
