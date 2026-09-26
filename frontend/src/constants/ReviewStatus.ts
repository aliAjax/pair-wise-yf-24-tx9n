export const ReviewStatus = ["OPEN","CONFIRMED","IGNORED","RESOLVED"] as const;
export type ReviewStatus = (typeof ReviewStatus)[number];
export const ReviewStatusText: Record<ReviewStatus, string> = Object.fromEntries(ReviewStatus.map((value) => [value, value.replace(/_/g, " ")])) as Record<ReviewStatus, string>;
export const ReviewStatusZh: Record<ReviewStatus, string> = {
  OPEN: "待处理",
  CONFIRMED: "已确认",
  IGNORED: "已忽略",
  RESOLVED: "已解决"
};
