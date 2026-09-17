> ## 文档索引
>
> 完整文档索引请访问：https://docs.langchain.com/llms.txt
> 在进一步探索前，可利用此文件发现所有可用页面。

# 快速入门

本快速入门指南将演示如何使用 LangGraph 的 **Graph API** 或 **Functional API** 构建一个计算器 Agent（智能体）。

> [!TIP]
> **正在使用 AI 编程助手？**
>
> - 安装 [LangChain Docs MCP 服务器](/use-these-docs)，让你的 Agent 可以访问最新的 LangChain 文档和示例。
> - 安装 [LangChain Skills](https://github.com/langchain-ai/langchain-skills)，以提升 Agent 在 LangChain 生态任务中的表现。

- 如果你更倾向于将 Agent 定义为由节点（Nodes）和边（Edges）构成的图结构，请参阅 [方式一：使用 Graph API](#方式一使用-graph-api)。
- 如果你更倾向于将 Agent 定义为单个函数流，请参阅 [方式二：使用 Functional API](#方式二使用-functional-api)。

关于概念性信息，请参阅 [Graph API 概述](/oss/javascript/langgraph/graph-api) 和 [Functional API 概述](/oss/javascript/langgraph/functional-api)。

> [!NOTE]
> 在本示例中，你需要准备一个模型提供商（例如 Claude / OpenAI 等）的账号并获取 API Key，在终端中设置相应的环境变量（如 `ANTHROPIC_API_KEY` 或 `OPENAI_API_KEY`）。有关所有可用的模型提供商，请参阅[聊天模型集成](/oss/javascript/integrations/chat)。如果你使用 [LangSmith Gateway](/langsmith/llm-gateway)，可以[自带提供商密钥（BYOK）](/langsmith/llm-gateway-quickstart)或使用 [Gateway 积分](/langsmith/llm-gateway-credits)在无需提供商密钥的情况下访问模型。

---

## 方式一：使用 Graph API

### 1. 定义工具和模型

在本示例中，我们定义加法、乘法和除法工具，并将其绑定到大模型。

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
});

// 定义工具
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

// 为 LLM 绑定工具
const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);
```

### 2. 定义状态 (State)

图的状态用于存储消息列表以及 LLM 的调用次数。

> [!TIP]
> LangGraph 中的状态会在 Agent 执行过程中持久保留。
>
> `MessagesValue` 提供了一个内置的 reducer 用于追加消息。`llmCalls` 字段使用 `ReducedValue` 配合 `(x, y) => x + y` 来累加调用次数。

```typescript
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  ReducedValue,
  GraphNode,
  ConditionalEdgeRouter,
  START,
  END,
} from "@langchain/langgraph";
import * as z from "zod";

const MessagesState = new StateSchema({
  messages: MessagesValue,
  llmCalls: new ReducedValue(z.number().default(0), { reducer: (x, y) => x + y }),
});
```

### 3. 定义模型节点 (Model Node)

模型节点用于调用 LLM 并决定是否调用工具。

```typescript
import { SystemMessage } from "@langchain/core/messages";
import type { GraphNode } from "@langchain/langgraph";

const llmCall: GraphNode<typeof MessagesState> = async (state) => {
  const response = await modelWithTools.invoke([
    new SystemMessage(
      "You are a helpful assistant tasked with performing arithmetic on a set of inputs.",
    ),
    ...state.messages,
  ]);
  return {
    messages: [response],
    llmCalls: 1,
  };
};
```

### 4. 定义工具节点 (Tool Node)

工具节点用于调用工具并返回结果。

```typescript
import { AIMessage, type ToolMessage } from "@langchain/core/messages";
import type { GraphNode } from "@langchain/langgraph";

