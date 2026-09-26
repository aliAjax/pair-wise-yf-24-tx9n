import type { DiffResult } from "../types/DiffResult";

export const createDefaultDiffResult = (overrides: Partial<DiffResult> = {}): DiffResult => ({
  id: 1,
  old_document_id: 1,
  new_document_id: 1,
  section_id: 1,
  diff_type: "REMOVED",
  summary: "summary 1",
  risk_level: "LOW",
  origin: "AUTO",
  merge_state: "ACTIVE",
  merged_into_id: null,
  merged_from_ids: [],
  created_at: "2026-06-11T09:00:00Z",
  ...overrides
});

export const createDiffResultForm = createDefaultDiffResult;
export const createDiffResultResponse = createDefaultDiffResult;
