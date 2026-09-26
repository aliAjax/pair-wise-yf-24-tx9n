export const STORAGE_KEYS = {
  mergeGroup: "policy-diff:diff-merge-group",
  mergeAudit: "policy-diff:merge-audit-log",
  reviewNoteOverride: "policy-diff:review-note:override",
  reviewNoteCreated: "policy-diff:review-note:created"
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 不可用时退化为内存态，页面功能仍可在当前会话使用。
  }
}
