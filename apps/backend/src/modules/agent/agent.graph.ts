import { AIMessage, SystemMessage, type ToolMessage } from "@langchain/core/messages";
import {
  END,
  MemorySaver,
  MessagesValue,
  ReducedValue,
  START,
  StateGraph,
  StateSchema,
  type ConditionalEdgeRouter,
  type GraphNode,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";

import { env } from "../../config/env";
import { mathTools, toolsByName } from "./tools/math.tools";

const model = new ChatOpenAI({
  configuration: {
    baseURL: env.OPENAI_BASE_URL,
  },
  model: env.OPENAI_MODEL_NAME,
  apiKey: env.OPENAI_API_KEY,
  temperature: 0,
});

const modelWithTools = model.bindTools(mathTools);

export const MessagesState = new StateSchema({
  messages: MessagesValue,
  llmCalls: new ReducedValue(z.number().default(0) as any, {
    inputSchema: z.number() as any,
    reducer: (x: number, y: number) => x + y,
  }),
});

const llmCall: GraphNode<typeof MessagesState> = async (state) => {
  const response = await modelWithTools.invoke([
    new SystemMessage("你是一个乐于助人的助手，负责对一组输入执行算术运算"),
    ...state.messages,
  ]);

  return {
    messages: [response],
    llmCalls: 1,
  };
};

const toolNode: GraphNode<typeof MessagesState> = async (state) => {
  const lastMessage = state.messages.at(-1);

  if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    if (tool) {
      const observation = await tool.invoke(toolCall);
      result.push(observation as ToolMessage);
    }
  }

  return { messages: result };
};

const shouldContinue: ConditionalEdgeRouter<{
  InputSchema: typeof MessagesState;
  Nodes: "toolNode";
}> = async (state) => {
  const lastMessage = state.messages.at(-1);

  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return END;
  }

  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }

  return END;
};

export const checkpointer = new MemorySaver();

export const mathAgent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile({ checkpointer });
