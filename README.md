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
   docker compose up -d postgres
   ```

3. Run the backend and frontend as described in their respective READMEs.

## Deployment auf dem Raspberry Pi

Die App läuft als kompletter Docker-Stack (Postgres, Backend, Frontend) und ist für einen Single-User-Betrieb hinter einem VPN gedacht — es gibt bewusst kein TLS und kein Nutzer-Management in den Containern.

### 1. Docker auf dem Pi installieren

Auf einem 64-bit Raspberry Pi OS (Pi 4/5, aarch64) reicht das offizielle Docker-Installationsskript:

```shell
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Danach einmal aus- und wieder einloggen (oder `newgrp docker`), damit die Gruppenmitgliedschaft aktiv wird. `docker compose` (v2, als `docker compose`-Subcommand) ist im Docker-Installationsskript bereits enthalten.

### 2. Repository und Secrets vorbereiten

```shell
git clone <repo-url> coach-buddy
cd coach-buddy
cp .env.example .env
```

`.env` bei Bedarf anpassen (Passwörter, `FRONTEND_PORT`).

Der private JWT-Signierschlüssel ist **nicht** im Repository (siehe `backend/.gitignore`) und wird zur Laufzeit in den Backend-Container gemountet, statt ins Image eingebacken zu werden — er muss also lokal vorhanden und für den Container lesbar sein:

```shell
chmod 644 backend/src/main/resources/privateKey.pem
```

(`publicKey.pem` ist unkritisch und bereits im Repository enthalten.)

### 3. Stack starten

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
