#!/usr/bin/env bash
# Retention for the local backup directory.
#
# Why this exists: `backup-einfach-hausen.sh` runs before every deploy and the
# nightly timer adds another bundle. Without retention that grows without bound
# until the disk is full, which takes production down. This script is the
# bounded-growth half of the backup contract; it never touches production data,
# only artifacts under BACKUP_ROOT that this repository itself created.
#
# Policy (GFS-lite, deliberately small):
#   1. the newest backup is always kept,
#   2. everything younger than BACKUP_KEEP_ALL_HOURS is kept,
#   3. the newest backup per UTC day for BACKUP_KEEP_DAILY_DAYS is kept,
#   4. the newest backup per ISO week for BACKUP_KEEP_WEEKLY_WEEKS is kept.
# Everything else is removed. Nothing younger than BACKUP_KEEP_ALL_HOURS is ever
# removed, so an in-flight deploy cannot lose the backup it just produced.
#
# Usage:
#   scripts/prune-einfach-hausen-backups.sh              # apply
#   BACKUP_PRUNE_DRY_RUN=1 scripts/prune-einfach-hausen-backups.sh
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/einfach-hausen}"
KEEP_ALL_HOURS="${BACKUP_KEEP_ALL_HOURS:-48}"
KEEP_DAILY_DAYS="${BACKUP_KEEP_DAILY_DAYS:-14}"
KEEP_WEEKLY_WEEKS="${BACKUP_KEEP_WEEKLY_WEEKS:-8}"
DRY_RUN="${BACKUP_PRUNE_DRY_RUN:-0}"

case "$KEEP_ALL_HOURS$KEEP_DAILY_DAYS$KEEP_WEEKLY_WEEKS" in
  *[!0-9]*) echo 'Retention windows must be non-negative integers.' >&2; exit 1 ;;
esac

if [[ ! -d "$BACKUP_ROOT" ]]; then
  printf 'Backup root is not a directory: %s\n' "$BACKUP_ROOT" >&2
  exit 1
fi

# The root must never be a dangerous path. A wrong BACKUP_ROOT here would delete
# unrelated directories, so this is checked before anything is enumerated.
resolved="$(cd "$BACKUP_ROOT" && pwd -P)"
case "$resolved" in
  /|/var|/var/backups|/home|/home/*|/srv|/etc|/usr|/tmp|/var/lib)
    printf 'Refusing to prune a shared path: %s\n' "$resolved" >&2
    exit 1 ;;
esac

python3 - "$resolved" "$KEEP_ALL_HOURS" "$KEEP_DAILY_DAYS" "$KEEP_WEEKLY_WEEKS" "$DRY_RUN" <<'PY'
import re
import shutil
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

root = Path(sys.argv[1])
keep_all_hours = int(sys.argv[2])
keep_daily_days = int(sys.argv[3])
keep_weekly_weeks = int(sys.argv[4])
dry_run = sys.argv[5] == "1"

# Only artifacts this repository creates: `einfach-hausen-<UTC stamp>` as a
# directory (deploy/nightly bundle) or as a `.tar.gz` (nightly off-host upload).
name_re = re.compile(r"^einfach-hausen-(\d{8}T\d{6}Z)(\.tar\.gz)?$")

entries = []
skipped = []
for path in sorted(root.iterdir()):
    match = name_re.match(path.name)
    if not match:
        continue
    # Never follow or delete symlinks, and never leave the direct children.
    if path.is_symlink() or path.parent != root:
        skipped.append(path.name)
        continue
    if not (path.is_dir() or path.is_file()):
        skipped.append(path.name)
        continue
    try:
        stamp = datetime.strptime(match.group(1), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        skipped.append(path.name)
        continue
    entries.append((stamp, path))

if not entries:
    print("retention: no backups found under " + str(root))
    raise SystemExit(0)

now = datetime.now(timezone.utc)
entries.sort(key=lambda item: item[0], reverse=True)

keep = {entries[0][1]}

for stamp, path in entries:
    if now - stamp <= timedelta(hours=keep_all_hours):
        keep.add(path)

seen_days = set()
for stamp, path in entries:
    if now - stamp > timedelta(days=keep_daily_days):
        continue
    day = stamp.date()
    if day in seen_days:
        continue
    seen_days.add(day)
    keep.add(path)

seen_weeks = set()
for stamp, path in entries:
    if now - stamp > timedelta(weeks=keep_weekly_weeks):
        continue
    week = stamp.isocalendar()[:2]
    if week in seen_weeks:
        continue
    seen_weeks.add(week)
    keep.add(path)

removable = []
for stamp, path in entries:
    if path in keep:
        continue
    # Hard safety net: the keep-all window already covers this, but deleting a
    # recent backup is the one mistake that is not recoverable, so it is asserted.
    if now - stamp <= timedelta(hours=keep_all_hours):
        continue
    removable.append((stamp, path))

freed = 0
removed = 0
for stamp, path in removable:
    if path.is_dir():
        size = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
        if not dry_run:
            shutil.rmtree(path)
    else:
        size = path.stat().st_size
        if not dry_run:
            path.unlink()
    freed += size
    removed += 1
    print(("would remove " if dry_run else "removed ") + path.name)

if skipped:
    print("retention: left alone (not a backup artifact): " + ", ".join(skipped))

verb = "would remove" if dry_run else "removed"
print(
    "retention: %s %d of %d backup(s), %s %.1f MB; kept %d"
    % (verb, removed, len(entries), "would free" if dry_run else "freed", freed / (1024 * 1024), len(keep))
)
PY
