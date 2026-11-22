-- Runs once, when the Postgres volume is first created: a separate database for Pest,
-- so tests run on PostgreSQL (never SQLite) without touching development data.
CREATE DATABASE exam_platform_test;
