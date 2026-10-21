import { ERROR_CODE, type ErrorCode } from "@lg-lab/types";

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;

  constructor({ code, message }: { code: ErrorCode; message?: string }) {
    const preset = ERROR_CODE[code];
    super(message ?? preset.message);
    this.name = "AppError";
    this.status = preset.status;
    this.code = code;
  }
}
