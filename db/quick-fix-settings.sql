-- Quick Fix: Create Settings Table and Record for Supabase
-- Run this in Supabase Dashboard > SQL Editor

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id int primary key default 1,
  site_name text default 'AI Doctor Helper',
  site_description text default 'Your Personal AI Health Assistant',
  contact_email text,
  support_email text,
  logo_url text,
  stripe_secret_key text,
  stripe_publishable_key text,
  stripe_webhook_secret text,
  stripe_price_ids jsonb
);

-- Insert or update settings record
INSERT INTO settings (id, site_name, site_description)
VALUES (1, 'AI Doctor Helper', 'Your Personal AI Health Assistant')
ON CONFLICT (id) DO UPDATE SET
  site_name = EXCLUDED.site_name,
  site_description = EXCLUDED.site_description;

-- Verify
SELECT * FROM settings WHERE id = 1;

