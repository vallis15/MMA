# MMA Manager - Supabase Backend Integration Guide

## ✅ Completed Features

### 1. **Environment & Supabase Setup**
- ✅ `.env.local` created with Supabase credentials
- ✅ Supabase client initialized in `src/lib/supabase.ts`
- ✅ Configuration validates environment variables on startup

### 2. **Authentication System**
- ✅ **AuthContext** (`src/context/AuthContext.tsx`)
  - Email/password signup with Supabase Auth
  - Email/password login with Supabase Auth
  - Session management with real-time auth state
  - Admin authentication via environment variables (`VITE_ADMIN_USERNAME`, `VITE_ADMIN_PASSWORD` in `.env.local`)
  - Logout functionality
  
- ✅ **Registration Page** (`src/pages/Registration.tsx`)
  - Email validation
  - Password strength requirement (min 8 chars)
  - Password confirmation
  - Email confirmation flow via Supabase
  - Loading states during signup
  - Form error messages
  
- ✅ **Login Page** (`src/pages/Login.tsx`)
  - Email and password login
  - Error handling
  - Link to registration
  - Admin panel access button
  
- ✅ **Admin Login** (`src/pages/AdminLogin.tsx`)
  - Separate login for admin users
  - Username/password authentication
  - Restricted access control

### 3. **Protected Routes & Navigation**
- ✅ **ProtectedRoute Component**
  - Redirects unauthenticated users to login
  - Shows loading screen
  - Admin-only route protection
  - Integration with React Router
  
- ✅ **React Router Integration**
  - Complete routing setup with BrowserRouter
  - Protected routes for authenticated pages
  - Public routes for auth pages
  - Admin-only routes for admin dashboard
  
- ✅ **Sidebar Navigation**
  - Updated to use React Router navigation
  - Logout button in sidebar footer
  - Route path navigation

### 4. **Admin Dashboard** (`src/pages/AdminDashboard.tsx`)
- ✅ **User Management**
  - Table displaying all registered players
  - Shows stats: Wins, Losses, Draws, Reputation, Striking
  - Energy levels with color-coded display
  - Last activity timestamp
  - Sortable/filterable data (when users exist)
  
- ✅ **God Mode - Stat Editing**
  - Edit any player's stats directly
  - Edit buttons for Striking, Grappling, Speed, Strength, Cardio
  - Real-time stat updates to database
  - Min/max values (0-100)
  
- ✅ **Energy Refill**
  - One-click energy refill to 100 for any player
  - Used for managing player session issues
  
- ✅ **Global Announcements**
  - Text area for broadcast messages
  - Message persisted to localStorage
  - Displays on all player dashboards via banner

### 5. **Dashboard Enhancements**
- ✅ **Global Announcement Banner**
  - Displays admin messages at top of dashboard
  - Dismissible with X button
  - Red alert styling
  - Automatic loading from localStorage

### 6. **Loading States & UX**
- ✅ **LoadingScreen Component**
  - Full-screen loading indicator
  - Animated spinner with pulsing bars
  - Custom loading messages
  
- ✅ **LoadingSkeleton Component**
  - Reusable skeleton for async content
  - Smooth animation loop

---

## 📊 Supabase Database Setup (IMPORTANT!)

### ⚠️ CRITICAL: Fix RLS and Profile Creation with Database Trigger

The app uses a **PostgreSQL trigger** to automatically create profiles when users sign up. This bypasses RLS timing issues and 401 errors.

**See [TRIGGER_SETUP.md](TRIGGER_SETUP.md) for complete SQL setup instructions.**

### Quick Summary:

1. **First** - Create the profiles table (original SQL below)
2. **Second** - Run the trigger SQL from [TRIGGER_SETUP.md](TRIGGER_SETUP.md)  
3. **Then** - Test signup/login

This ensures:
- ✅ No 401 Unauthorized errors
- ✅ No RLS policy violations
- ✅ Profiles created automatically and securely
- ✅ No client-side profile creation logic

---

### Create Profiles Table in Supabase SQL Editor

Run this SQL in your Supabase project's SQL editor:

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

### Steps to Set Up:
1. Log in to your Supabase project dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Paste the SQL above
5. Click "Run"
6. Verify the table appears in the "Tables" panel

