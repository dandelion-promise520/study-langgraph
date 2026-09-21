import { defineContract, enumType, member } from "@prisma/orm-postgres/contract-builder";

const pgText = { codecId: "pg/text@1", nativeType: "text" } as const;
const MessageRoleEnum = enumType(
  "message_role",
  pgText,
  member("user", "user"),
  member("assistant", "assistant"),
);

export const contract = defineContract({}, ({ field, model, rel }) => {
  // 通用基础时间戳结构（复用继承模式）
  const withTimeStamps = () => ({
    createdAt: field.temporal.createdAtString(),
    updatedAt: field.temporal.updatedAtString(),
  });

  // 用户表
  const User = model("User", {
    fields: {
      id: field.id.uuidv7String(),
      email: field.text().unique(),
      name: field.text().optional(),
      ...withTimeStamps(),
    },
  });

  // 会话表
  const Thread = model("Thread", {
    fields: {
      id: field.text().id(),
      title: field.text().default("新会话"),
      userId: field.uuidString().optional(),
      ...withTimeStamps(),
    },
  });

  // 消息表
  const Message = model("Message", {
    fields: {
      id: field.text().id(),
      threadId: field.text(),
      role: field.namedType(MessageRoleEnum),
      content: field.text(),
      ...withTimeStamps(),
    },
  });

  return {
    enums: {
      message_role: MessageRoleEnum,
    },
    models: {
      User: User.relations({
        threads: rel.hasMany(Thread, { by: "userId" }),
      }),
      Thread: Thread.relations({
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
        messages: rel.hasMany(Message, { by: "threadId" }),
      }),
      Message: Message.relations({
        thread: rel.belongsTo(Thread, { from: "threadId", to: "id" }),
      }),
    },
  };
});
