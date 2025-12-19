-- Migration: add bathrooms column to properties
-- Adds a nullable integer column `bathrooms` to the `properties` table

ALTER TABLE IF EXISTS properties
ADD COLUMN IF NOT EXISTS bathrooms integer;
