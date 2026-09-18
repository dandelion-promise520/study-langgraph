import {
  CreateThreadSchema,
  ThreadParamsSchema,
  UpdateThreadSchema,
  type CreateThreadDto,
  type ThreadParamsDto,
  type UpdateThreadDto,
} from "@lg-lab/types";

export const ThreadModels = {
  CreateThread: CreateThreadSchema,
  UpdateThread: UpdateThreadSchema,
  ThreadParams: ThreadParamsSchema,
};

// 导出强类型以保持对齐和兼容
export type CreateThread = CreateThreadDto;
export type UpdateThread = UpdateThreadDto;
export type ThreadParams = ThreadParamsDto;
