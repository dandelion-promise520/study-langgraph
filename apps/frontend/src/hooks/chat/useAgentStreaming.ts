import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import type { AddedMessage } from "@/types/agent";

/**
 * 【Hook: useAgentStreaming】
 * 作用：模拟 AI 助手的打字机流式输出动效（基于 requestAnimationFrame）。
 * 
 * 核心原理：
 * 1. 当 activeReply 存在（即某条 assistant 消息正在输出）时启动动画循环。
 * 2. 根据时间差（毫秒）计算出当前应该展示的字符下标 (cursor)，逐帧更新消息内容。
 * 3. 当用户开启了“减弱动效”(reduce=true) 时，跳过逐字动画，直接一次性渲染完整文本。
 * 4. 在组件卸载或 activeReply 变化时，利用 useEffect 返回的清理函数取消未执行的 RAF，防止内存泄漏。
 * 
 * @param reply 完整的回复文本内容
 * @param reduce 是否开启了“减弱动效”（针对系统无障碍偏好或配置）
 * @param setMessages 用于更新外部消息列表状态的 dispatch 函数
 */
export function useAgentStreaming(
  reply: string,
  reduce: boolean,
  setMessages: Dispatch<SetStateAction<AddedMessage[]>>,
) {
  // 当前正在流式输出的消息 ID，为 null 时表示没有正在流式生成的消息
  const [activeReply, setActiveReply] = useState<string | null>(null);

  useEffect(() => {
    // 如果没有正在流式的消息，则无需执行任何动画
    if (!activeReply) return;

    // 场景一：用户偏好减少动效（无障碍支持） -> 直接一次性渲染完整文本，结束流式状态
    if (reduce) {
      setMessages((current) =>
        current.map((message) =>
          message.id === activeReply
            ? { ...message, content: reply, streaming: false }
            : message,
        ),
      );
      setActiveReply(null);
      return;
    }

    // 场景二：正常动效 -> 基于 requestAnimationFrame 逐字渲染
    const startedAt = performance.now(); // 记录流式开始的高精度时间戳
    let frame = 0;

    // 动画帧执行回调函数
    const stream = (now: number) => {
      // 92 是打字速度系数（约每秒 92 个字符），可根据需求调节
      const elapsed = (now - startedAt) / 1000;
      const cursor = Math.min(reply.length, Math.floor(elapsed * 92));
      const content = reply.slice(0, cursor);

      // 更新对应 ID 消息的内容
      setMessages((current) =>
        current.map((message) =>
          message.id === activeReply && message.content !== content
            ? { ...message, content }
            : message,
        ),
      );

      // 如果尚未输出完所有字符，继续请求下一帧；否则将 streaming 置为 false 标记完成
      if (cursor < reply.length) {
        frame = requestAnimationFrame(stream);
      } else {
        setMessages((current) =>
          current.map((message) =>
            message.id === activeReply ? { ...message, streaming: false } : message,
          ),
        );
        setActiveReply(null); // 流式完成，清除当前激活状态
      }
    };

    // 启动第一帧
    frame = requestAnimationFrame(stream);

    // 清理函数：组件卸载或 activeReply 发生变化时，取消当前正在排队的动画帧
    return () => cancelAnimationFrame(frame);
  }, [activeReply, reduce, reply, setMessages]);

  return { activeReply, setActiveReply };
}
