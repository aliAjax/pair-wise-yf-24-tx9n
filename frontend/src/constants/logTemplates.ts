export const LOG_TEMPLATES = {
  PolicyDocument: ["政策文档创建", "政策文档更新", "政策文档状态变更", "政策文档导出"],
  PolicySection: ["条款段落创建", "条款段落更新", "条款段落状态变更", "条款段落导出"],
  DiffResult: ["差异结果创建", "差异结果更新", "差异结果状态变更", "差异结果导出"],
  ReviewNote: ["审阅备注创建", "审阅备注更新", "审阅备注状态变更", "审阅备注导出"],
  DiffMerge: [
    "人工归并草稿创建：成员 {diffIds}",
    "人工归并草稿更新：归并组 {groupId} 成员 {diffIds}",
    "人工归并确认：归并组 {groupId}，风险取最高 {riskLevel}，处理记录 {noteCount} 条转入",
    "人工归并拆回：归并组 {groupId}，恢复差异 {diffIds}",
    "人工归并草稿废弃：归并组 {groupId}",
    "误合项重新归并：归并组 {groupId} 拆分后重建"
  ]
};
