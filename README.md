# Coach Buddy

Coach Buddy is a training and team management app with a Quarkus backend and an Angular frontend, backed by PostgreSQL.

## Project structure

- [`backend/`](backend) — Quarkus REST API ([backend/README.md](backend/README.md))
- [`frontend/`](frontend) — Angular application ([frontend/README.md](frontend/README.md))
- [`docs/`](docs) — API documentation (OpenAPI spec)

## Getting started

1. Copy `.env.example` to `.env` and adjust the values if needed.
2. Start the database:

   ```shell
   docker compose up -d
   ```

3. Run the backend and frontend as described in their respective READMEs.

## License

This project is licensed under the terms of the [MIT license](LICENSE).
