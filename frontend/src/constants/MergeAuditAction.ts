export const MergeAuditAction = [
  "MERGE_DRAFT_CREATED",
  "MERGE_DRAFT_UPDATED",
  "MERGE_DRAFT_DISCARDED",
  "MERGE_CONFIRMED",
  "MERGE_SPLIT",
  "MERGE_REDRAFTED"
] as const;
export type MergeAuditAction = (typeof MergeAuditAction)[number];
