#!/usr/bin/env bash
# Enciende / apaga todo el prototipo local: PostgreSQL + backend (Spring Boot) + frontend (Vite).
#
#   ./demo.sh start    enciende los tres y muestra las direcciones
#   ./demo.sh stop     los apaga
#   ./demo.sh status   dice qué está encendido
#   ./demo.sh reset    deja los datos de ejemplo como al inicio (apaga todo, borra la base y vuelve a encender)
#   ./demo.sh logs     muestra los registros (backend y frontend)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN="$ROOT/.run"
PG="$ROOT/database/scripts/local-pg.sh"
BACKEND_PORT=8080
FRONT_PORT="${PORT:-8443}"
mkdir -p "$RUN"

alive() { [[ -f "$RUN/$1.pid" ]] && kill -0 "$(cat "$RUN/$1.pid")" 2>/dev/null; }

wait_for() { # url nombre segundos
  for _ in $(seq 1 "$3"); do curl -fs -o /dev/null "$1" && return 0; sleep 1; done
  echo "✗ $2 no respondió en $3 s. Revisa: $RUN/$2.log"; return 1
}

kill_tree() { # mata el proceso guardado y todos sus descendientes (mvnw → maven → JVM de la app)
  local pid; pid="$(cat "$RUN/$1.pid" 2>/dev/null || true)"
  rm -f "$RUN/$1.pid"
  [[ -n "$pid" ]] || return 0
  kill_descendants "$pid"
  kill "$pid" 2>/dev/null || true
}

kill_descendants() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null || true); do
    kill_descendants "$child"
    kill "$child" 2>/dev/null || true
  done
}

lan_ip() { ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true; }

start() {
  echo "▸ Base de datos"
  # Los procesos que quedan encendidos no deben heredar la salida de este script (si no, `./demo.sh start | tail` no termina).
  "$PG" start >"$RUN/db.log" 2>&1 </dev/null && sed 's/^/   /' "$RUN/db.log"

  echo "▸ Backend"
  if alive backend; then echo "   ya estaba encendido"; else
    # `cd` va en su propia línea: con `cd x && cmd &` bash deja un subproceso extra que retiene la salida del script.
    (cd "$ROOT/backend"; nohup ./mvnw -q spring-boot:run > "$RUN/backend.log" 2>&1 < /dev/null & echo $! > "$RUN/backend.pid")
    wait_for "http://127.0.0.1:$BACKEND_PORT/api/health" backend 90
    echo "   listo en http://localhost:$BACKEND_PORT"
  fi

  echo "▸ Frontend"
  if alive frontend; then echo "   ya estaba encendido"; else
    [[ -d "$ROOT/frontend/node_modules" ]] || (cd "$ROOT/frontend" && pnpm install)
    (cd "$ROOT/frontend"; PORT="$FRONT_PORT" nohup pnpm exec vite > "$RUN/frontend.log" 2>&1 < /dev/null & echo $! > "$RUN/frontend.pid")
    wait_for "http://127.0.0.1:$FRONT_PORT/" frontend 40
    wait_for "http://127.0.0.1:$FRONT_PORT/api/health" "frontend (proxy hacia el backend)" 10
  fi

  local ip; ip="$(lan_ip)"
  echo
  echo "✔ Todo encendido"
  echo "   Aplicación (computador):  http://localhost:$FRONT_PORT/#/agenda"
  [[ -n "$ip" ]] && echo "   Aplicación (celular, mismo Wi-Fi):  http://$ip:$FRONT_PORT/#/agenda"
  echo "   API / Swagger:            http://localhost:$BACKEND_PORT/swagger-ui.html"
  echo "   Apagar:                   ./demo.sh stop"
}

stop() {
  kill_tree frontend; kill_tree backend
  # Red de seguridad: lo que siga escuchando en los puertos de la demo (por ejemplo, una ejecución anterior).
  local port pids
  for port in "$FRONT_PORT" "$BACKEND_PORT"; do
    pids="$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)"
    [[ -n "$pids" ]] && kill $pids 2>/dev/null || true
  done
  "$PG" stop || true
  echo "✔ Apagado"
}

status() {
  alive frontend && echo "frontend:  ENCENDIDO (puerto $FRONT_PORT)" || echo "frontend:  apagado"
  alive backend  && echo "backend:   ENCENDIDO (puerto $BACKEND_PORT)" || echo "backend:   apagado"
  "$PG" status | sed 's/^/base de datos: /' || true
}

case "${1:-}" in
  start)  start ;;
  stop)   stop ;;
  status) status ;;
  reset)
    echo "Esto borra TODOS los cambios hechos en la demo y restaura los datos de ejemplo."
    read -r -p "Escribe 'si' para continuar: " ok; [[ "$ok" == "si" ]] || { echo "Cancelado."; exit 1; }
    stop
    "$PG" start >/dev/null
    printf 'si\n' | "$PG" reset >/dev/null
    "$PG" stop >/dev/null
    start
    ;;
  logs)   tail -n 40 -f "$RUN/backend.log" "$RUN/frontend.log" ;;
  *) echo "Uso: $0 {start|stop|status|reset|logs}"; exit 2 ;;
esac
