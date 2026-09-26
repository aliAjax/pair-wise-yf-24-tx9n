export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  MERGE_SELECTION_TOO_SMALL: "归并至少需要选择两条有效差异",
  MERGE_MEMBER_ARCHIVED: "所选差异包含已归档或已归并的条目，无法再次归并",
  MERGE_RESULT_NOT_FOUND: "未找到可拆回的归并项，或该项已被拆回",
  MERGE_DRAFT_NOT_FOUND: "归并草稿不存在或已被处理"
};