const toolNode: GraphNode<typeof MessagesState> = async (state) => {
  const lastMessage = state.messages.at(-1);

  if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }

  return { messages: result };
};
```

### 5. 定义流转逻辑 (End Logic)

条件边函数根据 LLM 是否发起了工具调用，来决定路由到工具节点还是结束流程。

```typescript
import { AIMessage } from "@langchain/core/messages";
import { END, type ConditionalEdgeRouter } from "@langchain/langgraph";

const shouldContinue: ConditionalEdgeRouter<{
  InputSchema: typeof MessagesState;
  Nodes: "toolNode";
}> = (state) => {
  const lastMessage = state.messages.at(-1);

  // 在访问 tool_calls 之前检查是否为 AIMessage
  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return END;
  }

  // 如果 LLM 发起了工具调用，则执行工具节点
  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }

  // 否则停止执行（直接回复用户）
  return END;
};
```

### 6. 构建并编译 Agent

使用 [`StateGraph`](https://reference.langchain.com/javascript/langchain-langgraph/index/StateGraph) 类构建 Agent，并通过 [`compile`](https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.StateGraph.html#compile) 方法进行编译。

```typescript
import { HumanMessage } from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";

const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();

// 调用执行
const result = await agent.invoke({
  messages: [new HumanMessage("Add 3 and 4.")],
});

for (const message of result.messages) {
  console.log(`[${message.type}]: ${message.text}`);
}
```

> [!TIP]
> 使用 [LangSmith](https://smith.langchain.com?utm_source=docs&utm_medium=cta&utm_campaign=langsmith-signup&utm_content=oss-langgraph-quickstart) 追踪和调试你的 Agent。请参考[追踪快速入门](/langsmith/trace-with-langgraph)完成配置。准备好投入生产时，请参阅[部署](/langsmith/deployment)了解托管选项。

<details>
<summary><b>点击展开：Graph API 完整代码示例</b></summary>

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  ReducedValue,
  GraphNode,
  ConditionalEdgeRouter,
  START,
  END,
} from "@langchain/langgraph";
import { SystemMessage, AIMessage, ToolMessage, HumanMessage } from "@langchain/core/messages";
import * as z from "zod";

// 步骤 1: 定义工具和模型
const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
});

const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

// 步骤 2: 定义状态 (State)
const MessagesState = new StateSchema({
  messages: MessagesValue,
  llmCalls: new ReducedValue(z.number().default(0), { reducer: (x, y) => x + y }),
});

// 步骤 3: 定义模型节点 (Model Node)
const llmCall: GraphNode<typeof MessagesState> = async (state) => {
  return {
    messages: [
      await modelWithTools.invoke([
        new SystemMessage(
          "You are a helpful assistant tasked with performing arithmetic on a set of inputs.",
        ),
        ...state.messages,
      ]),
    ],
    llmCalls: 1,
  };
};

// 步骤 4: 定义工具节点 (Tool Node)
const toolNode: GraphNode<typeof MessagesState> = async (state) => {
  const lastMessage = state.messages.at(-1);

  if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }

  return { messages: result };
};

// 步骤 5: 定义流转逻辑
const shouldContinue: ConditionalEdgeRouter<{
  InputSchema: typeof MessagesState;
  Nodes: "toolNode";
}> = (state) => {
  const lastMessage = state.messages.at(-1);

  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return END;
  }

  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }

  return END;
};

// 步骤 6: 构建并编译 Agent
const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();

// 调用执行
const result = await agent.invoke({
  messages: [new HumanMessage("Add 3 and 4.")],
});

for (const message of result.messages) {
  console.log(`[${message.type}]: ${message.text}`);
}
```

</details>

---

## 方式二：使用 Functional API

### 1. 定义工具和模型

在本示例中，我们同样定义加法、乘法和除法工具，并绑定到大模型。

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
});

// 定义工具
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

// 为 LLM 绑定工具
const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);
```

### 2. 定义模型任务 (Model Task)

使用 `task` 定义 LLM 调用任务。

```typescript
import { task } from "@langchain/langgraph";
import { SystemMessage, type BaseMessage } from "@langchain/core/messages";

