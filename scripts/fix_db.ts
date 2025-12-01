import 'dotenv/config';
import { db } from '../drizzle/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Altering transactions table...');
  try {
    await db.execute(sql`ALTER TABLE transactions ALTER COLUMN project_id DROP NOT NULL`);
    console.log('Successfully altered transactions table.');
  } catch (e) {
    console.error('Error altering table:', e);
  }
  process.exit(0);
}

main();
