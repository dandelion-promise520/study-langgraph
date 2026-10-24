import { client } from "./eden";

export const register = async ({
  name,
  email,
  password,
}: {
  email: string;
  password: string;
  name: string;
}) => {
  const { data } = await client.auth.register.post({ name, email, password });

  if (!data) throw new Error("注册失败");

  return data;
};

export const login = async ({ email, password }: { email: string; password: string }) => {
  const { data } = await client.auth.login.post({ email, password });

  if (!data) throw new Error("登录失败");

  return data;
};

export const logout = async () => {
  await client.auth.logout.delete();
};

export const getMe = async () => {
  const { data } = await client.auth.me.get();

  if (!data) throw new Error("获取用户信息失败");

  return data;
};
