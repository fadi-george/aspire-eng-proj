import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const runMigration = async () => {
  const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    database: process.env.SUPABASE_DB_NAME,
    ssl: true,
  });

  const db = drizzle(pool);

  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Migrations completed!");
  await pool.end();
  process.exit(0);
};

runMigration().catch((err) => {
  console.error("Migration failed!");
  console.error(err);
  process.exit(1);
});
