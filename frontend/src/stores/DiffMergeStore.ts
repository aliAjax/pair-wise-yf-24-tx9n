import { defineStore } from "pinia";
import {
  listDiffMergeGroup,
  listMergeAuditLog,
  saveDiffMergeGroup,
  saveMergeAuditLog
} from "../api/DiffMerge";
import {
  listCreatedReviewNote,
  listReviewNote,
  listReviewNoteOverride,
  saveCreatedReviewNote,
  saveReviewNoteOverride
} from "../api/ReviewNote";
import { listDiffResult } from "../api/DiffResult";
import { ReviewStatus } from "../constants/ReviewStatus";
import { listPolicySection } from "../api/PolicySection";
import type { DiffResult } from "../types/DiffResult";
import type { DiffMergeGroup, MergeAuditLog } from "../types/DiffMerge";
import type { PolicySection } from "../types/PolicySection";
import type { ReviewNote } from "../types/ReviewNote";
import {
  confirmMerge,
  discardMergeDraft,
  redraftFromSplit,
  splitMerge,
  startMergeDraft,
  updateMergeDraft,
  type MergeState,
  type ReviewNoteOverride
} from "../services/mergeService";
import { MergeServiceError } from "../services/MergeServiceError";

interface DiffMergeStoreState extends MergeState {
  diffs: DiffResult[];
  sections: PolicySection[];
  notes: ReviewNote[];
  createdNotes: ReviewNote[];
  loading: boolean;
  errorCode: string | null;
  errorMessage: string;
}

/** controller：编排 API 持久化与 service 领域逻辑；service 异常在此二次包装为 store 错误态 */
export const useDiffMergeStore = defineStore("diffMerge", {
  state: (): DiffMergeStoreState => ({
    groups: [],
    audits: [],
    overrides: [],
    diffs: [],
    sections: [],
    notes: [],
    createdNotes: [],
    loading: false,
    errorCode: null,
    errorMessage: ""
  }),
  actions: {
    async load() {
      this.loading = true;
      try {
        const [groups, audits, overrides, diffs, sections, createdNotes] = await Promise.all([
          listDiffMergeGroup(),
          listMergeAuditLog(),
          listReviewNoteOverride(),
          listDiffResult(),
          listPolicySection(),
          listCreatedReviewNote()
        ]);
        this.groups = groups;
        this.audits = audits;
        this.overrides = overrides;
        this.diffs = diffs;
        this.sections = sections;
        this.createdNotes = createdNotes;
        this.notes = await listReviewNote();
      } finally {
        this.loading = false;
      }
    },
    clearError() {
      this.errorCode = null;
      this.errorMessage = "";
    },
    async persist(next: MergeState) {
      const [groups, audits, overrides, notes] = await Promise.all([
        saveDiffMergeGroup(next.groups),
        saveMergeAuditLog(next.audits),
        saveReviewNoteOverride(next.overrides),
        listReviewNote()
      ]);
      this.groups = groups;
      this.audits = audits;
      this.overrides = overrides;
      this.notes = notes;
    },
    /** 处理记录只能写在可编辑对象上：归并后的新项或独立差异；归档旧项只读 */
    async addNote(params: { target: { kind: "diff"; id: number } | { kind: "merge"; id: number }; tag: string; comment: string; reviewer: string }) {
      const note: ReviewNote = {
        id: Math.max(0, ...this.notes.map((row) => row.id)) + 1,
        diff_result_id: params.target.kind === "diff" ? params.target.id : 0,
        tag: params.tag || "待评估",
        comment: params.comment,
        reviewer: params.reviewer || "法务",
        status: ReviewStatus[0],
        moved_to_merge_id: params.target.kind === "merge" ? params.target.id : null,
        created_at: new Date().toISOString()
      };
      this.createdNotes = await saveCreatedReviewNote([...this.createdNotes, note]);
      this.notes = await listReviewNote();
    },
    async run(action: () => MergeState) {
      this.clearError();
      try {
        await this.persist(action());
      } catch (error) {
        // 禁止在全局位置吞掉异常：controller 层包装后交给页面展示
        if (error instanceof MergeServiceError) {
          this.errorCode = error.code;
          this.errorMessage = error.message;
        } else {
          this.errorCode = "MERGE_UNEXPECTED";
          this.errorMessage = error instanceof Error ? error.message : "归并操作失败，请重试";
        }
        throw error;
      }
    },
    startDraft(diffIds: number[], operator: string, summary?: string) {
      return this.run(() =>
        startMergeDraft(this.snapshot(), { diffIds, operator, diffs: this.diffs, sections: this.sections, summary })
      );
    },
    updateDraft(groupId: number, diffIds: number[], operator: string, summary?: string) {
      return this.run(() =>
        updateMergeDraft(this.snapshot(), {
          groupId,
          diffIds,
          operator,
          diffs: this.diffs,
          summary
        })
      );
    },
    discardDraft(groupId: number, operator: string) {
      return this.run(() => discardMergeDraft(this.snapshot(), { groupId, operator }));
    },
    confirm(groupId: number, operator: string) {
      return this.run(() =>
        confirmMerge(this.snapshot(), {
          groupId,
          operator,
          diffs: this.diffs,
          sections: this.sections,
          notes: this.notes
        })
      );
    },
    split(groupId: number, operator: string) {
      return this.run(() => splitMerge(this.snapshot(), { groupId, operator, notes: this.notes }));
    },
    redraft(groupId: number, operator: string, diffIds: number[]) {
      return this.run(() =>
        redraftFromSplit(this.snapshot(), { groupId, operator, diffIds, diffs: this.diffs, sections: this.sections })
      );
    },
    snapshot(): MergeState {
      return { groups: this.groups, audits: this.audits, overrides: this.overrides };
    }
  }
});
