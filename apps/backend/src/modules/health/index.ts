import Elysia from "elysia";

import { db } from "../../prisma/db";

const pingDatabase = async () => {
  const plan = db.raw.sql`SELECT 1`.affectedCount().build();
  await db.runtime().execute(plan);
};

export const healthModule = new Elysia({ name: "health" })
  .onStart(async () => {
    try {
      await pingDatabase();
      console.log("数据库连接成功");
    } catch (error) {
      console.error("数据库连接失败，服务终止", error);
      process.exit(1);
    }
  })
  .get("/health", async ({ set }) => {
    try {
      await pingDatabase();
      return {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      set.status = 503;
      return {
        status: "error",
        database: "unreachable",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
