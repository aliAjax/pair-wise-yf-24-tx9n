export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  MERGE_MEMBER_TOO_FEW: "至少选择 2 条差异才能归并为同一条业务条款",
  MERGE_MEMBER_CONFLICT: "所选差异中存在已确认归并的旧项，不能重复归并",
  MERGE_GROUP_LOCKED: "归并已确认并归档，旧项只能在并档中查看，不能继续编辑",
  MERGE_DRAFT_NOT_FOUND: "未找到对应的归并草稿",
  MERGE_ARCHIVED_READONLY: "归档旧项为只读，请在新归并项上操作",
  MERGE_CROSS_DOCUMENT: "只能归并同一份新旧文档对比结果内的差异"
};
