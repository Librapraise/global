-- Create missing twilio_config table for admin dashboard
CREATE TABLE IF NOT EXISTS twilio_config (
  id SERIAL PRIMARY KEY,
  account_sid VARCHAR(255),
  auth_token VARCHAR(255),
  application_sid VARCHAR(255),
  webhook_url TEXT,
  status_callback_url TEXT,
  is_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample Twilio configuration for development
INSERT INTO twilio_config (
  account_sid, auth_token, application_sid, webhook_url, 
  status_callback_url, is_configured
) VALUES (
  'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'your_auth_token_here',
  'APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'https://your-domain.com/api/telemarketing/twilio/webhook',
  'https://your-domain.com/api/telemarketing/twilio/status',
  false
) ON CONFLICT (id) DO NOTHING;

-- Add sample telemarketing numbers with proper capabilities
INSERT INTO telemarketing_numbers (
  phone_number, twilio_sid, friendly_name, assigned_user_id, is_active
) VALUES 
  ('+15551234567', 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Main Sales Line', 1, true),
  ('+15551234568', 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxy', 'Support Line', 2, true),
  ('+15551234569', 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxz', 'Marketing Line', NULL, false)
ON CONFLICT (phone_number) DO NOTHING;

-- Create missing telemarketing_list_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS telemarketing_list_assignments (
  id SERIAL PRIMARY KEY,
  list_id INTEGER REFERENCES telemarketing_lead_lists(id),
  user_id INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by INTEGER REFERENCES users(id)
);

-- Add some sample assignments
INSERT INTO telemarketing_list_assignments (list_id, user_id, assigned_by) 
SELECT 1, 1, 1 WHERE EXISTS (SELECT 1 FROM telemarketing_lead_lists WHERE id = 1)
ON CONFLICT DO NOTHING;
