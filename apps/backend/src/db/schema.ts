import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// 枚举定义
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

// 通用基础时间戳结构（复用继承模式）
const timestamps = () => ({
  createdAt: timestamp("createdAt", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updatedAt", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date().toISOString()),
});

// 用户表
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  ...timestamps(),
});

// 会话表
export const threads = pgTable("threads", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  title: text("title").notNull().default("新会话"),
  userId: uuid("userId").references(() => users.id, { onDelete: "set null" }),
  ...timestamps(),
});

// 消息表
export const messages = pgTable("messages", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  threadId: uuid("threadId")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  ...timestamps(),
});

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SelectThread = typeof threads.$inferSelect;
export type InsertThread = typeof threads.$inferInsert;

export type SelectMessage = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
