import { defineStore } from "pinia";
import { listDiffMerge } from "../api/DiffMerge";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { DiffMerge } from "../types/DiffMerge";

export const useDiffMergeStore = defineStore("diffMerge", {
  state: () => ({ rows: [] as DiffMerge[], loading: false }),
  getters: {
    nextId: (state) => state.rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
  },
  actions: {
    async load() {
      this.loading = true;
      this.rows = await listDiffMerge();
      this.loading = false;
    },
    addDraft(draft: DiffMerge) {
      this.rows.push(draft);
      console.info(LOG_TEMPLATES.DiffMerge[0], draft.id);
    },
    markConfirmed(id: number, resultDiffId: number) {
      this.rows = this.rows.map((row) =>
        row.id === id
          ? { ...row, status: "CONFIRMED" as const, result_diff_id: resultDiffId, confirmed_at: new Date().toISOString() }
          : row
      );
    },
    markReverted(id: number) {
      this.rows = this.rows.map((row) => (row.id === id ? { ...row, status: "REVERTED" as const } : row));
    },
    removeDraft(id: number) {
      this.rows = this.rows.filter((row) => row.id !== id);
    }
  }
});
