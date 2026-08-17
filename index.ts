import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  ReducedValue,
  START,
  END,
  type GraphNode,
  type ConditionalEdgeRouter,
} from "@langchain/langgraph";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  type ToolMessage,
} from "@langchain/core/messages";
import * as z from "zod";

// ============================================================================
// 第一步：初始化模型与定义工具函数 (Tools)
// ============================================================================

// 1. 初始化大模型客户端（使用本地代理与配置的模型）
const model = new ChatOpenAI({
  configuration: {
    baseURL: "http://127.0.0.1:8045/v1",
  },
  apiKey: "sk-9ad190d5bace4ac19b0a108b428ac460",
  model: "gemini-3.7-flash-high",
  temperature: 0, // 设置为 0 使数学计算回答更加确定和精确
});

// 2. 使用 LangChain 的 `tool` 函数定义计算工具
// 每个工具包含：具体执行逻辑、名称、功能描述和输入参数模式 (Zod Schema)
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "计算两个数字相加之和",
  schema: z.object({
    a: z.number().describe("第一个加数"),
    b: z.number().describe("第二个加数"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "计算两个数字相乘之积",
  schema: z.object({
    a: z.number().describe("第一个乘数"),
    b: z.number().describe("第二个乘数"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "计算两个数字相除之商",
  schema: z.object({
    a: z.number().describe("被除数"),
    b: z.number().describe("除数"),
  }),
});

// 3. 将工具打包成一个字典映射，方便后续根据工具名快速查找执行
const toolsByName: Record<string, any> = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);

// 4. 将工具“绑定”给大模型（告诉大模型有这些工具可用，必要时可以发起调用）
const modelWithTools = model.bindTools(tools);

// ============================================================================
// 第二步：定义图的状态结构 (State Schema)
// ============================================================================
// State 就像是整个流程的“公共记事本”，所有节点都在这个记事本上读取和追加信息。
const MessagesState = new StateSchema({
  // `messages`: 保存对话历史消息数组。
  // `MessagesValue` 内置了追加模式（Reducer），新返回的消息会自动追加到数组末尾，不会覆盖旧消息。
  messages: MessagesValue,

  // `llmCalls`: 记录大模型被调用的总次数。
  // `ReducedValue` 配合 reducer: (x, y) => x + y，实现每次有新调用时自动累加计数。
  llmCalls: new ReducedValue(
    z.number().default(0),
    { reducer: (x, y) => x + y }
  ),
});

// ============================================================================
// 第三步：定义图的节点函数 (Graph Nodes)
// ============================================================================
// 节点是图中的具体工人，每个节点接收当前的 State，执行业务逻辑后返回需要更新的 State 字段。

/**
 * 节点 1: LLM 思考与决策节点
 * 负责将当前的对话历史发给大模型，获取大模型的回复（可能是要求调工具，也可能是直接回答）
 */
const llmCall: GraphNode<typeof MessagesState> = async (state) => {
  console.log("\n[Node: llmCall] 🧠 正在请求大模型思考...");

  // 将系统提示词与历史消息合并后发送给大模型
  const response = await modelWithTools.invoke([
    new SystemMessage("你是一个数学计算助手，遇到计算问题时，请务必调用对应的数学工具来计算，不要自己心算。"),
    ...state.messages,
  ]);

  // 返回更新内容：将模型的回复放入 messages 列表，并将调用次数 +1
  return {
    messages: [response],
    llmCalls: 1,
  };
};

/**
 * 节点 2: 工具执行节点
 * 负责解析模型给出的 `tool_calls` 参数，实际执行加减乘除函数，并把执行结果包装成 ToolMessage
 */
const toolNode: GraphNode<typeof MessagesState> = async (state) => {
  console.log("[Node: toolNode] 🔧 检测到工具调用请求，正在执行具体计算...");

  // 获取记事本中的最后一条消息（即上一轮 LLM 产生的回复）
  const lastMessage = state.messages.at(-1);

  // 如果没有最后一条消息，或者不是 AI 发送的消息，直接返回空
  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];

  // 遍历模型需要调用的所有工具
  for (const toolCall of lastMessage.tool_calls ?? []) {
    console.log(`  -> 正在调用工具: [${toolCall.name}]，输入参数:`, toolCall.args);
    const toolInstance = toolsByName[toolCall.name];

    // 调用工具函数获取计算结果
    const observation = await toolInstance.invoke(toolCall);
    console.log(`  -> 工具 [${toolCall.name}] 计算完成，结果:`, observation.content);
    result.push(observation);
  }

  // 将工具执行结果以消息形式返回，自动追加进记事本
  return { messages: result };
};

// ============================================================================
// 第四步：定义条件路由函数 (Conditional Edge Router)
// ============================================================================
// 负责在 LLM 节点执行完后“看一眼”记事本，决定下一步是去“工具节点”还是“结束”。
const shouldContinue: ConditionalEdgeRouter<{
  InputSchema: typeof MessagesState;
  Nodes: "toolNode";
}> = (state) => {
  const lastMessage = state.messages.at(-1);

  // 如果没有 AI 消息，直接结束
  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return END;
  }

  // 如果 AI 消息中包含 tool_calls（说明模型认为需要计算），则路由到 toolNode 执行计算
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "toolNode";
  }

  // 如果没有 tool_calls（说明模型已经得到了所有结果并输出了最终回复），流程结束
  return END;
};

