-- Add division_id column to magang_registrations table
-- This links registrations to specific divisions

ALTER TABLE magang_registrations 
ADD COLUMN division_id BIGINT REFERENCES magang_divisions(id);

-- Add index for better query performance
CREATE INDEX idx_magang_registrations_division_id ON magang_registrations(division_id);

-- Optional: Add comment to document the column
COMMENT ON COLUMN magang_registrations.division_id IS 'Reference to the division selected by the applicant during registration';
