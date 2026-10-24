import type { Cookie } from "elysia";

export const setSessionCookie = <T>({
  cookie,
  expiresAt,
  token,
}: {
  cookie: Cookie<T> | undefined;
  token: string;
  expiresAt: Date;
}) => {
  cookie?.set({
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
};

export const clearSessionCookie = <T>({ cookie }: { cookie: Cookie<T> | undefined }) => {
  cookie?.remove();
};
