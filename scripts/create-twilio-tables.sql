-- Create Twilio configuration table
CREATE TABLE IF NOT EXISTS twilio_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    account_sid VARCHAR(255) NOT NULL,
    auth_token VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Twilio numbers table
CREATE TABLE IF NOT EXISTS twilio_numbers (
    id SERIAL PRIMARY KEY,
    sid VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    friendly_name VARCHAR(255),
    capabilities_voice BOOLEAN DEFAULT false,
    capabilities_sms BOOLEAN DEFAULT false,
    capabilities_mms BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    assigned_to VARCHAR(255),
    user_id INTEGER,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO twilio_config (user_id, account_sid, auth_token, phone_number) 
VALUES (3, 'AC_test_account_sid', 'test_auth_token', '+1234567890')
ON CONFLICT DO NOTHING;

INSERT INTO twilio_numbers (sid, phone_number, friendly_name, capabilities_voice, capabilities_sms, capabilities_mms, status, user_id)
VALUES 
    ('PN_test_number_1', '+1234567890', 'Main Business Line', true, true, true, 'active', 3),
    ('PN_test_number_2', '+1987654321', 'Support Line', true, true, false, 'active', 3)
ON CONFLICT (sid) DO NOTHING;
