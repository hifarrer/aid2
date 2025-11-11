# Fix Settings Error - Database Setup Guide

## Problem
The application uses Supabase client to connect to the database, but the database structure hasn't been set up in your Supabase project yet.

## Solution

You have two databases:
1. **Render.com database** (DATABASE_URL) - Already set up ✅
2. **Supabase database** (SUPABASE_URL) - Needs setup ❌

Since your application code uses Supabase client, you need to set up the database structure in Supabase.

## Option 1: Set up Database Structure in Supabase (Recommended)

1. **Get Supabase PostgreSQL Connection String:**
   - Go to your Supabase Dashboard: https://supabase.com/dashboard
   - Select your project: `qnrdhelnptsuheklmsok`
   - Go to **Settings > Database**
   - Scroll down to **Connection string**
   - Copy the **Connection pooling** string (port 6543) or **Direct connection** string (port 5432)
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

2. **Add to `.env.local`:**
   ```env
   SUPABASE_DB_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

3. **Run the setup script:**
   ```bash
   # Temporarily use Supabase DB URL
   SUPABASE_DB_URL="your-supabase-connection-string" node scripts/setup-database.js
   ```

## Option 2: Copy Schema from Render.com to Supabase

1. **Get Supabase PostgreSQL Connection String** (same as Option 1, step 1)

2. **Add to `.env.local`:**
   ```env
   SOURCE_DB_URL=postgresql://aidocuser:****@dpg-d49n6mkhg0os73blp9og-a.oregon-postgres.render.com/aidocdb
   TARGET_DB_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

3. **Run the copy schema script:**
   ```bash
   npm run copy-schema
   ```

## Option 3: Manual Setup via Supabase Dashboard

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `db/supabase.sql`
3. Execute it
4. Then run all migration files in order from the `db/` folder

## Quick Fix: Initialize Settings Only

If you just want to fix the immediate error, you can manually insert the settings record:

1. Go to Supabase Dashboard > SQL Editor
2. Run this SQL:
   ```sql
   INSERT INTO settings (id, site_name, site_description)
   VALUES (1, 'AI Doctor Helper', 'Your Personal AI Health Assistant')
   ON CONFLICT (id) DO UPDATE SET
     site_name = EXCLUDED.site_name,
     site_description = EXCLUDED.site_description;
   ```

But you'll still need to set up the rest of the database structure for the app to work fully.

## Recommended Approach

**Use Option 1** - Set up the complete database structure in Supabase using the setup script. This ensures all tables, indexes, and functions are created correctly.

