import { sql } from "drizzle-orm";
import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// 枚举定义
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

// 所有表共有的列：主键 + 时间戳
const commonColumns = () => ({
  // 主键
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  // 创建时间
  createdAt: timestamp("createdAt", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .defaultNow(),
  // 更新时间
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
  ...commonColumns(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("passwordHash").notNull(),
  emailVerified: boolean("emailVerified").notNull().default(false),
});

// 认证表
export const authSessions = pgTable(
  "auth_sessions",
  {
    ...commonColumns(),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "string" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
  },
  (t) => [index("auth_sessions_userId_idx").on(t.userId)],
);

// 会话表
export const threads = pgTable(
  "threads",
  {
    ...commonColumns(),
    title: text("title").notNull().default("新会话"),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [index("threads_userId_idx").on(t.userId)],
);

// 消息表
export const messages = pgTable(
  "messages",
  {
    ...commonColumns(),
    threadId: uuid("threadId")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
  },
  (t) => [index("messages_threadId_idx").on(t.threadId)],
);

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SelectAuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = typeof authSessions.$inferInsert;

export type SelectThread = typeof threads.$inferSelect;
export type InsertThread = typeof threads.$inferInsert;

export type SelectMessage = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
