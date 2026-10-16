# Drizzle ORM（Context7 文档片段）

> 本文件由 ctx7 CLI 按下列主题检索并整理。Context7 返回与查询相关的文档片段，不是上游文档站点的完整离线副本。

- 采集日期：2026-10-14
- Context7 Library ID：`/drizzle-team/drizzle-orm-docs`
- Context7 来源分支：Context7 文档来自 main 分支，未固定具体版本。
- 仓库状态：仓库目前尚未声明 Drizzle 依赖。
- CLI：`ctx7 0.5.8`；每个主题均通过 `ctx7 docs <Library ID> <query> --json` 获取。

## Drizzle ORM PostgreSQL connection setup with node-postgres, schema files, and drizzle instance

### Initialize node-postgres driver with connection string

Connects to PostgreSQL using Drizzle ORM and the node-postgres driver. Requires the 'pg' package.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/connect-neon.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/connect-neon.mdx)

Context7 片段生成时间：2026-09-14T03:53:07.955Z

```typescript
// Make sure to install the 'pg' package
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(process.env.DATABASE_URL);

const result = await db.execute("select 1");
```

### Initialize connection with node-postgres config

Initialize Drizzle ORM by providing a connection options object with connectionString and ssl settings to drizzle.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/mdx/get-started/postgresql/ConnectAppwritePostgres.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/mdx/get-started/postgresql/ConnectAppwritePostgres.mdx)

Context7 片段生成时间：2026-09-19T05:16:59.508Z

```typescript
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

// You can specify any property from the node-postgres connection options
const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
    ssl: true,
  },
});
```

### Generate and apply PostgreSQL migrations with Drizzle ORM and node-postgres

Defines a PostgreSQL schema in TypeScript, generates migration SQL files with drizzle-kit generate, and applies unapplied migrations programmatically using the node-postgres migrator.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/migrations.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/migrations.mdx)

Context7 片段生成时间：2026-09-14T04:04:14.140Z

```typescript
import * as p from "drizzle-orm/pg-core";

export const users = p.pgTable("users", {
  id: p.serial().primaryKey(),
  name: p.text(),
  email: p.text().unique(),
});
```

```text
┌────────────────────────┐
│ $ drizzle-kit generate │
└─┬──────────────────────┘
  │
  └ 1. read previous migration folders
    2. find diff between current and previous schema
    3. prompt developer for renames if necessary
  ┌ 4. generate SQL migration and persist to file
  │    ┌─┴───────────────────────────────────────┐
  │      📂 drizzle
  │      └ 📂 20242409125510_premium_mister_fear
  │        ├ 📜 snapshot.json
  │        └ 📜 migration.sql
  v
```

```sql
-- drizzle/20242409125510_premium_mister_fear/migration.sql

CREATE TABLE "users" (
 "id" SERIAL PRIMARY KEY,
 "name" TEXT,
 "email" TEXT UNIQUE
);
```

```typescript
// index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const db = drizzle(process.env.DATABASE_URL);

await migrate(db);
```

```text
┌───────────────────────┐
│ npx tsx src/index.ts  │
└─┬─────────────────────┘
  │
  ├ 1. init database connection                             ┌──────────────────────────┐
  └ 2. read migration.sql files in migrations folder        │                          │
    3. fetch migration history from database -------------> │                          │
  ┌ 4. pick previously unapplied migrations <-------------- │         DATABASE         │
  └ 5. apply new migration to the database ---------------> │                          │
                                                            │                          │
                                                            └──────────────────────────┘
[✓] done!
```

### Define relations and pass to drizzle database instance

Sequential setup showing how to define all schema relations in a central relations.ts file and initialize the drizzle database instance in index.ts with the relations option.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/relations-v1-v2.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/relations-v1-v2.mdx)

Context7 片段生成时间：2026-09-14T04:16:53.048Z

```ts
// relations.ts
import * as schema from "./schema"
import { defineRelations } from "drizzle-orm"

export const relations = defineRelations(schema, (r) => ({
    ...
}));
```

```ts
// index.ts
import { relations } from "./relations";
import { drizzle } from "drizzle-orm/...";

const db = drizzle(process.env.DATABASE_URL, { relations });
```

### Initialize node-postgres driver with existing Pool instance

Passes an existing pg Pool instance to Drizzle ORM. Requires the 'pg' package.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/connect-neon.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/connect-neon.mdx)

Context7 片段生成时间：2026-09-14T03:53:07.955Z

```typescript
// Make sure to install the 'pg' package
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle({ client: pool });

const result = await db.execute("select 1");
```

