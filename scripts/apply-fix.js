import pkg from 'pg';
const { Client } = pkg;
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function applyFix() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL environment variables");
    return;
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Force unauthorized rejection to false at a lower level if needed
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const sqlFile = process.argv[2] || "fix-chat-recursion.sql";
  const sql = fs.readFileSync(path.join(process.cwd(), sqlFile), "utf8");

  console.log(`Applying SQL from ${sqlFile} via direct Postgres connection...`);
  
  try {
    await client.connect();
    await client.query(sql);
    console.log("Successfully applied SQL!");
  } catch (error) {
    console.error("Error applying SQL:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFix().catch(console.error);
