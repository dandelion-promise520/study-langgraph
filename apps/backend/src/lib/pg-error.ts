interface PgErrorLike {
  code?: string;
  constraint?: string;
  constraint_name?: string;
  cause?: PgErrorLike;
}

// Postgres 唯一约束是否冲突
export const isPgUniqueViolation = ({
  err,
  constraintName,
}: {
  err: unknown;
  constraintName?: string;
}): boolean => {
  const e = (err as PgErrorLike) || null;

  const pgErr = e?.cause ?? e;

  // 23505为pg约束冲突代码
  if (pgErr?.code !== "23505") return false;

  if (constraintName) {
    return (pgErr.constraint ?? pgErr.constraint_name) === constraintName;
  }

  return true;
};
