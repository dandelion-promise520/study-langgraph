import { env } from "@backend/config/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { relations } from "./relations";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle({ client: pool, relations });
