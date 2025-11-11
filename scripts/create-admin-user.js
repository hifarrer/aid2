#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * This script creates an admin user in the database.
 * 
 * Usage:
 *   node scripts/create-admin-user.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL (PostgreSQL connection string)
 *   OR
 *   - SUPABASE_DB_URL (PostgreSQL connection string)
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
  log('Create Admin User Script', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Admin user details
  const adminEmail = 'admin@aidoctorhelper.com';
  const adminPassword = 'AdminHelper123';
  const adminFirstName = 'Admin';
  
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
    
    // Check if user already exists
    info(`Checking if user ${adminEmail} already exists...`);
    const checkResult = await client.query(
      'SELECT id, email, is_admin FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      warning(`User ${adminEmail} already exists`);
      
      // Ask if we should update to admin
      if (!existingUser.is_admin) {
        info('User exists but is not an admin. Updating to admin...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await client.query(
          `UPDATE users 
           SET password = $1, 
               first_name = $2, 
               is_admin = $3, 
               is_active = $4 
           WHERE email = $5`,
          [hashedPassword, adminFirstName, true, true, adminEmail]
        );
        
        success(`User ${adminEmail} updated to admin successfully!`);
        success(`Password has been updated to: ${adminPassword}`);
      } else {
        info('User is already an admin.');
        info('Do you want to update the password? (This script will update it)');
        
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await client.query(
          'UPDATE users SET password = $1 WHERE email = $2',
          [hashedPassword, adminEmail]
        );
        
        success(`Password updated for ${adminEmail}`);
      }
    } else {
      // Create new admin user
      info(`Creating admin user: ${adminEmail}...`);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Generate UUID for user ID (using crypto.randomUUID for Node.js 14.17+)
      const userId = crypto.randomUUID();
      
      // Insert user
      const insertResult = await client.query(
        `INSERT INTO users (id, email, password, first_name, plan, is_active, is_admin, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id, email, first_name, is_admin`,
        [userId, adminEmail, hashedPassword, adminFirstName, 'Free', true, true]
      );
      
      const newUser = insertResult.rows[0];
      success(`Admin user created successfully!`);
      info(`User ID: ${newUser.id}`);
      info(`Email: ${newUser.email}`);
      info(`Name: ${newUser.first_name}`);
      info(`Admin: ${newUser.is_admin}`);
      success(`\nLogin credentials:`);
      success(`Email: ${adminEmail}`);
      success(`Password: ${adminPassword}`);
    }
    
    success('\n✅ Admin user setup completed!');
    info('\nYou can now login with:');
    info(`  Email: ${adminEmail}`);
    info(`  Password: ${adminPassword}`);
    
  } catch (err) {
    error(`Failed to create admin user: ${err.message}`);
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

