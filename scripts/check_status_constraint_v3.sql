-- Check current status values in vendor_followups table
SELECT DISTINCT status FROM vendor_followups WHERE status IS NOT NULL;

-- Check if there's a constraint on the status column
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'vendor_followups' 
AND tc.constraint_type = 'CHECK'
AND tc.constraint_name LIKE '%status%';

-- If constraint exists and is restrictive, drop it and recreate with proper values
DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'vendor_followups' 
        AND constraint_name = 'vendor_followups_status_check'
    ) THEN
        ALTER TABLE vendor_followups DROP CONSTRAINT vendor_followups_status_check;
    END IF;
    
    -- Add a new constraint that allows the status values we need
    ALTER TABLE vendor_followups 
    ADD CONSTRAINT vendor_followups_status_check 
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'in_progress', 'pending'));
END $$;
