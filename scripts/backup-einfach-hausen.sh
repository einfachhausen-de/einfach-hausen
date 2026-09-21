#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${DATABASE_PATH:-/var/lib/einfach-hausen/einfach-hausen.db}"
PRIVATE_ROOT="${PRIVATE_ROOT:-/var/lib/einfach-hausen/private}"
UPLOAD_ROOT="${UPLOAD_ROOT:-/var/lib/einfach-hausen/uploads}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/einfach-hausen}"

for required in "$DB_PATH" "$PRIVATE_ROOT" "$UPLOAD_ROOT"; do
  if [[ ! -e "$required" ]]; then
    printf 'Required production data path is missing: %s\n' "$required" >&2
    exit 1
  fi
done
if [[ ! -r "$DB_PATH" || ! -d "$PRIVATE_ROOT" || ! -d "$UPLOAD_ROOT" ]]; then
  echo 'Production data paths are not readable directories/files as expected.' >&2
  exit 1
fi

install -d -m 0750 "$BACKUP_ROOT"
ts="$(date -u +%Y%m%dT%H%M%SZ)"
staging="$(mktemp -d "$BACKUP_ROOT/.einfach-hausen-$ts.XXXXXX")"
final="$BACKUP_ROOT/einfach-hausen-$ts"
cleanup() { rm -rf "$staging"; }
trap cleanup EXIT

python3 - "$DB_PATH" "$staging/einfach-hausen.db" <<'PY'
import sqlite3
import sys

src, dst = sys.argv[1:3]
source = sqlite3.connect(f"file:{src}?mode=ro", uri=True)
target = sqlite3.connect(dst)
try:
    source.backup(target)
    result = target.execute("PRAGMA integrity_check").fetchone()
    if not result or result[0] != "ok":
        raise SystemExit(f"backup integrity_check failed: {result!r}")
finally:
    target.close()
    source.close()
PY
chmod 0640 "$staging/einfach-hausen.db"

tar -C "$PRIVATE_ROOT" -cf "$staging/private.tar" .
tar -C "$UPLOAD_ROOT" -cf "$staging/uploads.tar" .

python3 - "$staging" "$PRIVATE_ROOT" "$UPLOAD_ROOT" <<'PY'
import hashlib
import json
import os
from pathlib import Path
import sys

staging = Path(sys.argv[1])
private_root = Path(sys.argv[2])
upload_root = Path(sys.argv[3])

def count_files(root: Path) -> int:
    return sum(1 for p in root.rglob('*') if p.is_file())

payloads = ["einfach-hausen.db", "private.tar", "uploads.tar"]
checksums = {}
for name in payloads:
    p = staging / name
    digest = hashlib.sha256()
    with p.open('rb') as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b''):
            digest.update(chunk)
    checksums[name] = {"sha256": digest.hexdigest(), "bytes": p.stat().st_size}

manifest = {
    "format": 1,
    "database": "einfach-hausen.db",
    "private_archive": "private.tar",
    "uploads_archive": "uploads.tar",
    "private_file_count": count_files(private_root),
    "upload_file_count": count_files(upload_root),
    "payloads": checksums,
}
(staging / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
PY
chmod 0640 "$staging/manifest.json" "$staging/private.tar" "$staging/uploads.tar"

if [[ -e "$final" ]]; then
  echo "Backup destination already exists; refusing to overwrite: $final" >&2
  exit 1
fi
mv "$staging" "$final"
trap - EXIT

# Bounded growth. This script runs before every deploy and the nightly timer adds
# another bundle, so without retention the directory grows until the disk is full
# (observed 2026-09-21: 79 backups / 13.7 GB, no rotation at all). Retention runs
# only after the new backup is committed, so a failure here can never cost the
# backup that was just produced. It is reported loudly on stderr instead of
# aborting, because silent retention failure is exactly how the directory grew
# unbounded before. stdout stays reserved for the backup path.
prune_script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/prune-einfach-hausen-backups.sh"
if [[ -x "$prune_script" ]]; then
  BACKUP_ROOT="$BACKUP_ROOT" "$prune_script" >&2 ||
    printf 'WARNING: backup retention failed; %s will keep growing.\n' "$BACKUP_ROOT" >&2
else
  printf 'WARNING: retention script missing (%s); backups are not pruned.\n' "$prune_script" >&2
fi

printf '%s\n' "$final"
