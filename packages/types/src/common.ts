import z from "zod";

export const IsoDateTimeSchema = z
  .union([z.date(), z.string().datetime({ offset: true })])
  .transform((v) => (typeof v === "string" ? v : v.toISOString()));
