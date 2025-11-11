#!/usr/bin/env node

/**
 * Initialize Database Data Script
 * 
 * This script initializes the database with default data:
 * - Settings
 * - Plans
 * - Landing Hero
 * 
 * Usage:
 *   node scripts/init-database-data.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL (PostgreSQL connection string)
 *   OR
 *   - SUPABASE_DB_URL (PostgreSQL connection string)
 */

const { Client } = require('pg');
const path = require('path');
const { randomUUID } = require('crypto');
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
 * Initialize Settings
 */
async function initSettings(client) {
  info('Initializing settings...');
  
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
  
  // Check if settings exist
  const checkResult = await client.query('SELECT id FROM settings WHERE id = $1', [1]);
  
  if (checkResult.rows.length > 0) {
    // Update only if values are null
    await client.query(
      `UPDATE settings 
       SET site_name = COALESCE($1, site_name),
           site_description = COALESCE($2, site_description)
       WHERE id = 1`,
      [defaultSettings.site_name, defaultSettings.site_description]
    );
    success('Settings updated');
  } else {
    // Insert new record
    await client.query(
      `INSERT INTO settings (
        id, site_name, site_description, contact_email, support_email,
        logo_url, stripe_secret_key, stripe_publishable_key, stripe_webhook_secret, stripe_price_ids
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    success('Settings created');
  }
}

/**
 * Initialize Plans
 */
async function initPlans(client) {
  info('Initializing plans...');
  
  const defaultPlans = [
    {
      title: 'Free',
      description: 'Perfect for getting started',
      features: [
        '5 AI consultations per month',
        'Basic health information',
        'Email support',
        'Standard response time'
      ],
      monthly_price: 0,
      yearly_price: 0,
      is_active: true,
      is_popular: false,
      interactions_limit: 5,
    },
    {
      title: 'Basic',
      description: 'Great for regular users',
      features: [
        '50 AI consultations per month',
        'Priority health information',
        'Image analysis (5 per month)',
        'Email & chat support',
        'Faster response time',
        'Health history tracking'
      ],
      monthly_price: 9.99,
      yearly_price: 99.99,
      is_active: true,
      is_popular: true,
      interactions_limit: 50,
    },
    {
      title: 'Premium',
      description: 'For healthcare professionals',
      features: [
        'Unlimited AI consultations',
        'Advanced health analysis',
        'Unlimited image analysis',
        'Priority support',
        'Fastest response time',
        'Advanced health tracking',
        'Custom health reports',
        'API access'
      ],
      monthly_price: 29.99,
      yearly_price: 299.99,
      is_active: true,
      is_popular: false,
      interactions_limit: null, // Unlimited
    },
  ];
  
  // Check existing plans
  const existingPlans = await client.query('SELECT title FROM plans');
  const existingTitles = new Set(existingPlans.rows.map(p => p.title));
  
  for (const plan of defaultPlans) {
    if (existingTitles.has(plan.title)) {
      // Update existing plan
      await client.query(
        `UPDATE plans 
         SET description = $1, features = $2, monthly_price = $3, yearly_price = $4,
             is_active = $5, is_popular = $6, interactions_limit = $7
         WHERE title = $8`,
        [
          plan.description,
          plan.features,
          plan.monthly_price,
          plan.yearly_price,
          plan.is_active,
          plan.is_popular,
          plan.interactions_limit,
          plan.title,
        ]
      );
      success(`Plan "${plan.title}" updated`);
    } else {
      // Insert new plan
      await client.query(
        `INSERT INTO plans (
          id, title, description, features, monthly_price, yearly_price,
          is_active, is_popular, interactions_limit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          randomUUID(),
          plan.title,
          plan.description,
          plan.features,
          plan.monthly_price,
          plan.yearly_price,
          plan.is_active,
          plan.is_popular,
          plan.interactions_limit,
        ]
      );
      success(`Plan "${plan.title}" created`);
    }
  }
}

/**
 * Initialize Landing Hero
 */
async function initLandingHero(client) {
  info('Initializing landing hero...');
  
  // Check if landing_hero table exists
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'landing_hero'
    )
  `);
  
  if (!tableCheck.rows[0].exists) {
    warning('landing_hero table does not exist, skipping...');
    return;
  }
  
  const defaultHero = {
    title: 'AI Doctor Helper',
    subtitle: 'Your Personal AI Health Assistant',
    images: [],
    background_color: null,
    title_accent1: null,
    title_accent2: null,
  };
  
  // Check if hero exists
  const checkResult = await client.query('SELECT id FROM landing_hero WHERE id = $1', [1]);
  
  if (checkResult.rows.length > 0) {
    // Update only if values are null
    await client.query(
      `UPDATE landing_hero 
       SET title = COALESCE($1, title),
           subtitle = COALESCE($2, subtitle)
       WHERE id = 1`,
      [defaultHero.title, defaultHero.subtitle]
    );
    success('Landing hero updated');
  } else {
    // Insert new record
    await client.query(
      `INSERT INTO landing_hero (
        id, title, subtitle, images, background_color, title_accent1, title_accent2
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        title = COALESCE(EXCLUDED.title, landing_hero.title),
        subtitle = COALESCE(EXCLUDED.subtitle, landing_hero.subtitle)`,
      [
        1,
        defaultHero.title,
        defaultHero.subtitle,
        defaultHero.images,
        defaultHero.background_color,
        defaultHero.title_accent1,
        defaultHero.title_accent2,
      ]
    );
    success('Landing hero created');
  }
}

/**
 * Main function
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('Initialize Database Data Script', 'bright');
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
    success('Connected to database\n');
    
    // Initialize data
    await initSettings(client);
    await initPlans(client);
    await initLandingHero(client);
    
    log('\n' + '='.repeat(60), 'bright');
    success('Database data initialization completed successfully!');
    log('='.repeat(60) + '\n', 'bright');
    
  } catch (err) {
    error(`Failed to initialize database data: ${err.message}`);
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

