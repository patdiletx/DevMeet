import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../config/database';
import { logger } from '../config/logger';

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: tsx runMigration.ts <migration-file>');
  process.exit(1);
}

async function runMigration() {
  try {
    const migrationPath = join(__dirname, '../../migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf-8');

    logger.info(`Running migration: ${migrationFile}`);
    await query(sql);
    logger.info('Migration completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
