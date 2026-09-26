import { mockData } from "../mocks/seedData";
import type { ReviewNote } from "../types/ReviewNote";
import { readStorage, STORAGE_KEYS, writeStorage } from "../utils/localStorage";

const endpoint = "/api/review-note";

type ReviewNoteOverride = Partial<Omit<ReviewNote, "id">> & { id: number };

/** 归并确认/拆回会改写处理记录的归属，这些人工调整以覆盖表形式持久化 */
export async function listReviewNoteOverride(): Promise<ReviewNoteOverride[]> {
  return readStorage<ReviewNoteOverride[]>(STORAGE_KEYS.reviewNoteOverride, []);
}

export async function saveReviewNoteOverride(rows: ReviewNoteOverride[]): Promise<ReviewNoteOverride[]> {
  writeStorage(STORAGE_KEYS.reviewNoteOverride, rows);
  return [...rows];
}

/** 归并后的新项上可以继续添加处理记录 */
export async function listCreatedReviewNote(): Promise<ReviewNote[]> {
  return readStorage<ReviewNote[]>(STORAGE_KEYS.reviewNoteCreated, []);
}

export async function saveCreatedReviewNote(rows: ReviewNote[]): Promise<ReviewNote[]> {
  writeStorage(STORAGE_KEYS.reviewNoteCreated, rows);
  return [...rows];
}

export async function listReviewNote(): Promise<ReviewNote[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  const overrides = await listReviewNoteOverride();
  const created = await listCreatedReviewNote();
  const seeded = (mockData.reviewNote as unknown as ReviewNote[]).map((row) => {
    const patch = overrides.find((item) => item.id === row.id);
    return patch ? { ...row, ...patch } : row;
  });
  return [...seeded, ...created];
}

export async function saveReviewNote(payload: ReviewNote) {
  console.info("save ReviewNote", payload);
  return payload;
}
