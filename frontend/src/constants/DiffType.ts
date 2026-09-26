export const DiffType = ["ADDED","REMOVED","MODIFIED","MOVED","UNCHANGED"] as const;
export type DiffType = (typeof DiffType)[number];
export const DiffTypeText: Record<DiffType, string> = Object.fromEntries(DiffType.map((value) => [value, value.replace(/_/g, " ")])) as Record<DiffType, string>;
export const DiffTypeZh: Record<DiffType, string> = {
  ADDED: "新增",
  REMOVED: "删除",
  MODIFIED: "修改",
  MOVED: "移动",
  UNCHANGED: "未变更"
};
