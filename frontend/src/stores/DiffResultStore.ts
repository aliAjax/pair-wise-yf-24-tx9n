import { defineStore } from "pinia";
import { listDiffResult } from "../api/DiffResult";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { DiffResult } from "../types/DiffResult";

export const useDiffResultStore = defineStore("diffResult", {
  state: () => ({ rows: [] as DiffResult[], loading: false }),
  getters: {
    activeRows: (state) => state.rows.filter((row) => row.merge_state === "ACTIVE"),
    archivedRows: (state) => state.rows.filter((row) => row.merge_state === "ARCHIVED"),
    nextId: (state) => state.rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
  },
  actions: {
    async load() {
      this.loading = true;
      this.rows = await listDiffResult();
      this.loading = false;
    },
    addRow(row: DiffResult) {
      this.rows.push(row);
      console.info(LOG_TEMPLATES.DiffResult[0], row.id);
    },
    archiveSources(ids: number[], intoId: number) {
      this.rows = this.rows.map((row) =>
        ids.includes(row.id) ? { ...row, merge_state: "ARCHIVED" as const, merged_into_id: intoId } : row
      );
      console.info(LOG_TEMPLATES.DiffResult[2], ids.join(","));
    },
    restoreSources(ids: number[]) {
      this.rows = this.rows.map((row) =>
        ids.includes(row.id) ? { ...row, merge_state: "ACTIVE" as const, merged_into_id: null } : row
      );
      console.info(LOG_TEMPLATES.DiffResult[2], ids.join(","));
    },
    archiveMerged(id: number) {
      this.rows = this.rows.map((row) =>
        row.id === id ? { ...row, merge_state: "ARCHIVED" as const } : row
      );
      console.info(LOG_TEMPLATES.DiffResult[2], String(id));
    }
  }
});
