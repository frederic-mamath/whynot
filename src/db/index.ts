import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'notwhat',
  user: 'postgres',
  password: 'postgres',
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

export const db = drizzle(pool, { schema });
