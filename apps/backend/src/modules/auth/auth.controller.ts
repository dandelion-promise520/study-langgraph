import type { LoginDto, RegisterDto } from "@lg-lab/types";

import { authService } from "./auth.service";

class AuthController {
  register({ body }: { body: RegisterDto }) {
    return authService.register({ body });
  }

  async login({ body }: { body: LoginDto }) {
    return authService.login({ body });
  }
}

export const authController = new AuthController();
