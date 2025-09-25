-- Remove the restrictive check constraint on vendor_followups status column
-- This will allow any status value including 'completed'

-- First, check if the constraint exists and what it contains
DO $$
BEGIN
    -- Drop the check constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'vendor_followups_status_check' 
        AND table_name = 'vendor_followups'
    ) THEN
        ALTER TABLE vendor_followups DROP CONSTRAINT vendor_followups_status_check;
        RAISE NOTICE 'Dropped existing status check constraint';
    ELSE
        RAISE NOTICE 'No status check constraint found to drop';
    END IF;
    
    -- Also check for any other status-related constraints
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%status%' 
        AND table_name = 'vendor_followups'
        AND constraint_type = 'CHECK'
    ) THEN
        -- Get the constraint name and drop it
        DECLARE
            constraint_name_var text;
        BEGIN
            SELECT constraint_name INTO constraint_name_var
            FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%status%' 
            AND table_name = 'vendor_followups'
            AND constraint_type = 'CHECK'
            LIMIT 1;
            
            EXECUTE 'ALTER TABLE vendor_followups DROP CONSTRAINT ' || constraint_name_var;
            RAISE NOTICE 'Dropped constraint: %', constraint_name_var;
        END;
    END IF;
END $$;

-- Verify the constraint has been removed
SELECT 
    constraint_name, 
    constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'vendor_followups' 
AND constraint_type = 'CHECK';

-- Show current status values in the table to verify what's being used
SELECT DISTINCT status, COUNT(*) as count
FROM vendor_followups 
GROUP BY status
ORDER BY status;
