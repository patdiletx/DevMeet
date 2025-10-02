-- 001_initial_schema.sql
-- DevMeet AI - Initial Database Schema
-- Created: 2025-10-02

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create meetings table
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  audio_file_path VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_started_at ON meetings(started_at DESC);
CREATE INDEX idx_meetings_metadata ON meetings USING GIN(metadata);

-- Create transcriptions table
CREATE TABLE transcriptions (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  speaker VARCHAR(100),
  timestamp TIMESTAMP NOT NULL,
  confidence DECIMAL(5,4),
  language VARCHAR(10),
  duration_seconds DECIMAL(6,2),
  audio_offset_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transcriptions_meeting ON transcriptions(meeting_id);
CREATE INDEX idx_transcriptions_timestamp ON transcriptions(timestamp);
CREATE INDEX idx_transcriptions_content_fts ON transcriptions
  USING GIN(to_tsvector('spanish', content));

-- Create notes table
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  section VARCHAR(100),
  referenced_transcription_ids INTEGER[],
  generated_at TIMESTAMP NOT NULL,
  model_version VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_meeting ON notes(meeting_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_generated_at ON notes(generated_at DESC);

-- Create action_items table
CREATE TABLE action_items (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP,
  referenced_transcription_ids INTEGER[],
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_action_items_meeting ON action_items(meeting_id);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_priority ON action_items(priority);
CREATE INDEX idx_action_items_due_date ON action_items(due_date);

-- Create participants table
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100),
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  speaking_time_seconds INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_participants_meeting ON participants(meeting_id);
CREATE INDEX idx_participants_email ON participants(email);

-- Create documentation_references table
CREATE TABLE documentation_references (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  technology VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  title VARCHAR(500),
  description TEXT,
  relevance_score DECIMAL(3,2),
  mentioned_at TIMESTAMP,
  referenced_transcription_ids INTEGER[],
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_refs_meeting ON documentation_references(meeting_id);
CREATE INDEX idx_doc_refs_technology ON documentation_references(technology);
CREATE INDEX idx_doc_refs_relevance ON documentation_references(relevance_score DESC);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification queries
SELECT 'Migration 001 completed successfully!' AS status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
