# Supabase Database Trigger Setup

## 🔧 Auto-Create Profiles Using PostgreSQL Trigger

This SQL creates a database trigger that **automatically** creates a profile whenever a new user signs up. This bypasses all RLS policy and timing issues.

### Copy and Run This SQL in Supabase SQL Editor

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

### Steps to Apply:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project: `vfetkdnqcpqoknzwbxyw`

2. **Go to SQL Editor**
   - Click **SQL Editor** (left sidebar)
   - Click **New Query** (top right)

3. **Paste the SQL Above**
   - Copy entire SQL block above (all three parts)
   - Paste into the editor
   - Click **Run** (or Ctrl+Enter)

4. **Verify Success**
   - Should see: "function handle_new_user() ... created successfully"
   - Should see: "trigger on_auth_user_created created successfully"
   - No error messages

### How It Works

```
User signs up with email → Supabase Auth creates auth.users entry
                          ↓
                    PostgreSQL Trigger fires
                          ↓
              Function runs with SECURITY DEFINER
                    (bypasses RLS!)
                          ↓
         Automatically creates profiles row with defaults
                          ↓
        User login → FighterContext loads profile instantly
```

### What This Fixes

✅ **No 401 Unauthorized** - Trigger runs server-side with full permissions  
✅ **No RLS Violations** - SECURITY DEFINER bypasses all RLS policies  
✅ **No Timing Issues** - Profile created before signup completes  
✅ **No Client-Side Logic** - AuthContext doesn't need to create profiles  
✅ **More Robust** - Works even if client crashes during signup  

---

## Verification

After running the SQL, test it:

1. **Create a new user** via `/register`
2. **Check Supabase SQL Editor:**
   ```sql
   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
   ```
   Should show the newly created profile with default stats

3. **Check AuthContext logs** (browser F12)
   - Should see: `✅ [PROFILE CREATE] Skipped - relying on DB trigger`
   - Should still see: `✅ [FIGHTER LOAD] Profile found!`

---

## Troubleshooting

### Error: "auth.users" does not exist
This shouldn't happen - `auth.users` is the Supabase standard auth table. Try refreshing the SQL editor.

### Error: "profiles" table does not exist
Make sure you created the profiles table first using the original SQL from BACKEND_SETUP.md.

### Error: invalid syntax
Make sure you copied the **entire** SQL block (all three parts: function, drop trigger, create trigger).

---

**Done!** After running this SQL, the AuthContext.tsx has been updated to skip manual profile creation and rely on the trigger instead. ✨
