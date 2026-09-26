<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useDiffMergeStore } from "../stores/DiffMergeStore";
import { useMergeView } from "../hooks/useMergeView";
import StatCard from "../components/common/StatCard.vue";
import RiskTag from "../components/common/RiskTag.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import ReviewChecklist from "../components/common/ReviewChecklist.vue";
import { ReviewStatusText } from "../constants/ReviewStatus";
import { formatDate } from "../utils/formatters";

const store = useDiffMergeStore();
const { groups, diffs, sections, notes, audits, loading } = storeToRefs(store);
const { entries, stats } = useMergeView({ diffs, sections, notes, groups, audits });

const onlyOpen = ref(true);
const operator = ref("法务-王敏");

onMounted(() => {
  store.load();
});

const todoEntries = computed(() =>
  entries.value
    .filter((entry) => (onlyOpen.value ? entry.openNoteCount > 0 : true))
    .sort((a, b) => b.openNoteCount - a.openNoteCount)
);

const statusText = (status: string) =>
  ReviewStatusText[status as keyof typeof ReviewStatusText] ?? status;

const titleOf = (entry: (typeof entries.value)[number]) =>
  entry.kind === "MERGED" ? `归并项 #${entry.groupId}` : `差异 #${entry.diffId}`;

const guard = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch {
    // controller 已包装错误信息
  }
};

const onAddNote = async (
  entry: (typeof entries.value)[number],
  payload: { tag: string; comment: string }
) => {
  await guard(() =>
    store.addNote(
      entry.kind === "MERGED"
        ? { target: { kind: "merge", id: entry.groupId! }, ...payload, reviewer: operator.value }
        : { target: { kind: "diff", id: entry.diffId! }, ...payload, reviewer: operator.value }
    )
  );
};

const exportMarkdown = () => {
  const lines: string[] = ["# 审阅清单摘要（按人工归并口径）", ""];
  lines.push(`- 差异/归并项总数：${stats.value.total}`);
  lines.push(`- 已归并条款：${stats.value.merged}`);
  lines.push(`- 待办处理记录：${stats.value.openTodos}`);
  lines.push(`- 并档只读旧差异：${stats.value.archivedDiffCount}`);
  lines.push(`- 未确认草稿（不计入统计）：${stats.value.draftCount}`);
  lines.push("");
  for (const entry of entries.value) {
    lines.push(`## ${titleOf(entry)}｜${entry.kind === "MERGED" ? "人工归并" : entry.diffType}`);
    lines.push(`- 风险：${entry.riskLevel}`);
    lines.push(`- 说明：${entry.summary}`);
    if (entry.kind === "MERGED") lines.push(`- 原差异：${entry.memberDiffIds.map((id) => `#${id}`).join("、")}`);
    if (entry.notes.length === 0) {
      lines.push("- 处理记录：无");
    } else {
      lines.push("- 处理记录：");
      for (const note of entry.notes) {
        lines.push(
          `  - [${statusText(note.status)}] ${note.tag}｜${note.comment}（${note.reviewer}${
            note.created_at ? ` · ${formatDate(note.created_at)}` : ""
          }）`
        );
      }
    }
    lines.push("");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "review-summary.md";
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <section class="review-page">
    <section class="metrics merge-metrics">
      <StatCard label="差异/归并项总数" :value="stats.total" />
      <StatCard label="待办处理记录（新归并口径）" :value="stats.openTodos" />
      <StatCard label="已归并条款" :value="stats.merged" />
      <StatCard label="未确认草稿" :value="stats.draftCount" />
    </section>

    <section class="panel">
      <div class="filter-bar">
        <label class="switch-line">
          <input type="checkbox" v-model="onlyOpen" /> 只看有待办记录的项
        </label>
        <label class="operator-box">
          当前法务
          <input v-model="operator" />
        </label>
        <button class="primary" @click="exportMarkdown">导出 Markdown 摘要</button>
      </div>
      <p class="muted">归并确认后，原差异的处理记录统一挂到新归并项下；未确认草稿不产生待办，数量保持原差异口径。</p>
    </section>

    <div v-if="loading" class="muted">加载中…</div>
    <div v-else class="todo-list">
      <article v-for="entry in todoEntries" :key="entry.key" class="panel todo-card">
        <header class="todo-head">
          <div>
            <StatusBadge :value="entry.kind === 'MERGED' ? '已归并' : statusText(entry.diffType)" />
            <RiskTag :level="entry.riskLevel" />
            <span v-if="entry.openNoteCount" class="todo-count">待办 {{ entry.openNoteCount }}</span>
          </div>
          <strong>{{ titleOf(entry) }}</strong>
        </header>
        <p class="summary">{{ entry.summary }}</p>
        <p v-if="entry.kind === 'MERGED'" class="member-line">
          原差异 <span v-for="id in entry.memberDiffIds" :key="id" class="member-chip">#{{ id }}</span>
          已转并档只读，记录归并到本项。
        </p>
        <ReviewChecklist :notes="entry.notes" :editable="true" @add="(payload) => onAddNote(entry, payload)" />
      </article>
      <p v-if="!todoEntries.length" class="muted">没有待办记录。</p>
    </div>
  </section>
</template>
