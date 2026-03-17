import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function checkTables() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables in database:", tables.map(t => t.table_name));
    process.exit(0);
  } catch (e: any) {
    console.error("Failed to fetch tables:", e.message);
    process.exit(1);
  }
}

checkTables();
