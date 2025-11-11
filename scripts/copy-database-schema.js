#!/usr/bin/env node

/**
 * Database Schema Copy Script
 * 
 * This script copies the complete database structure (schema only, no data)
 * from a source database to a target database.
 * 
 * Usage:
 *   node scripts/copy-database-schema.js
 * 
 * Environment Variables Required:
 *   Source Database:
 *     - SOURCE_DB_URL (PostgreSQL connection string)
 *     OR
 *     - SOURCE_SUPABASE_URL + SOURCE_SUPABASE_SERVICE_ROLE_KEY
 *   
 *   Target Database:
 *     - TARGET_DB_URL (PostgreSQL connection string)
 *     OR
 *     - TARGET_SUPABASE_URL + TARGET_SUPABASE_SERVICE_ROLE_KEY
 * 
 * Example PostgreSQL connection string:
 *   postgresql://user:password@host:port/database
 * 
 * Example Supabase connection string:
 *   postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
 *   (Get this from Supabase Dashboard > Settings > Database > Connection string)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ Error: ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Extract database connection details from Supabase URL
 * Note: This is a helper - you'll need the actual PostgreSQL connection string
 */
function getPostgresConnectionString(supabaseUrl, serviceKey) {
  // Supabase URL format: https://[project-ref].supabase.co
  // PostgreSQL connection: postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
  // 
  // Note: You need to get the actual PostgreSQL password from Supabase Dashboard
  // Settings > Database > Connection string > Connection pooling (or Direct connection)
  
  if (supabaseUrl && supabaseUrl.startsWith('https://')) {
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    warning(`Supabase URL detected: ${supabaseUrl}`);
    warning(`To get PostgreSQL connection string:`);
    warning(`1. Go to Supabase Dashboard > Settings > Database`);
    warning(`2. Copy the "Connection string" under "Connection pooling" or "Direct connection"`);
    warning(`3. Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`);
    return null;
  }
  
  return null;
}

/**
 * Get source database connection string
 */
function getSourceConnectionString() {
  // Try direct PostgreSQL connection string first
  if (process.env.SOURCE_DB_URL) {
    return process.env.SOURCE_DB_URL;
  }
  
  // Try Supabase credentials
  const supabaseUrl = process.env.SOURCE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && serviceKey) {
    const pgString = getPostgresConnectionString(supabaseUrl, serviceKey);
    if (pgString) return pgString;
  }
  
  return null;
}

/**
 * Get target database connection string
 */
function getTargetConnectionString() {
  // Try direct PostgreSQL connection string first
  if (process.env.TARGET_DB_URL) {
    return process.env.TARGET_DB_URL;
  }
  
  // Try Supabase credentials
  const supabaseUrl = process.env.TARGET_SUPABASE_URL;
  const serviceKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && serviceKey) {
    const pgString = getPostgresConnectionString(supabaseUrl, serviceKey);
    if (pgString) return pgString;
  }
  
  return null;
}

/**
 * Parse connection string to extract database name
 */
function getDatabaseName(connectionString) {
  const match = connectionString.match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (match) {
    return match[5].split('?')[0]; // Remove query parameters
  }
  return null;
}

/**
 * Check if pg_dump and psql are available
 */
