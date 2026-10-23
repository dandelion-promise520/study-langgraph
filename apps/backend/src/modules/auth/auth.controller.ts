import type { LoginDto, RegisterDto } from "@lg-lab/types";

import { authService } from "./auth.service";

class AuthController {
  register({ body }: { body: RegisterDto }) {
    return authService.register({ body });
  }

  login({ body }: { body: LoginDto }) {
    return authService.login({ body });
  }

  logout({ token }: { token: string }) {
    return authService.logout({ token });
  }

  getCurrentUser({ userId }: { userId: string }) {
    return authService.getCurrentUser({ userId });
  }
}

export const authController = new AuthController();
