# 🔍 Supabase Debugging Guide

## Console Logging Reference

Comprehensive logging has been added to all Supabase operations. Open your browser's Developer Console (**F12** or **Cmd+Option+I** on Mac) to see real-time debug messages.

---

## 📊 Log Format

All console logs follow this format:

```
🔵 [OPERATION] Starting operation message
🔵 [OPERATION] Progress message
✅ [OPERATION] Success message
❌ [OPERATION] Error message with details
⚠️ [OPERATION] Warning message
```

**Legend:**
- 🔵 Blue circle = Operation starting or in progress
- ✅ Green checkmark = Success
- ❌ Red X = Error
- ⚠️ Warning = Issue but not fatal

---

## 🔐 **Authentication & Profile Creation (SIGNUP)**

### Expected Console Output When Registering:

```
🔵 [SIGNUP] Starting signup for: user@example.com
🔵 [SIGNUP] Auth response: {error: null, userId: "abc123..."}
🔵 [SIGNUP] User created successfully, creating profile...
🔵 [PROFILE CREATE] Starting profile creation for user: abc123... user@example.com
🔵 [PROFILE CREATE] Sending data to Supabase: {id: "abc123...", username: "user", striking: 40, ...}
✅ [PROFILE CREATE] Success! Profile created: [{id: "abc123...", ...}]
```

### ❌ Common Errors:

**Error 1: RLS policy violation**
```
❌ [PROFILE CREATE] Supabase error: 
  message: "new row violates row level security policy"
  code: "PGRST301"
```
**Fix:** Check that the RLS policy allows INSERT for authenticated users.

**Error 2: Foreign key constraint**
```
❌ [PROFILE CREATE] Supabase error:
  message: "insert or update on table "profiles" violates foreign key constraint"
  code: "23503"
```
**Fix:** The user ID must exist in `auth.users` table. This shouldn't happen if signup succeeded.

---

## 👤 **Loading Fighter Data (LOGIN)**

### Expected Console Output When Logging In:

```
🔵 [FIGHTER LOAD] User not ready. user: null authLoading: true
🔵 [FIGHTER LOAD] User authenticated: abc123...
🔵 [FIGHTER LOAD] Querying Supabase for profile ID: abc123...
🔵 [FIGHTER LOAD] Supabase response: {error: null, dataExists: true}
✅ [FIGHTER LOAD] Profile found! Data: {id: "abc123...", username: "user", striking: 40, ...}
✅ [FIGHTER LOAD] Fighter object created: {id: "abc123...", name: "user", stats: {...}, ...}
```

### ❌ Common Errors:

**Error 1: Profile not found**
```
🔵 [FIGHTER LOAD] Querying Supabase for profile ID: abc123...
🔵 [FIGHTER LOAD] Supabase response: {error: "No rows found", dataExists: false}
❌ [FIGHTER LOAD] Supabase error: No rows found
⚠️ [FIGHTER LOAD] No data returned, using default fighter
```
**Fix:** Ensure the profile was created during signup (see SIGNUP section above).

**Error 2: RLS policy blocks SELECT**
```
❌ [FIGHTER LOAD] Supabase error: 
  message: "permission denied for schema public"
  code: "42501"
```
**Fix:** Check that RLS policy allows SELECT for authenticated users:
```sql
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
```

---

## ⚡ **Training Sync**

### Expected Console Output After Training:

```
🔵 [TRAIN] Checking energy and stats...
  (Several combat calculation logs...)
✅ [TRAIN] Training complete! Stats updated: {energy: 85, stats: {striking: 42, ...}}
🔵 [TRAIN] Updated fighter state, syncing to Supabase...
🔵 [FIGHTER UPDATE] Updating profile ID: abc123...
🔵 [FIGHTER UPDATE] Data being sent: {
  striking: 42, grappling: 40, speed: 40, strength: 40, cardio: 40,
  energy: 85, wins: 0, losses: 0, draws: 0, reputation: 0, level: 1,
  updated_at: "2024-02-20T10:30:45.123Z"
}
✅ [FIGHTER UPDATE] Success! Updated rows: [{id: "abc123...", ...}]
```

### ❌ Common Errors:

**Error 1: Energy insufficient**
```
Not enough energy! Need 30, have 15
```
**Fix:** Train more times or wait for energy regeneration.

**Error 2: Update fails due to RLS**
```
❌ [FIGHTER UPDATE] Supabase error: 
  message: "new row violates row level security policy"
  code: "PGRST301"
```
**Fix:** Ensure RLS policy allows UPDATE for own profile:
```sql
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

## 🥊 **Fight Result Sync**

### Expected Console Output After Fighting:

```
🔵 [FIGHT] Starting fight simulation...
  (Many fight round logs...)
🔵 [FIGHT] Fight complete! Updating fighter state...
🔵 [FIGHT] Result: {winner: "player", reputationGain: 50, newRecord: {wins: 1, losses: 0, draws: 0}}
🔵 [FIGHTER UPDATE] Updating profile ID: abc123...
🔵 [FIGHTER UPDATE] Data being sent: {
  ..., wins: 1, losses: 0, draws: 0, reputation: 50, energy: 50, ...
}
✅ [FIGHTER UPDATE] Success! Updated rows: [{...}]
✅ [FIGHT] Synced to Supabase
```

---

## ⚙️ **Energy Regeneration Sync**

### Expected Console Output (Every 30 seconds):

```
🔵 [ENERGY SYNC] Energy sync interval started for user: abc123...
  (10 seconds pass with +1 energy per 10s)
