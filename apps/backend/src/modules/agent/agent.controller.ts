import type { ChatRequest, ChatResponse } from "./agent.model";

import { agentService } from "./agent.service";

export class AgentController {
  /**
   * 处理聊天请求
   */
  async chat(body: ChatRequest): Promise<ChatResponse> {
    return await agentService.chat(body.message);
  }
}

export const agentController = new AgentController();
