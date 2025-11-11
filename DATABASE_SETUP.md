# Database Setup Guide

## Quick Setup Steps

1. **Get PostgreSQL Connection String from Supabase:**
   - Go to your Supabase Dashboard
   - Navigate to **Settings > Database**
   - Scroll down to **Connection string**
   - Copy the **Connection pooling** string (recommended) or **Direct connection** string
   - Format: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

2. **Add to `.env.local` file:**
   ```env
   # Add this line with your actual connection string
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   
   # OR use this variable name instead
   SUPABASE_DB_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

3. **Run the setup script:**
   ```bash
   npm run setup-database
   ```

## What the Script Does

The script will:
- ✅ Connect to your Supabase database
- ✅ Execute all SQL migration files in the correct order
- ✅ Create all tables, indexes, triggers, and functions
- ✅ Set up Row Level Security (RLS) policies
- ✅ Initialize default data where needed

## SQL Files Executed (in order)

1. `supabase.sql` - Base schema (users, settings, plans, usage_records, etc.)
2. `migration-add-plan-columns.sql` - Additional plan columns
3. `migration-add-user-interactions.sql` - User interactions tracking
4. `migration-fix-user-interactions-fk.sql` - Fix foreign keys
5. `migration-add-showcase-table.sql` - Landing showcase table
6. `migration-add-health-reports.sql` - Health reports tables
7. `migration-add-image-analysis-support.sql` - Image analysis support
8. `migration-add-reset-token-fields.sql` - Password reset fields
9. `migration-add-usage-records-mobile-fields.sql` - Mobile API fields
10. `migration-add-hero-background-color.sql` - Hero background color
11. `migration-add-features-background-color.sql` - Features background color
12. `migration-add-hero-title-accents.sql` - Hero title accents
13. `migration-add-features-title-accents.sql` - Features title accents
14. `migration-fix-users-id-default.sql` - Fix users ID default

## After Setup

Once the database structure is created, you can:

1. **Initialize default data:**
   ```bash
   npm run init-data
   ```

2. **Verify tables in Supabase Dashboard:**
   - Go to **Table Editor** in Supabase Dashboard
   - You should see all tables created

## Troubleshooting

### Error: "Database connection string not found"
- Make sure you've added `DATABASE_URL` or `SUPABASE_DB_URL` to `.env.local`
- Verify the connection string format is correct
- Make sure you're using the PostgreSQL connection string, not the Supabase API URL

### Error: "Connection refused" or "Connection timeout"
- Check if your Supabase project is active
- Verify the connection string is correct
- Try using the "Direct connection" string instead of "Connection pooling"

### Error: "Authentication failed"
- Verify your database password is correct
- Make sure you're using the password from Supabase Dashboard > Settings > Database
- The password might be different from your Supabase account password

### Error: "relation already exists"
- This is normal if tables already exist
- The script will skip creating existing objects
- You can safely run the script multiple times

## Security Notes

- ⚠️ Never commit `.env.local` to version control (already in `.gitignore`)
- ⚠️ The PostgreSQL connection string contains your database password
- ⚠️ Use connection pooling for production applications
- ⚠️ Consider using environment-specific connection strings

## Next Steps

After running `npm run setup-database`:

1. ✅ Database structure will be created
2. ✅ Run `npm run init-data` to add default data
3. ✅ Start your development server: `npm run dev`
4. ✅ Verify everything works in your application

