#!/usr/bin/env bash
# Creates a role and a database owned by it for one app in the shared Postgres.
# Usage: ./create-app-db.sh <name> <password> [role]
# role defaults to <name>. Names must be plain identifiers (letters, digits, _).
set -euo pipefail

name="${1:?usage: $0 <name> <password> [role]}"
password="${2:?usage: $0 <name> <password> [role]}"
role="${3:-$name}"

for ident in "$name" "$role"; do
  [[ "$ident" =~ ^[a-z_][a-z0-9_]*$ ]] || { echo "invalid identifier: $ident" >&2; exit 1; }
done
[[ "$password" != *"'"* ]] || { echo "password must not contain a single quote" >&2; exit 1; }

docker exec -i postgres psql -U postgres -v ON_ERROR_STOP=1 <<SQL
CREATE ROLE "$role" LOGIN PASSWORD '$password';
CREATE DATABASE "$name" OWNER "$role";
SQL

echo "created database '$name' with role '$role'"