const callLlm = task({ name: "callLlm" }, async (messages: BaseMessage[]) => {
  return modelWithTools.invoke([
    new SystemMessage(
      "You are a helpful assistant tasked with performing arithmetic on a set of inputs.",
    ),
    ...messages,
  ]);
});
```

### 3. 定义工具任务 (Tool Task)

使用 `task` 定义工具执行任务。

```typescript
import { task } from "@langchain/langgraph";
import type { ToolCall } from "@langchain/core/messages/tool";

const callTool = task({ name: "callTool" }, async (toolCall: ToolCall) => {
  const tool = toolsByName[toolCall.name];
  return tool.invoke(toolCall);
});
```

### 4. 定义 Agent 入口函数 (Entrypoint)

使用 `entrypoint` 将任务编排为完整的 Agent 执行流程。

```typescript
import { entrypoint, addMessages } from "@langchain/langgraph";
import { type BaseMessage, HumanMessage } from "@langchain/core/messages";

const agent = entrypoint({ name: "agent" }, async (messages: BaseMessage[]) => {
  let modelResponse = await callLlm(messages);

  while (true) {
    if (!modelResponse.tool_calls?.length) {
      break;
    }

    // 执行工具调用
    const toolResults = await Promise.all(
      modelResponse.tool_calls.map((toolCall) => callTool(toolCall)),
    );
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }

  return messages;
});

// 调用执行
const result = await agent.invoke([new HumanMessage("Add 3 and 4.")]);

for (const message of result) {
  console.log(`[${message.type}]: ${message.text}`);
}
```

> [!TIP]
> 使用 [LangSmith](https://smith.langchain.com?utm_source=docs&utm_medium=cta&utm_campaign=langsmith-signup&utm_content=oss-langgraph-quickstart) 追踪和调试你的 Agent。请参考[追踪快速入门](/langsmith/trace-with-langgraph)完成配置。准备好投入生产时，请参阅[部署](/langsmith/deployment)了解托管选项。

<details>
<summary><b>点击展开：Functional API 完整代码示例</b></summary>

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { task, entrypoint, addMessages } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import type { ToolCall } from "@langchain/core/messages/tool";
import * as z from "zod";

// 步骤 1: 定义工具和模型
const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
});

const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

// 步骤 2: 定义模型任务 (Model Task)
const callLlm = task({ name: "callLlm" }, async (messages: BaseMessage[]) => {
  return modelWithTools.invoke([
    new SystemMessage(
      "You are a helpful assistant tasked with performing arithmetic on a set of inputs.",
    ),
    ...messages,
  ]);
});

// 步骤 3: 定义工具任务 (Tool Task)
const callTool = task({ name: "callTool" }, async (toolCall: ToolCall) => {
  const tool = toolsByName[toolCall.name];
  return tool.invoke(toolCall);
});

// 步骤 4: 定义 Agent
const agent = entrypoint({ name: "agent" }, async (messages: BaseMessage[]) => {
  let modelResponse = await callLlm(messages);

  while (true) {
    if (!modelResponse.tool_calls?.length) {
      break;
    }

    // 执行工具调用
    const toolResults = await Promise.all(
      modelResponse.tool_calls.map((toolCall) => callTool(toolCall)),
    );
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }

  return messages;
});

// 调用执行
const result = await agent.invoke([new HumanMessage("Add 3 and 4.")]);

for (const message of result) {
  console.log(`[${message.type}]: ${message.text}`);
}
```

</details>

---

## 资源与链接

- [通过 MCP 将这些文档连接到 Claude、VSCode 等工具](/use-these-docs)
- [在 GitHub 上编辑此页面](https://github.com/langchain-ai/docs/edit/main/src/oss/langgraph/quickstart.mdx) 或 [提交 Issue](https://github.com/langchain-ai/docs/issues/new/choose)
