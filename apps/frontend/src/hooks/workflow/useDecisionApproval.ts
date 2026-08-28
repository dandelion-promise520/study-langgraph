import { useCallback, useEffect, useRef, useState } from "react";

import type { ApprovalCardStatus } from "@/components/agents/approval-card";

/**
 * 【Hook: useDecisionApproval】
 * 作用：管理 Human-in-the-Loop (人机协同) 的最终业务决策审批卡片状态。
 *
 * 核心原理：
 * 1. 状态机流转：
 *    - pending：等待用户在审批卡片上选择发布方案
 *    - submitting：用户点击提交，卡片展示提交中 Loading 动画
 *    - answered：提交成功，卡片转为已完成确认状态
 * 2. 封装定时器清理逻辑，防止在提交等待过程中组件卸载引起警告。
 *
 * @param initialStatus 初始状态，默认为 "pending"
 */
export function useDecisionApproval(initialStatus: ApprovalCardStatus = "pending") {
  // 决策审批卡片状态
  const [approvalStatus, setApprovalStatus] = useState<ApprovalCardStatus>(initialStatus);

  // 记录提交模拟延时器的 ref
  const approvalTimers = useRef<number[]>([]);

  /**
   * 清理所有决策审批相关的定时器
   */
  const clearApprovalTimers = useCallback(() => {
    approvalTimers.current.forEach(window.clearTimeout);
    approvalTimers.current = [];
  }, []);

  // 组件卸载时自动清理
  useEffect(() => clearApprovalTimers, [clearApprovalTimers]);

  /**
   * 用户提交审批表单时触发
   */
  const submitApproval = useCallback(() => {
    // 1. 进入提交中状态
    setApprovalStatus("submitting");
    clearApprovalTimers();

    // 2. 模拟网络请求（650ms 后转为 answered 已确认状态）
    approvalTimers.current.push(
      window.setTimeout(() => {
        setApprovalStatus("answered");
      }, 650),
    );
  }, [clearApprovalTimers]);

  return {
    approvalStatus,
    setApprovalStatus,
    submitApproval,
    clearApprovalTimers,
  };
}
