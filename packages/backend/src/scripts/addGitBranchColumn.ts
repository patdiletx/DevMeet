import { query } from '../config/database';
import { logger } from '../config/logger';

async function addGitBranchColumn() {
  try {
    logger.info('Adding git_branch column to projects table');

    await query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS git_branch VARCHAR(100)
    `);

    logger.info('Column added successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to add column:', error);
    process.exit(1);
  }
}

addGitBranchColumn();
