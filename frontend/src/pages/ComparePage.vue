<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useDiffMergeStore } from "../stores/DiffMergeStore";
import { useMergeView, type MergeViewEntry } from "../hooks/useMergeView";
import { DiffType } from "../constants/DiffType";
import { DiffTypeText } from "../constants/DiffType";
import MergeEntryCard from "../components/merge/MergeEntryCard.vue";
import MergeDraftPanel from "../components/merge/MergeDraftPanel.vue";
import MergeArchivePanel from "../components/merge/MergeArchivePanel.vue";
import StatCard from "../components/common/StatCard.vue";
import EmptyState from "../components/common/EmptyState.vue";

const store = useDiffMergeStore();
const { groups, diffs, sections, notes, audits, loading, errorMessage } = storeToRefs(store);

const { entries, stats, draftGroups, archiveGroups } = useMergeView({
  diffs,
  sections,
  notes,
  groups,
  audits
});

const operator = ref("法务-王敏");
const selectedIds = ref<number[]>([]);
const typeFilter = ref("ALL");
const quickFilter = ref("ALL");
const keyword = ref("");

onMounted(() => {
  store.load();
});

const toggleSelect = (entry: MergeViewEntry) => {
  if (entry.kind !== "DIFF" || entry.inDraftGroupId) return;
  const id = entry.diffId!;
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id];
};

const filteredEntries = computed(() =>
  entries.value.filter((entry) => {
    if (typeFilter.value !== "ALL") {
      if (entry.kind === "MERGED") {
        if (typeFilter.value !== "MERGED") return false;
      } else if (entry.diffType !== typeFilter.value) {
        return false;
      }
    }
    if (quickFilter.value === "MERGED" && entry.kind !== "MERGED") return false;
    if (quickFilter.value === "OPEN" && entry.openNoteCount === 0) return false;
    if (quickFilter.value === "HIGH" && !["HIGH", "CRITICAL"].includes(entry.riskLevel)) return false;
    if (keyword.value.trim()) {
      const hit = entry.summary.includes(keyword.value.trim()) ||
        entry.diffs.some((diff) => String(diff.id).includes(keyword.value.trim()));
      if (!hit) return false;
    }
    return true;
  })
);

const filterOptions = [
  { value: "ALL", label: "全部类型" },
  { value: "MERGED", label: "人工归并" },
  ...DiffType.map((value) => ({ value, label: DiffTypeText[value] }))
];

const guard = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch {
    // 错误已在 store(controller) 包装为 errorMessage，这里无需再处理
  }
};

const onStart = async (payload: { diffIds: number[]; summary: string }) => {
  await guard(() => store.startDraft(payload.diffIds, operator.value, payload.summary));
  selectedIds.value = [];
};

const onConfirm = async (groupId: number) => {
  if (!window.confirm(`确认归并 #${groupId}？确认后风险取原项最高值，处理记录转入新项，旧项进入并档只读。`)) return;
  await guard(() => store.confirm(groupId, operator.value));
};

const onDiscard = async (groupId: number) => {
  if (!window.confirm(`废弃草稿 #${groupId}？草稿未确认，废弃不会改变任何统计。`)) return;
  await guard(() => store.discardDraft(groupId, operator.value));
};

const onUpdateMembers = async (payload: { groupId: number; diffIds: number[] }) => {
  await guard(() => store.updateDraft(payload.groupId, payload.diffIds, operator.value));
};

const onSplit = async (entry: MergeViewEntry) => {
  if (!window.confirm(`把归并 #${entry.groupId} 拆回原来的 ${entry.memberDiffIds.length} 项差异？处理记录会转回原项。`)) return;
  await guard(() => store.split(entry.groupId!, operator.value));
};

const onRedraft = async (groupId: number) => {
  await guard(() => store.redraft(groupId, operator.value, []));
};

const onAddNote = async (payload: { entry: MergeViewEntry; tag: string; comment: string }) => {
  const { entry, tag, comment } = payload;
  await guard(() =>
    store.addNote(
      entry.kind === "MERGED"
        ? { target: { kind: "merge", id: entry.groupId! }, tag, comment, reviewer: operator.value }
        : { target: { kind: "diff", id: entry.diffId! }, tag, comment, reviewer: operator.value }
    )
  );
};
</script>

<template>
  <section class="compare-page">
    <div v-if="errorMessage" class="error-banner" @click="store.clearError()">
      ⚠ {{ errorMessage }}（点击关闭）
    </div>

    <section class="metrics merge-metrics">
      <StatCard label="差异/归并项总数（按新归并）" :value="stats.total" />
      <StatCard label="已归并条款" :value="stats.merged" />
      <StatCard label="待办处理记录" :value="stats.openTodos" />
      <StatCard label="并档只读旧差异" :value="stats.archivedDiffCount" />
      <StatCard label="未确认草稿（不计入统计）" :value="stats.draftCount" />
    </section>

    <p class="rule-hint">
      统计口径：人工调整经「确认归并」后才按新归并显示；未确认草稿不影响详情与待办数量；已拆回的差异恢复为独立项。
    </p>

    <div class="compare-layout">
      <div class="result-column">
        <section class="panel">
          <div class="filter-bar">
            <select v-model="typeFilter" aria-label="差异类型过滤">
              <option v-for="option in filterOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <div class="quick-filters">
              <button :class="{ active: quickFilter === 'ALL' }" @click="quickFilter = 'ALL'">全部</button>
              <button :class="{ active: quickFilter === 'MERGED' }" @click="quickFilter = 'MERGED'">已归并</button>
              <button :class="{ active: quickFilter === 'OPEN' }" @click="quickFilter = 'OPEN'">有待办</button>
              <button :class="{ active: quickFilter === 'HIGH' }" @click="quickFilter = 'HIGH'">高风险</button>
            </div>
            <input v-model="keyword" class="search" placeholder="搜索差异编号或说明" />
            <label class="operator-box">
              当前法务
              <input v-model="operator" />
            </label>
          </div>
          <p class="select-hint" v-if="selectedIds.length">
            已勾选 {{ selectedIds.length }} 项，可在右侧「人工归并草稿」面板合为同一业务条款。
          </p>
          <div v-if="loading" class="muted">加载中…</div>
          <div v-else-if="filteredEntries.length" class="entry-list">
            <MergeEntryCard
              v-for="entry in filteredEntries"
              :key="entry.key"
              :entry="entry"
              :selected="entry.kind === 'DIFF' && selectedIds.includes(entry.diffId!)"
              :select-disabled="false"
              @toggle="toggleSelect"
              @split="onSplit"
              @add-note="onAddNote"
            />
          </div>
          <EmptyState v-else />
        </section>

        <MergeArchivePanel :groups="archiveGroups" @redraft="onRedraft" />
      </div>

      <aside class="side-column">
        <MergeDraftPanel
          :drafts="draftGroups"
          :diffs="diffs"
          :selected-diff-ids="selectedIds"
          @start="onStart"
          @confirm="onConfirm"
          @discard="onDiscard"
          @update-members="onUpdateMembers"
        />
        <section class="panel risk-panel">
          <h2>风险分布（新归并口径）</h2>
          <div v-for="item in stats.riskBreakdown" :key="item.risk" class="risk-row">
            <span>{{ { CRITICAL: '严重', HIGH: '高', MEDIUM: '中', LOW: '低' }[item.risk] }}</span>
            <div class="risk-bar"><i :style="{ width: `${(item.count / stats.total) * 100}%` }" :class="`bar-${item.risk.toLowerCase()}`" /></div>
            <strong>{{ item.count }}</strong>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>