## Drizzle ORM PostgreSQL schema definition with tables, columns, defaults, constraints, indexes, relations, and inferred TypeScript types

### Define PostgreSQL schema with enums, tables, and indexes

Declares relational tables (users, posts, comments) and an enum using Drizzle ORM PostgreSQL core definitions. Demonstrates self-referencing foreign keys, generated identity columns, and table-level indexes.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/sql-schema-declaration.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/sql-schema-declaration.mdx)

Context7 片段生成时间：2026-09-14T04:13:22.404Z

```typescript
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["guest", "user", "admin"]);

export const users = table(
  "users",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    firstName: t.varchar("first_name", { length: 256 }),
    lastName: t.varchar("last_name", { length: 256 }),
    email: t.varchar().notNull(),
    invitee: t.integer().references((): AnyPgColumn => users.id),
    role: rolesEnum().default("guest"),
  },
  (table) => [t.uniqueIndex("email_idx").on(table.email)],
);

export const posts = table(
  "posts",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: t.varchar().$default(() => generateUniqueString(16)),
    title: t.varchar({ length: 256 }),
    ownerId: t.integer("owner_id").references(() => users.id),
  },
  (table) => [t.uniqueIndex("slug_idx").on(table.slug), t.index("title_idx").on(table.title)],
);

export const comments = table("comments", {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  text: t.varchar({ length: 256 }),
  postId: t.integer("post_id").references(() => posts.id),
  ownerId: t.integer("owner_id").references(() => users.id),
});
```

### Define PostgreSQL schema in src/schema.ts

Declares users and posts tables with relations, constraints, and inferred TypeScript insert and select types.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/bun-railway-pg.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/bun-railway-pg.mdx)

Context7 片段生成时间：2026-09-19T05:25:18.939Z

```typescript
import * as p from "drizzle-orm/pg-core";

export const usersTable = p.pgTable("users", {
  id: p.serial().primaryKey(),
  name: p.text().notNull(),
  age: p.integer().notNull(),
  email: p.text().notNull().unique(),
});

export const postsTable = p.pgTable("posts", {
  id: p.serial().primaryKey(),
  title: p.text().notNull(),
  content: p.text().notNull(),
  userId: p
    .integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: p.timestamp().notNull().defaultNow(),
  updatedAt: p
    .timestamp()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export type InsertPost = typeof postsTable.$inferInsert;
export type SelectPost = typeof postsTable.$inferSelect;
```

### Infer select and insert models from a PostgreSQL table

Use $inferSelect and $inferInsert or the InferSelectModel and InferInsertModel type helpers to extract TypeScript types from a PostgreSQL schema definition.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/goodies.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/goodies.mdx)

Context7 片段生成时间：2026-09-14T03:59:15.349Z

```typescript
import { serial, text, pgTable } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

const users = pgTable("users", {
  id: serial().primaryKey(),
  name: text().notNull(),
});

type SelectUser = typeof users.$inferSelect;
type InsertUser = typeof users.$inferInsert;

type SelectUserAlt = InferSelectModel<typeof users>;
type InsertUserAlt = InferInsertModel<typeof users>;
```

### Define PostgreSQL schema with relational foreign keys

Defines a multi-table PostgreSQL schema for customers, employees, orders, suppliers, products, and order details using Drizzle ORM pgTable definitions and foreign key references.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/seed-overview.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/seed-overview.mdx)

Context7 片段生成时间：2026-09-14T04:12:04.569Z

