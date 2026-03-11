-- Migration: add has_character flag to profiles
-- Tracks whether a user has completed the character creation flow.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS has_character BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.has_character IS
  'TRUE once the FighterInitialization flow has been completed. Used to gate access to game routes.';

-- Backfill: mark existing accounts with a saved visual_config as already having a character.
UPDATE profiles
  SET has_character = TRUE
  WHERE visual_config IS NOT NULL
    AND (has_character IS NULL OR has_character = FALSE);

-- ─── Admin helper: reset a single user back to "fresh" state ─────────────────
-- Usage (Supabase SQL editor):
--   SELECT admin_reset_character('<user-uuid>');

CREATE OR REPLACE FUNCTION admin_reset_character(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    has_character = FALSE,
    visual_config = NULL,
    updated_at    = NOW()
  WHERE id = target_user_id;
END;
$$;

-- ─── Admin helper: reset ALL users (run manually when needed) ─────────────────
-- Usage (Supabase SQL editor):
--   SELECT admin_reset_all_characters();

CREATE OR REPLACE FUNCTION admin_reset_all_characters()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE profiles
  SET
    has_character = FALSE,
    visual_config = NULL,
    updated_at    = NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
