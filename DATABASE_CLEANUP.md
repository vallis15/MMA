# Database Cleanup - Remove Fake/Bot Fighters

## 🎯 Goal
Clean the database to keep only REAL players and remove all AI/bot fighters.

## 📋 Steps to Clean Database

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this query to see current players:

```sql
SELECT id, username, reputation, wins, losses, draws, created_at
FROM profiles
ORDER BY created_at DESC;
```

4. Identify which players are REAL users vs bots/test accounts
5. Delete bot accounts (BE CAREFUL - this is permanent!):

```sql
-- Example: Delete by specific IDs
DELETE FROM profiles
WHERE id IN (
  'bot_id_1',
  'bot_id_2',
  'test_id_3'
);

-- OR: Delete by username pattern (if bots have specific naming)
DELETE FROM profiles
WHERE username LIKE 'Bot_%'
   OR username LIKE 'AI_%'
   OR username LIKE 'Test_%';
```

6. Verify remaining players:

```sql
SELECT COUNT(*) as total_players FROM profiles;
SELECT username, reputation FROM profiles ORDER BY reputation DESC;
```

### Option 2: Programmatic Cleanup (via Node.js)

Create a cleanup script `cleanup.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // Use service role for admin access

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupBots() {
  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${profiles.length} total profiles`);

  // Identify bots (customize this logic)
  const bots = profiles.filter(p => 
    p.username?.startsWith('Bot_') ||
    p.username?.startsWith('AI_') ||
    p.username?.includes('Test')
  );

  console.log(`Identified ${bots.length} bot accounts:`);
  bots.forEach(bot => console.log(`  - ${bot.username} (ID: ${bot.id})`));

  // Delete bots (uncomment when ready)
  /*
  for (const bot of bots) {
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', bot.id);
    
    if (deleteError) {
      console.error(`Failed to delete ${bot.username}:`, deleteError);
    } else {
      console.log(`✅ Deleted ${bot.username}`);
    }
  }
  */
}

cleanupBots();
```

## ⚠️ Important Safety Checks

Before deleting ANY data:

1. **Backup your database** (Supabase Dashboard → Database → Backups)
2. **Verify which accounts are real users** - check email, creation date, activity
3. **Test with dry-run first** - SELECT before DELETE
4. **Keep at least 3-5 real test accounts** for development

## 🗃️ Expected Database Schema

Your `profiles` table should have these columns:
- `id` (uuid, primary key)
- `username` (text)
- `reputation` (int)
- `wins` (int)
- `losses` (int)
- `draws` (int)
- `level` (int)
- `strength` (int)
- `speed` (int)
- `cardio` (int)
- `striking` (int)
- `grappling` (int)
- `current_energy` (int)
- `max_energy` (int)
- `created_at` (timestamp)

## 🎮 Post-Cleanup

After cleanup:
1. Verify Arena shows only real players
2. Check Rankings leaderboard is correct
3. Test matchmaking with remaining players
4. If < 6 players, matchmaking will show all available

## 📝 Notes

- The app now expects ALL fighters in `profiles` table to be real players
- No more fake AI fighters from `leaderboard.ts` or `opponents.ts`
- Those files are now deprecated and unused
- Challenge buttons in Rankings will only work if you have 50+ energy
