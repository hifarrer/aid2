-- Create health_reports table (Render.com compatible version - without Supabase auth)
CREATE TABLE IF NOT EXISTS health_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'lab_results', 'exam_results', 'imaging', 'general_report', etc.
    original_filename VARCHAR(255),
    file_content TEXT, -- Store the extracted text content
    file_size INTEGER,
    mime_type VARCHAR(100),
    ai_analysis TEXT, -- Store the AI analysis/summary
    ai_summary TEXT, -- Store the concise summary
    key_findings TEXT[], -- Array of key findings
    recommendations TEXT[], -- Array of recommendations
    risk_level VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'moderate', 'high', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_report_attachments table for storing file attachments
CREATE TABLE IF NOT EXISTS health_report_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    health_report_id UUID NOT NULL REFERENCES health_reports(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500), -- Path to stored file
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_report_history table for tracking analysis history
CREATE TABLE IF NOT EXISTS health_report_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    health_report_id UUID NOT NULL REFERENCES health_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'uploaded', 'analyzed', 'summary_generated', 'pdf_created', 'saved'
    details JSONB, -- Additional details about the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_created_at ON health_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_reports_report_type ON health_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_health_reports_risk_level ON health_reports(risk_level);
CREATE INDEX IF NOT EXISTS idx_health_report_attachments_report_id ON health_report_attachments(health_report_id);
CREATE INDEX IF NOT EXISTS idx_health_report_history_report_id ON health_report_history(health_report_id);
CREATE INDEX IF NOT EXISTS idx_health_report_history_user_id ON health_report_history(user_id);

-- Note: RLS (Row Level Security) policies are Supabase-specific
-- For Render.com or other PostgreSQL databases, application-level access control should be used
-- RLS policies are commented out below - uncomment if using Supabase

-- ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_report_attachments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_report_history ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_reports_updated_at 
    BEFORE UPDATE ON health_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

