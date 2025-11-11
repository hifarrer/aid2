#!/usr/bin/env node

/**
 * Database Structure Setup Script
 * 
 * This script creates the complete database structure by executing
 * all SQL migration files in the correct order.
 * 
 * Usage:
 *   node scripts/setup-database.js
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   OR
 *   - DATABASE_URL (PostgreSQL connection string)
 * 
 * Example PostgreSQL connection string:
 *   postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
 */

const { Client } = require('pg');
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
 * Get database connection string
 */
function getDatabaseConnectionString() {
  // Debug: Show what env vars are available (masked)
  const envVars = Object.keys(process.env).filter(key => 
    key.includes('DATABASE') || key.includes('SUPABASE') || key.includes('DB')
  );
  
  if (envVars.length > 0) {
    info(`Found environment variables: ${envVars.join(', ')}`);
  }
  
  // Try direct PostgreSQL connection string first
  if (process.env.DATABASE_URL) {
    info('Using DATABASE_URL');
    return process.env.DATABASE_URL;
  }
  
  // Try Supabase connection string
  if (process.env.SUPABASE_DB_URL) {
    info('Using SUPABASE_DB_URL');
    return process.env.SUPABASE_DB_URL;
  }
  
  // Construct from Supabase URL (if provided)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (supabaseUrl) {
    warning('Supabase URL detected, but PostgreSQL connection string is required.');
    warning('Please set DATABASE_URL or SUPABASE_DB_URL in your .env.local file.');
    warning('Get it from: Supabase Dashboard > Settings > Database > Connection string');
    warning('Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
  }
  
  return null;
}

/**
 * Get SQL files in execution order
 */
function getSqlFiles() {
  const dbDir = path.join(__dirname, '../db');
  
  // Define the order of SQL files
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';
  const isRender = connectionString.includes('render.com');
  
  let fileOrder = [
    'supabase.sql',                                    // Base schema
    'migration-add-plan-columns.sql',                  // Add plan columns
    'migration-add-user-interactions.sql',             // User interactions table
    'migration-fix-user-interactions-fk.sql',          // Fix foreign keys
    'migration-add-showcase-table.sql',                 // Showcase table
    'migration-add-image-analysis-support.sql',         // Image analysis support
    'migration-add-reset-token-fields.sql',            // Reset token fields
    'migration-add-usage-records-mobile-fields.sql',   // Usage records mobile fields
    'migration-add-hero-background-color.sql',          // Hero background color
    'migration-add-features-background-color.sql',      // Features background color
    'migration-add-hero-title-accents.sql',             // Hero title accents
    'migration-add-features-title-accents.sql',         // Features title accents
    'migration-fix-users-id-default.sql',               // Fix users ID default
  ];
  
  // Add health reports migration - use Render.com version if on Render, otherwise Supabase version
  if (isRender) {
    fileOrder.splice(5, 0, 'migration-add-health-reports-render.sql'); // Insert after showcase
  } else {
    fileOrder.splice(5, 0, 'migration-add-health-reports.sql'); // Insert after showcase
  }
  
  const files = [];
  
  for (const fileName of fileOrder) {
    const filePath = path.join(dbDir, fileName);
    if (fs.existsSync(filePath)) {
      files.push({
        name: fileName,
        path: filePath,
      });
    } else {
      warning(`SQL file not found: ${fileName} (skipping)`);
    }
  }
  
  return files;
}

/**
 * Execute SQL file
 */
