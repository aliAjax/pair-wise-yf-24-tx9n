import { mockData } from "../mocks/seedData";
import type { DiffMergeGroup, MergeAuditLog } from "../types/DiffMerge";
import { readStorage, STORAGE_KEYS, writeStorage } from "../utils/localStorage";

export async function listDiffMergeGroup(): Promise<DiffMergeGroup[]> {
  const seeded = mockData.diffMergeGroup as unknown as DiffMergeGroup[];
  const stored = readStorage<DiffMergeGroup[] | null>(STORAGE_KEYS.mergeGroup, null);
  return [...(stored ?? seeded)];
}

export async function saveDiffMergeGroup(rows: DiffMergeGroup[]): Promise<DiffMergeGroup[]> {
  writeStorage(STORAGE_KEYS.mergeGroup, rows);
  return [...rows];
}

export async function listMergeAuditLog(): Promise<MergeAuditLog[]> {
  const seeded = mockData.mergeAuditLog as unknown as MergeAuditLog[];
  const stored = readStorage<MergeAuditLog[] | null>(STORAGE_KEYS.mergeAudit, null);
  return [...(stored ?? seeded)];
}

export async function saveMergeAuditLog(rows: MergeAuditLog[]): Promise<MergeAuditLog[]> {
  writeStorage(STORAGE_KEYS.mergeAudit, rows);
  return [...rows];
}
