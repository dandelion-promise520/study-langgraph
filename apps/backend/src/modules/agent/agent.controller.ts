import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { agentService } from "./agent.service";

export class AgentController {
  /**
   * 处理聊天请求
   */
  async chat(body: ChatRequestDto): Promise<ChatResponseDto> {
    return await agentService.chat(body);
  }
}

export const agentController = new AgentController();
