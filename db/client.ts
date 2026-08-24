import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;

let database: Database | undefined;
let pool: Pool | undefined;

export function getDatabase(): Database {
  if (database) {
    return database;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before connecting to PostgreSQL.");
  }

  pool = new Pool({ connectionString: databaseUrl });
  database = drizzle({
    client: pool,
    schema,
  });

  return database;
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool?.end();
  pool = undefined;
  database = undefined;
}
