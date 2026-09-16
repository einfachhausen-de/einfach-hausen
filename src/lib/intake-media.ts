import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { privateRoot } from './security/private-files';

export type IntakeMediaKind = 'image' | 'video' | 'audio';
type MediaRule = { ext: string; max: number; kind: IntakeMediaKind };

export const PRIVATE_MEDIA_TYPES: Record<string, MediaRule> = {
  'image/jpeg': { ext: 'jpg', max: 8 * 1024 * 1024, kind: 'image' },
  'image/png': { ext: 'png', max: 8 * 1024 * 1024, kind: 'image' },
  'image/webp': { ext: 'webp', max: 8 * 1024 * 1024, kind: 'image' },
  'image/heic': { ext: 'heic', max: 8 * 1024 * 1024, kind: 'image' },
  'video/mp4': { ext: 'mp4', max: 25 * 1024 * 1024, kind: 'video' },
  'video/webm': { ext: 'webm', max: 25 * 1024 * 1024, kind: 'video' },
  'video/quicktime': { ext: 'mov', max: 25 * 1024 * 1024, kind: 'video' },
  'video/x-m4v': { ext: 'm4v', max: 25 * 1024 * 1024, kind: 'video' },
  'audio/aac': { ext: 'aac', max: 16 * 1024 * 1024, kind: 'audio' },
  'audio/mpeg': { ext: 'mp3', max: 16 * 1024 * 1024, kind: 'audio' },
  'audio/mp4': { ext: 'm4a', max: 16 * 1024 * 1024, kind: 'audio' },
  'audio/ogg': { ext: 'ogg', max: 16 * 1024 * 1024, kind: 'audio' },
  'audio/opus': { ext: 'opus', max: 16 * 1024 * 1024, kind: 'audio' },
  'audio/wav': { ext: 'wav', max: 16 * 1024 * 1024, kind: 'audio' },
  'audio/x-wav': { ext: 'wav', max: 16 * 1024 * 1024, kind: 'audio' },
};

export function normalizedMediaType(value: string | undefined | null) {
  return String(value || '').split(';', 1)[0].trim().toLowerCase();
}

export function privateMediaRule(value: string | undefined | null) {
  return PRIVATE_MEDIA_TYPES[normalizedMediaType(value)] || null;
}

export function mediaKindFromPath(value: string | undefined | null): IntakeMediaKind {
  const ext = path.extname(String(value || '')).toLowerCase();
  if (['.mp4', '.webm', '.mov', '.m4v'].includes(ext)) return 'video';
  if (['.aac', '.mp3', '.m4a', '.ogg', '.opus', '.wav'].includes(ext)) return 'audio';
  return 'image';
}

function privateMediaName(rule: MediaRule, stableKey?: string) {
  if (!stableKey) return `${Date.now()}-${randomUUID()}.${rule.ext}`;
  const digest = createHash('sha256').update(stableKey).digest('hex');
  return `stable-${digest}.${rule.ext}`;
}

export async function savePrivateMediaBuffer(data: Uint8Array, contentType: string, stableKey?: string) {
  const rule = privateMediaRule(contentType);
  if (!rule || !data.byteLength || data.byteLength > rule.max) throw new Error('Ungültige Mediendatei');

  const name = privateMediaName(rule, stableKey);
  // Ueber privateRoot(), damit die Ablage auch ausserhalb des Projekts liegen
  // kann (PRIVATE_ROOT). Ein literales 'data','private' bricht den Turbopack-
  // Build, sobald dort echte Dateien liegen.
  const dir = path.join(privateRoot(), 'job-media');
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  await fs.writeFile(path.join(dir, name), data, { mode: 0o600 });
  return `job-media/${name}`;
}

export async function savePrivateMediaUpload(file: File | null) {
  if (!file || file.size === 0) return null;
  const rule = privateMediaRule(file.type);
  if (!rule || !Number.isSafeInteger(file.size) || file.size > rule.max) throw new Error('Ungültige Mediendatei');
  return savePrivateMediaBuffer(new Uint8Array(await file.arrayBuffer()), file.type);
}
