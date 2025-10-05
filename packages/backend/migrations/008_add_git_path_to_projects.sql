-- Add git_path and git_branch to projects table for filtering commits
ALTER TABLE projects
ADD COLUMN git_path VARCHAR(500),
ADD COLUMN git_branch VARCHAR(100);

COMMENT ON COLUMN projects.git_path IS 'Optional git path filter for daily standup commits (e.g., "packages/backend" or "src/frontend")';
COMMENT ON COLUMN projects.git_branch IS 'Optional git branch for daily standup commits (e.g., "main", "develop")';
