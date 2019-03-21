CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public".prices( id serial, created DATE, price_time timestamp, ibov_price decimal, mini_index decimal, dol decimal );

SELECT create_hypertable('prices', 'price_time');

ALTER USER postgres PASSWORD 'postgres';
