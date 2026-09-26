import type { MergeStatus } from "../constants/MergeStatus";
import type { MergeAuditAction } from "../constants/MergeAuditAction";

export interface DiffMergeGroup {
  id: number;
  old_document_id: number;
  new_document_id: number;
  member_diff_ids: number[];
  anchor_diff_id: number;
  summary: string;
  status: MergeStatus;
  created_by: string;
  created_at: string;
  confirmed_at: string | null;
  split_at: string | null;
}

export interface MergeAuditLog {
  id: number;
  group_id: number;
  action: MergeAuditAction;
  diff_ids: number[];
  operator: string;
  detail: string;
  created_at: string;
}
