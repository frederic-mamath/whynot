import * as path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { Migrator, FileMigrationProvider } from 'kysely';
import { db } from './src/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Migration "${it.migrationName}" executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`❌ Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('❌ Failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
  console.log('✅ All migrations completed');
}

migrateToLatest();
