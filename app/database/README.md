# Base de datos (PostgreSQL local)

Base `gracia_osorio`, usuario `gracia`, contraseña `gracia`, puerto `5432`. Es solo para el prototipo local.

**El esquema y los datos de ejemplo no están aquí**: los crea el backend al arrancar con Flyway
(`backend/src/main/resources/db/migration`: `V1__schema.sql` y `V2__seed.sql`). Así hay una única fuente de verdad.

## Opción A — sin Docker (la usada en este equipo)

```bash
brew install postgresql@16            # una sola vez
database/scripts/local-pg.sh start    # crea el clúster en database/.pgdata y lo enciende
database/scripts/local-pg.sh status
database/scripts/local-pg.sh psql     # consola SQL (acepta argumentos: psql -c "select ...")
database/scripts/local-pg.sh stop     # apagar
```

No instala ningún servicio del sistema: se enciende y se apaga a mano, y los datos viven en `database/.pgdata`.

| Comando | Qué hace |
|---|---|
| `backup` | Guarda un `.sql` en `database/backups/` |
| `restore <archivo>` | Reemplaza la base por esa copia (pide confirmación) |
| `reset` | Borra la base; al arrancar el backend se recrea con los datos de ejemplo |
| `url` | Muestra la cadena JDBC |

## Opción B — Docker

```bash
docker compose -f database/docker-compose.yml up -d
```

## Modelo

```
doctor 1─* patient 1─* treatment_plan 1─* payment
   │          │
   │          └─* appointment *─1 doctor        reminder 1─1 appointment
   └─* appointment                               pending_reschedule *─0..1 patient
treatment (catálogo)        patient_balance (vista: costo − abonado, por paciente)
```

- El saldo de cada paciente **no se guarda**: sale de la vista `patient_balance`.
- `appointment.patient_id` puede ser nulo (cita para alguien aún no registrado).
- Los pagos y tratamientos protegen al paciente: no se puede borrar un paciente que los tenga.
- Los precios del catálogo `treatment` son nulos salvo los 3 conocidos; faltan por definir con el cliente.

## Si algo falla

- `PostgreSQL ... Address already in use`: ya hay otro Postgres en 5432. Usa `PGPORT=5433 database/scripts/local-pg.sh start` y arranca el backend con `DB_URL=jdbc:postgresql://127.0.0.1:5433/gracia_osorio`.
- Log del servidor: `database/.pgdata.log`.
