-- ════════════════════════════════════════════════════════════════════════════
-- Migration: 002_automation_and_history.sql
-- Přidává kompletní historii zápasů, tréninkové logy, rozšíření profilu
-- a seed AI fighterů do leaderboardu.
-- Spustit jednou v Supabase SQL Editoru.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Rozšíření tabulky profiles ───────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nickname              TEXT          DEFAULT 'The Champion',
  ADD COLUMN IF NOT EXISTS experience            INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_fights          INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wins_by_ko            INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wins_by_submission    INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wins_by_decision      INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses_by_ko          INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses_by_submission  INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses_by_decision    INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_damage_dealt    BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_damage_taken    BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hits_landed     BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_training_sessions INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_fight_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_training_at      TIMESTAMPTZ;

COMMENT ON COLUMN profiles.nickname               IS 'Fighter nickname / alias';
COMMENT ON COLUMN profiles.experience             IS 'Accumulated XP used for level display';
COMMENT ON COLUMN profiles.total_fights           IS 'Total fights played (wins + losses + draws)';
COMMENT ON COLUMN profiles.wins_by_ko             IS 'Wins via Knockout or TKO';
COMMENT ON COLUMN profiles.wins_by_submission     IS 'Wins via Submission';
COMMENT ON COLUMN profiles.wins_by_decision       IS 'Wins via Judges Decision';
COMMENT ON COLUMN profiles.losses_by_ko           IS 'Losses via Knockout or TKO';
COMMENT ON COLUMN profiles.losses_by_submission   IS 'Losses via Submission';
COMMENT ON COLUMN profiles.losses_by_decision     IS 'Losses via Judges Decision';
COMMENT ON COLUMN profiles.total_damage_dealt     IS 'Lifetime cumulative damage dealt in fights';
COMMENT ON COLUMN profiles.total_damage_taken     IS 'Lifetime cumulative damage taken in fights';
COMMENT ON COLUMN profiles.total_hits_landed      IS 'Lifetime total hits landed';
COMMENT ON COLUMN profiles.total_training_sessions IS 'Total training sessions completed';
COMMENT ON COLUMN profiles.last_fight_at          IS 'Timestamp of last fight';
COMMENT ON COLUMN profiles.last_training_at       IS 'Timestamp of last training session';


