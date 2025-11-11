# Database Schema Copy Script

This script copies the complete database structure (schema only, no data) from a source database to a target database.

## Prerequisites

1. **PostgreSQL Client Tools**: Install `pg_dump` and `psql` command-line tools
   - **macOS**: `brew install postgresql`
   - **Ubuntu/Debian**: `sudo apt-get install postgresql-client`
   - **Windows**: Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

2. **Database Connection Strings**: You need PostgreSQL connection strings for both source and target databases.

## Setup

### For Supabase Databases

1. Get PostgreSQL connection strings from Supabase Dashboard:
   - Go to **Settings > Database**
   - Under **Connection string**, copy the **Connection pooling** or **Direct connection** string
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

2. Add to `.env.local`:
   ```env
   # Source Database (current database)
   SOURCE_DB_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   
   # Target Database (new database)
   TARGET_DB_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### For Direct PostgreSQL Databases

Add connection strings directly to `.env.local`:
```env
SOURCE_DB_URL=postgresql://user:password@host:port/database
TARGET_DB_URL=postgresql://user:password@host:port/database
```

## Usage

Run the script:
```bash
node scripts/copy-database-schema.js
```

Or add to `package.json` scripts:
```json
{
  "scripts": {
    "copy-schema": "node scripts/copy-database-schema.js"
  }
}
```

Then run:
```bash
npm run copy-schema
```

## What It Does

1. **Extracts Schema**: Uses `pg_dump` to extract the complete schema from the source database, including:
   - All tables and their structures
   - Indexes
   - Triggers
   - Functions
   - Row Level Security (RLS) policies
   - Sequences
   - Constraints

2. **Applies Schema**: Uses `psql` to apply the extracted schema to the target database

3. **Saves Schema File**: Saves the extracted schema as a SQL file in `temp/` directory for review

## Important Notes

⚠️ **WARNING**: This script will:
- Drop existing tables in the target database if they exist
- Copy only the schema structure, **NOT the data**
- Require confirmation before proceeding

## Troubleshooting

### Error: pg_dump/psql not found
- Install PostgreSQL client tools (see Prerequisites)
- Ensure they're in your system PATH

### Error: Connection refused
- Verify your connection strings are correct
- Check if the database server is accessible
- For Supabase, ensure you're using the correct connection string format

### Error: Permission denied
- Ensure the database user has necessary permissions:
  - `CREATE` privilege on the target database
  - `SELECT` privilege on source database tables
  - For Supabase, use the service role key connection string

## Alternative: Manual Method

If you prefer to copy schema manually:

1. **Extract schema**:
   ```bash
   pg_dump "SOURCE_CONNECTION_STRING" --schema-only --no-owner --no-privileges --clean > schema.sql
   ```

2. **Review schema file**:
   ```bash
   cat schema.sql
   ```

3. **Apply to target**:
   ```bash
   psql "TARGET_CONNECTION_STRING" --file=schema.sql
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SOURCE_DB_URL` | PostgreSQL connection string for source database | Yes* |
| `TARGET_DB_URL` | PostgreSQL connection string for target database | Yes* |
| `SOURCE_SUPABASE_URL` | Supabase project URL (alternative to SOURCE_DB_URL) | No |
| `SOURCE_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (alternative to SOURCE_DB_URL) | No |
| `TARGET_SUPABASE_URL` | Supabase project URL (alternative to TARGET_DB_URL) | No |
| `TARGET_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (alternative to TARGET_DB_URL) | No |

*Either direct connection string OR Supabase credentials required

## Example Workflow

1. **Development to Production**:
   ```bash
   # Copy schema from dev database to production database
   SOURCE_DB_URL="postgresql://..." TARGET_DB_URL="postgresql://..." node scripts/copy-database-schema.js
   ```

2. **Backup Schema**:
   ```bash
   # Extract schema to file for backup
   pg_dump "SOURCE_CONNECTION_STRING" --schema-only > backup-schema-$(date +%Y%m%d).sql
   ```

3. **Create New Database**:
   ```bash
   # Create new database first
   createdb -h host -U user new_database_name
   
   # Then copy schema
   node scripts/copy-database-schema.js
   ```

## Security Notes

- Never commit connection strings to version control
- Use environment variables or `.env.local` file (already in `.gitignore`)
- For production, use connection pooling with proper credentials
- Consider using SSL connections for remote databases

