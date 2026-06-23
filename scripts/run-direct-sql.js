const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env variables
const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value;
  }
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;

if (!connectionString) {
  console.error("No PostgreSQL connection string found in .env");
  process.exit(1);
}

const sqlArg = process.argv[2];
if (!sqlArg) {
  console.error("Please provide a SQL string or path to a SQL file");
  process.exit(1);
}

let sql = '';
if (fs.existsSync(sqlArg)) {
  sql = fs.readFileSync(sqlArg, 'utf8');
  console.log(`Running SQL from file: ${sqlArg}`);
} else {
  sql = sqlArg;
  console.log(`Running SQL query string directly`);
}

async function run() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!");
    const res = await client.query(sql);
    console.log("SQL executed successfully!");
    if (res.rows) {
      console.log(`Returned ${res.rows.length} rows.`);
      if (res.rows.length > 0) {
        console.log(res.rows.slice(0, 10));
      }
    }
  } catch (err) {
    console.error("Postgres execution error:", err);
  } finally {
    await client.end();
  }
}

run();
