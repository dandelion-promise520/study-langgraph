import { SystemMessage } from "@langchain/core/messages";
import { END, MessagesValue, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

import { env } from "../../config/env";

// 1. 初始化模型
const model = new ChatOpenAI({
  configuration: {
    baseURL: env.OPENAI_BASE_URL,
  },
  model: env.OPENAI_MODEL_NAME,
  apiKey: env.OPENAI_API_KEY,
  temperature: 0.7,
});

// 2. 状态账本：只存消息历史列表
export const AgentState = new StateSchema({
  messages: MessagesValue,
});

// 3. 工人节点：负责调用大模型
const callModel = async (state: typeof AgentState.State) => {
  const response = await model.invoke([
    new SystemMessage("你是一个乐于助人的 AI 助手。"),
    ...state.messages,
  ]);

  return { messages: [response] };
};

// 4. 组装流水线：START -> callModel -> END
export const simpleAgent = new StateGraph(AgentState)
  .addNode("callModel", callModel)
  .addEdge(START, "callModel")
  .addEdge("callModel", END)
  .compile();
