-- 002_add_analysis_chat_notes.sql
-- DevMeet AI - Add analysis, chat, and notes tables
-- Created: 2025-10-04

BEGIN;

-- Create meeting_analysis table to store AI analysis results
CREATE TABLE meeting_analysis (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  summary TEXT,
  key_points TEXT[],
  action_items TEXT[],
  decisions TEXT[],
  topics TEXT[],
  participants TEXT[],
  sentiment VARCHAR(20),
  user_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meeting_analysis_meeting ON meeting_analysis(meeting_id);
CREATE INDEX idx_meeting_analysis_updated ON meeting_analysis(updated_at DESC);

-- Create chat_messages table to store AI chat history
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_meeting ON chat_messages(meeting_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Create user_notes table to store user manual notes
CREATE TABLE user_notes (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_notes_meeting ON user_notes(meeting_id);

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_meeting_analysis_updated_at BEFORE UPDATE ON meeting_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification
SELECT 'Migration 002 completed successfully!' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('meeting_analysis', 'chat_messages', 'user_notes')
ORDER BY table_name;
