import { computed } from "vue";
import { useDiffResultStore } from "../stores/DiffResultStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import { useDiffMergeStore } from "../stores/DiffMergeStore";
import { createDefaultDiffResult } from "../constructors/DiffResultConstructor";
import { createDiffMergeDraft } from "../constructors/DiffMergeConstructor";
import { maxRiskLevel } from "../utils/formatters";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { DiffResult } from "../types/DiffResult";
import type { ReviewNote } from "../types/ReviewNote";

export interface EffectiveDiffItem {
  row: DiffResult;
  notes: ReviewNote[];
  todoCount: number;
}

export function useDiffMerge() {
  const diffStore = useDiffResultStore();
  const noteStore = useReviewNoteStore();
  const mergeStore = useDiffMergeStore();

  // 处理记录归属解析：归并项承接其来源项的全部审阅备注，拆回后自动回到原项。
  const notesOf = (row: DiffResult): ReviewNote[] => {
    const ids = row.origin === "MERGED" ? [row.id, ...row.merged_from_ids] : [row.id];
    return noteStore.rows.filter((note) => ids.includes(note.diff_result_id));
  };

  // 有效视图：仅 ACTIVE 项参与详情展示与待办统计，草稿确认前不改变任何差异行。
  const items = computed<EffectiveDiffItem[]>(() =>
    diffStore.activeRows.map((row) => {
      const notes = notesOf(row);
      return { row, notes, todoCount: notes.filter((note) => note.status === "OPEN").length };
    })
  );

  const todoTotal = computed(() => items.value.reduce((sum, item) => sum + item.todoCount, 0));
  const drafts = computed(() => mergeStore.rows.filter((row) => row.status === "DRAFT"));
  const confirmedMerges = computed(() => mergeStore.rows.filter((row) => row.status === "CONFIRMED"));

  const assertMergeable = (ids: number[]): DiffResult[] => {
    const members = diffStore.rows.filter((row) => ids.includes(row.id));
    if (members.length < 2) throw new Error(ERROR_MESSAGES.MERGE_SELECTION_TOO_SMALL);
    if (members.some((member) => member.merge_state !== "ACTIVE" || member.origin !== "AUTO")) {
      throw new Error(ERROR_MESSAGES.MERGE_MEMBER_ARCHIVED);
    }
    return members;
  };

  const resolveMergedDiffType = (members: DiffResult[]): string =>
    members.every((member) => member.diff_type === members[0].diff_type) ? members[0].diff_type : "MODIFIED";

  function createDraft(memberIds: number[], note: string) {
    const members = assertMergeable(memberIds);
    const draft = createDiffMergeDraft(mergeStore.nextId, members.map((member) => member.id), note);
    mergeStore.addDraft(draft);
    return draft;
  }

  function confirmDraft(draftId: number) {
    const draft = mergeStore.rows.find((row) => row.id === draftId);
    if (!draft || draft.status !== "DRAFT") throw new Error(ERROR_MESSAGES.MERGE_DRAFT_NOT_FOUND);
    const members = assertMergeable(draft.member_diff_ids);
    const merged = createDefaultDiffResult({
      id: diffStore.nextId,
      old_document_id: members[0].old_document_id,
      new_document_id: members[0].new_document_id,
      section_id: members[0].section_id,
      diff_type: resolveMergedDiffType(members),
      summary: `人工归并（${members.length} 条）：${members.map((member) => member.summary).join("；")}`,
      risk_level: maxRiskLevel(members.map((member) => member.risk_level)),
      origin: "MERGED",
      merge_state: "ACTIVE",
      merged_into_id: null,
      merged_from_ids: members.map((member) => member.id),
      created_at: new Date().toISOString()
    });
    diffStore.addRow(merged);
    diffStore.archiveSources(members.map((member) => member.id), merged.id);
    mergeStore.markConfirmed(draft.id, merged.id);
    console.info(LOG_TEMPLATES.DiffMerge[1], merged.id);
    return merged;
  }

  function discardDraft(draftId: number) {
    const draft = mergeStore.rows.find((row) => row.id === draftId);
    if (!draft || draft.status !== "DRAFT") throw new Error(ERROR_MESSAGES.MERGE_DRAFT_NOT_FOUND);
    mergeStore.removeDraft(draftId);
    console.info(LOG_TEMPLATES.DiffMerge[3], draftId);
  }

  function splitMerge(mergedId: number) {
    const merged = diffStore.rows.find((row) => row.id === mergedId);
    if (!merged || merged.origin !== "MERGED" || merged.merge_state !== "ACTIVE") {
      throw new Error(ERROR_MESSAGES.MERGE_RESULT_NOT_FOUND);
    }
    diffStore.restoreSources(merged.merged_from_ids);
    diffStore.archiveMerged(merged.id);
    const record = mergeStore.rows.find((row) => row.result_diff_id === mergedId && row.status === "CONFIRMED");
    if (record) mergeStore.markReverted(record.id);
    console.info(LOG_TEMPLATES.DiffMerge[2], mergedId);
  }

  return { items, todoTotal, drafts, confirmedMerges, notesOf, createDraft, confirmDraft, discardDraft, splitMerge };
}
