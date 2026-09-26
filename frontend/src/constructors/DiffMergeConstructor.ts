import type { DiffMerge } from "../types/DiffMerge";

export const createDefaultDiffMerge = (overrides: Partial<DiffMerge> = {}): DiffMerge => ({
  id: 1,
  member_diff_ids: [],
  result_diff_id: null,
  status: "DRAFT",
  note: "",
  created_at: new Date().toISOString(),
  confirmed_at: null,
  ...overrides
});

export const createDiffMergeDraft = (id: number, memberIds: number[], note = ""): DiffMerge =>
  createDefaultDiffMerge({ id, member_diff_ids: [...memberIds], note });

export const createDiffMergeForm = createDefaultDiffMerge;
export const createDiffMergeResponse = createDefaultDiffMerge;
