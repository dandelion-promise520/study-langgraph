import { Bot, User } from "lucide-react";
import { useRef, useState } from "react";

import { getErrorMessage, sendChatMessageStream } from "./api";
import { ChatApp } from "./components/agents/chat-app";
import { ThinkingShimmer } from "./components/agents/loading-states/thinking-shimmer";
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "./components/agents/message";
import { MessageScroller } from "./components/agents/message-scroller";
import { PromptInput } from "./components/agents/prompt-input";
import { StreamingResponse } from "./components/agents/streaming-response";

type ChatItem = {
  id: string;
  from: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export const App = () => {
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: "1",
      from: "assistant",
      content: "你好！我是你的 AI 助手，有什么可以帮你的？",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [threadId] = useState<string>(() => `thread-${Date.now()}`);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = async (text: string) => {
    if (!text.trim() || pending) return;

    // 1、用户发送
    const userMsg: ChatItem = { id: `user-${Date.now()}`, from: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setPending(true);
    setInput("");

    // 2、准备接受ai回复的占位
    const aiId = `ai-${Date.now()}`;
    const aiMsg: ChatItem = {
      id: aiId,
      from: "assistant",
      content: "",
      streaming: true,
    };
    setMessages((prev) => [...prev, aiMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const stream = sendChatMessageStream({ message: text, threadId }, controller.signal);

      for await (const delta of stream) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiId ? { ...msg, content: msg.content + delta } : msg)),
        );
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiId ? { ...msg, streaming: false } : msg)),
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        const errorMessage = getErrorMessage(error, "请求失败");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiId
              ? {
                  ...msg,
                  content: msg.content
                    ? `${msg.content}\n\n[异常中断：${errorMessage}]`
                    : `请求失败:${errorMessage}`,
                }
              : msg,
          ),
        );
      }
    } finally {
      setPending(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <ChatApp className="h-dvh flex-col">
      {/* 消息滚动区 */}
      <MessageScroller
        navigation="rail"
        className="flex-1"
        contentClassName="mx-auto max-w-3xl py-6 px-4"
      >
        <div className="flex flex-col gap-4">
          <MessageGroup spacing="default">
            {messages.map(({ content, from, id, streaming }) => (
              // 消息部分
              <Message key={id} from={from} animateIn>
                {/* 头像 */}
                <MessageAvatar>{from === "assistant" ? <Bot></Bot> : <User></User>}</MessageAvatar>
                {/* 名字 */}
                <MessageContent>
                  <MessageHeader>
                    <span>{from === "assistant" ? "AI 智能体" : "你"}</span>{" "}
                  </MessageHeader>
                  {/* 内容 */}
                  <MessageBubble variant={from === "assistant" ? "soft" : "solid"}>
                    <MessageBubbleContent>
                      {from === "assistant" ? (
                        streaming && !content ? (
                          <ThinkingShimmer />
                        ) : (
                          <StreamingResponse
                            status={streaming ? "streaming" : "complete"}
                            showActions={!streaming}
                            copyText={content}
                          >
                            {content}
                          </StreamingResponse>
                        )
                      ) : (
                        content
                      )}
                    </MessageBubbleContent>
                  </MessageBubble>
                </MessageContent>
              </Message>
            ))}
          </MessageGroup>
        </div>
      </MessageScroller>

      {/* 输入框 */}
      <div className="border-t border-border p-3">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            value={input}
            onValueChange={setInput}
            onSubmit={handleSend}
            loading={pending}
            placeholder={pending ? "AI 正在思考中…" : "输入消息，按回车发送…"}
          />
        </div>
      </div>
    </ChatApp>
  );
};
