-- Fix weight column to be NOT NULL with default value
-- This addresses CodeRabbit comments 9 and 13 about nullable weight columns

-- First, update any existing NULL weights to 1.0
UPDATE edges SET weight = 1.0 WHERE weight IS NULL;

-- Set default value for new rows
ALTER TABLE edges ALTER COLUMN weight SET DEFAULT 1.0;

-- Make the column NOT NULL
ALTER TABLE edges ALTER COLUMN weight SET NOT NULL; 