🔵 [ENERGY SYNC] Syncing energy: 78 for user: abc123...
🔵 [FIGHTER UPDATE] Updating profile ID: abc123...
🔵 [FIGHTER UPDATE] Data being sent: {energy: 78, updated_at: "..."}
✅ [ENERGY SYNC] Success! Energy synced: 78 Rows updated: 1
  (Wait another 30 seconds...)
🔵 [ENERGY SYNC] Syncing energy: 82 for user: abc123...
✅ [ENERGY SYNC] Success! Energy synced: 82 Rows updated: 1
```

### ⚠️ What to watch for:

- If you see 0 rows updated, the RLS policy may be blocking updates
- If the sync stops happening, check if the interval is still running
- If energy never increases, check if regen effect is working

---

## ✅ **Full Testing Workflow with Logging**

### 1. **SIGNUP Test**
```
1. Open browser console (F12)
2. Go to /register
3. Enter email: test@example.com, password: password123
4. Click "Create Account"
5. Watch console for 🔵 → ✅ logs above
6. Check Supabase: table records, view profiles table
```

### 2. **LOGIN Test**
```
1. Go to /login
2. Login with test@example.com / password123
3. Watch console for 🔵 [FIGHTER LOAD] ... ✅ logs
4. If you see ✅ [FIGHTER LOAD] Success!, profile loaded correctly
5. Check Sidebar for stats display
```

### 3. **TRAIN Test**
```
1. Click "Gym" in sidebar
2. Click any training drill
3. Watch console for 🔵 [TRAIN] ... ✅ [FIGHTER UPDATE] logs
4. Refresh page (Ctrl+R)
5. Stats should persist (loaded from Supabase)
6. Check Admin Dashboard → User Management table shows updated stats
```

### 4. **FIGHT Test**
```
1. Click "Arena" in sidebar
2. Start a fight
3. Watch console for 🔵 [FIGHT] ... ✅ logs
4. After fight, check console for update sync
5. Refresh page
6. Record (W/L/D) should persist
7. Admin Dashboard should show updated record
```

### 5. **ENERGY SYNC Test**
```
1. Train once (energy depletes)
2. Wait 30+ seconds
3. Watch console for 🔵 [ENERGY SYNC] logs
4. Refresh page
5. Energy should match what you see in console
```

---

## 🔧 **Debugging Tips**

### Filter Console by Log Type

In browser console, you can use:
```javascript
// Show only errors
console.filter = (msg) => msg.includes('❌') || msg.includes('Error')

// Show only success
console.filter = (msg) => msg.includes('✅')

// Show only a specific operation
console.filter = (msg) => msg.includes('[FIGHTER UPDATE]')
```

### Check Network Tab

1. Open DevTools → Network tab
2. Filter by "profiles" requests
3. Each Supabase operation should show:
   - **Method:** POST (insert) or PATCH (update)
   - **Status:** 200 (success) or 4xx/5xx (error)
   - **Response:** Should contain the updated/inserted data

### Check Supabase Dashboard

1. Go to Supabase project dashboard
2. Click "SQL Editor"
3. Run this query to see all profiles:
   ```sql
   SELECT id, username, striking, grappling, speed, strength, cardio, 
          energy, wins, losses, draws, reputation, updated_at 
   FROM profiles 
   ORDER BY updated_at DESC 
   LIMIT 10;
   ```
4. Watch the `updated_at` timestamp change as you train/fight

---

## 📋 **Checklist: Everything Should Log**

- [ ] **USER SIGNUP** → See 🔵 [SIGNUP] and 🔵 [PROFILE CREATE] logs
- [ ] **PROFILE INSERT** → See ✅ [PROFILE CREATE] Success log
- [ ] **USER LOGIN** → See 🔵 [FIGHTER LOAD] logs
- [ ] **PROFILE LOAD** → See ✅ [FIGHTER LOAD] Success with data
- [ ] **TRAINING** → See 🔵 [TRAIN] and 🔵 [FIGHTER UPDATE] logs
- [ ] **FIGHTER UPDATE** → See ✅ Updated rows: 1 (means one row updated)
- [ ] **FIGHTING** → See 🔵 [FIGHT] and syncing logs
- [ ] **ENERGY REGEN** → See 🔵 [ENERGY SYNC] every 30 seconds
- [ ] **REFRESH PERSIST** → Stats/energy should persist after page refresh

---

## ⚠️ **If All Syncs Show 0 Rows Updated**

This usually means **RLS policies are too restrictive**. Check:

1. Go to Supabase SQL Editor
2. Run:
   ```sql
   -- Check current RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
3. Ensure these policies exist:
   ```sql
   CREATE POLICY "Public profiles are viewable by everyone" ON profiles
     FOR SELECT USING (true);
   
   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);
   
   CREATE POLICY "Users can insert own profile" ON profiles
     FOR INSERT WITH CHECK (auth.uid() = id);
   ```

---

## 💡 **Pro Tips**

1. **Copy Logs for Analysis:** Right-click console → Save as → txt file
2. **Check Supabase Activity Logs:** Helps confirm requests reached backend
3. **Clear Console:** Type `clear()` to clean up logs
4. **Filter Specific Logs:** CTRL+F in console to search logs
5. **Test with Fresh User:** Delete browser storage and create new account

---

**Good luck debugging! Check the console first, then Supabase dashboard, then contact support.** 🚀
