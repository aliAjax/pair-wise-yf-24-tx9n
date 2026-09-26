import { ERROR_MESSAGES } from "../constants/errorMessages";
import { ERROR_CODES, type MergeErrorCode } from "../constants/errorCodes";
import { MergeAuditAction } from "../constants/MergeAuditAction";
import { PrivacyRiskLevel } from "../constants/PrivacyRiskLevel";
import type { DiffResult } from "../types/DiffResult";
import type { DiffMergeGroup, MergeAuditLog } from "../types/DiffMerge";
import type { PolicySection } from "../types/PolicySection";
import type { ReviewNote } from "../types/ReviewNote";
import { createDefaultDiffMergeGroup } from "../constructors/DiffMergeConstructor";
import { MergeServiceError } from "./MergeServiceError";
import { mergeLogTemplates, writeLog } from "../utils/logger";

export type ReviewNoteOverride = Partial<Omit<ReviewNote, "id">> & { id: number };

export interface MergeState {
  groups: DiffMergeGroup[];
  audits: MergeAuditLog[];
  overrides: ReviewNoteOverride[];
}

const fail = (code: MergeErrorCode): never => {
  throw new MergeServiceError(code, ERROR_MESSAGES[code]);
};

const RISK_RANK: Record<string, number> = Object.fromEntries(
  PrivacyRiskLevel.map((level, index) => [level, index])
);

let auditSequence = 0;
const nextAuditId = (audits: MergeAuditLog[]) =>
  Math.max(0, ...audits.map((row) => row.id), auditSequence) + 1;

let groupSequence = 0;
const nextGroupId = (groups: DiffMergeGroup[]) =>
  Math.max(100, ...groups.map((row) => row.id), groupSequence) + 1;

const now = () => new Date().toISOString();

const unique = <T>(values: T[]): T[] => [...new Set(values)];

/** 归并确认后风险取原项最高值：对比差异关联条款的风险等级 */
export function highestRisk(diffIds: number[], diffs: DiffResult[], sections: PolicySection[]): string {
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  return diffIds
    .map((id) => diffs.find((diff) => diff.id === id))
    .map((diff) => (diff ? sectionMap.get(diff.section_id)?.risk_level : undefined))
    .reduce<string>((highest, risk) => {
      if (!risk) return highest;
      if (!highest) return risk;
      return (RISK_RANK[risk] ?? -1) > (RISK_RANK[highest] ?? -1) ? risk : highest;
    }, "");
}

const assertSameComparison = (diffs: DiffResult[], selected: DiffResult[]) => {
  if (selected.length < 2) fail(ERROR_CODES.MERGE_MEMBER_TOO_FEW);
  const scope = selected[0];
  const cross = selected.some(
    (diff) => diff.old_document_id !== scope.old_document_id || diff.new_document_id !== scope.new_document_id
  );
  if (cross) fail(ERROR_CODES.MERGE_CROSS_DOCUMENT);
};

const assertMembersFree = (groups: DiffMergeGroup[], diffIds: number[]) => {
  // DRAFT / CONFIRMED 归并组占用成员；SPLIT 组已拆回，成员重新可用
  const lockedIds = new Set(
    groups.filter((group) => group.status !== "SPLIT").flatMap((group) => group.member_diff_ids)
  );
  if (diffIds.some((id) => lockedIds.has(id))) fail(ERROR_CODES.MERGE_MEMBER_CONFLICT);
};

const getDraft = (groups: DiffMergeGroup[], groupId: number): DiffMergeGroup => {
  const group = groups.find((row) => row.id === groupId && row.status === "DRAFT");
  if (!group) throw new MergeServiceError(ERROR_CODES.MERGE_DRAFT_NOT_FOUND, ERROR_MESSAGES.MERGE_DRAFT_NOT_FOUND);
  return group;
};

const pushAudit = (
  state: MergeState,
  payload: { groupId: number; action: (typeof MergeAuditAction)[number]; diffIds: number[]; operator: string; detail: string }
): void => {
  state.audits = [
    ...state.audits,
    {
      id: nextAuditId(state.audits),
      group_id: payload.groupId,
      action: payload.action,
      diff_ids: payload.diffIds,
      operator: payload.operator,
      detail: payload.detail,
      created_at: now()
    }
  ];
};

