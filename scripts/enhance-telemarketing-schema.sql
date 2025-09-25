-- Adding enhanced fields to support the Power Dialer interface

-- Add new fields to telemarketing_leads table to match the Power Dialer mockup
ALTER TABLE telemarketing_leads 
ADD COLUMN IF NOT EXISTS lead_source_detail VARCHAR(100),
ADD COLUMN IF NOT EXISTS high_intent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS disposition VARCHAR(50),
ADD COLUMN IF NOT EXISTS disposition_notes TEXT,
ADD COLUMN IF NOT EXISTS call_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Create call_dispositions table for tracking call outcomes
CREATE TABLE IF NOT EXISTS call_dispositions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES telemarketing_leads(id),
    user_id INTEGER REFERENCES users(id),
    disposition VARCHAR(50) NOT NULL,
    disposition_notes TEXT,
    call_duration INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    call_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create power_dialer_sessions table for tracking dialer sessions
CREATE TABLE IF NOT EXISTS power_dialer_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    total_talk_time INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lead_call_history table for detailed call tracking
CREATE TABLE IF NOT EXISTS lead_call_history (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES telemarketing_leads(id),
    user_id INTEGER REFERENCES users(id),
    session_id INTEGER REFERENCES power_dialer_sessions(id),
    call_start TIMESTAMP,
    call_end TIMESTAMP,
    duration INTEGER,
    outcome VARCHAR(50),
    notes TEXT,
    recording_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO telemarketing_leads (
    contact_person, phone, email, address, company_name, 
    lead_source, lead_source_detail, status, priority, 
    high_intent, notes, tags, created_by, list_id
) VALUES 
(
    'Alex Rivera', '(305) 555-0101', 'alex@example.com', 
    '123 Ocean Dr, Aventura, FL 33180', 'Rivera Roofing',
    'Website', 'Contact Form', 'New', 5,
    TRUE, 'Roof leak reported, needs immediate inspection',
    '["roofing", "urgent", "insurance_claim"]'::jsonb, 1, 1
),
(
    'Sara Cohen', '(305) 555-0102', 'sara@example.com',
    '456 Bay Rd, Sunny Isles, FL 33154', 'Cohen Properties', 
    'Google Ads', 'Impact Windows Campaign', 'Warm', 4,
    TRUE, 'Interested in impact windows for hurricane season',
    '["windows", "hurricane_prep", "high_value"]'::jsonb, 1, 1
),
(
    'Michael Lee', '(305) 555-0103', 'michael@example.com',
    '789 Beach Ave, Hollywood, FL 33019', 'Lee Construction',
    'Referral', 'Previous Customer', 'Hot', 5,
    FALSE, 'Insurance claim in progress, needs contractor',
    '["insurance", "referral", "construction"]'::jsonb, 1, 1
);

-- Update existing leads with enhanced data
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
        WHEN industry = 'Construction' THEN '["construction", "contractor"]'::jsonb
        WHEN industry = 'Insurance' THEN '["insurance", "claims"]'::jsonb
        ELSE '["general"]'::jsonb
    END
WHERE lead_source_detail IS NULL;
