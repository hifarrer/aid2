#!/usr/bin/env node

/**
 * Test PostgreSQL Connection Script
 * 
 * Tests the new PostgreSQL wrapper to ensure it works correctly
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Import the wrapper (we'll need to compile TypeScript or use ts-node)
// For now, let's test directly with pg
const { Client } = require('pg');

async function testConnection() {
  console.log('\n=== Testing PostgreSQL Connection ===\n');
  
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!connectionString) {
    console.error('❌ Database connection string not found');
    process.exit(1);
  }
  
  const isRender = connectionString.includes('render.com');
  const isSupabase = connectionString.includes('supabase.co');
  
  const client = new Client({
    connectionString,
    ssl: isRender || isSupabase ? {
      rejectUnauthorized: false,
      require: isRender ? true : false
    } : false,
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Test settings query
    console.log('Testing settings query...');
    const settingsResult = await client.query('SELECT * FROM settings WHERE id = $1', [1]);
    console.log('✅ Settings:', settingsResult.rows[0]);
    
    // Test plans query
    console.log('\nTesting plans query...');
    const plansResult = await client.query('SELECT title, monthly_price FROM plans ORDER BY monthly_price');
    console.log(`✅ Found ${plansResult.rows.length} plans:`);
    plansResult.rows.forEach(plan => {
      console.log(`   - ${plan.title}: $${plan.monthly_price}`);
    });
    
    // Test users query
    console.log('\nTesting users query...');
    const usersResult = await client.query('SELECT email, is_admin FROM users LIMIT 5');
    console.log(`✅ Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.email} (admin: ${user.is_admin})`);
    });
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();

