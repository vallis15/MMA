-- ─── Skill Tree Migration ──────────────────────────────────────────────────────
-- Run once in Supabase SQL Editor (or your migration tooling).
-- Adds skill_points and unlocked_skills columns to the profiles table.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skill_points    INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unlocked_skills TEXT[]    NOT NULL DEFAULT '{}';

-- Optional: add a comment so future devs understand the columns
COMMENT ON COLUMN profiles.skill_points    IS 'Unspent skill points the fighter can use to unlock skill nodes.';
COMMENT ON COLUMN profiles.unlocked_skills IS 'Array of unlocked skill node ids, e.g. {striking_1_jab_mastery}.';
