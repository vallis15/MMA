-- Migration 004: Add country_code column, clean up hardcoded 'The Champion' default
-- Stores the ISO 3166-1 alpha-2 country code chosen during Fighter Creation

-- 1. Add country_code column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.country_code IS 'ISO 3166-1 alpha-2 country code, e.g. CZ, US, BR';

-- 2. Change nickname default from 'The Champion' to NULL
--    so new accounts start with no nickname until explicitly set.
ALTER TABLE profiles
  ALTER COLUMN nickname SET DEFAULT NULL;

-- 3. Clear existing 'The Champion' placeholder so the UI shows "No nickname set"
--    instead of a fake default nickname.
UPDATE profiles
  SET nickname = NULL
  WHERE nickname = 'The Champion';
