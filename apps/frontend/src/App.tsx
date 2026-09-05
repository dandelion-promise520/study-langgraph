import { Bot, User } from "lucide-react";
import { useState } from "react";

import { sendChatMessage } from "./api";
import { ChatApp } from "./components/agents/chat-app";
import { ThinkingShimmer } from "./components/agents/loading-states/thinking-shimmer";
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
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

  const handleSend = async (text: string) => {
    if (!text.trim() || pending) return;

    // 1、用户发送
    const userMsg: ChatItem = { id: `user-${Date.now()}`, from: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setPending(true);
    setInput("");

    // 2、调用真实接口
    try {
      const { reply } = await sendChatMessage({ message: text });
      setPending(false);

      const aiId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: aiId, content: "", from: "assistant", streaming: true },
      ]);

      let i = 0;
      const timer = setInterval(() => {
        i++;
        const currentText = reply.slice(0, i);

        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiId ? { ...msg, content: currentText } : msg)),
        );

        if (i >= reply.length) {
          clearInterval(timer);

          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiId ? { ...msg, streaming: false } : msg)),
          );
        }
      }, 40);
    } catch (error) {
      setPending(false);

      const errorMessage = error instanceof Error ? error.message : "网络异常，请稍后重试";

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          content: `请求失败${errorMessage}`,
          from: "assistant",
        },
      ]);
    }

    // 2、模拟ai回复
    // setTimeout(() => {
    //   setPending(false);

    //   const reply = `好的！关于“${text}”，我已经为你分析完成。我们可以分步骤进行处理。`;
    //   const aiId = `ai-${Date.now()}`;

    //   setMessages((prev) => [
    //     ...prev,
    //     { id: aiId, content: "", from: "assistant", streaming: true },
    //   ]);

    //   let i = 0;
    //   const timer = setInterval(() => {
    //     i++;
    //     const currentText = reply.slice(0, i);

    //     setMessages((prev) =>
    //       prev.map((msg) => (msg.id === aiId ? { ...msg, content: currentText } : msg)),
    //     );

    //     if (i >= reply.length) {
    //       clearInterval(timer);

    //       setMessages((prev) =>
    //         prev.map((msg) => (msg.id === aiId ? { ...msg, streaming: false } : msg)),
    //       );
    //     }
    //   }, 40);
    // }, 800);
  };

  return (
    <ChatApp className="h-dvh flex-col">
      {/* 消息滚动区 */}
      <MessageScroller className="flex-1" contentClassName="mx-auto max-w-3xl py-6 px-4">
        <div className="flex flex-col gap-4">
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
                      <StreamingResponse
                        status={streaming ? "streaming" : "complete"}
                        showActions={!streaming}
                        copyText={content}
                      >
                        {content}
                      </StreamingResponse>
                    ) : (
                      content
                    )}
                  </MessageBubbleContent>
                </MessageBubble>
              </MessageContent>
            </Message>
          ))}
          {pending && (
            <Message from="assistant" animateIn>
              <MessageContent>
                <ThinkingShimmer></ThinkingShimmer>
              </MessageContent>
            </Message>
          )}
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
