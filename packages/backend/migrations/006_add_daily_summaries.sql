-- Create daily_summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER DEFAULT 1, -- For future multi-user support
  summary_date DATE NOT NULL,
  yesterday_work JSONB DEFAULT '[]', -- Array of work items from yesterday
  today_plan JSONB DEFAULT '[]', -- Array of planned tasks for today
  blockers JSONB DEFAULT '[]', -- Array of blockers
  standup_script TEXT, -- Natural language script for standup
  git_commits JSONB DEFAULT '[]', -- Array of git commits
  meetings_summary TEXT, -- Summary of yesterday's meetings
  raw_data JSONB DEFAULT '{}', -- Raw data for debugging
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date);

-- Add unique constraint to prevent duplicate summaries for same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_summaries_user_date_unique ON daily_summaries(user_id, summary_date);

-- Add comment
COMMENT ON TABLE daily_summaries IS 'Stores daily standup summaries generated from git commits, meetings, and notes';
