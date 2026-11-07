#!/usr/bin/env bash
# Base de datos PostgreSQL local del prototipo, SIN Docker y SIN servicio del sistema.
# El clúster vive dentro del proyecto (database/.pgdata) y se enciende/apaga a mano.
#
# Requisito (una sola vez):  brew install postgresql@16
# Uso:  database/scripts/local-pg.sh {start|stop|status|psql|backup|restore <archivo>|reset|url}
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA="$ROOT/.pgdata"
LOG="$ROOT/.pgdata.log"
BACKUPS="$ROOT/backups"
PORT="${PGPORT:-5432}"
DB_NAME="gracia_osorio"
DB_USER="gracia"
DB_PASS="gracia"

BIN="${PG_BIN:-}"
if [[ -z "$BIN" ]]; then
  if command -v brew >/dev/null 2>&1 && brew --prefix postgresql@16 >/dev/null 2>&1; then
    BIN="$(brew --prefix postgresql@16)/bin"
  else
    BIN="$(dirname "$(command -v pg_ctl 2>/dev/null || true)")"
  fi
fi
[[ -x "$BIN/pg_ctl" ]] || { echo "No encuentro PostgreSQL. Instálalo con: brew install postgresql@16 (o define PG_BIN)"; exit 1; }

is_running() { "$BIN/pg_ctl" -D "$DATA" status >/dev/null 2>&1 || "$BIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; }

init_cluster() {
  [[ -d "$DATA" ]] && return
  echo "Creando clúster en $DATA ..."
  # Autenticación por contraseña también en local; solo escucha en 127.0.0.1.
  "$BIN/initdb" -D "$DATA" -E UTF8 --locale=en_US.UTF-8 -U postgres --auth=scram-sha-256 --pwfile=<(echo "$DB_PASS") >/dev/null
  {
    echo "listen_addresses = '127.0.0.1'"
    echo "port = $PORT"
    echo "timezone = 'America/Bogota'"
    echo "unix_socket_directories = '$DATA'"
  } >> "$DATA/postgresql.conf"
}

psql_admin() { PGPASSWORD="$DB_PASS" "$BIN/psql" -h 127.0.0.1 -p "$PORT" -U postgres -v ON_ERROR_STOP=1 "$@"; }
psql_app()   { PGPASSWORD="$DB_PASS" "$BIN/psql" -h 127.0.0.1 -p "$PORT" -U "$DB_USER" -d "$DB_NAME" "$@"; }

ensure_db() {
  if PGPASSWORD="$DB_PASS" "$BIN/psql" -h 127.0.0.1 -p "$PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1; then
    return 0
  fi
  psql_admin -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 \
    || psql_admin -d postgres -c "CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS'" >/dev/null
  psql_admin -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
    || psql_admin -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER ENCODING 'UTF8'" >/dev/null
}

case "${1:-}" in
  start)
    init_cluster
    if is_running; then echo "Ya está encendida (puerto $PORT)."; else
      "$BIN/pg_ctl" -D "$DATA" -l "$LOG" -w start >/dev/null
      echo "PostgreSQL encendido en 127.0.0.1:$PORT"
    fi
    ensure_db
    echo "Base lista: $DB_NAME (usuario $DB_USER). El esquema y los datos de ejemplo los crea el backend (Flyway) al arrancar."
    ;;
  stop)
    if is_running; then "$BIN/pg_ctl" -D "$DATA" -m fast -w stop >/dev/null; echo "PostgreSQL apagado."; else echo "No estaba encendida."; fi
    ;;
  status)
    if is_running; then echo "ENCENDIDA en 127.0.0.1:$PORT"; else echo "APAGADA"; exit 3; fi
    ;;
  psql)
    shift; psql_app "$@"
    ;;
  backup)
    mkdir -p "$BACKUPS"
    FILE="$BACKUPS/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
    PGPASSWORD="$DB_PASS" "$BIN/pg_dump" -h 127.0.0.1 -p "$PORT" -U "$DB_USER" --no-owner "$DB_NAME" > "$FILE"
    echo "Copia guardada en $FILE"
    ;;
  restore)
    FILE="${2:?Indica el archivo .sql a restaurar}"
    echo "Esto BORRA los datos actuales de $DB_NAME y los reemplaza por $FILE."
    read -r -p "Escribe 'si' para continuar: " ok; [[ "$ok" == "si" ]] || { echo "Cancelado."; exit 1; }
    psql_admin -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE)" >/dev/null
    psql_admin -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER ENCODING 'UTF8'" >/dev/null
    psql_app -v ON_ERROR_STOP=1 -q -f "$FILE" >/dev/null
    echo "Restaurado desde $FILE"
    ;;
  reset)
    echo "Esto BORRA la base $DB_NAME. Al volver a arrancar el backend se recrean el esquema y los datos de ejemplo."
    read -r -p "Escribe 'si' para continuar: " ok; [[ "$ok" == "si" ]] || { echo "Cancelado."; exit 1; }
    is_running || { init_cluster; "$BIN/pg_ctl" -D "$DATA" -l "$LOG" -w start >/dev/null; }
    psql_admin -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE)" >/dev/null
    ensure_db
    echo "Base vacía. Arranca el backend para recrearla."
    ;;
  url)
    echo "jdbc:postgresql://127.0.0.1:$PORT/$DB_NAME  (usuario: $DB_USER, contraseña: $DB_PASS)"
    ;;
  *)
    echo "Uso: $0 {start|stop|status|psql|backup|restore <archivo>|reset|url}"; exit 2
    ;;
esac
