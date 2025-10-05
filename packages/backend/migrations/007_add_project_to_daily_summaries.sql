-- Add project_id to daily_summaries table
ALTER TABLE daily_summaries
ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

-- Drop old unique constraint
DROP INDEX IF EXISTS idx_daily_summaries_user_date_unique;

-- Create new unique constraint with project_id
CREATE UNIQUE INDEX idx_daily_summaries_user_project_date_unique
ON daily_summaries(user_id, project_id, summary_date);

-- Allow NULL project_id for personal summaries
CREATE UNIQUE INDEX idx_daily_summaries_user_date_unique_no_project
ON daily_summaries(user_id, summary_date)
WHERE project_id IS NULL;
