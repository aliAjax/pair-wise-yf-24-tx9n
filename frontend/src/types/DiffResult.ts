export type DiffOrigin = "AUTO" | "MERGED";
export type MergeState = "ACTIVE" | "ARCHIVED";

export interface DiffResult {
  id: number;
  old_document_id: number;
  new_document_id: number;
  section_id: number;
  diff_type: string;
  summary: string;
  risk_level: string;
  origin: DiffOrigin;
  merge_state: MergeState;
  merged_into_id: number | null;
  merged_from_ids: number[];
  created_at: string;
}
