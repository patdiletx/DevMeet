#!/usr/bin/env tsx
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function markMigrations() {
  const client = await pool.connect();
  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Mark existing migrations as applied
    const migrations = [
      '001_initial_schema.sql',
      '002_add_analysis_chat_notes.sql'
    ];

    for (const migration of migrations) {
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
        [migration]
      );
      console.log(`✅ Marked as applied: ${migration}`);
    }

    console.log('\n✨ Done! Now run: npm run migrate');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

markMigrations();
