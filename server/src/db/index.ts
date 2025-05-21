import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(process.env.DATABASE_URL!);

console.log("uhh", await db.execute("select 1"));

export default db;
