<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useDiffResultStore } from "../stores/DiffResultStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import { useDiffMergeStore } from "../stores/DiffMergeStore";
import { useDiffMerge } from "../hooks/useDiffMerge";
import { DiffTypeZh } from "../constants/DiffType";
import { maxRiskLevel } from "../utils/formatters";
import MergePanel from "../components/common/MergePanel.vue";
import RiskTag from "../components/common/RiskTag.vue";
import StatCard from "../components/common/StatCard.vue";
import EmptyState from "../components/common/EmptyState.vue";
import type { DiffResult } from "../types/DiffResult";

const diffStore = useDiffResultStore();
const noteStore = useReviewNoteStore();
const mergeStore = useDiffMergeStore();
const { items, todoTotal, drafts, confirmedMerges, createDraft, confirmDraft, discardDraft, splitMerge } = useDiffMerge();

const selected = ref<number[]>([]);
const expanded = ref<number[]>([]);
const draftNote = ref("");
const error = ref("");

onMounted(async () => {
  await Promise.all([diffStore.load(), noteStore.load(), mergeStore.load()]);
});

const run = (fn: () => void) => {
  try {
    error.value = "";
    fn();
  } catch (e) {
    error.value = (e as Error).message;
  }
};

const selectable = (row: DiffResult) => row.origin === "AUTO";
const toggleSelect = (id: number) => {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((value) => value !== id)
    : [...selected.value, id];
};
const toggleExpand = (id: number) => {
  expanded.value = expanded.value.includes(id)
    ? expanded.value.filter((value) => value !== id)
    : [...expanded.value, id];
};

const makeDraft = () =>
  run(() => {
    createDraft(selected.value, draftNote.value.trim());
    selected.value = [];
    draftNote.value = "";
  });
const confirm = (id: number) => run(() => confirmDraft(id));
const discard = (id: number) => run(() => discardDraft(id));
const split = (id: number) => {
  if (window.confirm("确定将该归并项拆回原始差异？处理记录将随原项恢复。")) {
    run(() => splitMerge(id));
  }
};

const typeText = (value: string) => (DiffTypeZh as Record<string, string>)[value] ?? value;
const rowsOf = (ids: number[]) => diffStore.rows.filter((row) => ids.includes(row.id));
const draftRisk = (ids: number[]) => maxRiskLevel(rowsOf(ids).map((row) => row.risk_level));
const draftNoteCount = (ids: number[]) => noteStore.rows.filter((note) => ids.includes(note.diff_result_id)).length;
const archivedNoteCount = (row: DiffResult) =>
  noteStore.rows.filter((note) => [row.id, ...row.merged_from_ids].includes(note.diff_result_id)).length;
</script>

<template>
  <section class="stack">
    <div class="metrics">
      <StatCard label="有效差异（按归并显示）" :value="items.length" />
      <StatCard label="待办备注" :value="todoTotal" />
      <StatCard label="已确认归并" :value="confirmedMerges.length" />
      <StatCard label="并档条目" :value="diffStore.archivedRows.length" />
    </div>

    <p v-if="drafts.length" class="notice">有 {{ drafts.length }} 个归并草稿未确认，确认前不影响上方统计。</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="panel">
      <h2>差异结果</h2>
      <EmptyState v-if="!items.length" />
      <table v-else>
        <thead>
          <tr><th></th><th>类型</th><th>摘要</th><th>风险</th><th>处理记录</th><th>来源</th><th>操作</th></tr>
        </thead>
        <tbody>
          <template v-for="item in items" :key="item.row.id">
            <tr>
              <td>
                <input
                  v-if="selectable(item.row)"
                  type="checkbox"
                  :checked="selected.includes(item.row.id)"
                  @change="toggleSelect(item.row.id)"
                />
              </td>
              <td><span class="badge">{{ typeText(item.row.diff_type) }}</span></td>
              <td>{{ item.row.summary }}</td>
              <td><RiskTag :value="item.row.risk_level" /></td>
              <td>
                {{ item.notes.length }} 条
                <span v-if="item.todoCount" class="todo">（待办 {{ item.todoCount }}）</span>
              </td>
              <td>
                <span v-if="item.row.origin === 'MERGED'" class="badge merged">人工归并</span>
                <span v-else class="muted">自动对比</span>
              </td>
              <td class="actions">
                <template v-if="item.row.origin === 'MERGED'">
                  <button class="btn" @click="toggleExpand(item.row.id)">
                    {{ expanded.includes(item.row.id) ? "收起" : "查看来源" }}
                  </button>
                  <button class="btn danger" @click="split(item.row.id)">拆回</button>
                </template>
              </td>
            </tr>
            <tr v-if="item.row.origin === 'MERGED' && expanded.includes(item.row.id)" class="source-row">
              <td></td>
              <td colspan="6">
                原始差异（已入并档，只读）：
                <ul class="member-list">
                  <li v-for="source in rowsOf(item.row.merged_from_ids)" :key="source.id">
                    <span class="badge">{{ typeText(source.diff_type) }}</span>
                    #{{ source.id }} {{ source.summary }}
                    <RiskTag :value="source.risk_level" />
                  </li>
                </ul>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div class="actions selection-bar">
        <span class="muted">已选 {{ selected.length }} 项（归并至少 2 项）</span>
        <input v-model="draftNote" class="note-input" placeholder="归并备注（可选）" />
        <button class="btn primary" :disabled="selected.length < 2" @click="makeDraft">存为归并草稿</button>
      </div>
    </div>

    <MergePanel
      v-for="draft in drafts"
      :key="draft.id"
      :draft="draft"
      :members="rowsOf(draft.member_diff_ids)"
      :merged-risk="draftRisk(draft.member_diff_ids)"
      :note-count="draftNoteCount(draft.member_diff_ids)"
      @confirm="confirm"
      @discard="discard"
    />

    <div class="panel">
      <h2>并档（只读）</h2>
      <EmptyState v-if="!diffStore.archivedRows.length" />
      <table v-else>
        <thead>
          <tr><th>编号</th><th>类型</th><th>摘要</th><th>风险</th><th>处理记录</th><th>归档原因</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in diffStore.archivedRows" :key="row.id">
            <td>#{{ row.id }}</td>
            <td><span class="badge">{{ typeText(row.diff_type) }}</span></td>
            <td>{{ row.summary }}</td>
            <td><RiskTag :value="row.risk_level" /></td>
            <td>{{ archivedNoteCount(row) }} 条</td>
            <td>
              <span v-if="row.origin === 'MERGED'" class="badge">已拆回 · 只读</span>
              <span v-else class="badge">已归并入 #{{ row.merged_into_id }} · 只读</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