```ts
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { integer, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const customers = pgTable("customer", {
  id: varchar({ length: 256 }).primaryKey(),
  companyName: text().notNull(),
  contactName: text().notNull(),
  contactTitle: text().notNull(),
  address: text().notNull(),
  city: text().notNull(),
  postalCode: text(),
  region: text(),
  country: text().notNull(),
  phone: text().notNull(),
  fax: text(),
});

export const employees = pgTable("employee", {
  id: integer().primaryKey(),
  lastName: text().notNull(),
  firstName: text(),
  title: text().notNull(),
  titleOfCourtesy: text().notNull(),
  birthDate: timestamp().notNull(),
  hireDate: timestamp().notNull(),
  address: text().notNull(),
  city: text().notNull(),
  postalCode: text().notNull(),
  country: text().notNull(),
  homePhone: text().notNull(),
  extension: integer().notNull(),
  notes: text().notNull(),
  reportsTo: integer().references((): AnyPgColumn => employees.id),
  photoPath: text(),
});

export const orders = pgTable("order", {
  id: integer().primaryKey(),
  orderDate: timestamp().notNull(),
  requiredDate: timestamp().notNull(),
  shippedDate: timestamp(),
  shipVia: integer().notNull(),
  freight: numeric().notNull(),
  shipName: text().notNull(),
  shipCity: text().notNull(),
  shipRegion: text(),
  shipPostalCode: text(),
  shipCountry: text().notNull(),

  customerId: text()
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),

  employeeId: integer()
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
});

export const suppliers = pgTable("supplier", {
  id: integer().primaryKey(),
  companyName: text().notNull(),
  contactName: text().notNull(),
  contactTitle: text().notNull(),
  address: text().notNull(),
  city: text().notNull(),
  region: text(),
  postalCode: text().notNull(),
  country: text().notNull(),
  phone: text().notNull(),
});

export const products = pgTable("product", {
  id: integer().primaryKey(),
  name: text().notNull(),
  quantityPerUnit: text().notNull(),
  unitPrice: numeric().notNull(),
  unitsInStock: integer().notNull(),
  unitsOnOrder: integer().notNull(),
  reorderLevel: integer().notNull(),
  discontinued: integer().notNull(),

  supplierId: integer()
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
});

export const details = pgTable("order_detail", {
  unitPrice: numeric().notNull(),
  quantity: integer().notNull(),
  discount: numeric().notNull(),

  orderId: integer()
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  productId: integer()
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
});
```

### Seed relational data using Drizzle ORM relations definition

Resolves the seeding error by creating a relations definition with postsRelations and passing it into the seed() schema object. This enables the with nested seeding without modifying the column constraint directly.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/guides/seeding-using-with-option.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/guides/seeding-using-with-option.mdx)

Context7 片段生成时间：2026-09-14T03:02:34.748Z

```typescript
import { users, posts, postsRelations } from './schema.ts';

async function main() {
    const db = drizzle(...);
    await seed(db, { users, posts, postsRelations }).refine(() => ({
        users: {
            count: 2,
            with: {
                posts: 3,
            },
        },
    }));
}
main();

// Running the seeding script above will fill you database with values shown below
```

```mdx
`users`

| id  | name      |
| --- | --------- |
| 1   | 'Melanny' |
| 2   | 'Elvera'  |

`posts`

| id  | content               | author_id |
| --- | --------------------- | --------- |
| 1   | 'tf02gUXb0LZIdEg6SL'  | 2         |
| 2   | 'j15YdT7Sma'          | 2         |
| 3   | 'LwwvWtLLAZzIpk'      | 1         |
| 4   | 'mgyUnBKSrQw'         | 1         |
| 5   | 'CjAJByKIqilHcPjkvEw' | 2         |
| 6   | 'S5g0NzXs'            | 1         |
```

```typescript
import { serial, pgTable, integer, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content"),
  authorId: integer("author_id").notNull(),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

## Drizzle ORM PostgreSQL query API for select, insert, update, delete, joins, filtering, ordering, and returning

### Query Vercel Postgres database with basic CRUD operations

Performs insert, select, update, and delete queries on the usersTable using drizzle-orm and the Vercel Postgres driver in src/index.ts.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/get-started/vercel-existing.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/get-started/vercel-existing.mdx)

Context7 片段生成时间：2026-09-14T02:45:54.061Z

```typescript
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { usersTable } from "./db/schema";

async function main() {
  const db = drizzle();

  const user: typeof usersTable.$inferInsert = {
    name: "John",
    age: 30,
    email: "john@example.com",
  };

  await db.insert(usersTable).values(user);
  console.log("New user created!");

  const users = await db.select().from(usersTable);
  console.log("Getting all users from the database: ", users);
  /*
  const users: {
    id: number;
    name: string;
    age: number;
    email: string;
  }[]
  */

  await db
    .update(usersTable)
    .set({
      age: 31,
    })
    .where(eq(usersTable.email, user.email));
  console.log("User info updated!");

  await db.delete(usersTable).where(eq(usersTable.email, user.email));
  console.log("User deleted!");
}

main();
```

### Select data with filters, joins, and pagination

Fetches single users, users joined with post counts, and paginated posts created within the last 24 hours. Note that getColumns requires drizzle-orm@1.0.0-beta.2 or later (use getTableColumns on older versions).

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/drizzle-with-supabase.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/drizzle-with-supabase.mdx)

Context7 片段生成时间：2026-09-14T05:08:37.522Z

```typescript
import { asc, between, count, eq, getColumns, sql } from "drizzle-orm";
import { db } from "../index";
import { SelectUser, postsTable, usersTable } from "../schema";

