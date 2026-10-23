import { db } from "@backend/db";
import { sql } from "drizzle-orm";
import Elysia from "elysia";

const pingDatabase = async () => {
  await db.execute(sql`SELECT 1`);
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
    } catch (cause) {
      console.error("[health] 数据库探活失败", cause);
      set.status = 503;

      return {
        status: "error",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      };
    }
  });
