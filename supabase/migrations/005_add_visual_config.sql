-- Migration: add visual_config JSONB column to profiles
-- Stores the fighter's chosen body archetype, skin tone, and future cosmetics.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS visual_config JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.visual_config IS
  'Fighter visual settings: { bodyId: 1-5, skinToneId: string, hairStyle?: string }';
