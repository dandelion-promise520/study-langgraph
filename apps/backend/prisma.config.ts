import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import "dotenv/config";

import { env } from "./src/config/env";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.ts",
    db: {
      connection: env.DATABASE_URL,
    },
  }),
});
