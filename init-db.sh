#!/bin/bash
set -e

# Crea la base de datos principal y la base de datos shadow
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE cpe_system;
    CREATE DATABASE cpe_system_shadow;
EOSQL
