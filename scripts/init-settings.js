#!/usr/bin/env node

/**
 * Initialize Settings Script
 * 
 * This script initializes the settings table with default values.
 * 
 * Usage:
 *   node scripts/init-settings.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL (PostgreSQL connection string)
 *   OR
 *   - SUPABASE_DB_URL (PostgreSQL connection string)
 */

const { Client } = require('pg');
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
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }
  
  return null;
}

/**
 * Main function
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('Initialize Settings Script', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Get database connection string
  const connectionString = getDatabaseConnectionString();
  
  if (!connectionString) {
    error('Database connection string not found');
    info('Please set DATABASE_URL or SUPABASE_DB_URL in your .env.local file');
    process.exit(1);
  }
  
  // Mask password in connection string for display
  const maskedConnection = connectionString.replace(/:([^:@]+)@/, ':****@');
  info(`Connecting to: ${maskedConnection}`);
  
  // Create PostgreSQL client
  const isRender = connectionString.includes('render.com');
  const isSupabase = connectionString.includes('supabase.co');
  
  let client;
  
  if (isRender) {
    client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
        require: true
      },
      connectionTimeoutMillis: 30000,
    });
  } else if (isSupabase) {
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
    await client.connect();
    success('Connected to database');
    
    // Check if settings record exists
    info('Checking if settings record exists...');
    const checkResult = await client.query(
      'SELECT id FROM settings WHERE id = $1',
      [1]
    );
    
    const defaultSettings = {
      site_name: 'AI Doctor Helper',
      site_description: 'Your Personal AI Health Assistant',
      contact_email: null,
      support_email: null,
      logo_url: null,
      stripe_secret_key: null,
      stripe_publishable_key: null,
      stripe_webhook_secret: null,
      stripe_price_ids: null,
    };
    
    if (checkResult.rows.length > 0) {
      warning('Settings record already exists (id=1)');
      info('Updating with default values...');
      
      // Update existing record
      await client.query(
        `UPDATE settings 
         SET site_name = COALESCE($1, site_name),
             site_description = COALESCE($2, site_description)
         WHERE id = 1`,
        [defaultSettings.site_name, defaultSettings.site_description]
      );
      
      success('Settings record updated with default values');
    } else {
      info('Creating default settings record...');
      
      // Insert new record
      await client.query(
        `INSERT INTO settings (
          id, 
          site_name, 
          site_description, 
          contact_email, 
          support_email, 
          logo_url, 
          stripe_secret_key, 
          stripe_publishable_key, 
          stripe_webhook_secret, 
          stripe_price_ids
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          site_name = COALESCE(EXCLUDED.site_name, settings.site_name),
          site_description = COALESCE(EXCLUDED.site_description, settings.site_description)`,
        [
          1,
          defaultSettings.site_name,
          defaultSettings.site_description,
          defaultSettings.contact_email,
          defaultSettings.support_email,
          defaultSettings.logo_url,
          defaultSettings.stripe_secret_key,
          defaultSettings.stripe_publishable_key,
          defaultSettings.stripe_webhook_secret,
          defaultSettings.stripe_price_ids,
        ]
      );
      
      success('Default settings record created successfully!');
    }
    
    // Verify settings
    info('Verifying settings...');
    const verifyResult = await client.query(
      'SELECT site_name, site_description FROM settings WHERE id = $1',
      [1]
    );
    
    if (verifyResult.rows.length > 0) {
      const settings = verifyResult.rows[0];
      success('\n✅ Settings initialized successfully!');
      info(`Site Name: ${settings.site_name}`);
      info(`Site Description: ${settings.site_description || 'Not set'}`);
    } else {
      error('Failed to verify settings record');
      process.exit(1);
    }
    
  } catch (err) {
    error(`Failed to initialize settings: ${err.message}`);
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

module.exports = { main };

