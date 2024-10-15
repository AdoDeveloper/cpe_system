# Usa la imagen oficial de PostgreSQL
FROM postgres:latest

# Configura las variables de entorno
ENV POSTGRES_USER=username
ENV POSTGRES_PASSWORD=password
ENV POSTGRES_DB=cpe_system

# Crea las bases de datos adicionales al iniciar el contenedor
COPY init-db.sh /docker-entrypoint-initdb.d/

# Exponemos el puerto de PostgreSQL
EXPOSE 5432
