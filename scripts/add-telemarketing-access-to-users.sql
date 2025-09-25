-- Add telemarketing access field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS telemarketing_access BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telemarketing_script_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telemarketing_lead_list_ids INTEGER[];

-- Update existing users to have default telemarketing access
UPDATE users SET telemarketing_access = FALSE WHERE telemarketing_access IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_telemarketing_access ON users(telemarketing_access);
