import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function inspect() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position;
    `);
    console.log("Notifications Columns:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspect();
