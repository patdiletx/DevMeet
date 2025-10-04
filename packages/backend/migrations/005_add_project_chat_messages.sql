-- Create project_chat_messages table
CREATE TABLE IF NOT EXISTS project_chat_messages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_project_id ON project_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_created_at ON project_chat_messages(created_at);

-- Add comment
COMMENT ON TABLE project_chat_messages IS 'Stores chat messages for project-wide AI conversations';
