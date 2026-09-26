import type { MergeStatus } from "../constants/MergeStatus";

export interface DiffMerge {
  id: number;
  member_diff_ids: number[];
  result_diff_id: number | null;
  status: MergeStatus;
  note: string;
  created_at: string;
  confirmed_at: string | null;
}
