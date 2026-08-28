import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TodoItem } from "@/components/agents/todo-list";
import type { ToolApprovalStatus } from "@/components/agents/tool-approval";

/**
 * 【Hook: useToolWorkflow】
 * 作用：管理智能体工具调用审批流程、模拟执行状态机与动态计划清单（TodoList）。
 *
 * 核心原理：
 * 1. 状态机流转：
 *    - 初始状态：pending（等待用户审批）
 *    - 点击允许：approving -> approved (450ms) -> running (850ms) -> complete (1650ms)
 *    - 点击拒绝：denied
 * 2. 计划清单联动（派生状态）：
 *    - 使用 useMemo 根据当前 toolStatus 动态推导 TodoList 各项任务的完成/进行中/已取消状态，
 *      无需额外声明 useState 维护重复冗余数据。
 * 3. 定时器自动清理：
 *    - 在执行新的审批动作或组件卸载时，自动清理正在进行的延时任务，杜绝内存泄漏。
 *
 * @param initialStatus 初始工具状态，默认为 "pending"
 */
export function useToolWorkflow(initialStatus: ToolApprovalStatus = "pending") {
  // 当前工具调用的状态
  const [toolStatus, setToolStatus] = useState<ToolApprovalStatus>(initialStatus);

  // 保存模拟状态流转相关的 setTimeout 引用
  const toolTimers = useRef<number[]>([]);

  /**
   * 清除当前所有工具相关的定时器
   */
  const clearToolTimers = useCallback(() => {
    toolTimers.current.forEach(window.clearTimeout);
    toolTimers.current = [];
  }, []);

  // 组件卸载时自动清理
  useEffect(() => clearToolTimers, [clearToolTimers]);

  /**
   * 用户点击“允许/始终允许”时触发的状态机推进逻辑
   */
  const approveTool = useCallback(() => {
    clearToolTimers();
    // 立即进入正在批准动画
    setToolStatus("approving");

    // 依次排队模拟：已批准 -> 正在运行 -> 执行完成
    toolTimers.current = [
      window.setTimeout(() => setToolStatus("approved"), 450),
      window.setTimeout(() => setToolStatus("running"), 850),
      window.setTimeout(() => setToolStatus("complete"), 1650),
    ];
  }, [clearToolTimers]);

  /**
   * 用户点击“拒绝”时触发
   */
  const denyTool = useCallback(() => {
    clearToolTimers();
    setToolStatus("denied");
  }, [clearToolTimers]);

  /**
   * 根据 toolStatus 派生计算出的 TodoList 任务清单
   * 采用 useMemo 避免每次无关渲染重复计算
   */
  const plan = useMemo<TodoItem[]>(() => {
    // 依据工具执行状态映射第三步任务（checks）的状态
    const checksStatus: TodoItem["status"] =
      toolStatus === "complete"
        ? "completed"
        : toolStatus === "running"
          ? "in-progress"
          : toolStatus === "denied" || toolStatus === "error"
            ? "cancelled"
            : "pending";

    return [
      {
        id: "inspect",
        title: "审计结算业务流程",
        status: "completed",
      },
      {
        id: "patch",
        title: "编写参数校验修复补丁",
        status: "completed",
      },
      {
        id: "checks",
        title: "执行定向自动化检查",
        status: checksStatus,
      },
      {
        id: "review",
        title: "确认发布审批流程",
        // 当自动化检查完全通过后，第四步审批进入“进行中”状态
        status: toolStatus === "complete" ? "in-progress" : "pending",
      },
    ];
  }, [toolStatus]);

  return {
    toolStatus,
    setToolStatus,
    plan,
    approveTool,
    denyTool,
    clearToolTimers,
  };
}
