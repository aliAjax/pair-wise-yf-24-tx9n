import { computed, type Ref } from "vue";
import type { DiffResult } from "../types/DiffResult";
import type { DiffMergeGroup, MergeAuditLog } from "../types/DiffMerge";
import type { PolicySection } from "../types/PolicySection";
import type { ReviewNote } from "../types/ReviewNote";
import { highestRisk } from "../services/mergeService";

export interface MergeViewEntry {
  key: string;
  kind: "MERGED" | "DIFF";
  groupId?: number;
  mergeStatus?: "CONFIRMED";
  diffId?: number;
  memberDiffIds: number[];
  diffType: string;
  summary: string;
  riskLevel: string;
  oldSection?: PolicySection;
  newSection?: PolicySection;
  diffs: DiffResult[];
  notes: ReviewNote[];
  openNoteCount: number;
  editable: boolean;
  /** 未确认草稿占用该差异，仅作标记，不进入统计 */
  inDraftGroupId?: number;
}

export interface MergeViewStats {
  total: number;
  merged: number;
  openTodos: number;
  archivedDiffCount: number;
  draftCount: number;
  riskBreakdown: Array<{ risk: string; count: number }>;
}

interface MergeViewSource {
  diffs: DiffResult[] | Ref<DiffResult[]>;
  sections: PolicySection[] | Ref<PolicySection[]>;
  notes: ReviewNote[] | Ref<ReviewNote[]>;
  groups: DiffMergeGroup[] | Ref<DiffMergeGroup[]>;
  audits?: MergeAuditLog[] | Ref<MergeAuditLog[]>;
}

const unwrap = <T>(value: T | Ref<T>): T => (value && typeof value === "object" && "value" in value ? value.value : value);

const RISK_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", ""];

/**
 * 人工归并后的差异视图：
 * - 已确认归并：成员差异合成 1 项，风险取原项最高值，处理记录归到新项，旧项转并档只读
 * - 未确认草稿：不出合成项、不占统计，成员仅标记“草稿中”
 * - 已拆回：原差异恢复为独立项
 */