const buildSummary = (diffIds: number[], diffs: DiffResult[]): string => {
  const members = diffIds
    .map((id) => diffs.find((diff) => diff.id === id))
    .filter((diff): diff is DiffResult => Boolean(diff));
  const types = unique(members.map((diff) => diff.diff_type));
  return `人工归并 ${diffIds.length} 项（${types.join("、")}）：${members
    .map((diff) => diff.summary)
    .join(" / ")}`;
};

/** 把 ADDED+REMOVED/MOVED 等误判为删一条加一条的差异合成一个归并草稿，未确认不影响统计 */
export function startMergeDraft(
  state: MergeState,
  params: { diffIds: number[]; operator: string; diffs: DiffResult[]; sections: PolicySection[]; summary?: string }
): MergeState {
  const diffIds = unique(params.diffIds);
  const selected = diffIds
    .map((id) => params.diffs.find((diff) => diff.id === id))
    .filter((diff): diff is DiffResult => Boolean(diff));
  assertSameComparison(params.diffs, selected);
  assertMembersFree(state.groups, diffIds);

  const scope = selected[0];
  const next: MergeState = { ...state, groups: [...state.groups] };
  const group = createDefaultDiffMergeGroup({
    id: nextGroupId(next.groups),
    old_document_id: scope.old_document_id,
    new_document_id: scope.new_document_id,
    member_diff_ids: diffIds,
    anchor_diff_id: diffIds[0],
    summary: params.summary?.trim() || buildSummary(diffIds, params.diffs),
    status: "DRAFT",
    created_by: params.operator,
    created_at: now()
  });
  next.groups.push(group);
  writeLog(mergeLogTemplates[0], { diffIds: diffIds.join(",") });
  pushAudit(next, {
    groupId: group.id,
    action: "MERGE_DRAFT_CREATED",
    diffIds,
    operator: params.operator,
    detail: `创建归并草稿，成员 ${diffIds.join("、")}`
  });
  return next;
}

export function updateMergeDraft(
  state: MergeState,
  params: { groupId: number; diffIds: number[]; operator: string; diffs: DiffResult[]; summary?: string }
): MergeState {
  const group = getDraft(state.groups, params.groupId);
  const diffIds = unique(params.diffIds);
  const selected = diffIds
    .map((id) => params.diffs.find((diff) => diff.id === id))
    .filter((diff): diff is DiffResult => Boolean(diff));
  assertSameComparison(params.diffs, selected);
  const others = state.groups.filter((row) => row.id !== group.id && row.status !== "SPLIT");
  const lockedIds = new Set(others.flatMap((row) => row.member_diff_ids));
  if (diffIds.some((id) => lockedIds.has(id))) fail(ERROR_CODES.MERGE_MEMBER_CONFLICT);

  const next: MergeState = { ...state };
  next.groups = state.groups.map((row) =>
    row.id === group.id
      ? {
          ...row,
          member_diff_ids: diffIds,
          anchor_diff_id: diffIds[0],
          summary: params.summary?.trim() || buildSummary(diffIds, params.diffs)
        }
      : row
  );
  writeLog(mergeLogTemplates[1], { groupId: group.id, diffIds: diffIds.join(",") });
  pushAudit(next, {
    groupId: group.id,
    action: "MERGE_DRAFT_UPDATED",
    diffIds,
    operator: params.operator,
    detail: `更新草稿成员为 ${diffIds.join("、")}`
  });
  return next;
}

export function discardMergeDraft(state: MergeState, params: { groupId: number; operator: string }): MergeState {
  const group = getDraft(state.groups, params.groupId);
  const next: MergeState = { ...state, groups: state.groups.filter((row) => row.id !== group.id) };
  writeLog(mergeLogTemplates[4], { groupId: group.id });
  pushAudit(next, {
    groupId: group.id,
    action: "MERGE_DRAFT_DISCARDED",
    diffIds: group.member_diff_ids,
    operator: params.operator,
    detail: "废弃未确认草稿，统计未受影响"
  });
  return next;
}

