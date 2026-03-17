import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function checkColumns() {
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'api_usage'
    `;
    console.log("Columns in api_usage:", JSON.stringify(columns, null, 2));
    process.exit(0);
  } catch (e: any) {
    console.error("Failed to fetch columns:", e.message);
    process.exit(1);
  }
}

checkColumns();
