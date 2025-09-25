-- Create Twilio integration tables and sample data for telemarketing system

-- Insert sample telemarketing scripts
INSERT INTO telemarketing_scripts (name, content, created_by, created_at, updated_at) VALUES
('Insurance - Opening Script', 'Hi, this is [AGENT_NAME] calling from [COMPANY_NAME]. I''m reaching out because we specialize in helping homeowners like yourself save money on their insurance premiums. Do you currently have homeowners insurance?', 1, NOW(), NOW()),
('Roofing - Inspection Script', 'Hello, this is [AGENT_NAME] from [COMPANY_NAME]. We''re offering free roof inspections in your area due to recent weather conditions. Many homeowners are discovering damage they weren''t aware of. Would you be interested in a complimentary inspection?', 1, NOW(), NOW()),
('Windows - Energy Savings Script', 'Hi [CONTACT_NAME], this is [AGENT_NAME] calling about energy-efficient window solutions. With rising energy costs, many homeowners in your area are saving hundreds on their monthly bills. Do you have a few minutes to discuss how new windows could benefit your home?', 1, NOW(), NOW());

-- Insert sample lead lists
INSERT INTO telemarketing_lead_lists (name, description, created_by, created_at, updated_at) VALUES
('Insurance Prospects Q1', 'High-value homeowners for insurance outreach', 1, NOW(), NOW()),
('Roofing Leads - Storm Damage', 'Properties in storm-affected areas needing roof inspection', 1, NOW(), NOW()),
('Window Replacement Leads', 'Homes with older windows for energy efficiency upgrades', 1, NOW(), NOW());

-- Insert sample telemarketing leads
INSERT INTO telemarketing_leads (
    company_name, contact_person, phone, email, address, industry, 
    lead_source, status, priority, list_id, created_by, created_at, updated_at
) VALUES
('Johnson Residence', 'Mike Johnson', '+1-555-0101', 'mike.johnson@email.com', '123 Oak Street, Miami, FL 33101', 'Residential', 'Web Form', 'new', 1, 1, 1, NOW(), NOW()),
('Smith Property', 'Sarah Smith', '+1-555-0102', 'sarah.smith@email.com', '456 Pine Avenue, Miami, FL 33102', 'Residential', 'Referral', 'contacted', 2, 2, 1, NOW(), NOW()),
('Brown Home', 'David Brown', '+1-555-0103', 'david.brown@email.com', '789 Maple Drive, Miami, FL 33103', 'Residential', 'Cold Call', 'qualified', 3, 3, 1, NOW(), NOW()),
('Wilson House', 'Lisa Wilson', '+1-555-0104', 'lisa.wilson@email.com', '321 Cedar Lane, Miami, FL 33104', 'Residential', 'Web Form', 'new', 1, 1, 1, NOW(), NOW()),
('Garcia Residence', 'Carlos Garcia', '+1-555-0105', 'carlos.garcia@email.com', '654 Birch Street, Miami, FL 33105', 'Residential', 'Referral', 'new', 2, 2, 1, NOW(), NOW());

-- Insert sample Twilio numbers
INSERT INTO telemarketing_numbers (phone_number, friendly_name, twilio_sid, assigned_user_id, is_active, created_at, updated_at) VALUES
('+1-555-DIALER', 'Main Telemarketing Line', 'PN1234567890abcdef', 1, true, NOW(), NOW()),
('+1-555-SALES1', 'Sales Line 1', 'PN1234567890abcdeg', 2, true, NOW(), NOW()),
('+1-555-SALES2', 'Sales Line 2', 'PN1234567890abcdeh', 3, true, NOW(), NOW());

-- Insert sample call dispositions
INSERT INTO call_dispositions (lead_id, disposition, disposition_notes, call_duration, user_id, call_timestamp, created_at) VALUES
(1, 'Interested', 'Customer showed strong interest in insurance review', 180, 1, NOW() - INTERVAL '1 hour', NOW()),
(2, 'Callback Scheduled', 'Scheduled follow-up call for next Tuesday at 2 PM', 120, 1, NOW() - INTERVAL '2 hours', NOW()),
(3, 'Not Interested', 'Customer satisfied with current provider', 45, 1, NOW() - INTERVAL '3 hours', NOW());

-- Update users table to assign telemarketing numbers
UPDATE users SET telemarketing_number_id = 1 WHERE id = 1;
UPDATE users SET telemarketing_number_id = 2 WHERE id = 2;
UPDATE users SET telemarketing_number_id = 3 WHERE id = 3;
