import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const contracts = [
  ['GET', '/api/ki', 'src/app/api/ki/route.ts'],
  ['POST', '/api/ki', 'src/app/api/ki/route.ts'],
  ['GET', '/api/ai/byok', 'src/app/api/ai/byok/route.ts'],
  ['POST', '/api/ai/byok', 'src/app/api/ai/byok/route.ts'],
  ['POST', '/api/ai/credits', 'src/app/api/ai/credits/route.ts'],
  ['GET', '/api/account/export', 'src/app/api/account/export/route.ts'],
  ['POST', '/api/konto-loeschen', 'src/app/api/konto-loeschen/route.ts'],
  ['POST', '/api/telemetry', 'src/app/api/telemetry/route.ts'],
  ['POST', '/api/errors', 'src/app/api/errors/route.ts'],
  ['POST', '/api/owner/messages/[contactUserId]', 'src/app/api/owner/messages/[contactUserId]/route.ts'],
  ['PATCH', '/api/owner/messages/[contactUserId]', 'src/app/api/owner/messages/[contactUserId]/route.ts'],
  ['POST', '/api/support/messages/[homeownerId]', 'src/app/api/support/messages/[homeownerId]/route.ts'],
  ['PATCH', '/api/support/messages/[homeownerId]', 'src/app/api/support/messages/[homeownerId]/route.ts'],
];

for (const [method, endpoint, rel] of contracts) {
  const source = read(rel);
  assert.match(source, new RegExp(`export\\s+async\\s+function\\s+${method}\\b`), `${method} ${endpoint} missing`);
}

// /ki-chat ist inzwischen ein Redirect-Stub nach /app/hausmeister (kein eigener
// Chat mehr). Die Rollen-Translation liegt jetzt im KI-Endpoint und der
// Hausmeister-Seite; beide duerfen nur user/assistant kennen, niemals "ai".
const ki = read('src/app/api/ki/route.ts');
assert.match(ki, /role\s*===\s*["']user["']\s*\|\|\s*m\.role\s*===\s*["']assistant["']/, 'api/ki must keep only user/assistant roles');
const redirect = read('src/app/ki-chat/page.tsx');
assert.match(redirect, /redirect\(["']\/app\/hausmeister/, 'ki-chat must redirect to /app/hausmeister');
const hausmeister = read('src/app/app/hausmeister/page.tsx');
assert.match(hausmeister, /role:\s*['"]user['"]\s*\|\s*['"]assistant['"]\s*\|\s*['"]event['"]/, 'hausmeister must type roles user/assistant/event');

const boundary = read('src/app/error.tsx');
assert.match(boundary, /fetch\(["']\/api\/errors["']/, 'error boundary must use the error sink');
assert.match(boundary, /error_class\s*:\s*["']internal["']/, 'error boundary must send error taxonomy');

const srcFiles = fs.readdirSync(path.join(root, 'src'), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name));
for (const entry of srcFiles) {
  const source = fs.readFileSync(path.join(entry.parentPath, entry.name), 'utf8');
  assert.doesNotMatch(source, /(?:\/\/|\/\*)[^\n]*\b(?:todo|fixme|stub)\b|throw\s+new\s+Error\([^)]*not implemented/i, `${entry.name} contains TODO/stub marker`);
}
console.log(JSON.stringify({ ok: true, contracts: contracts.length, checks: contracts.length + 4 }));