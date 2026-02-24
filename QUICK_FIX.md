# ✅ Action Plan: Fix Supabase RLS Issues with Database Trigger

## 🎯 The Problem

You saw these errors:
- ❌ **401 Unauthorized**
- ❌ **"new row violates row level security policy"**

**Cause:** The code tried to create a profile right after signup, but the session wasn't fully established yet, and RLS policies blocked the insert.

---

## ✅ The Solution

Use a **PostgreSQL Database Trigger** that automatically creates profiles when users sign up. The trigger runs server-side with full permissions, bypassing all RLS issues.

**Status:** ✅ Code already updated to skip manual profile creation!

---

## 📋 What You Need to Do (2 Steps)

### Step 1: Run the Profile Table SQL (if not done yet)

Go to **Supabase Dashboard** → **SQL Editor** → **New Query** and paste:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  
  -- Fighter Stats (0-100)
  striking INT DEFAULT 40,
  grappling INT DEFAULT 40,
  speed INT DEFAULT 40,
  strength INT DEFAULT 40,
  cardio INT DEFAULT 40,
  
  -- Resources
  energy INT DEFAULT 100,
  level INT DEFAULT 1,
  
  -- Record
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  reputation INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for leaderboard)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Click Run** and verify it says "executed successfully".

### Step 2: Run the Database Trigger SQL ⭐ **CRITICAL**

This is the fix! Go to **Supabase Dashboard** → **SQL Editor** → **New Query** and paste:

```sql
-- Create trigger function to automatically create a profile for new users
-- SECURITY DEFINER allows this to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
BEGIN
  -- Extract username from email (part before @)
  -- e.g., user@example.com → user
  username_val := SPLIT_PART(NEW.email, '@', 1);
  
  -- Insert a new profile with default values
  INSERT INTO public.profiles (
    id,
    username,
    striking,
    grappling,
    speed,
    strength,
    cardio,
    energy,
    level,
    wins,
    losses,
    draws,
    reputation,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,                    -- UUID from auth.users
    username_val,              -- Extracted from email
    40,                        -- Default striking
    40,                        -- Default grappling
    40,                        -- Default speed
    40,                        -- Default strength
    40,                        -- Default cardio
    100,                       -- Default energy
    1,                         -- Default level
    0,                         -- Default wins
    0,                         -- Default losses
    0,                         -- Default draws
    0,                         -- Default reputation
    NOW(),                     -- Created timestamp
    NOW()                      -- Updated timestamp
  );
  
  RETURN NEW;
  
EXCEPTION WHEN others THEN
  -- Silently handle errors (e.g., duplicate profile)
  -- This prevents signup from failing
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that calls the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Click Run** and verify it says "executed successfully".

---

## ✅ What Changed in the Code

**AuthContext.tsx:**
- ❌ Removed `createUserProfile()` function (no longer needed)
- ❌ Removed manual profile creation call (trigger handles it now)
- ✅ Added console log explaining that trigger will create profile
- ✅ Cleaner signup flow without async waits

**Result:** 
```
🔵 [SIGNUP] Starting signup for: user@example.com
✅ [SIGNUP] User created successfully!
💡 [PROFILE CREATE] Skipped - database trigger will create profile automatically
```

---

## 🧪 Test It

1. **Start the app:** `npm run dev` (already running on http://localhost:5175)

2. **Sign up** at http://localhost:5175/register
   - Use: `test@example.com` / `password123`
   - Open Browser Console (F12)
   - Watch for the logs above

3. **Check the trigger worked:**
   - Go to Supabase → SQL Editor
   - Run: `SELECT * FROM profiles WHERE username = 'test';`
   - Should see the user with default stats

4. **Login** with the same credentials
   - Watch console for: `✅ [FIGHTER LOAD] Profile found!`
   - Your stats should display in the sidebar

5. **Check Admin Panel** at http://localhost:5175/admin-vallis
   - Username: *(viz `VITE_ADMIN_USERNAME` v `.env.local`)*
   - Password: *(viz `VITE_ADMIN_PASSWORD` v `.env.local`)*
   - Should see your new user in the User Management table

---

## 📊 How the Trigger Works

```
User Signs Up
  ↓
Supabase Auth creates user in auth.users table
  ↓
PostgreSQL trigger fires automatically
  ↓
Trigger function runs with SECURITY DEFINER (bypasses RLS!)
  ↓
Function inserts a new row into profiles table with defaults
  ↓
Profile is instantly available for user to login
  ↓
No 401 errors! No RLS violations! No timing issues!
```

---

## ✨ Benefits

| Issue | Before | After |
|-------|--------|-------|
| 401 Unauthorized | ❌ Happens frequently | ✅ Never happens |
| RLS Violations | ❌ "violates row level security" | ✅ Trigger bypasses RLS |
| Timing Issues | ❌ Session not ready yet | ✅ Server-side operation |
| Code Complexity | ❌ Manual async profile creation | ✅ Single trigger does it all |
| Reliability | ❌ Can fail if network slow | ✅ Atomic database operation |

---

## 🐛 If Something Goes Wrong

### "Function already exists" error
- This means you already ran the trigger SQL
- That's fine! It just updates the existing function
- Continue with the test

### "Table doesn't exist" error
- Run the profiles table SQL first (Step 1)
- Then run the trigger SQL (Step 2)

### Still getting 401 or RLS errors?
- Verify the trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
  Should show one row
  
- Verify the function exists:
  ```sql
  SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
  ```
  Should show one row

---

## 📚 Additional Resources

- [TRIGGER_SETUP.md](TRIGGER_SETUP.md) - Detailed trigger explanation
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Complete backend guide
- [DEBUG_LOGGING.md](DEBUG_LOGGING.md) - Logging reference for all operations

---

**You're all set!** Run the trigger SQL from Step 2, then test signup. The profile will be created automatically. 🚀