export async function getUserById(id: SelectUser["id"]): Promise<
  Array<{
    id: number;
    name: string;
    age: number;
    email: string;
  }>
> {
  return db.select().from(usersTable).where(eq(usersTable.id, id));
}

export async function getUsersWithPostsCount(
  page = 1,
  pageSize = 5,
): Promise<
  Array<{
    postsCount: number;
    id: number;
    name: string;
    age: number;
    email: string;
  }>
> {
  return db
    .select({
      ...getColumns(usersTable),
      postsCount: count(postsTable.id),
    })
    .from(usersTable)
    .leftJoin(postsTable, eq(usersTable.id, postsTable.userId))
    .groupBy(usersTable.id)
    .orderBy(asc(usersTable.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

export async function getPostsForLast24Hours(
  page = 1,
  pageSize = 5,
): Promise<
  Array<{
    id: number;
    title: string;
  }>
> {
  return db
    .select({
      id: postsTable.id,
      title: postsTable.title,
    })
    .from(postsTable)
    .where(between(postsTable.createdAt, sql`now() - interval '1 day'`, sql`now()`))
    .orderBy(asc(postsTable.title), asc(postsTable.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}
```

### Insert into select using db.select query builder

Performs an INSERT INTO ... SELECT query by passing a db.select() query builder directly into the select method and returning inserted values.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/insert.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/insert.mdx)

Context7 片段生成时间：2026-09-14T04:03:09.911Z

```ts
const insertedEmployees = await db
  .insert(employees)
  .select(
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "employee")),
  )
  .returning({
    id: employees.id,
    name: employees.name,
  });
```

### Composing filters in a service function with `SQL[]` and `and()`

Build filters array conditionally in a service function, then pass it to `.where(and(...filters))` — cleanly separates domain logic (which filters to apply) from query execution

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/data-querying.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/data-querying.mdx)

Context7 片段生成时间：2026-09-17T14:50:06.953Z

```typescript
async function getProductsBy({
  name,
  category,
  maxPrice,
}: {
  name?: string;
  category?: string;
  maxPrice?: number;
}) {
  const filters: SQL[] = [];

  if (name) filters.push(ilike(products.name, name));
  if (category) filters.push(eq(products.category, category));
  if (maxPrice) filters.push(lte(products.price, maxPrice));

  return db
    .select()
    .from(products)
    .where(and(...filters));
}
```

### Drizzle Queries + CRUD > Why SQL-like?

**If you know SQL, you know Drizzle.**

Other ORMs and data frameworks tend to deviate from or abstract away SQL, leading to a double learning curve: you need to learn both SQL and the framework's API.

Drizzle is the opposite.
We embrace SQL and built Drizzle to be SQL-like at its core, so you have little to no learning curve and full access to the power of SQL.

With SQL-like syntax, you can replicate much of what you can do with pure SQL and know
exactly what Drizzle will do and what query will be generated. You can perform a wide range of queries,
including select, insert, update, delete, as well as using aliases, WITH clauses, subqueries, prepared statements,
and more. Let's look at more examples

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/cockroach/data-querying.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/cockroach/data-querying.mdx)

## Drizzle Kit PostgreSQL configuration and migrations workflow using generate, migrate, push, and pull

### Configure database dialect in drizzle.config.ts

Sets the database dialect for Drizzle Kit commands such as generate, push, pull, studio, migrate, up, and export.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/drizzle-config-file.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/drizzle-config-file.mdx)

Context7 片段生成时间：2026-09-14T02:47:58.082Z

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
});
```

### Generate PostgreSQL migrations with drizzle-kit

Runs the drizzle-kit CLI command to automatically generate SQL migration files from the PostgreSQL schema definition.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/latest-releases/drizzle-orm-v0162.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/latest-releases/drizzle-orm-v0162.mdx)

Context7 片段生成时间：2026-09-14T02:56:07.109Z

```shell
drizzle-kit generate:pg --schema=src/schema.ts --out=migrations/

```

### Apply migrations with drizzle-kit migrate

Executes pending generated SQL migration files against the target PostgreSQL database.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/bun-railway-pg.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/bun-railway-pg.mdx)

Context7 片段生成时间：2026-09-19T05:25:18.939Z

```bash
bunx drizzle-kit migrate
```

### Execute Drizzle Kit CLI commands

Lists primary Drizzle Kit CLI commands for generating, migrating, pushing, pulling, checking, and inspecting schemas.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/cockroach/kit-overview.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/cockroach/kit-overview.mdx)

