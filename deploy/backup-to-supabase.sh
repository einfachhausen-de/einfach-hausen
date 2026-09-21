#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/einfach-hausen}"
DB_PATH="${DATABASE_PATH:-/var/lib/einfach-hausen/einfach-hausen.db}"
PRIVATE_ROOT="${PRIVATE_ROOT:-/var/lib/einfach-hausen/private}"
UPLOAD_ROOT="${UPLOAD_ROOT:-/var/lib/einfach-hausen/uploads}"
SUPABASE_ENV="${SUPABASE_ENV:-/opt/sin-supabase/.env}"
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:8006}"
BUCKET="${BACKUP_BUCKET:-einfach-hausen-backups}"
LOCAL_DIR="${LOCAL_BACKUP_DIR:-/var/backups/einfach-hausen}"

[[ -x "$APP_DIR/scripts/backup-einfach-hausen.sh" ]] || { echo 'Canonical backup script is missing or not executable.' >&2; exit 1; }
[[ -r "$SUPABASE_ENV" ]] || { echo 'Supabase environment is not readable.' >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$SUPABASE_ENV"
set +a
: "${SERVICE_ROLE_KEY:?SERVICE_ROLE_KEY missing from Supabase environment}"

backup_dir="$(DATABASE_PATH="$DB_PATH" PRIVATE_ROOT="$PRIVATE_ROOT" UPLOAD_ROOT="$UPLOAD_ROOT" BACKUP_ROOT="$LOCAL_DIR" "$APP_DIR/scripts/backup-einfach-hausen.sh")"
bundle="$backup_dir.tar.gz"
tar -C "$(dirname "$backup_dir")" -czf "$bundle" "$(basename "$backup_dir")"
chmod 0640 "$bundle"

curl -fsS -X POST "$SUPABASE_URL/storage/v1/object/$BUCKET/$(basename "$bundle")" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/gzip" \
  --data-binary "@$bundle" >/dev/null

# Local retention is owned by exactly one place: scripts/prune-einfach-hausen-
# backups.sh, which scripts/backup-einfach-hausen.sh runs as its last step (so it
# applies to both this nightly path and the pre-deploy path).
#
# This script used to prune here as well, with `find -mtime +KEEP_LOCAL_DAYS`.
# That was a pure age cutoff with no consolidation: it kept roughly eight days of
# *every* backup, i.e. one full set per deploy plus the nightly one. On 2026-09-21
# that had grown to 79 backups / 13.7 GB with ~26 GB free on the VM, so the disk
# would have filled in about 18 days. It would also have deleted the daily and
# weekly backups the consolidation is supposed to keep, so the two mechanisms
# could not coexist. Do not reintroduce a second pruning step here; change the
# retention windows in the prune script instead, where they are regression-tested.
printf 'Backup uploaded: %s\n' "$(basename "$bundle")"
