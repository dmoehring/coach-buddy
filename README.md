# Coach Buddy

Coach Buddy is a training and team management app with a Quarkus backend and an Angular frontend, backed by PostgreSQL.

## Project structure

- [`backend/`](backend) — Quarkus REST API ([backend/README.md](backend/README.md))
- [`frontend/`](frontend) — Angular application ([frontend/README.md](frontend/README.md))
- [`docs/`](docs) — API documentation (OpenAPI spec)

## Getting started (local development)

1. Copy `.env.example` to `.env` and adjust the values if needed.
2. Start the database:

   ```shell
   docker compose -f docker-compose.dev.yml up -d
   ```

3. Run the backend and frontend as described in their respective READMEs.

## Deployment auf dem Raspberry Pi

Die App läuft als Docker-Stack (Backend, Frontend) gegen eine auf dem Pi geteilte PostgreSQL-Instanz und ist für einen Single-User-Betrieb hinter einem VPN gedacht — es gibt bewusst kein TLS und kein Nutzer-Management in den Containern.

### 1. Docker auf dem Pi installieren

Auf einem 64-bit Raspberry Pi OS (Pi 4/5, aarch64) reicht das offizielle Docker-Installationsskript:

```shell
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Danach einmal aus- und wieder einloggen (oder `newgrp docker`), damit die Gruppenmitgliedschaft aktiv wird. `docker compose` (v2, als `docker compose`-Subcommand) ist im Docker-Installationsskript bereits enthalten.

### 2. Geteilte PostgreSQL-Instanz starten

Postgres läuft als eigener Stack unter [`deploy/postgres`](deploy/postgres) und wird von allen Apps auf dem Pi gemeinsam genutzt. Es wird kein Port nach außen veröffentlicht — die Apps erreichen die DB über das externe Docker-Netzwerk `db` (Hostname `postgres`).

```shell
cd deploy/postgres
cp .env.example .env   # POSTGRES_ADMIN_PASSWORD und BACKUP_DIR setzen
docker compose up -d
```

Danach für Coach Buddy eine eigene Datenbank samt Rolle anlegen (Werte wie in der `.env` der App, siehe unten):

```shell
./create-app-db.sh coach_buddy '<passwort>'
```

Weitere Apps bekommen analog je eine eigene Datenbank und Rolle.

#### Backups

`deploy/postgres/backup.sh` sichert alle Datenbanken (`pg_dump -Fc`) plus die Rollen (`pg_dumpall --globals-only`) nach `BACKUP_DIR` und löscht Dumps älter als `BACKUP_KEEP_DAYS`. Per Cron nachts ausführen:

```
0 3 * * * /home/<user>/coach-buddy/deploy/postgres/backup.sh >> /var/log/pg-backup.log 2>&1
```

`BACKUP_DIR` sollte auf einem anderen Medium als die SD-Karte liegen (externe Platte, NAS), sonst ist es kein Backup. Einen Restore einmal testen:

```shell
docker exec -i postgres createdb -U postgres coach_buddy_restore_test
docker exec -i postgres pg_restore -U postgres -d coach_buddy_restore_test < /pfad/zu/coach_buddy_YYYY-MM-DD.dump
```

Ein Major-Upgrade von Postgres betrifft alle Apps gleichzeitig — die Version ist daher in `deploy/postgres/docker-compose.yml` fest gepinnt.

### 3. Repository und Secrets vorbereiten

```shell
git clone <repo-url> coach-buddy
cd coach-buddy
cp .env.example .env
```

`.env` anpassen: `POSTGRES_DB`, `POSTGRES_USER` und `POSTGRES_PASSWORD` müssen zu der mit `create-app-db.sh` angelegten Datenbank passen (`POSTGRES_PORT` wird nur für die lokale Entwicklung genutzt). Außerdem `FRONTEND_PORT` bei Bedarf setzen.

Der private JWT-Signierschlüssel ist **nicht** im Repository (siehe `backend/.gitignore`) und wird zur Laufzeit in den Backend-Container gemountet, statt ins Image eingebacken zu werden — er muss also lokal vorhanden und für den Container lesbar sein:

```shell
chmod 644 backend/src/main/resources/privateKey.pem
```

(`publicKey.pem` ist unkritisch und bereits im Repository enthalten.)

### 4. Stack starten

Die Images werden automatisch bei jedem Push auf `main` und bei Versions-Tags nach [ghcr.io](https://github.com/dmoehring?tab=packages) gebaut und veröffentlicht (siehe [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml)). Auf dem Pi reicht es daher, die fertigen Images zu ziehen — kein Java/Maven/Node nötig:

```shell
docker compose pull
docker compose up -d
```

Alternativ kann der Stack auch komplett lokal aus dem Quellcode gebaut werden (z. B. für Entwicklung oder wenn kein Zugriff auf die Registry gewünscht ist):

```shell
docker compose up -d --build
```

Danach ist die App unter `http://<pi-ip>:${FRONTEND_PORT:-80}/` erreichbar (im Docker-Netz spricht das Frontend intern mit dem `backend`-Service, kein Port davon ist nach außen offen).

Login mit dem seed-Account `admin` / `ChangeMe123!` (definiert in [`V8__create_account_table.sql`](backend/src/main/resources/db/migration/V8__create_account_table.sql)). Eine Passwortänderung über die App gibt es aktuell nicht — bei Bedarf direkt in der Datenbank über `UPDATE coach_buddy.account SET password_hash = crypt('<neues-passwort>', gen_salt('bf')) WHERE username = 'admin';`.

### Updates einspielen

```shell
docker compose pull
docker compose up -d
```

## License

This project is licensed under the terms of the [MIT license](LICENSE).
