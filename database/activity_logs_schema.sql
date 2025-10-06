-- Activity Logs Table
-- Tracks all important user activities in the system

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE activity_logs IS 'Tracks all user activities and system events';
COMMENT ON COLUMN activity_logs.activity_type IS 'Types: login, logout, user_created, user_updated, registration_approved, registration_rejected, attendance_marked, etc.';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional context data in JSON format';

-- Enable Row Level Security (optional, for Supabase)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: System can insert activity logs
CREATE POLICY "Allow system to insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);