// ============================================================================
// 第五步：组装图结构并编译 (Assemble & Compile)
// ============================================================================
const agent = new StateGraph(MessagesState)
  // 1. 注册节点
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)

  // 2. 设置起点：流程从 START 节点直接进入 llmCall（让 LLM 先理解问题）
  .addEdge(START, "llmCall")

  // 3. 设置条件边：llmCall 执行完毕后，调用 shouldContinue 判断去哪
  //    - 返回 "toolNode" 则走向 toolNode 节点
  //    - 返回 END 则直接结束整张图
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])

  // 4. 设置闭环：工具执行完毕后，必须回到 llmCall，让 LLM 根据计算结果生成最终的人类语言答复
  .addEdge("toolNode", "llmCall")

  // 5. 编译图，生成可执行的 Agent 实例
  .compile();

// ============================================================================
// 第六步：调用执行 (Invoke)
// ============================================================================
async function main() {
  console.log("==================================================");
  console.log("🚀 LangGraph Calculator Agent Demo 启动");
  console.log("==================================================");

  // 测试一个复合计算问题，验证它能否连续调用工具（例如先加法再乘法）
  const userQuestion = "请帮我计算 (12 + 18) * 4 等于多少？";
  console.log(`\n💬 用户问题: "${userQuestion}"\n`);

  // 触发 Agent，传入用户的初始问题
  const finalState = await agent.invoke({
    messages: [new HumanMessage(userQuestion)],
  });

  console.log("\n==================================================");
  console.log("📜 完整对话流轨迹 (Message History)");
  console.log("==================================================");

  for (const msg of finalState.messages) {
    const role = msg.getType();
    if (role === "human") {
      console.log(`\n👤 [用户]:\n   ${msg.content}`);
    } else if (role === "ai") {
      const aiMsg = msg as AIMessage;
      if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
        console.log(`\n🤖 [AI 思考中 -> 发起工具调用]:`);
        for (const tc of aiMsg.tool_calls) {
          console.log(`   - 工具名称: ${tc.name}, 参数: ${JSON.stringify(tc.args)}`);
        }
      } else {
        console.log(`\n🤖 [AI 最终回答]:\n   ${aiMsg.content}`);
      }
    } else if (role === "tool") {
      console.log(`\n⚙️  [工具返回结果]:\n   ${msg.content}`);
    }
  }

  console.log("\n==================================================");
  console.log(`📈 运行统计: LLM 共被调用了 ${finalState.llmCalls} 次`);
  console.log("==================================================");
}

// 启动执行
main().catch((err) => {
  console.error("❌ 运行出错:", err);
});