-- =====================================================
-- Database Schema for Internship Divisions Management
-- DPMPTSP Provinsi Jawa Tengah
-- PostgreSQL Version (for Supabase)
-- =====================================================

-- Table: magang_divisions
-- Stores internship division information and slot availability
CREATE TABLE IF NOT EXISTS magang_divisions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Division Information
    nama_divisi VARCHAR(255) NOT NULL UNIQUE,
    total_slots INTEGER NOT NULL DEFAULT 0 CHECK (total_slots >= 0),
    available_slots INTEGER NOT NULL DEFAULT 0 CHECK (available_slots >= 0 AND available_slots <= total_slots),
    
    -- Description (optional)
    description TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_divisions_active ON magang_divisions(is_active);
CREATE INDEX IF NOT EXISTS idx_divisions_nama ON magang_divisions(nama_divisi);

-- Function: Update updated_at timestamp for divisions
CREATE OR REPLACE FUNCTION update_divisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at timestamp on updates
DROP TRIGGER IF EXISTS trigger_update_divisions_timestamp ON magang_divisions;
CREATE TRIGGER trigger_update_divisions_timestamp
BEFORE UPDATE ON magang_divisions
FOR EACH ROW
EXECUTE FUNCTION update_divisions_updated_at();

-- Insert default divisions
INSERT INTO magang_divisions (nama_divisi, total_slots, available_slots, description) VALUES
('Bidang Pelayanan Perizinan', 0, 0, 'Program magang di bidang pelayanan perizinan dan pengurusan dokumen'),
('Bidang Penanaman Modal', 0, 0, 'Program magang di bidang investasi dan penanaman modal'),
('Bidang Pengendalian & Pengawasan', 0, 0, 'Program magang di bidang monitoring dan evaluasi perizinan')
ON CONFLICT (nama_divisi) DO NOTHING;

-- View: Active divisions with slot information
CREATE OR REPLACE VIEW v_active_divisions AS
SELECT 
    id,
    nama_divisi,
    total_slots,
    available_slots,
    (total_slots - available_slots) as filled_slots,
    CASE 
        WHEN total_slots > 0 THEN ROUND((available_slots::numeric / total_slots::numeric) * 100, 2)
        ELSE 0
    END as availability_percentage,
    description,
    created_at,
    updated_at
FROM magang_divisions
WHERE is_active = true
ORDER BY nama_divisi;

-- Sample queries (commented out)
-- Get all active divisions with availability
-- SELECT * FROM v_active_divisions;

-- Get division by name
-- SELECT * FROM magang_divisions WHERE nama_divisi = 'Bidang Pelayanan Perizinan';

-- Update division slots
-- UPDATE magang_divisions 
-- SET total_slots = 10, available_slots = 10 
-- WHERE nama_divisi = 'Bidang Pelayanan Perizinan';

-- Decrease available slots when someone registers (to be called from API)
-- UPDATE magang_divisions 
-- SET available_slots = available_slots - 1 
-- WHERE id = 1 AND available_slots > 0;