async function executeSqlFile(client, filePath, fileName) {
  try {
    info(`Executing: ${fileName}...`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the entire file as one statement
    await client.query(sql);
    
    success(`Completed: ${fileName}`);
    return true;
  } catch (err) {
    // Check if error is about object already existing (which is okay)
    if (err.message && (
      err.message.includes('already exists') ||
      err.message.includes('duplicate') ||
      err.message.includes('relation') && err.message.includes('already exists')
    )) {
      warning(`Skipped (already exists): ${fileName}`);
      return true;
    }
    
    // Check if error is about Supabase-specific features on non-Supabase database
    if (err.message && (
      err.message.includes('schema "auth" does not exist') ||
      err.message.includes('auth.uid()')
    )) {
      warning(`Skipped (Supabase-specific feature not available): ${fileName}`);
      info(`This migration requires Supabase auth schema. For Render.com, use the Render-compatible version.`);
      return true; // Don't count as failure
    }
    
    error(`Failed to execute ${fileName}: ${err.message}`);
    if (err.position) {
      error(`Error at position: ${err.position}`);
    }
    return false;
  }
}

/**
 * Test database connection
 */
async function testConnection(client) {
  try {
    const result = await client.query('SELECT NOW()');
    success('Database connection successful');
    return true;
  } catch (err) {
    error(`Database connection failed: ${err.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('Database Structure Setup Script', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Get database connection string
  const connectionString = getDatabaseConnectionString();
  
  if (!connectionString) {
    error('Database connection string not found');
    info('Please set one of the following in .env.local:');
    info('  - DATABASE_URL (PostgreSQL connection string)');
    info('  - SUPABASE_DB_URL (PostgreSQL connection string)');
    info('\nFor Supabase, get PostgreSQL connection string from:');
    info('  Dashboard > Settings > Database > Connection string');
    info('  Use "Connection pooling" or "Direct connection"');
    process.exit(1);
  }
  
  // Mask password in connection string for display
  const maskedConnection = connectionString.replace(/:([^:@]+)@/, ':****@');
  info(`Connecting to: ${maskedConnection}`);
  
  // Create PostgreSQL client
  // Render.com and other cloud providers require SSL
  const isRender = connectionString.includes('render.com');
  const isSupabase = connectionString.includes('supabase.co');
  
  let client;
  
  // Render.com databases require SSL
  if (isRender) {
    info('Detected Render.com database - using SSL connection');
    client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
        require: true
      },
      connectionTimeoutMillis: 30000,
    });
  } else if (isSupabase) {
    info('Detected Supabase database - using SSL connection');
    client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
    });
  } else {
    client = new Client({
      connectionString: connectionString,
      ssl: false,
      connectionTimeoutMillis: 10000,
    });
  }
  
  try {
    // Connect to database
    info('Connecting to database...');
    
    try {
      await client.connect();
      success('Connected to database');
    } catch (connectError) {
      error(`Failed to connect: ${connectError.message}`);
      if (connectError.message.includes('ECONNRESET') || connectError.message.includes('timeout')) {
        warning('Connection reset or timeout detected.');
        warning('Trying with SSL enabled...');
        
        // Close existing client
        try {
          await client.end();
        } catch {}
        
        // Try with explicit SSL
        client = new Client({
          connectionString: connectionString,
          ssl: {
            rejectUnauthorized: false,
            require: true
          },
          connectionTimeoutMillis: 30000,
        });
        
        try {
          await client.connect();
          success('Connected with SSL');
        } catch (sslError) {
          error(`SSL connection also failed: ${sslError.message}`);
          throw connectError;
        }
      } else {
        throw connectError;
      }
    }
    
    // Test connection
    if (!(await testConnection(client))) {
      process.exit(1);
    }
    
    // Get SQL files
    const sqlFiles = getSqlFiles();
    
    if (sqlFiles.length === 0) {
      error('No SQL files found to execute');
      process.exit(1);
    }
    
    info(`Found ${sqlFiles.length} SQL file(s) to execute\n`);
    
    // Execute each SQL file
    let successCount = 0;
    let failCount = 0;
    
    for (const file of sqlFiles) {
      const result = await executeSqlFile(client, file.path, file.name);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
      log(''); // Empty line for readability
    }
    
    // Summary
    log('\n' + '='.repeat(60), 'bright');
    log('Setup Summary', 'bright');
    log('='.repeat(60), 'bright');
    success(`Successfully executed: ${successCount} file(s)`);
    if (failCount > 0) {
      error(`Failed: ${failCount} file(s)`);
    }
    
    if (failCount === 0) {
      success('\n✅ Database structure setup completed successfully!');
      info('\nNext steps:');
      info('1. Run "npm run init-data" to initialize default data');
      info('2. Verify tables in Supabase Dashboard > Table Editor');
    } else {
      warning('\n⚠️  Some migrations failed. Please review the errors above.');
      warning('You may need to manually execute failed SQL files.');
    }
    
  } catch (err) {
    error(`Unexpected error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    // Close database connection
    await client.end();
    info('Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    error(`Unexpected error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { main, executeSqlFile, getSqlFiles };

