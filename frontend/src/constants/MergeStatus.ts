export const MergeStatus = ["DRAFT", "CONFIRMED", "REVERTED"] as const;
export type MergeStatus = (typeof MergeStatus)[number];
export const MergeStatusText: Record<MergeStatus, string> = {
  DRAFT: "草稿",
  CONFIRMED: "已确认",
  REVERTED: "已拆回"
};
