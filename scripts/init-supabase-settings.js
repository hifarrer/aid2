#!/usr/bin/env node

/**
 * Initialize Settings in Supabase
 * 
 * This script initializes settings in the Supabase database
 * using the Supabase client API.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function initSupabaseSettings() {
  console.log('\n=== Initializing Settings in Supabase ===\n');
  
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceRoleKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }
  
  console.log(`Connecting to Supabase: ${url}\n`);
  
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  
  try {
    // First, check if settings table exists by trying to query it
    const { error: checkError } = await supabase
      .from('settings')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.error('❌ Settings table does not exist in Supabase database');
      console.error('\nYou need to set up the database structure in Supabase first.');
      console.error('\nOptions:');
      console.error('1. Run: npm run setup-database (if SUPABASE_DB_URL points to Supabase)');
      console.error('2. Or copy schema from Render.com to Supabase using: npm run copy-schema');
      console.error('3. Or manually run the SQL migrations in Supabase Dashboard > SQL Editor');
      process.exit(1);
    }
    
    // Try to get existing settings
    const { data: existing, error: fetchError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    const defaultSettings = {
      id: 1,
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
    
    if (fetchError && fetchError.code === 'PGRST116') {
      // Record doesn't exist, insert it
      console.log('Creating default settings record...');
      const { data, error } = await supabase
        .from('settings')
        .insert(defaultSettings)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating settings:', error);
        process.exit(1);
      }
      
      console.log('✅ Settings created successfully!');
      console.log('\nSettings:', JSON.stringify(data, null, 2));
    } else if (fetchError) {
      console.error('❌ Error fetching settings:', fetchError);
      process.exit(1);
    } else {
      // Record exists, update it
      console.log('Settings record exists, updating with default values...');
      const { data, error } = await supabase
        .from('settings')
        .update({
          site_name: defaultSettings.site_name,
          site_description: defaultSettings.site_description,
        })
        .eq('id', 1)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating settings:', error);
        process.exit(1);
      }
      
      console.log('✅ Settings updated successfully!');
      console.log('\nSettings:', JSON.stringify(data, null, 2));
    }
    
    console.log('\n✅ Settings initialization complete!');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

initSupabaseSettings();

