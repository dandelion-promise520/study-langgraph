import { useCallback, useEffect, useRef, useState } from "react";

import type { AddedMessage } from "@/types/agent";

import { useAgentStreaming } from "./useAgentStreaming";

/**
 * 【Hook: useAgentChat】
 * 作用：管理智能体对话的核心生命周期与用户交互状态。
 * 
 * 包含的职责：
 * 1. 消息列表维护（messages）
 * 2. 用户输入框状态（input）
 * 3. 智能体思考中等待状态（pending，如展示 ThinkingShimmer）
 * 4. 忙碌状态判断（busy = pending || 正在流式打字）
 * 5. 发送消息逻辑（submit：添加用户消息 -> 延迟模拟 -> 追加助手占位 -> 触发逐字打字机）
 * 6. 停止/中断生成逻辑（stop：清理延时器、截断当前流式状态）
 * 
 * @param defaultReply 当用户发送消息后，智能体模拟回复的文本模板
 * @param reduceMotion 是否开启无障碍减弱动效
 */
export function useAgentChat(defaultReply: string, reduceMotion = false) {
  // 消息列表数据
  const [messages, setMessages] = useState<AddedMessage[]>([]);

  // 当前 Prompt 输入框中的文本
  const [input, setInput] = useState("");

  // 是否处于等待 AI 思考规划阶段（在收到第一个流式 Token 前显示思考动画）
  const [pending, setPending] = useState(false);

  // 用于存储消息交互相关的 setTimeout 句柄，方便在组件卸载或手动停止时统一清理
  const chatTimers = useRef<number[]>([]);

  // 自增 ID 计数器，保证每条消息的 ID 唯一
  const runId = useRef(0);

  // 集成流式渲染 Hook，用于驱动打字机效果
  const { activeReply, setActiveReply } = useAgentStreaming(
    defaultReply,
    reduceMotion,
    setMessages,
  );

  /**
   * 清除所有正在排队的聊天延时器，避免快速切换或打断时发生竞态错乱
   */
  const clearChatTimers = useCallback(() => {
    chatTimers.current.forEach(window.clearTimeout);
    chatTimers.current = [];
  }, []);

  // 当组件卸载时，自动清理可能残留的定时器
  useEffect(() => clearChatTimers, [clearChatTimers]);

  /**
   * 发送消息处理函数
   * @param value 用户输入的文本内容
   */
  const submit = useCallback(
    (value: string) => {
      // 空字符校验，或者当前正处于思考/流式状态中则不允许重复发送
      if (!value.trim() || pending || activeReply !== null) return;

      const currentRunId = runId.current++;
      const assistantId = `assistant-${currentRunId}`;

      // 1. 立即将用户消息追加到列表中
      setMessages((current) => [
        ...current,
        { id: `user-${currentRunId}`, from: "user", content: value },
      ]);

      // 2. 清空输入框并进入 pending（思考规划）状态
      setInput("");
      setPending(true);

      // 3. 模拟网络响应延时（减弱动效时直接 0ms 响应，否则模拟 420ms 思考过程）
      const delay = reduceMotion ? 0 : 420;
      chatTimers.current.push(
        window.setTimeout(() => {
          // 4. 追加一条空的 assistant 占位消息，标记 streaming: true
          setMessages((current) => [
            ...current,
            {
              id: assistantId,
              from: "assistant",
              content: "",
              streaming: true,
            },
          ]);

          // 5. 结束 pending 思考状态，并将该消息 ID 交给 useAgentStreaming 开始流式打字
          setPending(false);
          setActiveReply(assistantId);
        }, delay),
      );
    },
    [pending, activeReply, reduceMotion, setActiveReply],
  );

  /**
   * 停止/打断智能体生成
   * 用户点击“停止”按钮时调用
   */
  const stop = useCallback(() => {
    clearChatTimers();
    setPending(false);

    // 将所有流式中的消息标记为已完成（streaming: false）
    setMessages((current) =>
      current.map((message) =>
        message.streaming ? { ...message, streaming: false } : message,
      ),
    );

    // 终止流式动画
    setActiveReply(null);
  }, [clearChatTimers, setActiveReply]);

  // 忙碌状态：只要处于 pending 思考中或 activeReply 流式打字中即为忙碌
  const busy = pending || activeReply !== null;

  return {
    messages,
    setMessages,
    input,
    setInput,
    pending,
    busy,
    submit,
    stop,
  };
}