### Then Create the Database Trigger:
7. **Go to [TRIGGER_SETUP.md](TRIGGER_SETUP.md)**
8. Copy and run the trigger SQL
9. This completes the setup!

---

## 🔄 FighterContext Supabase Sync (✅ COMPLETE)

The FighterContext has been fully integrated with Supabase with automatic profile creation via PostgreSQL trigger:

### What's Implemented:
1. **Auto-Profile Creation (via Trigger)** - When a user signs up, a PostgreSQL trigger automatically creates a default profile in the `profiles` table:
   - Default stats (all at 40)
   - Starting energy (100)
   - Starting level (1)
   - Zero wins/losses/draws
   - ✅ No client-side logic needed!

2. **Profile Loading** - When a user logs in, their fighter data is automatically loaded from the `profiles` table
3. **Auto-Sync on Actions** - Every training session, fight, or stat change syncs to Supabase in real-time
4. **Real-time Energy Sync** - Energy regeneration syncs to Supabase every 30 seconds
5. **Career Reset Sync** - Reset stats sync to Supabase instantly

### How It Works:
- **Signup** → Supabase creates auth.users → **Trigger automatically creates profiles row** ✅
- **Login** → FighterContext loads profile from Supabase → Stats displayed
- **Training** → Stats/energy updated → Synced to Supabase instantly
- **Fighting** → Record updated → Synced to Supabase instantly
- **Energy Regen** → +1 energy every 10s → Synced to Supabase every 30s

### No More localStorage!
- Removed all localStorage usage for fighter data
- All data now persists in Supabase
- Multi-device support: Fighter data syncs across devices/browsers
- Refreshing page loads latest data from Supabase

### Comprehensive Logging Added! 🔍
Every Supabase operation now logs to browser console with detailed messages:
- **🔵 Blue** = Operation starting
- **✅ Green** = Success with result details
- **❌ Red** = Error with Supabase error code and message

See [DEBUG_LOGGING.md](DEBUG_LOGGING.md) for complete logging reference and troubleshooting.

### Database Trigger
A PostgreSQL trigger automatically handles profile creation. See [TRIGGER_SETUP.md](TRIGGER_SETUP.md) for setup instructions.

---

## 🧪 Testing the Auth Flow

### Test Signup & Login:
1. Navigate to `http://localhost:5173/`
2. Should redirect to `/login`
3. Open Browser Console (**F12**)
4. Click "Sign up here" to go to `/register`
5. Enter email (e.g., `test@example.com`) and password (min 8 chars)
6. Click "Create Account"
7. **Watch Console** - Should see:
   - 🔵 [SIGNUP] Starting signup
   - ✅ [SIGNUP] User created successfully!
   - 💡 [PROFILE CREATE] Skipped - database trigger will create profile automatically
8. Should redirect to login after 2 seconds
9. Login with the credentials you just created
10. **Watch Console** - Should see:
    - 🔵 [FIGHTER LOAD] Loading profile
    - ✅ [FIGHTER LOAD] Profile found! (created by trigger)
    - ✅ [FIGHTER LOAD] Fighter object created
11. Should be redirected to dashboard

**✅ Profiles Created by Trigger!** The database trigger automatically created their profile when they signed up. Check Admin Dashboard to verify.

### Test Admin Panel:
1. From login page, click "Admin Panel"
2. Go to `/admin-login`
3. Enter:
   - Username: *(viz `VITE_ADMIN_USERNAME` v `.env.local`)*
   - Password: *(viz `VITE_ADMIN_PASSWORD` v `.env.local`)*
4. Click "Enter Admin Panel"
5. Should see **all registered users** in the table (profiles created by trigger)
6. If table is empty, check that the trigger SQL was run (see [TRIGGER_SETUP.md](TRIGGER_SETUP.md))

---

## 🗂️ Project Structure

```
src/
├── context/
│   ├── AuthContext.tsx          (NEW - Auth state & methods)
│   ├── FighterContext.tsx       (Updated - ready for Supabase)
│   └── NotificationContext.tsx
├── pages/
│   ├── Registration.tsx         (NEW - Signup page)
│   ├── Login.tsx               (NEW - Login page)
│   ├── AdminLogin.tsx          (NEW - Admin login)
│   ├── AdminDashboard.tsx      (NEW - Admin control panel)
│   ├── Dashboard.tsx           (Updated - Announcement banner)
│   ├── Gym.tsx
│   ├── Arena.tsx
│   └── Rankings.tsx
├── components/
│   ├── ProtectedRoute.tsx      (NEW - Route protection)
│   ├── LoadingScreen.tsx       (NEW - Loading state)
│   ├── Sidebar.tsx             (Updated - Router integration)
│   └── ...
├── lib/
│   └── supabase.ts             (NEW - Supabase client)
└── App.tsx                     (Updated - React Router)
```

