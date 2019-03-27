FROM timescale/timescaledb:latest-pg11
COPY startup.sql /docker-entrypoint-initdb.d/