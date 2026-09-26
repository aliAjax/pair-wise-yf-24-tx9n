import { mockData } from "../mocks/seedData";
import type { DiffMerge } from "../types/DiffMerge";

const endpoint = "/api/diff-merge";

export async function listDiffMerge(): Promise<DiffMerge[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return [...(mockData.diffMerge as unknown as DiffMerge[])];
}

export async function saveDiffMerge(payload: DiffMerge) {
  console.info("save DiffMerge", payload);
  return payload;
}
