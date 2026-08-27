import { Bot, User } from "lucide-react";

import { ThinkingShimmer } from "@/components/agents/loading-states/thinking-shimmer";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/agents/message";
import { MessageBubble, MessageBubbleContent } from "@/components/agents/message-bubble";
import { StreamingResponse } from "@/components/agents/streaming-response";
import type { AddedMessage } from "@/types/agent";

/**
 * 智能体身份标识头部组件
 */
function AssistantIdentity({ label = "AI 智能体" }: { label?: string }) {
  return (
    <MessageHeader>
      <span>{label}</span>
      <span>刚刚</span>
    </MessageHeader>
  );
}

/**
 * DynamicMessages 组件的入参属性定义
 */
export interface DynamicMessagesProps {
  /** 动态对话历史消息列表 */
  messages: AddedMessage[];
  /** 是否正在等待 AI 思考规划 */
  pending: boolean;
}

/**
 * 【组件: DynamicMessages】
 * 作用：渲染用户与 AI 助手实时交互产生的消息列表与思考 Loading 状态。
 * 
 * 包含：
 * 1. 用户发送的气泡消息（右侧/纯色背景）
 * 2. 助手回复的流式气泡消息（带打字机光标与操作按钮）
 * 3. 正在思考规划时的 Shimmer 动效 (ThinkingShimmer)
 */
export function DynamicMessages({ messages, pending }: DynamicMessagesProps) {
  return (
    <>
      {/* 动态追加的消息列表 */}
      {messages.map((message) => (
        <Message key={message.id} from={message.from} animateIn>
          {message.from === "assistant" ? (
            <MessageAvatar>
              <Bot />
            </MessageAvatar>
          ) : (
            <MessageAvatar>
              <User />
            </MessageAvatar>
          )}
          <MessageContent>
            {message.from === "assistant" ? <AssistantIdentity label="AI 智能体" /> : null}
            <MessageBubble variant={message.from === "user" ? "solid" : "soft"}>
              <MessageBubbleContent>
                {message.from === "assistant" ? (
                  <StreamingResponse
                    status={message.streaming ? "streaming" : "complete"}
                    showActions={!message.streaming}
                    copyText={message.content}
                  >
                    {message.content}
                  </StreamingResponse>
                ) : (
                  message.content
                )}
              </MessageBubbleContent>
            </MessageBubble>
            {message.from === "user" ? <MessageFooter>已发送</MessageFooter> : null}
          </MessageContent>
        </Message>
      ))}

      {/* 智能体思考中等待状态 */}
      {pending ? (
        <Message from="assistant" animateIn>
          <MessageAvatar>
            <Bot />
          </MessageAvatar>
          <MessageContent>
            <ThinkingShimmer>正在分析您的指令并规划下一步...</ThinkingShimmer>
          </MessageContent>
        </Message>
      ) : null}
    </>
  );
}
