<script setup lang="ts">
import { onMounted } from "vue";
import { useDiffResultStore } from "../stores/DiffResultStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import { useDiffMergeStore } from "../stores/DiffMergeStore";
import { useDiffMerge } from "../hooks/useDiffMerge";
import { DiffTypeZh } from "../constants/DiffType";
import { ReviewStatusZh } from "../constants/ReviewStatus";
import RiskTag from "../components/common/RiskTag.vue";
import StatCard from "../components/common/StatCard.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import EmptyState from "../components/common/EmptyState.vue";

const diffStore = useDiffResultStore();
const noteStore = useReviewNoteStore();
const mergeStore = useDiffMergeStore();
const { items, todoTotal } = useDiffMerge();

onMounted(async () => {
  await Promise.all([diffStore.load(), noteStore.load(), mergeStore.load()]);
});

const typeText = (value: string) => (DiffTypeZh as Record<string, string>)[value] ?? value;
const statusText = (value: string) => (ReviewStatusZh as Record<string, string>)[value] ?? value;
</script>

<template>
  <section class="stack">
    <div class="metrics">
      <StatCard label="待办备注" :value="todoTotal" />
      <StatCard label="有效差异（按归并显示）" :value="items.length" />
      <StatCard label="处理记录总数" :value="noteStore.rows.length" />
    </div>

    <EmptyState v-if="!items.length" />
    <div v-for="item in items" :key="item.row.id" class="panel">
      <h2>
        <span class="badge">{{ typeText(item.row.diff_type) }}</span>
        #{{ item.row.id }} {{ item.row.summary }}
        <RiskTag :value="item.row.risk_level" />
        <span v-if="item.row.origin === 'MERGED'" class="badge merged">人工归并</span>
      </h2>
      <p class="muted">待办 {{ item.todoCount }} 条 · 共 {{ item.notes.length }} 条处理记录</p>
      <EmptyState v-if="!item.notes.length" />
      <article v-for="note in item.notes" :key="note.id" class="row">
        <strong>{{ note.tag }}</strong>
        <span>{{ note.comment }} — {{ note.reviewer }}</span>
        <StatusBadge :value="statusText(note.status)" />
      </article>
    </div>
  </section>
</template>
