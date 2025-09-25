-- Create comprehensive telemarketing database schema with all required tables
-- First, check if tables exist and create them if they don't

-- Create telemarketing_scripts table
CREATE TABLE IF NOT EXISTS telemarketing_scripts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    list_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create telemarketing_leads table
CREATE TABLE IF NOT EXISTS telemarketing_leads (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    status VARCHAR(50) DEFAULT 'new',
    assigned_to INTEGER REFERENCES users(id),
    list_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_called TIMESTAMP,
    call_count INTEGER DEFAULT 0,
    notes TEXT
);

-- Create call_dispositions table
CREATE TABLE IF NOT EXISTS call_dispositions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create call_logs table
CREATE TABLE IF NOT EXISTS call_logs (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES telemarketing_leads(id),
    user_id INTEGER REFERENCES users(id),
    phone_number VARCHAR(20),
    call_duration INTEGER,
    disposition_id INTEGER REFERENCES call_dispositions(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    call_sid VARCHAR(255),
    recording_url TEXT
);

-- Create telemarketing_numbers table
CREATE TABLE IF NOT EXISTS telemarketing_numbers (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    friendly_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    twilio_sid VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lead_lists table
CREATE TABLE IF NOT EXISTS lead_lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create user_script_assignments table
CREATE TABLE IF NOT EXISTS user_script_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    script_id INTEGER REFERENCES telemarketing_scripts(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, script_id)
);

-- Create user_list_assignments table
CREATE TABLE IF NOT EXISTS user_list_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    list_id INTEGER REFERENCES lead_lists(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, list_id)
);

-- Insert default call dispositions if they don't exist
INSERT INTO call_dispositions (name, description) VALUES
    ('Contact Made', 'Successfully contacted the lead'),
    ('No Answer', 'No one answered the call'),
    ('Busy', 'Line was busy'),
    ('Voicemail', 'Left voicemail message'),
    ('Wrong Number', 'Incorrect phone number'),
    ('Not Interested', 'Lead expressed no interest'),
    ('Callback Requested', 'Lead requested callback'),
    ('Do Not Call', 'Lead requested to be removed from calls'),
    ('Appointment Set', 'Appointment scheduled with lead'),
    ('Sale Made', 'Successfully closed a sale')
ON CONFLICT (name) DO NOTHING;

-- Insert sample lead list if none exist
INSERT INTO lead_lists (name, description, created_by) 
SELECT 'Default Lead List', 'Default list for telemarketing leads', 1
WHERE NOT EXISTS (SELECT 1 FROM lead_lists);

-- Insert sample script if none exist
INSERT INTO telemarketing_scripts (name, content, created_by, list_id)
SELECT 
    'Default Script', 
    'Hello, this is [Your Name] calling from [Company Name]. How are you today?', 
    1,
    (SELECT id FROM lead_lists LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM telemarketing_scripts);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telemarketing_leads_assigned_to ON telemarketing_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_telemarketing_leads_status ON telemarketing_leads(status);
CREATE INDEX IF NOT EXISTS idx_telemarketing_leads_list_id ON telemarketing_leads(list_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);

-- Create view for telemarketing stats
CREATE OR REPLACE VIEW telemarketing_stats AS
SELECT 
    COUNT(DISTINCT tl.id) as total_leads,
    COUNT(DISTINCT CASE WHEN tl.status = 'contacted' THEN tl.id END) as contacted_leads,
    COUNT(DISTINCT CASE WHEN tl.status = 'converted' THEN tl.id END) as converted_leads,
    COUNT(DISTINCT cl.id) as total_calls,
    COUNT(DISTINCT cl.user_id) as active_users,
    COALESCE(AVG(cl.call_duration), 0) as avg_call_duration
FROM telemarketing_leads tl
LEFT JOIN call_logs cl ON tl.id = cl.lead_id;

-- Create view for call stats summary
CREATE OR REPLACE VIEW call_stats_summary AS
SELECT 
    u.name as user_name,
    COUNT(cl.id) as total_calls,
    COUNT(CASE WHEN cd.name = 'Contact Made' THEN 1 END) as successful_contacts,
    COUNT(CASE WHEN cd.name = 'Sale Made' THEN 1 END) as sales_made,
    COALESCE(AVG(cl.call_duration), 0) as avg_call_duration
FROM users u
LEFT JOIN call_logs cl ON u.id = cl.user_id
LEFT JOIN call_dispositions cd ON cl.disposition_id = cd.id
WHERE u.role IN ('telemarketer', 'admin')
GROUP BY u.id, u.name;