-- ─── 2. Tabulka fight_history ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fight_history (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id          UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id         UUID,                          -- NULL = AI opponent
  opponent_name       TEXT          NOT NULL,
  opponent_nickname   TEXT,
  result              TEXT          NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  method              TEXT          NOT NULL,        -- 'Knockout', 'Submission — X', "Judges' Decision"
  method_category     TEXT          NOT NULL CHECK (method_category IN ('ko', 'submission', 'decision')),
  rounds_completed    INTEGER       NOT NULL DEFAULT 1,
  damage_dealt        INTEGER       NOT NULL DEFAULT 0,
  damage_taken        INTEGER       NOT NULL DEFAULT 0,
  hits_landed         INTEGER       NOT NULL DEFAULT 0,
  hits_received       INTEGER       NOT NULL DEFAULT 0,
  energy_cost         INTEGER       NOT NULL DEFAULT 0,
  reputation_gain     INTEGER       NOT NULL DEFAULT 0,
  xp_gain             INTEGER       NOT NULL DEFAULT 0,
  fighter_level       INTEGER       NOT NULL DEFAULT 1,
  fighter_reputation  INTEGER       NOT NULL DEFAULT 0,
  -- snapshot fighter stats at fight time (for analytics)
  snap_strength       INTEGER,
  snap_speed          INTEGER,
  snap_cardio         INTEGER,
  snap_striking       INTEGER,
  snap_grappling      INTEGER,
  -- opponent stats snapshot
  opp_snap_strength   INTEGER,
  opp_snap_speed      INTEGER,
  opp_snap_cardio     INTEGER,
  opp_snap_striking   INTEGER,
  opp_snap_grappling  INTEGER,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index pro rychlé načítání historky konkrétního hráče
CREATE INDEX IF NOT EXISTS fight_history_fighter_idx   ON fight_history(fighter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fight_history_opponent_idx  ON fight_history(opponent_id) WHERE opponent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fight_history_result_idx    ON fight_history(fighter_id, result);

COMMENT ON TABLE fight_history IS 'Záznamy každého odehraného zápasu s kompletními statistikami.';


-- ─── 3. Tabulka training_sessions ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_sessions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id      UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id     TEXT          NOT NULL,
  exercise_name   TEXT          NOT NULL,
  category        TEXT          NOT NULL,   -- 'striking' | 'wrestling' | 'bjj' | 'physical'
  tier            TEXT          NOT NULL,   -- 'single' | 'dual' | 'complex' | 'hybrid'
  energy_cost     INTEGER       NOT NULL DEFAULT 0,
  money_cost      INTEGER       NOT NULL DEFAULT 0,
  stat_changes    JSONB         NOT NULL DEFAULT '{}',   -- {jab_precision: 4, ...}
  skill_point_awarded BOOLEAN   NOT NULL DEFAULT false,
  fighter_level   INTEGER       NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_sessions_fighter_idx ON training_sessions(fighter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS training_sessions_category_idx ON training_sessions(fighter_id, category);

COMMENT ON TABLE training_sessions IS 'Log každého tréninkového cvičení — pro statistiky a analýzy.';


-- ─── 4. Tabulka leaderboard_fighters (AI/seed data) ──────────────────────────

CREATE TABLE IF NOT EXISTS leaderboard_fighters (
  id            TEXT          PRIMARY KEY,   -- např. 'ai_1'
  name          TEXT          NOT NULL,
  nickname      TEXT          NOT NULL,
  avatar_emoji  TEXT          NOT NULL DEFAULT '🥊',
  wins          INTEGER       NOT NULL DEFAULT 0,
  losses        INTEGER       NOT NULL DEFAULT 0,
  draws         INTEGER       NOT NULL DEFAULT 0,
  reputation    INTEGER       NOT NULL DEFAULT 0,
  level         INTEGER       NOT NULL DEFAULT 1,
  strength      INTEGER       NOT NULL DEFAULT 50,
  speed         INTEGER       NOT NULL DEFAULT 50,
  cardio        INTEGER       NOT NULL DEFAULT 50,
  striking      INTEGER       NOT NULL DEFAULT 50,
  grappling     INTEGER       NOT NULL DEFAULT 50,
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE leaderboard_fighters IS 'AI/seed bojovníci pro leaderboard a matchmaking — aktualizovatelné přes админ dashboard.';


-- ─── 5. Seed AI leaderboard fighters ─────────────────────────────────────────

INSERT INTO leaderboard_fighters (id, name, nickname, avatar_emoji, wins, losses, draws, reputation, level, strength, speed, cardio, striking, grappling)
VALUES
  ('ai_1',  'Alexander Volkov',    'The Russian Bear',  '🐻', 47, 3,  1, 4700, 45, 89, 72, 80, 85, 78),
  ('ai_2',  'Kenji Tanaka',        'The Tsunami',       '🌊', 42, 5,  2, 4200, 42, 78, 82, 88, 82, 85),
  ('ai_3',  'Diego Reyes',         'El Fuego',          '🔥', 38, 8,  1, 3800, 38, 75, 79, 82, 84, 72),
  ('ai_4',  'Jade Chen',           'Dragon Striker',    '🐉', 35, 7,  3, 3500, 35, 70, 88, 78, 87, 68),
  ('ai_5',  'Marcus Johnson',      'The Machine',       '⚙️', 32, 9,  2, 3200, 32, 77, 72, 90, 75, 82),
  ('ai_6',  'Sofia Petrov',        'Ice Queen',         '❄️', 28, 12, 1, 2800, 28, 68, 82, 79, 81, 74),
  ('ai_7',  'Carlos Santos',       'The King',          '👑', 24, 16, 3, 2400, 24, 72, 70, 76, 78, 70),
  ('ai_8',  'Isabella Romano',     'Rose of Rome',      '🌹', 21, 18, 2, 2100, 21, 65, 75, 72, 76, 68),
  ('ai_9',  'Ravi Patel',          'Thunder Fist',      '⚡', 18, 22, 4, 1800, 18, 70, 68, 74, 72, 65),
  ('ai_10', 'Olaf Erikson',        'The Viking',        '🛡️', 16, 25, 3, 1600, 16, 82, 62, 70, 68, 72),
  ('ai_11', 'Yuki Sato',           'Silent Storm',      '🌸', 15, 25, 5, 1500, 15, 62, 78, 75, 74, 70),
  ('ai_12', 'Bruce Montgomery',    'The Bulldozer',     '🦏', 14, 26, 2, 1400, 14, 80, 62, 68, 65, 78),
  ('ai_13', 'Amara Diallo',        'The Warrior',       '⚔️', 13, 27, 4, 1300, 13, 68, 70, 72, 70, 68),
  ('ai_14', 'Pavel Horak',         'Iron Jaw',          '🪨', 12, 28, 6, 1200, 12, 74, 65, 70, 68, 72),
  ('ai_15', 'Luna Vasquez',        'La Pantera',        '🐆', 11, 29, 5, 1100, 11, 62, 75, 68, 73, 65)
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  nickname     = EXCLUDED.nickname,
  avatar_emoji = EXCLUDED.avatar_emoji,
  wins         = EXCLUDED.wins,
  losses       = EXCLUDED.losses,
  draws        = EXCLUDED.draws,
  reputation   = EXCLUDED.reputation,
  level        = EXCLUDED.level,
  strength     = EXCLUDED.strength,
  speed        = EXCLUDED.speed,
  cardio       = EXCLUDED.cardio,
  striking     = EXCLUDED.striking,
  grappling    = EXCLUDED.grappling;


-- ─── 6. Row Level Security ────────────────────────────────────────────────────

ALTER TABLE fight_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_fighters ENABLE ROW LEVEL SECURITY;

-- fight_history: hráč vidí jen své záznamy, INSERT jen pro svůj id
DROP POLICY IF EXISTS "fight_history_select_own" ON fight_history;
CREATE POLICY "fight_history_select_own"
  ON fight_history FOR SELECT
  USING (fighter_id = auth.uid());

DROP POLICY IF EXISTS "fight_history_insert_own" ON fight_history;
CREATE POLICY "fight_history_insert_own"
  ON fight_history FOR INSERT
  WITH CHECK (fighter_id = auth.uid());

-- training_sessions: hráč vidí jen své záznamy
DROP POLICY IF EXISTS "training_sessions_select_own" ON training_sessions;
CREATE POLICY "training_sessions_select_own"
  ON training_sessions FOR SELECT
  USING (fighter_id = auth.uid());

DROP POLICY IF EXISTS "training_sessions_insert_own" ON training_sessions;
CREATE POLICY "training_sessions_insert_own"
  ON training_sessions FOR INSERT
  WITH CHECK (fighter_id = auth.uid());

-- leaderboard_fighters: veřejné čtení, zápis jen pro adminy (service_role)
DROP POLICY IF EXISTS "leaderboard_fighters_select_all" ON leaderboard_fighters;
CREATE POLICY "leaderboard_fighters_select_all"
  ON leaderboard_fighters FOR SELECT
  USING (true);


-- ─── 7. Trigger: automaticky aktualizuj profiles.updated_at ──────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pouze pokud trigger ještě neexistuje na profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_profiles_updated_at'
      AND tgrelid = 'profiles'::regclass
  ) THEN
    CREATE TRIGGER trg_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ─── 8. View: leaderboard_combined (hráči + AI dohromady) ────────────────────

CREATE OR REPLACE VIEW leaderboard_combined AS
-- Realní hráči z profiles
SELECT
  id::TEXT                AS id,
  username                AS name,
  COALESCE(nickname, 'The Champion') AS nickname,
  wins, losses, draws,
  reputation,
  level,
  'player'::TEXT          AS fighter_type,
  NULL::TEXT              AS avatar_emoji
FROM profiles
WHERE username IS NOT NULL

UNION ALL

-- AI fighters
SELECT
  id, name, nickname,
  wins, losses, draws,
  reputation, level,
  'ai'::TEXT              AS fighter_type,
  avatar_emoji
FROM leaderboard_fighters
WHERE is_active = true

ORDER BY reputation DESC;

COMMENT ON VIEW leaderboard_combined IS 'Kombinovaný leaderboard: realní hráči + AI bojovníci, seřazeni podle reputace.';

-- Přístup k view pro autentizované uživatele
GRANT SELECT ON leaderboard_combined TO authenticated;
GRANT SELECT ON leaderboard_fighters  TO authenticated;
GRANT SELECT ON fight_history         TO authenticated;
GRANT SELECT ON training_sessions     TO authenticated;
GRANT INSERT ON fight_history         TO authenticated;
GRANT INSERT ON training_sessions     TO authenticated;