const upsertOverride = (
  overrides: ReviewNoteOverride[],
  note: ReviewNote,
  patch: Partial<Omit<ReviewNote, "id">>
): ReviewNoteOverride[] => {
  const index = overrides.findIndex((row) => row.id === note.id);
  const merged = { id: note.id, ...(index >= 0 ? overrides[index] : {}), ...patch };
  const next = [...overrides];
  if (index >= 0) next[index] = merged;
  else next.push(merged);
  return next;
};

/** 归并确认：风险取原项最高值，处理记录转给新项，旧项转入并档只读 */
export function confirmMerge(
  state: MergeState,
  params: { groupId: number; operator: string; diffs: DiffResult[]; sections: PolicySection[]; notes: ReviewNote[] }
): MergeState {
  const group = getDraft(state.groups, params.groupId);
  const riskLevel = highestRisk(group.member_diff_ids, params.diffs, params.sections) || "LOW";
  const next: MergeState = { ...state };
  const confirmedAt = now();
  next.groups = state.groups.map((row) =>
    row.id === group.id ? { ...row, status: "CONFIRMED", confirmed_at: confirmedAt, split_at: null } : row
  );
  next.overrides = [...state.overrides];
  let noteCount = 0;
  for (const note of params.notes) {
    if (group.member_diff_ids.includes(note.diff_result_id)) {
      next.overrides = upsertOverride(next.overrides, note, { moved_to_merge_id: group.id });
      noteCount += 1;
    }
  }
  writeLog(mergeLogTemplates[2], { groupId: group.id, riskLevel, noteCount });
  pushAudit(next, {
    groupId: group.id,
    action: "MERGE_CONFIRMED",
    diffIds: group.member_diff_ids,
    operator: params.operator,
    detail: `确认归并，风险取最高值 ${riskLevel}，${noteCount} 条处理记录转入新项，旧项转入并档只读`
  });
  return next;
}

/** 误合项拆回：新项归档不可再编辑，原差异恢复独立，处理记录转回原项 */
export function splitMerge(
  state: MergeState,
  params: { groupId: number; operator: string; notes: ReviewNote[] }
): MergeState {
  const group = state.groups.find((row) => row.id === params.groupId && row.status === "CONFIRMED");
  if (!group) throw new MergeServiceError(ERROR_CODES.MERGE_GROUP_LOCKED, ERROR_MESSAGES.MERGE_GROUP_LOCKED);
  const next: MergeState = { ...state };
  next.groups = state.groups.map((row) =>
    row.id === group.id ? { ...row, status: "SPLIT", split_at: now() } : row
  );
  next.overrides = [...state.overrides];
  let noteCount = 0;
  for (const note of params.notes) {
    if (note.moved_to_merge_id === group.id) {
      next.overrides = upsertOverride(next.overrides, note, { moved_to_merge_id: null });
      noteCount += 1;
    }
  }
  writeLog(mergeLogTemplates[3], { groupId: group.id, diffIds: group.member_diff_ids.join(",") });
  pushAudit(next, {
    groupId: group.id,
    action: "MERGE_SPLIT",
    diffIds: group.member_diff_ids,
    operator: params.operator,
    detail: `误合项拆回，恢复 ${group.member_diff_ids.length} 项原差异，${noteCount} 条处理记录转回原项`
  });
  return next;
}

/** 拆回后可对原差异重新归并 */
export function redraftFromSplit(
  state: MergeState,
  params: { groupId: number; diffIds: number[]; operator: string; diffs: DiffResult[]; sections: PolicySection[] }
): MergeState {
  const source = state.groups.find((row) => row.id === params.groupId && row.status === "SPLIT");
  if (!source) throw new MergeServiceError(ERROR_CODES.MERGE_GROUP_LOCKED, ERROR_MESSAGES.MERGE_GROUP_LOCKED);
  const restarted = startMergeDraft(state, {
    diffIds: params.diffIds?.length ? unique(params.diffIds) : source.member_diff_ids,
    operator: params.operator,
    diffs: params.diffs,
    sections: params.sections
  });
  writeLog(mergeLogTemplates[5], { groupId: params.groupId });
  pushAudit(restarted, {
    groupId: source.id,
    action: "MERGE_REDRAFTED",
    diffIds: source.member_diff_ids,
    operator: params.operator,
    detail: `拆回归并组 ${source.id} 后重新起草归并`
  });
  return restarted;
}
