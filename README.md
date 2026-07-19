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

Die JWT-Schlüssel sind **nicht** im Repository (siehe `backend/.gitignore`) und müssen vor dem Build manuell an ihren Platz kopiert werden:

- `backend/src/main/resources/privateKey.pem`
- `backend/src/main/resources/publicKey.pem`

### 3. Stack bauen und starten

```shell
docker compose up -d --build
```

Das baut Backend (Maven-Multi-Stage-Build) und Frontend (Node-Build + nginx) direkt aus dem Quellcode — auf dem Pi ist dafür weder Java/Maven noch Node nötig. Danach ist die App unter `http://<pi-ip>:${FRONTEND_PORT:-80}/` erreichbar (im Docker-Netz spricht das Frontend intern mit dem `backend`-Service, kein Port davon ist nach außen offen).

Login mit dem seed-Account `admin` / `ChangeMe123!` (definiert in [`V8__create_account_table.sql`](backend/src/main/resources/db/migration/V8__create_account_table.sql)). Eine Passwortänderung über die App gibt es aktuell nicht — bei Bedarf direkt in der Datenbank über `UPDATE coach_buddy.account SET password_hash = crypt('<neues-passwort>', gen_salt('bf')) WHERE username = 'admin';`.

### Updates einspielen

```shell
git pull
docker compose up -d --build
```

## License

This project is licensed under the terms of the [MIT license](LICENSE).
