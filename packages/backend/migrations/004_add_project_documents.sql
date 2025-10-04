-- Add project documents table
-- This allows projects to have documentation that the AI can access

CREATE TABLE IF NOT EXISTS project_documents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  file_type VARCHAR(50), -- 'markdown', 'text', 'pdf', etc.
  file_size INTEGER, -- Size in bytes
  file_url VARCHAR(500), -- URL or path to the file
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_project_documents_created_at ON project_documents(created_at DESC);

-- Add full-text search index on content
CREATE INDEX IF NOT EXISTS idx_project_documents_content_search ON project_documents USING gin(to_tsvector('english', content));

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_project_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_documents_updated_at
  BEFORE UPDATE ON project_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_project_documents_updated_at();
