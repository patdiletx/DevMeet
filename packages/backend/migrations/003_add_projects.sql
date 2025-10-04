-- 003_add_projects.sql
-- DevMeet AI - Add Projects Support
-- Created: 2025-10-04

BEGIN;

-- Create projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_name ON projects(name);

-- Add project_id to meetings table
ALTER TABLE meetings
  ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX idx_meetings_project ON meetings(project_id);

-- Apply trigger for updated_at on projects
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification queries
SELECT 'Migration 003 completed successfully!' AS status;