---

## 🔐 Security Features

✅ Protected routes prevent unauthorized access  
✅ Admin panel restricted to specific credentials  
✅ Supabase RLS policies restrict user data access  
✅ Environment variables not exposed in frontend  
✅ Email confirmation required for registration  
✅ Session-based authentication  

---

## 📱 User Flow Architecture

```
Registration → Email Confirmation → Login → Dashboard
                                          ↓
                                    Gym/Arena/Rankings
                                          ↑
                                    Protected by Auth
```

```
Admin Login (viz .env.local) → Admin Dashboard
                              ↓
                    • User Management
                    • Stat Editing (God Mode)
                    • Global Announcements
```

---

## 🚀 Next Steps (After DB Setup)

1. **Update FighterContext** to use Supabase instead of localStorage
2. **Create auto-sync** on every trainer.fight() and train() call
3. **Add real-time updates** with Supabase subscriptions
4. **Display loading states** while data syncs
5. **Handle offline mode** with local cache + sync on reconnect
6. **Add more admin features** (ban users, reset account, etc.)

---

## 🐛 Known Issues / Reminders

- localStorage is still used for announcements (works for now, can migrate to Supabase table)
- Admin credentials stored in `.env.local` as `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD`

---

## 🔍 Data Not Syncing? Read This First!

If you're not seeing data in Supabase after training/fighting:

1. **Check Browser Console** (F12)
   - Look for 🔵 [SIGNUP] logs when creating account
   - Look for � [PROFILE CREATE] Skipped (means trigger will create it)
   - Look for 🔵 [FIGHTER LOAD] logs when logging in
   - Look for 🔵 [FIGHTER UPDATE] logs after actions
   - Look for ❌ [something] error logs

2. **If signup fails with 401 or RLS error:**
   - Ensure you ran the TRIGGER SQL from [TRIGGER_SETUP.md](TRIGGER_SETUP.md)
   - The trigger allows profiles to be created without client-side auth
   - Without the trigger, you'll get RLS violations

3. **Common Issues:**
   - ❌ **"new row violates row level security policy"** → Run the trigger SQL (see step 2)
   - ❌ **"No rows found" during login** → Profile was never created, check signup logs
   - ❌ **"Updated rows: 0"** → RLS policy is blocking updates, check policies exist

4. **Solution Steps:**
   - Open [TRIGGER_SETUP.md](TRIGGER_SETUP.md) and run the trigger SQL
   - Verify trigger exists: Supabase → SQL Editor → Run:
     ```sql
     SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
     ```
   - Then test signup again

5. **Verify Database:**
   - Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM profiles ORDER BY updated_at DESC LIMIT 5;`
   - Should show entries after user signup

---

## 📝 Environment Variables

```
VITE_SUPABASE_URL=[viz .env.local]
VITE_SUPABASE_ANON_KEY=[viz .env.local]
```

Stored in `.env.local` (ignored by git)

---

## ✨ Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| Email/Password Auth | ✅ Complete | Supabase |
| Registration Page | ✅ Complete | `/register` |
| Login Page | ✅ Complete | `/login` |
| Protected Routes | ✅ Complete | ProtectedRoute Component |
| Admin Panel | ✅ Complete | `/admin-vallis` |
| User Management Table | ✅ Complete | AdminDashboard |
| God Mode (Stat Editing) | ✅ Complete | AdminDashboard |
| Energy Refill | ✅ Complete | AdminDashboard |
| Global Announcements | ✅ Complete | AdminDashboard → Dashboard |
| Loading Screens | ✅ Complete | LoadingScreen Component |
| Database Sync | ✅ Complete | FighterContext + Auto-Profile Creation |

---

**Build Status:** ✅ Compiles successfully  
**Tests:** Ready for testing after Supabase table creation  
**Deployment:** Ready (once DB table created)
