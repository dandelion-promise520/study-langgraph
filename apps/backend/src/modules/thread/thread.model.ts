import {
  CreateThreadSchema,
  MessageSchema,
  ThreadParamsSchema,
  ThreadSchema,
  UpdateThreadSchema,
} from "@lg-lab/types";

export const ThreadModels = {
  CreateThread: CreateThreadSchema,
  UpdateThread: UpdateThreadSchema,
  ThreadParams: ThreadParamsSchema,
  Thread: ThreadSchema,
  ThreadList: ThreadSchema.array(),
  MessageList: MessageSchema.array(),
};
