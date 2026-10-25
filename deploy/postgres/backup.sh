#!/usr/bin/env bash
# Dumps every database plus the global objects (roles) of the shared Postgres
# into BACKUP_DIR and removes dumps older than BACKUP_KEEP_DAYS.
# Run nightly via cron, e.g.:
#   0 3 * * * /home/pi/coach-buddy/deploy/postgres/backup.sh >> /var/log/pg-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a

backup_dir="${BACKUP_DIR:?BACKUP_DIR is not set (see .env)}"
keep_days="${BACKUP_KEEP_DAYS:-14}"
stamp="$(date +%F)"

mkdir -p "$backup_dir"

docker exec postgres pg_dumpall -U postgres --globals-only > "$backup_dir/globals_$stamp.sql"

docker exec postgres psql -U postgres -At \
  -c "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname <> 'postgres'" |
while read -r db; do
  docker exec postgres pg_dump -U postgres -Fc "$db" > "$backup_dir/${db}_$stamp.dump"
  echo "dumped $db"
done

find "$backup_dir" -maxdepth 1 \( -name '*.dump' -o -name 'globals_*.sql' \) -mtime +"$keep_days" -delete
