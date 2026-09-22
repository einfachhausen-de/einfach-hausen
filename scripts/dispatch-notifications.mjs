import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';

// Einfach Hausen notification outbox dispatcher (EH T-0201).
// Runs as a systemd oneshot every few minutes: delivers every due pending
// notification through its channel adapter (in_app receipt, SMTP email) with
// retry/backoff and dead-lettering handled by the outbox itself.
// Emits one JSON line: {"sent":N,"retried":N,"dead":N}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-dispatch-src-'));
fs.symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
for (const rel of tsClosure(root, ['src/lib/db.ts', 'src/lib/mailer.ts', 'src/lib/notifications.ts', 'src/lib/owner-intelligence.ts', 'src/lib/document-intelligence.ts', 'src/lib/observability.ts', 'src/lib/security/redact.ts', 'src/lib/retention.ts'])) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const stripped = stripTypeScriptTypes(src)
    .replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`)
    .replace(/(import\(\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`);
  const dest = path.join(scratch, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stripped);
}

try {
  const n = await import(pathToFileURL(path.join(scratch, 'src/lib/notifications.mjs')).href);
  const intelligence = await import(pathToFileURL(path.join(scratch, 'src/lib/owner-intelligence.mjs')).href);
  const documentIntelligenceModule = await import(pathToFileURL(path.join(scratch, 'src/lib/document-intelligence.mjs')).href);
  const batchRaw = Number(process.env.OWNER_AI_SCAN_BATCH || 80);
  const ownerIntelligence = intelligence.syncOwnerAttentionBatch(Number.isInteger(batchRaw) ? batchRaw : 80);
  const documentBatchRaw = Number(process.env.DOCUMENT_AI_SCAN_BATCH || 12);
  const documentIntelligence = await documentIntelligenceModule.processDocumentIntelligenceBatch(Number.isInteger(documentBatchRaw) ? documentBatchRaw : 12);
  const result = await n.dispatchDueNotifications();
  // T-0145 retention sweep runs on the same cadence (cheap when nothing is due).
  await import(pathToFileURL(path.join(scratch, 'src/lib/db.mjs')).href);
  const sweep = await import(pathToFileURL(path.join(scratch, 'src/lib/retention.mjs')).href);
  const retention = await sweep.runRetentionSweep();
  console.log(JSON.stringify({ ...result, owner_ai_users: ownerIntelligence.users, owner_ai_created: ownerIntelligence.created, owner_ai_checked: ownerIntelligence.checked, document_ai_processed: documentIntelligence.processed, document_ai_done: documentIntelligence.done, document_ai_review: documentIntelligence.review, document_ai_failed: documentIntelligence.failed, retention_finalized: retention.finalized }));
} finally {
  try { fs.rmSync(scratch, { recursive: true, force: true }); } catch {}
}