Context7 片段生成时间：2026-09-14T02:27:57.855Z

```shell
drizzle-kit generate
drizzle-kit migrate
drizzle-kit push
drizzle-kit pull
drizzle-kit check
drizzle-kit up
drizzle-kit studio
drizzle-kit export
```

### Define Drizzle configuration in drizzle.config.ts

Sets up Drizzle Kit configuration pointing to the schema file and migrations output folder using PostgreSQL dialect.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/drizzle-with-nile.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/drizzle-with-nile.mdx)

Context7 片段生成时间：2026-09-14T05:11:44.159Z

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NILEDB_URL!,
  },
});
```

## Drizzle ORM PostgreSQL transactions and nested transactions

### Create nested transactions using savepoints

Nests a transaction using tx.transaction inside an existing transaction callback. Drizzle ORM handles nested transactions using SQL savepoints.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/cockroach/transactions.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/cockroach/transactions.mdx)

Context7 片段生成时间：2026-09-14T02:31:57.766Z

```typescript
const db = drizzle(...)

await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100.00` }).where(eq(users.name, 'Dan'));
  await tx.update(accounts).set({ balance: sql`${accounts.balance} + 100.00` }).where(eq(users.name, 'Andrew'));

  await tx.transaction(async (tx2) => {
    await tx2.update(users).set({ name: "Mr. Dan" }).where(eq(users.name, "Dan"));
  });
});
```

### Create nested transaction with savepoints

Defines a nested transaction inside an existing transaction callback using savepoints.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/mssql/transactions.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/mssql/transactions.mdx)

Context7 片段生成时间：2026-09-19T04:57:41.843Z

```typescript
const db = drizzle(...)

await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100.00` }).where(eq(users.name, 'Dan'));
  await tx.update(accounts).set({ balance: sql`${accounts.balance} + 100.00` }).where(eq(users.name, 'Andrew'));

  await tx.transaction(async (tx2) => {
    await tx2.update(users).set({ name: "Mr. Dan" }).where(eq(users.name, "Dan"));
  });
});
```

### Transactions with node-postgres

Demonstrates Drizzle's transaction API with BEGIN/COMMIT/ROLLBACK semantics, including savepoint support via nested transactions, rollback on conditions, return values, and dialect-specific config like isolation level.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/transactions.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/transactions.mdx)

Context7 片段生成时间：2026-10-01T08:32:36.737Z

```tsx
const db = drizzle(...)

await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100.00` }).where(eq(users.name, 'Dan'));
  await tx.update(accounts).set({ balance: sql`${accounts.balance} + 100.00` }).where(eq(users.name, 'Andrew'));
});

// Nested transactions (savepoints)
await db.transaction(async (tx) => {
  await tx.update(accounts)...
  await tx.transaction(async (tx2) => {
    await tx2.update(users)...
  });
});

// Dialect-specific config
await db.transaction(
  async (tx) => { ... },
  {
    isolationLevel: "read committed",
    accessMode: "read write",
    deferrable: true,
  }
);
```

### Serializable transaction with returning values

Demonstrates db.transaction() with PgTransactionConfig isolationLevel set to "serializable", accessMode, deferrable, plus returning values from the transaction scope.

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/transactions.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/transactions.mdx)

Context7 片段生成时间：2026-09-24T11:32:29.604Z

```typescript
const newBalance: number = await db.transaction(async (tx) => {
  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} - 100.00` })
    .where(eq(users.name, "Dan"));
  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} + 100.00` })
    .where(eq(users.name, "Andrew"));

  const [account] = await tx
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(eq(users.name, "Dan"));
  return account.balance;
});

await db.transaction(
  async (tx) => {
    await tx
      .update(accounts)
      .set({ balance: sql`${accounts.balance} - 100.00` })
      .where(eq(users.name, "Dan"));
    await tx
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + 100.00` })
      .where(eq(users.name, "Andrew"));
  },
  {
    isolationLevel: "read committed",
    accessMode: "read write",
    deferrable: true,
  },
);

interface PgTransactionConfig {
  isolationLevel?: "read uncommitted" | "read committed" | "repeatable read" | "serializable";
  accessMode?: "read only" | "read write";
  deferrable?: boolean;
}
```

### Transactions

Drizzle ORM supports `savepoints` with nested transactions API:

来源：[https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/mssql/transactions.mdx](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/mssql/transactions.mdx)
