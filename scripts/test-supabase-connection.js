#!/usr/bin/env node

/**
 * Test Supabase Connection Script
 * 
 * This script tests if the Supabase client can connect and access settings.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function testSupabaseConnection() {
  console.log('\n=== Testing Supabase Connection ===\n');
  
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceRoleKey) {
    console.error('❌ Supabase credentials not found');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log(`Supabase URL: ${url}`);
  console.log(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`);
  console.log('\nConnecting to Supabase...\n');
  
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  
  try {
    // Test connection by querying settings
    console.log('Testing settings query...');
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('❌ Error querying settings:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      
      if (error.code === 'PGRST116') {
        console.error('\n⚠️  Settings record not found (id=1)');
        console.error('Run: npm run init-settings');
      } else if (error.code === '42P01') {
        console.error('\n⚠️  Settings table does not exist');
        console.error('Run: npm run setup-database');
      }
      
      process.exit(1);
    }
    
    if (!data) {
      console.error('❌ Settings record not found');
      console.error('Run: npm run init-settings');
      process.exit(1);
    }
    
    console.log('✅ Settings found!');
    console.log('\nSettings data:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testSupabaseConnection();

