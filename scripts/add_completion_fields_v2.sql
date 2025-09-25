-- Add missing completion fields to vendor_followups table
ALTER TABLE vendor_followups 
ADD COLUMN IF NOT EXISTS zoom_meeting boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS in_person_meeting boolean DEFAULT false;

-- Update existing records to have default values
UPDATE vendor_followups 
SET zoom_meeting = false, in_person_meeting = false 
WHERE zoom_meeting IS NULL OR in_person_meeting IS NULL;
