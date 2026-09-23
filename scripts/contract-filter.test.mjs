import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyContractFilter, contractKindCounts, filterIsActive, parseContractFilter, withContractQuery,
} from '../src/lib/contract-filter.ts';

const ROWS = [
  { id: 1, kind: 'strom', status: 'active', provider: 'Stadtwerke Duisburg', tariff: 'Basis Strom 12', contract_number: 'SWD-1', notice: '', cost_amount: 4190, cost_interval: 'month', cancellation_deadline: '2026-09-30' },
  { id: 2, kind: 'dsl', status: 'active', provider: 'Telekom', tariff: 'MagentaZuhause XL', contract_number: 'TK-2', notice: 'Router-Miete', cost_amount: 4495, cost_interval: 'month', cancellation_deadline: '2026-09-26' },
  { id: 3, kind: 'versicherung', status: 'active', provider: 'HUK24', tariff: 'Hausrat Komfort', contract_number: 'HUK-3', notice: '', cost_amount: 12800, cost_interval: 'year', cancellation_deadline: '2026-11-01' },
  { id: 4, kind: 'gas', status: 'cancelled', provider: 'Fluxio Energie', tariff: 'Fix 24', contract_number: 'FLX-4', notice: 'Bestätigung liegt in der Hausakte', cost_amount: 6400, cost_interval: 'month', cancellation_deadline: '2026-09-01' },
];

test('parseContractFilter normalisiert und begrenzt die Eingaben', () => {
  assert.deepEqual(parseContractFilter({}), { q: '', kind: null, status: 'alle', sort: 'frist', kompakt: false });
  assert.deepEqual(parseContractFilter({ q: '  Telekom   XL ', art: 'alle', status: 'quatsch', sort: 'kosten' }),
    { q: 'Telekom XL', kind: null, status: 'alle', sort: 'kosten', kompakt: false });
  assert.equal(parseContractFilter({ q: 'x'.repeat(200) }).q.length, 80);
});

test('Suche trifft Anbieter, Tarif, Nummer, Notiz und Artlabel', () => {
  for (const q of ['telekom', 'magenta', 'SWD-1', 'router-miete', 'versicherung']) {
    assert.equal(applyContractFilter(ROWS, parseContractFilter({ q })).length, 1, q);
  }
  assert.equal(applyContractFilter(ROWS, parseContractFilter({ q: 'nichts' })).length, 0);
});

test('Art- und Statusfilter kombinieren, inkl. gekuendigt', () => {
  assert.deepEqual(applyContractFilter(ROWS, parseContractFilter({ art: 'gas', status: 'cancelled' })).map((r) => r.id), [4]);
  assert.deepEqual(applyContractFilter(ROWS, parseContractFilter({ status: 'active' })).map((r) => r.id), [2, 1, 3]); // Frist-Sortierung greift auch im Statusfilter
});

test('Sortierung: naechste Frist zuerst (Aktive vor Inaktiven), Kosten, Name', () => {
  assert.deepEqual(applyContractFilter(ROWS, parseContractFilter({})).map((r) => r.id), [2, 1, 3, 4]);
  assert.deepEqual(applyContractFilter(ROWS, parseContractFilter({ sort: 'kosten' })).map((r) => r.id), [4, 2, 1, 3]);
  assert.deepEqual(applyContractFilter(ROWS, parseContractFilter({ sort: 'name' })).map((r) => r.provider), ['Fluxio Energie', 'HUK24', 'Stadtwerke Duisburg', 'Telekom']);
});

test('withContractQuery uebernimmt den Kontext und laesst Defaults weg', () => {
  const f = parseContractFilter({ q: 'tele', art: 'dsl' });
  assert.equal(withContractQuery(f), '?q=tele&art=dsl');
  assert.equal(withContractQuery(f, { kind: null }), '?q=tele');
  assert.equal(withContractQuery(f, { status: 'active', sort: 'name' }), '?q=tele&art=dsl&status=active&sort=name');
  assert.equal(filterIsActive(parseContractFilter({})), false);
  assert.equal(filterIsActive(parseContractFilter({ sort: 'kosten' })), true);
});

test('contractKindCounts nur vorhandene Arten, Menge absteigend, Label als Stich', () => {
  const counts = contractKindCounts(ROWS);
  assert.equal(counts.length, 4, 'jede Art genau einmal');
  assert.deepEqual(counts.map((c) => c.count), [1, 1, 1, 1]);
  assert.deepEqual(counts.map((c) => c.label), ['DSL & Festnetz', 'Gas', 'Strom', 'Versicherung']);
  const two = contractKindCounts([...ROWS, { ...ROWS[0], id: 9 }]);
  assert.equal(two[0].kind, 'strom');
  assert.equal(two[0].count, 2);
});