export function useMergeView(source: MergeViewSource) {
  const diffs = computed(() => unwrap(source.diffs));
  const sections = computed(() => unwrap(source.sections));
  const notes = computed(() => unwrap(source.notes));
  const groups = computed(() => unwrap(source.groups));
  const audits = computed(() => unwrap(source.audits ?? []));

  const sectionMap = computed(() => new Map(sections.value.map((section) => [section.id, section])));

  const confirmedGroups = computed(() => groups.value.filter((group) => group.status === "CONFIRMED"));
  const draftGroups = computed(() => groups.value.filter((group) => group.status === "DRAFT"));
  const splitGroups = computed(() => groups.value.filter((group) => group.status === "SPLIT"));

  const draftOwnerMap = computed(() => {
    const map = new Map<number, number>();
    for (const group of draftGroups.value) {
      for (const id of group.member_diff_ids) map.set(id, group.id);
    }
    return map;
  });

  const archivedDiffIdSet = computed(
    () => new Set(confirmedGroups.value.flatMap((group) => group.member_diff_ids))
  );

  const notesForDiff = (diffId: number) =>
    notes.value.filter((note) => note.diff_result_id === diffId && note.moved_to_merge_id === null);

  const notesForGroup = (groupId: number) =>
    notes.value.filter((note) => note.moved_to_merge_id === groupId);

  const buildDiffEntry = (diff: DiffResult): MergeViewEntry => {
      const section = sectionMap.value.get(diff.section_id);
      const entryNotes = notesForDiff(diff.id);
      const belongsOld = ["REMOVED", "MOVED"].includes(diff.diff_type);
      return {
        key: `diff-${diff.id}`,
        kind: "DIFF",
        diffId: diff.id,
        memberDiffIds: [diff.id],
        diffType: diff.diff_type,
        summary: diff.summary,
        riskLevel: section?.risk_level ?? "LOW",
        oldSection: belongsOld ? section : undefined,
        newSection: belongsOld ? undefined : section,
        diffs: [diff],
        notes: entryNotes,
        openNoteCount: entryNotes.filter((note) => note.status === "OPEN").length,
        editable: true,
        inDraftGroupId: draftOwnerMap.value.get(diff.id)
      };
    };

  const buildMergedEntry = (group: DiffMergeGroup): MergeViewEntry => {
    const memberDiffs = group.member_diff_ids
      .map((id) => diffs.value.find((diff) => diff.id === id))
      .filter((diff): diff is DiffResult => Boolean(diff));
    const entryNotes = notesForGroup(group.id);
    const sectionOf = (diff: DiffResult) => sectionMap.value.get(diff.section_id);
    const oldSection = memberDiffs
      .filter((diff) => ["REMOVED", "MOVED"].includes(diff.diff_type))
      .map(sectionOf)
      .find((section): section is PolicySection => section !== undefined && section.document_id === group.old_document_id);
    const newSection: PolicySection | undefined =
      memberDiffs
        .filter((diff) => ["ADDED", "MODIFIED"].includes(diff.diff_type))
        .map(sectionOf)
        .find((section): section is PolicySection => section !== undefined && section.document_id === group.new_document_id) ??
      memberDiffs
        .map(sectionOf)
        .find((section): section is PolicySection => Boolean(section));
    return {
      key: `merge-${group.id}`,
      kind: "MERGED",
      groupId: group.id,
      mergeStatus: "CONFIRMED",
      memberDiffIds: group.member_diff_ids,
      diffType: "MERGED",
      summary: group.summary,
      riskLevel: highestRisk(group.member_diff_ids, diffs.value, sections.value) || "LOW",
      oldSection,
      newSection: newSection as PolicySection | undefined,
      diffs: memberDiffs,
      notes: entryNotes,
      openNoteCount: entryNotes.filter((note) => note.status === "OPEN").length,
      editable: true
    };
  };

  /** 详情列表与待办数量均以此为准 */
  const entries = computed<MergeViewEntry[]>(() => {
    const merged = confirmedGroups.value.map(buildMergedEntry);
    const standalone = diffs.value
      .filter((diff) => !archivedDiffIdSet.value.has(diff.id))
      .map(buildDiffEntry);
    return [...merged, ...standalone].sort((a, b) => {
      const idA = a.kind === "MERGED" ? -(a.groupId ?? 0) : (a.diffId ?? 0);
      const idB = b.kind === "MERGED" ? -(b.groupId ?? 0) : (b.diffId ?? 0);
      return idB - idA;
    });
  });

  const stats = computed<MergeViewStats>(() => {
    const rows = entries.value;
    const counts = new Map<string, number>();
    for (const entry of rows) counts.set(entry.riskLevel, (counts.get(entry.riskLevel) ?? 0) + 1);
    return {
      total: rows.length,
      merged: rows.filter((entry) => entry.kind === "MERGED").length,
      openTodos: rows.reduce((sum, entry) => sum + entry.openNoteCount, 0),
      archivedDiffCount: archivedDiffIdSet.value.size,
      draftCount: draftGroups.value.length,
      riskBreakdown: RISK_ORDER.filter((risk) => risk && counts.has(risk)).map((risk) => ({
        risk,
        count: counts.get(risk) ?? 0
      }))
    };
  });

  /** 并档：已确认与已拆回归并组都可查；其中旧项只读，不能继续编辑 */
  const archiveGroups = computed(() =>
    groups.value
      .filter((group) => group.status === "CONFIRMED" || group.status === "SPLIT")
      .map((group) => ({
        group,
        members: group.member_diff_ids
          .map((id) => diffs.value.find((diff) => diff.id === id))
          .filter((diff): diff is DiffResult => Boolean(diff))
          .map((diff) => ({
            id: diff.id,
            diffType: diff.diff_type,
            summary: diff.summary,
            riskLevel: sectionMap.value.get(diff.section_id)?.risk_level ?? ""
          })),
        audits: audits.value
          .filter((audit) => audit.group_id === group.id)
          .sort((a, b) => a.created_at.localeCompare(b.created_at)),
        readOnly: group.status === "CONFIRMED"
      }))
  );

  return {
    entries,
    stats,
    draftGroups,
    confirmedGroups,
    splitGroups,
    archivedDiffIdSet,
    archiveGroups,
    notesForGroup,
    sectionMap
  };
}
