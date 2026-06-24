// Canonical migration/query runner — connects directly via pg (Postgres),
// because the older scripts/run-sql-*.js rely on an `exec_sql` RPC that does
// not exist in this database.
//
// Usage (from project root, with Windows node):
//   node scripts/db-run.mjs <path-to.sql>     # apply a migration file
//   node scripts/db-run.mjs -q "SELECT ..."   # run an ad-hoc query, print rows
import pg from "pg";
import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
});

const conn = (env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL).split("?")[0];
const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/db-run.mjs <file.sql> | -q \"SQL\"");
  process.exit(1);
}

await client.connect();
try {
  if (args[0] === "-q") {
    const r = await client.query(args[1]);
    console.log(JSON.stringify(r.rows, null, 1));
  } else {
    const sql = fs.readFileSync(path.join(process.cwd(), args[0]), "utf8");
    await client.query(sql);
    console.log("OK applied: " + args[0]);
  }
} catch (e) {
  console.error("DB ERROR:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