function checkDependencies() {
  try {
    execSync('pg_dump --version', { stdio: 'ignore' });
    execSync('psql --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract schema from source database
 */
function extractSchema(sourceConnectionString, outputFile) {
  info('Extracting schema from source database...');
  
  try {
    // Use pg_dump with schema-only flag
    // --schema-only: Only dump schema, no data
    // --no-owner: Don't output commands to set ownership
    // --no-privileges: Don't output commands to set privileges
    // --clean: Include DROP statements before CREATE statements
    const command = `pg_dump "${sourceConnectionString}" --schema-only --no-owner --no-privileges --clean --file="${outputFile}"`;
    
    execSync(command, { stdio: 'inherit' });
    success('Schema extracted successfully');
    return true;
  } catch (error) {
    error(`Failed to extract schema: ${error.message}`);
    return false;
  }
}

/**
 * Apply schema to target database
 */
function applySchema(targetConnectionString, schemaFile) {
  info('Applying schema to target database...');
  
  try {
    // Use psql to execute the schema file
    const command = `psql "${targetConnectionString}" --file="${schemaFile}"`;
    
    execSync(command, { stdio: 'inherit' });
    success('Schema applied successfully');
    return true;
  } catch (error) {
    error(`Failed to apply schema: ${error.message}`);
    return false;
  }
}

/**
 * Alternative method: Use Supabase client to extract and apply schema
 * This method reads SQL files and executes them via Supabase RPC
 */
async function copySchemaViaSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const fs = require('fs');
  const path = require('path');
  
  // Source Supabase client
  const sourceUrl = process.env.SOURCE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sourceKey = process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Target Supabase client
  const targetUrl = process.env.TARGET_SUPABASE_URL;
  const targetKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!sourceUrl || !sourceKey || !targetUrl || !targetKey) {
    error('Missing Supabase credentials for source or target');
    return false;
  }
  
  const sourceClient = require('@supabase/supabase-js').createClient(sourceUrl, sourceKey);
  const targetClient = require('@supabase/supabase-js').createClient(targetUrl, targetKey);
  
  info('Using Supabase client method...');
  warning('Note: This method requires reading SQL files from db/ directory');
  
  // Read all SQL files from db directory
  const dbDir = path.join(__dirname, '../db');
  const sqlFiles = [
    'supabase.sql',
    'migration-add-plan-columns.sql',
    'migration-add-user-interactions.sql',
    'migration-add-showcase-table.sql',
    'migration-add-health-reports.sql',
    'migration-add-reset-token-fields.sql',
    'migration-add-image-analysis-support.sql',
    'migration-add-usage-records-mobile-fields.sql',
    'migration-add-hero-background-color.sql',
    'migration-add-features-background-color.sql',
    'migration-add-hero-title-accents.sql',
    'migration-add-features-title-accents.sql',
  ];
  
  for (const file of sqlFiles) {
    const filePath = path.join(dbDir, file);
    if (fs.existsSync(filePath)) {
      info(`Applying ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        // Note: Supabase doesn't have a direct SQL execution endpoint via client
        // You would need to use the Supabase Dashboard SQL Editor or pgAdmin
        warning(`File ${file} needs to be executed manually in Supabase Dashboard SQL Editor`);
        warning(`Or use the PostgreSQL connection string method instead`);
      } catch (error) {
        error(`Failed to apply ${file}: ${error.message}`);
        return false;
      }
    }
  }
  
  return false; // Not fully implemented - use PostgreSQL method instead
}

/**
 * Main function
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('Database Schema Copy Script', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Check dependencies
  if (!checkDependencies()) {
    error('pg_dump and/or psql not found in PATH');
    error('Please install PostgreSQL client tools:');
    error('  macOS: brew install postgresql');
    error('  Ubuntu: sudo apt-get install postgresql-client');
    error('  Windows: Download from https://www.postgresql.org/download/windows/');
    process.exit(1);
  }
  
  // Get connection strings
  const sourceConnectionString = getSourceConnectionString();
  const targetConnectionString = getTargetConnectionString();
  
  if (!sourceConnectionString) {
    error('Source database connection string not found');
    info('Please set one of the following:');
    info('  - SOURCE_DB_URL (PostgreSQL connection string)');
    info('  - SOURCE_SUPABASE_URL + SOURCE_SUPABASE_SERVICE_ROLE_KEY');
    info('\nFor Supabase, get PostgreSQL connection string from:');
    info('  Dashboard > Settings > Database > Connection string');
    process.exit(1);
  }
  
  if (!targetConnectionString) {
    error('Target database connection string not found');
    info('Please set one of the following:');
    info('  - TARGET_DB_URL (PostgreSQL connection string)');
    info('  - TARGET_SUPABASE_URL + TARGET_SUPABASE_SERVICE_ROLE_KEY');
    info('\nFor Supabase, get PostgreSQL connection string from:');
    info('  Dashboard > Settings > Database > Connection string');
    process.exit(1);
  }
  
  // Display connection info (masked)
  const maskConnectionString = (str) => {
    return str.replace(/:([^:@]+)@/, ':****@');
  };
  
  info('Source Database: ' + maskConnectionString(sourceConnectionString));
  info('Target Database: ' + maskConnectionString(targetConnectionString));
  
  const sourceDbName = getDatabaseName(sourceConnectionString);
  const targetDbName = getDatabaseName(targetConnectionString);
  
  if (sourceDbName && targetDbName) {
    info(`Source DB: ${sourceDbName}`);
    info(`Target DB: ${targetDbName}`);
  }
  
  // Confirm before proceeding
  log('\n⚠️  WARNING: This will copy the schema to the target database.', 'yellow');
  log('⚠️  Existing tables in target database may be dropped!', 'yellow');
  log('\nPress Ctrl+C to cancel, or Enter to continue...\n');
  
  // Create temporary schema file
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const schemaFile = path.join(tempDir, `schema-${Date.now()}.sql`);
  
  try {
    // Extract schema
    if (!extractSchema(sourceConnectionString, schemaFile)) {
      process.exit(1);
    }
    
    // Show schema file size
    const stats = fs.statSync(schemaFile);
    info(`Schema file size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Apply schema
    if (!applySchema(targetConnectionString, schemaFile)) {
      process.exit(1);
    }
    
    success('\n✅ Database schema copied successfully!');
    info(`Schema file saved at: ${schemaFile}`);
    info('You can review the schema file or delete it if no longer needed.');
    
  } catch (error) {
    error(`\n❌ Failed to copy schema: ${error.message}`);
    process.exit(1);
  } finally {
    // Optionally clean up temp file
    // fs.unlinkSync(schemaFile);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main, extractSchema, applySchema };

