export const MergeStatus = ["DRAFT", "CONFIRMED", "SPLIT"] as const;
export type MergeStatus = (typeof MergeStatus)[number];
export const MergeStatusText: Record<MergeStatus, string> = {
  DRAFT: "归并草稿",
  CONFIRMED: "已归并",
  SPLIT: "已拆回"
};
