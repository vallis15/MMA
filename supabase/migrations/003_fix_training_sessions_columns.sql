-- ════════════════════════════════════════════════════════════════════════════
-- Migration: 003_fix_training_sessions_columns.sql
-- Přidává VŠECHNY chybějící sloupce do training_sessions
-- (tabulka byla vytvořena ze starší verze schématu bez těchto sloupců)
-- Spustit jednou v Supabase SQL Editoru.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS exercise_id         TEXT     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tier                TEXT     NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS money_cost          INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stat_changes        JSONB    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skill_point_awarded BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fighter_level       INTEGER  NOT NULL DEFAULT 1;

-- Odstraní DEFAULT z exercise_id (nové inserty musí vždy posílat hodnotu)
ALTER TABLE training_sessions
  ALTER COLUMN exercise_id DROP DEFAULT;

-- Znovu načti schema cache (PostgREST uvidí nové sloupce okamžitě)
NOTIFY pgrst, 'reload schema';
