import type { DiffMergeGroup } from "../types/DiffMerge";

export const createDefaultDiffMergeGroup = (overrides: Partial<DiffMergeGroup> = {}): DiffMergeGroup => ({
  id: 0,
  old_document_id: 0,
  new_document_id: 0,
  member_diff_ids: [],
  anchor_diff_id: 0,
  summary: "",
  status: "DRAFT",
  created_by: "法务",
  created_at: new Date(0).toISOString(),
  confirmed_at: null,
  split_at: null,
  ...overrides
});

export const createDiffMergeForm = createDefaultDiffMergeGroup;
export const createDiffMergeResponse = createDefaultDiffMergeGroup;
