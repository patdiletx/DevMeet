#!/usr/bin/env tsx
/**
 * Database Migration Script
 *
 * Usage:
 *   npm run migrate              # Run all pending migrations
 *   npm run migrate:rollback     # Rollback last migration (not implemented yet)
 *   npm run migrate:status       # Show migration status
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Migration {
  filename: string;
  sql: string;
}

const MIGRATIONS_DIR = join(__dirname, '../migrations');

async function getMigrations(): Promise<Migration[]> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  return files.map((filename) => ({
    filename,
    sql: readFileSync(join(MIGRATIONS_DIR, filename), 'utf-8'),
  }));
}

async function createMigrationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations table ready');
  } finally {
    client.release();
  }
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query(
    'SELECT filename FROM schema_migrations ORDER BY filename'
  );
  return result.rows.map((row) => row.filename);
}

async function runMigration(migration: Migration) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log(`📦 Running migration: ${migration.filename}`);
    await client.query(migration.sql);

    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [migration.filename]
    );

    await client.query('COMMIT');
    console.log(`✅ Migration applied: ${migration.filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed: ${migration.filename}`);
    throw error;
  } finally {
    client.release();
  }
}

async function migrate() {
  try {
    console.log('🚀 Starting migrations...\n');

    // Create migrations table if it doesn't exist
    await createMigrationsTable();

    // Get all migrations and applied ones
    const allMigrations = await getMigrations();
    const appliedMigrations = await getAppliedMigrations();

    console.log(`📋 Total migrations: ${allMigrations.length}`);
    console.log(`✓  Applied: ${appliedMigrations.length}`);
    console.log(`⏳ Pending: ${allMigrations.length - appliedMigrations.length}\n`);

    // Filter pending migrations
    const pendingMigrations = allMigrations.filter(
      (m) => !appliedMigrations.includes(m.filename)
    );

    if (pendingMigrations.length === 0) {
      console.log('✨ No pending migrations. Database is up to date!\n');
      return;
    }

    // Run each pending migration
    for (const migration of pendingMigrations) {
      await runMigration(migration);
    }

    console.log('\n✨ All migrations completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function status() {
  try {
    await createMigrationsTable();

    const allMigrations = await getMigrations();
    const appliedMigrations = await getAppliedMigrations();

    console.log('\n📊 Migration Status:\n');
    console.log('Applied migrations:');
    appliedMigrations.forEach((filename) => {
      console.log(`  ✅ ${filename}`);
    });

    const pending = allMigrations.filter(
      (m) => !appliedMigrations.includes(m.filename)
    );

    if (pending.length > 0) {
      console.log('\nPending migrations:');
      pending.forEach((migration) => {
        console.log(`  ⏳ ${migration.filename}`);
      });
    }

    console.log(
      `\nTotal: ${allMigrations.length} | Applied: ${appliedMigrations.length} | Pending: ${pending.length}\n`
    );
  } catch (error) {
    console.error('❌ Error checking status:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const command = process.argv[2] || 'migrate';

switch (command) {
  case 'migrate':
    migrate();
    break;
  case 'status':
    status();
    break;
  default:
    console.log('Usage: npm run migrate [command]');
    console.log('Commands:');
    console.log('  migrate  - Run all pending migrations (default)');
    console.log('  status   - Show migration status');
    process.exit(1);
}
