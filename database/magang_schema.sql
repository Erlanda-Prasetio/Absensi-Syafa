-- =====================================================
-- Database Schema for Internship Registration System
-- DPMPTSP Provinsi Jawa Tengah
-- PostgreSQL Version (for Supabase)
-- =====================================================

-- Table: magang_registrations
-- Stores all internship registration data
CREATE TABLE IF NOT EXISTS magang_registrations (
    id BIGSERIAL PRIMARY KEY,
    
    -- Personal Information
    nama_lengkap VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telepon VARCHAR(20) NOT NULL,
    
    -- Educational Information
    institusi VARCHAR(255) NOT NULL,
    jurusan VARCHAR(255),
    semester VARCHAR(10),
    
    -- Internship Details
    durasi_magang VARCHAR(50),
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    deskripsi TEXT,
    
    -- Status and Tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'completed')),
    kode_pendaftaran VARCHAR(50) UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_magang_email ON magang_registrations(email);
CREATE INDEX IF NOT EXISTS idx_magang_kode ON magang_registrations(kode_pendaftaran);
CREATE INDEX IF NOT EXISTS idx_magang_status ON magang_registrations(status);
CREATE INDEX IF NOT EXISTS idx_magang_created ON magang_registrations(created_at);


-- Table: magang_documents
-- Stores uploaded documents for each registration
CREATE TABLE IF NOT EXISTS magang_documents (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL,
    
    -- Document Information
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('surat_rekomendasi', 'proposal', 'cv_portfolio', 'other')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    
    -- Timestamps
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_registration FOREIGN KEY (registration_id) 
        REFERENCES magang_registrations(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_docs_registration ON magang_documents(registration_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON magang_documents(document_type);

-- Table: magang_status_history
-- Tracks status changes for each registration
CREATE TABLE IF NOT EXISTS magang_status_history (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL,
    
    -- Status Information
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by VARCHAR(255),
    
    -- Timestamp
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_status_registration FOREIGN KEY (registration_id) 
        REFERENCES magang_registrations(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_history_registration ON magang_status_history(registration_id);
CREATE INDEX IF NOT EXISTS idx_history_changed ON magang_status_history(changed_at);

-- Table: magang_notifications
-- Stores email notifications sent to applicants
CREATE TABLE IF NOT EXISTS magang_notifications (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL,
    
    -- Notification Information
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('confirmation', 'status_update', 'reminder', 'approval', 'rejection')),
    email_to VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    
    -- Foreign Key
    CONSTRAINT fk_notif_registration FOREIGN KEY (registration_id) 
        REFERENCES magang_registrations(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notif_registration ON magang_notifications(registration_id);
CREATE INDEX IF NOT EXISTS idx_notif_status ON magang_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notif_sent ON magang_notifications(sent_at);


-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function: Auto-generate registration code
-- Uses BEFORE INSERT to set kode_pendaftaran using sequence peek + random for uniqueness
CREATE OR REPLACE FUNCTION generate_kode_pendaftaran()
RETURNS TRIGGER AS $$
DECLARE
    next_id BIGINT;
BEGIN
    -- Only generate if not provided
    IF NEW.kode_pendaftaran IS NULL OR NEW.kode_pendaftaran = '' THEN
        -- Get the next sequence value (without consuming it)
        -- This is an approximation; for exact ID, we'd need a custom sequence
        SELECT COALESCE(MAX(id), 0) + 1 INTO next_id FROM magang_registrations;
        
        -- Generate: MGG + YYYYMMDD + 5-digit padded number
        NEW.kode_pendaftaran := 'MGG' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(next_id::TEXT, 5, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate registration code before insert
CREATE TRIGGER trigger_generate_kode
BEFORE INSERT ON magang_registrations
FOR EACH ROW
EXECUTE FUNCTION generate_kode_pendaftaran();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at timestamp on updates
DROP TRIGGER IF EXISTS trigger_update_timestamp ON magang_registrations;
CREATE TRIGGER trigger_update_timestamp
BEFORE UPDATE ON magang_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function: Update registration status with history
CREATE OR REPLACE FUNCTION update_registration_status(
    p_registration_id BIGINT,
    p_new_status VARCHAR(50),
    p_notes TEXT,
    p_changed_by VARCHAR(255)
)
RETURNS VOID AS $$
DECLARE
    v_old_status VARCHAR(50);
BEGIN
    -- Get current status
    SELECT status INTO v_old_status 
    FROM magang_registrations 
    WHERE id = p_registration_id;
    
    -- Update registration status
    UPDATE magang_registrations 
    SET status = p_new_status 
    WHERE id = p_registration_id;
    
    -- Insert into status history
    INSERT INTO magang_status_history (
        registration_id, 
        old_status, 
        new_status, 
        notes, 
        changed_by
    ) VALUES (
        p_registration_id, 
        v_old_status, 
        p_new_status, 
        p_notes, 
        p_changed_by
    );
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- Views
-- =====================================================

-- View: Registration with document count
CREATE OR REPLACE VIEW v_registrations_summary AS
SELECT 
    r.id,
    r.nama_lengkap,
    r.email,
    r.telepon,
    r.institusi,
    r.jurusan,
    r.semester,
    r.durasi_magang,
    r.tanggal_mulai,
    r.tanggal_selesai,
    r.status,
    r.kode_pendaftaran,
    r.created_at,
    r.updated_at,
    COUNT(DISTINCT d.id) as document_count,
    COUNT(DISTINCT sh.id) as status_change_count
FROM magang_registrations r
LEFT JOIN magang_documents d ON r.id = d.registration_id
LEFT JOIN magang_status_history sh ON r.id = sh.registration_id
GROUP BY r.id, r.nama_lengkap, r.email, r.telepon, r.institusi, r.jurusan, 
         r.semester, r.durasi_magang, r.tanggal_mulai, r.tanggal_selesai, 
         r.status, r.kode_pendaftaran, r.created_at, r.updated_at;

-- View: Recent registrations (last 30 days)
CREATE OR REPLACE VIEW v_recent_registrations AS
SELECT 
    r.*,
    COUNT(d.id) as document_count
FROM magang_registrations r
LEFT JOIN magang_documents d ON r.id = d.registration_id
WHERE r.created_at >= NOW() - INTERVAL '30 days'
GROUP BY r.id
ORDER BY r.created_at DESC;

-- View: Pending registrations
CREATE OR REPLACE VIEW v_pending_registrations AS
SELECT 
    r.id,
    r.nama_lengkap,
    r.email,
    r.institusi,
    r.kode_pendaftaran,
    r.created_at,
    COUNT(d.id) as document_count
FROM magang_registrations r
LEFT JOIN magang_documents d ON r.id = d.registration_id
WHERE r.status = 'pending'
GROUP BY r.id, r.nama_lengkap, r.email, r.institusi, r.kode_pendaftaran, r.created_at
ORDER BY r.created_at ASC;

-- =====================================================
-- Sample Queries (commented out)
-- =====================================================

-- Query 1: Get registration with all documents
-- SELECT r.*, d.document_type, d.file_name, d.file_path
-- FROM magang_registrations r
-- LEFT JOIN magang_documents d ON r.id = d.registration_id
-- WHERE r.kode_pendaftaran = 'MGG2025100300001';

-- Query 2: Get registration status history
-- SELECT sh.*, r.nama_lengkap
-- FROM magang_status_history sh
-- JOIN magang_registrations r ON sh.registration_id = r.id
-- WHERE r.kode_pendaftaran = 'MGG2025100300001'
-- ORDER BY sh.changed_at DESC;

-- Query 3: Statistics by month
-- SELECT 
--     TO_CHAR(created_at, 'YYYY-MM') as month,
--     COUNT(*) as total_registrations,
--     SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
--     SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
--     SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
-- FROM magang_registrations
-- GROUP BY TO_CHAR(created_at, 'YYYY-MM')
-- ORDER BY month DESC;

-- Query 4: Get registrations by institution
-- SELECT 
--     institusi,
--     COUNT(*) as total_applicants,
--     SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
-- FROM magang_registrations
-- GROUP BY institusi
-- ORDER BY total_applicants DESC;

-- =====================================================
-- Usage Example for update_registration_status function
-- =====================================================
-- SELECT update_registration_status(
--     1,                          -- registration_id
--     'approved',                 -- new_status
--     'Documents verified',       -- notes
--     'admin@dpmptsp.go.id'      -- changed_by
-- );
