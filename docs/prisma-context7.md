# Prisma ORM 8（Context7 文档片段）

> 本文件由 ctx7 CLI 按下列主题检索并整理。Context7 返回与查询相关的文档片段，不是上游文档站点的完整离线副本。

- 采集日期：2026-10-14
- Context7 Library ID：`/prisma/orm`
- Context7 来源分支：Context7 文档来自 main 分支，未按预发布版本锁定；请结合仓库依赖版本核对 API。
- 仓库依赖：backend 当前声明 prisma ^8.0.0-rc.15 与 @prisma/orm-postgres ^8.0.0-rc.11。
- CLI：`ctx7 0.5.8`；每个主题均通过 `ctx7 docs <Library ID> <query> --json` 获取。

## Prisma ORM 8 PostgreSQL contract authoring with defineContract, models, fields, columns, ids, and relations using @prisma/orm-postgres/contract-builder

### Author a Postgres contract with defineContract from @internal/postgres/contract-builder

Use the @internal/postgres/contract-builder facade to author a TypeScript contract. The defineContract export is a Postgres-specific wrapper that pre-binds family and target, so callers do not pass those fields.

来源：[https://github.com/prisma/orm/blob/main/packages/3-extensions/postgres/README.md](https://github.com/prisma/orm/blob/main/packages/3-extensions/postgres/README.md)

Context7 片段生成时间：2026-09-27T20:13:01.215Z

```typescript
import { defineContract, field, model } from "@internal/postgres/contract-builder";

export const contract = defineContract({ extensions: {} }, ({ field: f, model: m }) => ({
  models: {
    User: m("User", { fields: { id: f.id.uuidv4String() } }),
  },
}));
```

### Define a SQL contract with defineContract in TypeScript

Defines a SQL contract in TypeScript using the no-emit authoring API. Imports column types, family and target packs, and contract builder helpers. The User model uses autoincrement, unique, default, and now column defaults, and maps to the 'user' table.

来源：[https://github.com/prisma/orm/blob/main/docs/architecture docs/subsystems/9. No-Emit Workflow.md](https://github.com/prisma/orm/blob/main/docs/architecture docs/subsystems/9. No-Emit Workflow.md)

Context7 片段生成时间：2026-09-27T19:48:15.087Z

```typescript
import {
  boolColumn,
  int4Column,
  textColumn,
  timestamptzColumn,
} from "@internal/adapter-postgres/column-types";
import sqlFamily from "@internal/family-sql/pack";
import {
  autoincrement,
  defineContract,
  field,
  model,
  now,
} from "@internal/sql-contract-ts/contract-builder";
import postgresPack from "@internal/target-postgres/pack";

export const contract = defineContract({
  family: sqlFamily,
  target: postgresPack,
  models: {
    User: model("User", {
      fields: {
        id: field.column(int4Column).default(autoincrement()).id(),
        email: field.column(textColumn).unique(),
        active: field.column(boolColumn).default(true),
        createdAt: field.column(timestamptzColumn).default(now()),
      },
    }).sql({ table: "user" }),
  },
});
```

### Define contract with uuidv4 generated id

Defines a Prisma 8 contract using the uuidv4 helper for a generated id field. Imports the required contract builder, family, target, and column types. The id field is marked as generated and the model is mapped to the 'user' table.

来源：[https://github.com/prisma/orm/blob/main/packages/1-framework/2-authoring/ids/README.md](https://github.com/prisma/orm/blob/main/packages/1-framework/2-authoring/ids/README.md)

Context7 片段生成时间：2026-09-27T20:04:51.358Z

```ts
import { textColumn } from "@internal/adapter-postgres/column-types";
import sqlFamily from "@internal/family-sql/pack";
import { uuidv4 } from "@internal/ids";
import { defineContract, field, model } from "@internal/sql-contract-ts/contract-builder";
import postgresPack from "@internal/target-postgres/pack";

export const contract = defineContract({
  family: sqlFamily,
  target: postgresPack,
  models: {
    User: model("User", {
      fields: {
        id: field.generated(uuidv4()).id(),
        email: field.column(textColumn),
      },
    }).sql({ table: "user" }),
  },
});
```

### Import and use Models, Scalars, Shape, and ResultType

Use after running `prisma contract emit` once to access the new named model and result types. `Scalars<M>` names the row a default fetch returns, `Shape<M, Spec>` derives a data structure with chosen scalars and nested relations, and `ResultType` works on ORM queries instead of returning `never`. These replace Prisma 7's `Prisma.User` and `UserGetPayload<...>`.

来源：[https://github.com/prisma/orm/blob/main/docs/releases/v8.0.0-rc.10.md](https://github.com/prisma/orm/blob/main/docs/releases/v8.0.0-rc.10.md)

Context7 片段生成时间：2026-09-27T19:58:36.848Z

```typescript
import type { Models } from "./prisma/contract";
import type { Scalars, Shape } from "@prisma/orm-postgres/family-contract/types";
import type { ResultType } from "@prisma/orm-postgres/components/runtime";

type UserRow = Scalars<Models.public_User>;
type UserResponse = Shape<
  Models.public_User,
  { "-": "passwordHash"; posts: { "+": "id" | "title" } }
>;
const usersWithPosts = db.orm.public.User.include("posts");
type UserWithPosts = ResultType<typeof usersWithPosts>;
```

### `@internal/postgres/contract-builder`

Re-exports the TypeScript contract authoring DSL (`defineContract`, `field`, `model`, `rel`, ...) so a generated `prisma/contract.ts` can author its contract using only this facade package. The `defineContract` export is a Postgres-specific wrapper that pre-binds `family` and `target` — callers do not pass those fields:

来源：[https://github.com/prisma/orm/blob/main/packages/3-extensions/postgres/README.md](https://github.com/prisma/orm/blob/main/packages/3-extensions/postgres/README.md)

## Prisma ORM 8 PostgreSQL configuration in prisma.config.ts, defineConfig, connection settings, and @prisma/orm-postgres/config

### prisma.config.ts scaffold with definePrismaConfig and ormConfig

Example of the prisma.config.ts file scaffolded by `prisma orm init`. It uses `definePrismaConfig` from `@prisma/cli-engine` and `defineConfig` (imported as `ormConfig`) from `@internal/postgres/config` to wire the contract source and database connection. A bare `defineConfig` without the `orm:` section fails with `CONFIG.VERSION_MARKER_MISSING`.

来源：[https://github.com/prisma/orm/blob/main/skills/prisma-8/references/contract.md](https://github.com/prisma/orm/blob/main/skills/prisma-8/references/contract.md)

Context7 片段生成时间：2026-09-27T21:06:10.393Z

```typescript
// prisma.config.ts — what `prisma orm init` scaffolds
import "dotenv/config";
import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@internal/postgres/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: { connection: process.env["DATABASE_URL"]! },
  }),
});
```

### Configure Prisma ORM with definePrismaConfig

Configures the Prisma ORM with a contract file and a database connection from the DATABASE_URL environment variable. The default export must be the value returned by definePrismaConfig; the CLI rejects a bare defineConfig result with CONFIG.VERSION_MARKER_MISSING.

来源：[https://github.com/prisma/orm/blob/main/packages/3-extensions/postgres/README.md](https://github.com/prisma/orm/blob/main/packages/3-extensions/postgres/README.md)

Context7 片段生成时间：2026-09-27T20:13:01.215Z

```typescript
// prisma.config.ts
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma",
    db: { connection: process.env["DATABASE_URL"]! },
  }),
});
```

### Configure Prisma 8 to read a Prisma 7 schema with prisma7Schema

Configuration file for Prisma 8 that uses prisma7Schema from @prisma/orm-postgres/config to point the contract source at the existing Prisma 7 schema.prisma file. Required to make Prisma 8 commands work with an earlier version's schema.

来源：[https://github.com/prisma/orm/blob/main/docs/architecture docs/adrs/ADR 252 - An earlier Prisma version's schema is a contract source.md](https://github.com/prisma/orm/blob/main/docs/architecture docs/adrs/ADR 252 - An earlier Prisma version's schema is a contract source.md)

Context7 片段生成时间：2026-09-27T19:44:22.462Z

```typescript
// prisma.config.ts
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig, prisma7Schema } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: prisma7Schema("prisma/schema.prisma"),
    db: { connection: process.env["DATABASE_URL"]! },
  }),
});
```

### Configure prisma.config.ts

Configuration file for the Prisma CLI. It loads environment variables from .env automatically and tells the CLI where your contract lives and how to connect to your database.

来源：[https://github.com/prisma/orm/blob/main/packages/1-framework/3-tooling/cli/src/commands/init/templates/quick-reference-postgres.md](https://github.com/prisma/orm/blob/main/packages/1-framework/3-tooling/cli/src/commands/init/templates/quick-reference-postgres.md)

Context7 片段生成时间：2026-09-27T20:05:26.160Z

```typescript
import "dotenv/config";
import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "{{configEntrypoint}}";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./{{schemaPath}}",
    db: {
      connection: process.env["DATABASE_URL"]!,
    },
  }),
});
```

### Key Concepts

- **`prisma.config.ts`.** Wires the contract source, the database connection, the migrations directory, and any installed extensions. The file is an _envelope_: the unified CLI's `definePrismaConfig({...})` from `@prisma/cli-engine` wraps an `orm:` section built by the target's `defineConfig` — conventionally imported as `ormConfig` from `@internal/postgres/config` (or `@internal/mongo/config`). There is no flat form; a bare `defineConfig({ contract, ... })` default export fails with `CONFIG.VERSION_MARKER_MISSING`.

来源：[https://github.com/prisma/orm/blob/main/skills/prisma-8/references/contract.md](https://github.com/prisma/orm/blob/main/skills/prisma-8/references/contract.md)

## Prisma ORM 8 contract verification and schema migration workflow with prisma db init, contract emit, db update, and db verify

### Prisma db init and db update workflow

Typical workflow for managing database schema lifecycle with Prisma ORM. Run `prisma contract emit` to define the schema, `prisma db init` to sign the database, and `prisma db update` to apply changes. Use `--dry-run` to preview updates before applying.

来源：[https://github.com/prisma/orm/blob/main/docs/commands/SUMMARY.md](https://github.com/prisma/orm/blob/main/docs/commands/SUMMARY.md)

Context7 片段生成时间：2026-09-27T19:47:08.588Z

```bash
# 1. Define schema and emit contract
prisma contract emit --config prisma.config.ts

# 2. Sign the database (first time only)
prisma db init --db $DATABASE_URL

# 3. Evolve the schema: add a column, change a type, etc.
#    Re-emit the contract after editing the schema
prisma contract emit --config prisma.config.ts

# 4. Preview what db update would do
prisma db update --db $DATABASE_URL --dry-run

# 5. Apply the update
prisma db update --db $DATABASE_URL
```

### Initialize Prisma 8 in an existing project with npx prisma orm init

Run this from your repo root to add Prisma 8 to an existing project. `orm init` writes `prisma.config.ts`, scaffolds a starter contract and `db.ts` under `src/prisma/`, installs the runtime, and emits the contract. It does not touch your framework or build setup.

来源：[https://github.com/prisma/orm/blob/main/README.md](https://github.com/prisma/orm/blob/main/README.md)

Context7 片段生成时间：2026-09-27T19:19:44.750Z

```bash
npx prisma orm init
```

### Infer and emit contract from existing database

Run `prisma contract infer` to read the live schema and write a `contract.prisma` file, then `prisma contract emit` to generate the contract artefacts. The infer step captures indexes and RLS policies at full fidelity.

来源：[https://github.com/prisma/orm/blob/main/skills/prisma-8/references/contract.md](https://github.com/prisma/orm/blob/main/skills/prisma-8/references/contract.md)

Context7 片段生成时间：2026-09-27T21:06:10.393Z

```bash
pnpm prisma contract infer --db $DATABASE_URL --output ./src/prisma/contract.prisma
pnpm prisma contract emit
```

### Dev-to-ship migration workflow with db update, migration plan, and db migrate

Iterate locally with db update, then publish the first real migration. Uses pnpm prisma commands with the --db flag. The db ref is a named pointer at migrations/app/refs/db.json that records the contract hash the dev database has been brought up to.

来源：[https://github.com/prisma/orm/blob/main/skills/prisma-8/references/migrations.md](https://github.com/prisma/orm/blob/main/skills/prisma-8/references/migrations.md)

Context7 片段生成时间：2026-09-27T21:08:31.207Z

```bash
pnpm prisma db init --db $DATABASE_URL
pnpm prisma contract emit && pnpm prisma db update --db $DATABASE_URL
pnpm prisma contract emit && pnpm prisma migration plan --name add_feature
pnpm prisma db migrate --db $DATABASE_URL
pnpm prisma db verify --db $DATABASE_URL
```

### Workflow — adopt a pre-existing database

## Workflow — adopt a pre-existing database

The concept: a database that predates Prisma 8 enters the system by describing it, not migrating it — `contract infer` derives the contract from the live schema, and after review + `contract emit`, `db sign` records the marker. Full recipe: `references/quickstart.md` § _Brownfield-DB_.

```bash
pnpm prisma contract infer --db "$DATABASE_URL" --output src/prisma/contract.prisma
# review and re-author, then:
pnpm prisma contract emit
pnpm prisma db sign --db "$DATABASE_URL"                # advances the db ref even with --db
```

By default `db sign` sets the `db` ref to the signed contract's hash and stores its snapshot, so the next `migration plan` chains from the adopted schema (`--advance-ref <name>` writes another ref instead, and `--no-advance-ref` writes none; after either, set the `db` ref yourself with `migration ref set db <hash>` or pass `--from` on the next plan): the graph is still empty at that point, so the plan auto-emits the baseline `null → signed-hash`, plus a delta `signed-hash → contract` once the contract has moved on from the signed one. No baseline is written at sign time. If the graph is already non-empty and the signed hash is not a graph node, the next plan refuses with `MIGRATION.HASH_NOT_IN_GRAPH`, exactly as after `db update`.

来源：[https://github.com/prisma/orm/blob/main/skills/prisma-8/references/migration-model.md](https://github.com/prisma/orm/blob/main/skills/prisma-8/references/migration-model.md)

## Prisma ORM 8 PostgreSQL runtime query API for selecting, inserting, updating, deleting, and transactions

### ORM write operations with select

Shows create, update, delete, and upsert operations. The create returns the inserted row; update and delete use a predicate; upsert is typed by the create branch's shape. The .select() method narrows the return shape.

来源：[https://github.com/prisma/orm/blob/main/skills/prisma-8/references/queries-postgres.md](https://github.com/prisma/orm/blob/main/skills/prisma-8/references/queries-postgres.md)

Context7 片段生成时间：2026-09-27T21:03:38.506Z

```typescript
// Create — returns the inserted row.
const user = await db.orm.public.User.create({ id, email, displayName, kind, createdAt });

// Create with selected return — narrows the return shape.
const summary = await db.orm.public.User.select("id", "email", "kind").create({
  id,
  email,
  displayName,
  kind,
  createdAt,
});

// Update by predicate.
await db.orm.public.User.where({ id }).update({ email: newEmail });

// Update with selected return.
await db.orm.public.User.where({ id }).select("id", "email", "kind").update({ email: newEmail });

// Delete by predicate.
await db.orm.public.User.where({ id }).delete();

// Upsert — typed by the create branch's shape.
await db.orm.public.User.select("id", "email", "kind", "createdAt").upsert({
  create: { id, email, displayName, kind, createdAt: new Date() },
  update: { email, displayName, kind },
});
```

### TypeScript example: Using the runtime API with postgres and schema

This example shows how to connect to a database using the internal postgres runtime, define a schema, build a query, and execute it. It demonstrates both streaming query results and executing an update, logging the affected rows.

来源：[https://github.com/prisma/orm/blob/main/docs/architecture docs/subsystems/4. Runtime & Middleware Framework.md](https://github.com/prisma/orm/blob/main/docs/architecture docs/subsystems/4. Runtime & Middleware Framework.md)

Context7 片段生成时间：2026-09-27T19:54:30.938Z

```typescript
import postgres from "@internal/postgres/runtime";
import { schema } from "@internal/sql-relational-core/schema";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

const db = postgres<Contract>({ url: process.env.DATABASE_URL, contractJson });
await db.connect();

const tables = schema(db.context).tables;

const plan = db.sql
  .from(tables.user)
  .where(tables.user.columns.active.eq(true))
  .select({ id: tables.user.columns.id, email: tables.user.columns.email })
  .build();

for await (const row of db.runtime().query(plan)) {
  console.log(row.id, row.email);
}

const stats = await db
  .runtime()
  .execute(
    db.sql
      .from(tables.user)
      .where(tables.user.columns.active.eq(false))
      .update({ active: true })
      .build(),
  );
console.log(stats.affectedRows);
```

### Per-request runtime acquisition and query surfaces (src/worker.ts)

Shows the fetch handler acquiring a fresh runtime per request via db.connect(), using AsyncDisposable to close the pg.Client. Demonstrates three query surfaces: SQL DSL, ORM client, and transactions with withTransaction. Includes a 404 fallback.

来源：[https://github.com/prisma/orm/blob/main/docs/Serverless Deployment Guide.md](https://github.com/prisma/orm/blob/main/docs/Serverless Deployment Guide.md)

Context7 片段生成时间：2026-09-27T19:22:32.951Z

```TypeScript
// src/worker.ts
import { withTransaction } from '@internal/sql-runtime';
import { createOrmClient } from './orm-client/client';
import { db } from './prisma/db';

interface Env {
  HYPERDRIVE: { connectionString: string };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Fresh runtime per fetch. AsyncDisposable: when the fetch body
    // returns (or throws), runtime.close() runs and ends the
    // underlying pg.Client. No closure cache, no shared state across
    // concurrent fetches in this isolate.
    await using runtime = await db.connect({ url: env.HYPERDRIVE.connectionString });

    const url = new URL(request.url);

    // SQL DSL plan — runtime.execute returns AsyncIterable<row>.
    if (url.pathname === '/sql/users') {
      const rows = await runtime.execute(
        db.sql.user.select('id', 'email').limit(10).build(),
      );
      return Response.json(rows);
    }

    // ORM — constructed against the per-request runtime.
    if (url.pathname === '/orm/users') {
      const orm = createOrmClient(runtime);
      const rows = await orm.User.newestFirst().limit(10).all();
      return Response.json(rows);
    }

    // Transactions — withTransaction takes the per-request runtime.
    // BEGIN/COMMIT/ROLLBACK happen on the same underlying pg.Client.
    if (url.pathname === '/tx/example') {
      const result = await withTransaction(runtime, async (tx) => {
        await tx.execute(db.sql.user.update({ /* ... */ }).where(/* ... */).build());
        await tx.execute(db.sql.post.insert({ /* ... */ }).build());
        return { ok: true };
      });
      return Response.json(result);
    }

    return new Response('not found', { status: 404 });
  },
};
```

### INSERT/UPDATE/DELETE with RETURNING using db.sql.public.user

Shows INSERT, UPDATE, and DELETE plans with `RETURNING` where applicable. `insert()` takes an array of rows; `returning(...)` requires the target adapter to advertise the `returning` capability (Postgres does by default). Use `db.runtime().query(plan)` for writes with `RETURNING` and `db.runtime().execute(plan)` for writes without it, which resolves `{ affectedRows }`.

来源：[https://github.com/prisma/orm/blob/main/skills/prisma-8/references/queries-postgres.md](https://github.com/prisma/orm/blob/main/skills/prisma-8/references/queries-postgres.md)

Context7 片段生成时间：2026-09-27T21:03:38.506Z

```typescript
// Insert and return selected columns. `insert()` takes an array of rows.
const plan = db.sql.public.user.insert([{ email }]).returning("id", "email").build();
const [row] = await db.runtime().query(plan);

// Update with predicate and returning.
const updatePlan = db.sql.public.user
  .update({ email: newEmail })
  .where((f, fns) => fns.eq(f.id, userId))
  .returning("id", "email")
  .build();
const rows = await db.runtime().query(updatePlan);

// Delete with predicate, no RETURNING — `execute` resolves the affected count.
const deletePlan = db.sql.public.user
  .delete()
  .where((f, fns) => fns.eq(f.id, userId))
  .build();
const { affectedRows } = await db.runtime().execute(deletePlan);
```

### Prisma 8 — Queries (Postgres) > Key Concepts

**Postgres** (`postgres<Contract>(...)` from `@internal/postgres/runtime`):

- **`db.orm.<ns>.<Model>`** — ORM, PascalCase model name (`db.orm.public.User`). Fluent `.where(...).select(...).orderBy(...).all()`, fully typed against `Contract`. Default lane for CRUD with relations.
- **`db.sql.<ns>.<table>`** — SQL builder, lowercase storage name (`db.sql.public.user`). Produces a _plan_. A plan that returns rows (`select`, or a write with `.returning(...)`) runs through `db.runtime().query(plan)`; a write with no `RETURNING` runs through `db.runtime().execute(plan)`, which resolves `{ affectedRows }`. Use when the ORM is too high-level — explicit `JOIN`, computed projections, set operations, window functions.

Reach for the ORM first; drop to `db.sql` when the ORM can't express the shape. Lane choice is local — one query function picks one lane, not the whole app.

来源：[https://github.com/prisma/orm/blob/main/skills/prisma-8/references/queries-postgres.md](https://github.com/prisma/orm/blob/main/skills/prisma-8/references/queries-postgres.md)
