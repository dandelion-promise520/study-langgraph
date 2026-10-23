import z from "zod";

import { IsoDateTimeSchema } from "./common";

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "邮箱过长")
  .email("邮箱格式不正确");

export const PasswordSchema = z.string().min(8, "密码至少 8 位").max(128, "密码过长");

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().trim().min(1, "请填写昵称").max(50, "昵称过长"),
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "请输入密码"),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  createdAt: IsoDateTimeSchema,
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type UserDto = z.infer<typeof UserSchema>;
