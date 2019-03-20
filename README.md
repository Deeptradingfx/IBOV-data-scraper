# IBOV-data-scraper
Data scraper for IBOVESPA data

### Architecture

![alt text](https://raw.githubusercontent.com/xlucasdemelo/IBOV-data-scraper/master/architecture.png)

### Setting up timescale-db

1. Run it via docker

```
docker run -d --name ibov-timescale -v $(pwd)/timescale-data:/var/lib/postgresql/data -p 5432:5432 --env TIMESCALEDB_TELEMETRY=off -e POSTGRES_PASSWORD=postgres timescale/timescaledb:latest-pg11
```

2. Log in to container and create database

```
docker exec -it ibov-timescale bash

psql -U postgres

CREATE DATABASE ibov;

```

3. execute startup.sql to create tables

```
\i path/to/startup.sql

```
