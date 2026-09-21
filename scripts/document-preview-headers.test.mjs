import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.ts';

test('only authenticated document endpoints opt into same-origin framing', async () => {
  const entries = await config.headers();
  const global = entries.find(entry => entry.source === '/(.*)');
  assert.equal(global.headers.find(h => h.key === 'X-Frame-Options').value, 'DENY');
  assert.match(global.headers.find(h => h.key === 'Content-Security-Policy').value, /frame-ancestors 'none'/);
  const exceptions = entries.filter(entry => entry.headers.some(h => h.key === 'X-Frame-Options' && h.value === 'SAMEORIGIN'));
  assert.deepEqual(exceptions.map(entry => entry.source), ['/api/documents/:id', '/api/house-history-documents/:id']);
  for (const entry of exceptions) {
    const csp = entry.headers.find(h => h.key === 'Content-Security-Policy').value;
    assert.match(csp, /frame-ancestors 'self'/);
    assert.doesNotMatch(csp, /frame-ancestors \*/);
    assert.match(csp, /object-src 'none'/);
  }
});
