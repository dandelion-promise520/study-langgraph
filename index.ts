import {
  END,
  MessagesValue,
  ReducedValue,
  START,
  StateGraph,
  StateSchema,
  type ConditionalEdgeRouter,
  type GraphNode,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  tool,
  ToolMessage,
} from "langchain";
import * as z from "zod";

const model = new ChatOpenAI({
  configuration: {
    baseURL: "http://127.0.0.1:8045/v1",
  },
  model: "gemini-3.7-flash-low",
  apiKey: "sk-9ad190d5bace4ac19b0a108b428ac460",
  temperature: 0,
});

const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "两个数相加",
  schema: z.object({
    a: z.number().describe("第一个数字"),
    b: z.number().describe("第二个数字"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "两个数相乘",
  schema: z.object({
    a: z.number().describe("第一个数字"),
    b: z.number().describe("第二个数字"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "两个数相除",
  schema: z.object({
    a: z.number().describe("第一个数字"),
    b: z.number().describe("第二个数字"),
  }),
});

const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};

const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

const MessagesState = new StateSchema({
  messages: MessagesValue,
  llmCalls: new ReducedValue(z.number().default(0), {
    reducer: (x, y) => x + y,
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
    const toolName = toolCall.name as keyof typeof toolsByName;
    const tool = toolsByName[toolName];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }

  return { messages: result };
};

const shouldContinue: ConditionalEdgeRouter<{
  InputSchema: typeof MessagesState;
  Nodes: "toolNode";
}> = async (state) => {
  const laseMessages = state.messages.at(-1);

  if (!laseMessages || !AIMessage.isInstance(laseMessages)) {
    return END;
  }

  if (laseMessages.tool_calls?.length) {
    return "toolNode";
  }

  return END;
};

const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();

const result = await agent.invoke({
  messages: [new HumanMessage("三加四等于多少")],
});

for (const message of result.messages) {
  console.log(`[${message.type}]:${message.text}`);
}
