-- Comprehensive telemarketing database setup script
-- This script creates all necessary tables and relationships for the telemarketing system

-- Create telemarketing_script_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS telemarketing_script_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  script_id INTEGER REFERENCES telemarketing_scripts(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, script_id)
);

-- Create telemarketing_list_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS telemarketing_list_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  list_id INTEGER REFERENCES telemarketing_lead_lists(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, list_id)
);

-- Add missing columns to telemarketing_leads table
ALTER TABLE telemarketing_leads 
ADD COLUMN IF NOT EXISTS lead_source_detail VARCHAR(100),
ADD COLUMN IF NOT EXISTS high_intent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS disposition VARCHAR(50),
ADD COLUMN IF NOT EXISTS disposition_notes TEXT,
ADD COLUMN IF NOT EXISTS call_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to telemarketing_lead_lists table
ALTER TABLE telemarketing_lead_lists 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to users table for telemarketing
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telemarketing_number_id INTEGER REFERENCES telemarketing_numbers(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telemarketing_leads_status ON telemarketing_leads(status);
CREATE INDEX IF NOT EXISTS idx_telemarketing_leads_priority ON telemarketing_leads(priority);
CREATE INDEX IF NOT EXISTS idx_telemarketing_leads_assigned_to ON telemarketing_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_telemarketing_leads_list_id ON telemarketing_leads(list_id);
CREATE INDEX IF NOT EXISTS idx_call_dispositions_lead_id ON call_dispositions(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_dispositions_user_id ON call_dispositions(user_id);
CREATE INDEX IF NOT EXISTS idx_power_dialer_sessions_user_id ON power_dialer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_call_history_lead_id ON lead_call_history(lead_id);

-- Insert sample data if tables are empty
INSERT INTO telemarketing_lead_lists (name, description, created_by, created_at, updated_at) 
SELECT 'Insurance Prospects', 'High-value homeowners for insurance outreach', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM telemarketing_lead_lists WHERE name = 'Insurance Prospects');

INSERT INTO telemarketing_lead_lists (name, description, created_by, created_at, updated_at) 
SELECT 'Roofing Leads', 'Properties needing roof inspection and repair', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM telemarketing_lead_lists WHERE name = 'Roofing Leads');

INSERT INTO telemarketing_lead_lists (name, description, created_by, created_at, updated_at) 
SELECT 'Window Replacement', 'Homes needing energy-efficient window upgrades', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM telemarketing_lead_lists WHERE name = 'Window Replacement');

-- Insert sample scripts if they don't exist
INSERT INTO telemarketing_scripts (name, content, created_by, created_at, updated_at) 
SELECT 'Insurance Opening Script', 
'Hi, this is [AGENT_NAME] calling from [COMPANY_NAME]. I''m reaching out because we specialize in helping homeowners like yourself save money on their insurance premiums. Do you currently have homeowners insurance?', 
1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM telemarketing_scripts WHERE name = 'Insurance Opening Script');

INSERT INTO telemarketing_scripts (name, content, created_by, created_at, updated_at) 
SELECT 'Roofing Inspection Script', 
'Hello, this is [AGENT_NAME] from [COMPANY_NAME]. We''re offering free roof inspections in your area due to recent weather conditions. Many homeowners are discovering damage they weren''t aware of. Would you be interested in a complimentary inspection?', 
1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM telemarketing_scripts WHERE name = 'Roofing Inspection Script');

-- Insert sample telemarketing numbers if they don't exist
INSERT INTO telemarketing_numbers (phone_number, friendly_name, twilio_sid, assigned_user_id, is_active, created_at, updated_at) 
SELECT '+15551234567', 'Main Sales Line', 'PN1234567890abcdef', NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM telemarketing_numbers WHERE phone_number = '+15551234567');

INSERT INTO telemarketing_numbers (phone_number, friendly_name, twilio_sid, assigned_user_id, is_active, created_at, updated_at) 
SELECT '+15551234568', 'Support Line', 'PN1234567890abcdeg', NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM telemarketing_numbers WHERE phone_number = '+15551234568');

-- Update existing leads with enhanced data if they exist
UPDATE telemarketing_leads 
SET 
    lead_source_detail = CASE 
        WHEN lead_source = 'Website' THEN 'Contact Form'
        WHEN lead_source = 'Phone' THEN 'Inbound Call'
        WHEN lead_source = 'Referral' THEN 'Word of Mouth'
        ELSE 'Unknown'
    END,
    high_intent = (priority >= 4),
    tags = CASE 
        WHEN industry = 'Construction' THEN '[\"construction\", \"contractor\"]'::jsonb
        WHEN industry = 'Insurance' THEN '[\"insurance\", \"claims\"]'::jsonb
        ELSE '[\"general\"]'::jsonb
    END,
    is_active = true
WHERE lead_source_detail IS NULL;

-- Create a view for telemarketing statistics
CREATE OR REPLACE VIEW telemarketing_stats AS
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
    COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
    COUNT(CASE WHEN status = 'interested' THEN 1 END) as interested_leads,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
    COUNT(CASE WHEN high_intent = true THEN 1 END) as high_intent_leads,
    COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_leads,
    COUNT(CASE WHEN last_contacted >= CURRENT_DATE THEN 1 END) as contacted_today,
    ROUND(
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN status = 'converted' THEN 1 END)::float / COUNT(*)) * 100 
            ELSE 0 
        END, 2
    ) as conversion_rate
FROM telemarketing_leads 
WHERE is_active = true;

-- Create a view for call statistics
CREATE OR REPLACE VIEW call_stats_summary AS
SELECT 
    cd.user_id,
    u.name as user_name,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN cd.disposition IN ('Interested', 'Callback Scheduled', 'Appointment Set', 'Sale') THEN 1 END) as successful_calls,
    AVG(cd.call_duration) as avg_call_duration,
    COUNT(CASE WHEN DATE(cd.call_timestamp) = CURRENT_DATE THEN 1 END) as calls_today,
    ROUND(
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN cd.disposition IN ('Interested', 'Callback Scheduled', 'Appointment Set', 'Sale') THEN 1 END)::float / COUNT(*)) * 100 
            ELSE 0 
        END, 2
    ) as conversion_rate
FROM call_dispositions cd
LEFT JOIN users u ON cd.user_id = u.id
GROUP BY cd.user_id, u.name;

-- Grant necessary permissions
GRANT SELECT ON telemarketing_stats TO PUBLIC;
GRANT SELECT ON call_stats_summary TO PUBLIC;

-- Update table comments for documentation
COMMENT ON TABLE telemarketing_script_assignments IS 'Assigns telemarketing scripts to users';
COMMENT ON TABLE telemarketing_list_assignments IS 'Assigns lead lists to users for calling';
COMMENT ON VIEW telemarketing_stats IS 'Real-time statistics for telemarketing dashboard';
COMMENT ON VIEW call_stats_summary IS 'Call performance statistics by user';
