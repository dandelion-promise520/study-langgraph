import z from "zod";

export const FieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(FieldErrorSchema).optional(),
});

export const ERROR_CODE = {
  UNAUTHORIZED: { status: 401, message: "未登录" },
  INVALID_CREDENTIALS: { status: 401, message: "邮箱或密码错误" },
  FORBIDDEN: { status: 403, message: "无权访问" },
  NOT_FOUND: { status: 404, message: "资源不存在" },
  THREAD_NOT_FOUND: { status: 404, message: "会话不存在" },
  EMAIL_TAKEN: { status: 409, message: "该邮箱已注册" },
  THREAD_ID_TAKEN: { status: 409, message: "该会话 ID 已被占用" },
  VALIDATION_FAILED: { status: 422, message: "参数校验失败" },
  INVALID_BODY: { status: 400, message: "请求体不是合法的 JSON" },
  INTERNAL_ERROR: { status: 500, message: "服务器内部错误" },
} as const;

export type ErrorCode = keyof typeof ERROR_CODE;
export type FieldErrorDto = z.infer<typeof FieldErrorSchema>;
export type ApiErrorDto = z.infer<typeof ApiErrorSchema>;
