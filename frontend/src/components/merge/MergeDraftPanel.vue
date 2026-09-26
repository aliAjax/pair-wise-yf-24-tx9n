<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DiffResult } from "../../types/DiffResult";
import type { DiffMergeGroup } from "../../types/DiffMerge";
import { DiffTypeText } from "../../constants/DiffType";
import { formatDate } from "../../utils/formatters";

const props = defineProps<{
  drafts: DiffMergeGroup[];
  diffs: DiffResult[];
  selectedDiffIds: number[];
}>();

const emit = defineEmits<{
  (event: "start", payload: { diffIds: number[]; summary: string }): void;
  (event: "confirm", groupId: number): void;
  (event: "discard", groupId: number): void;
  (event: "update-members", payload: { groupId: number; diffIds: number[] }): void;
}>();

const customSummary = ref("");
const editableMembers = ref<Record<number, number[]>>({});

watch(
  () => props.drafts,
  (drafts) => {
    for (const draft of drafts) {
      if (!editableMembers.value[draft.id]) editableMembers.value[draft.id] = [...draft.member_diff_ids];
    }
  },
  { immediate: true, deep: true }
);

const diffMap = computed(() => new Map(props.diffs.map((diff) => [diff.id, diff])));
const diffText = (id: number) => {
  const diff = diffMap.value.get(id);
  if (!diff) return `#${id}`;
  const type = DiffTypeText[diff.diff_type as keyof typeof DiffTypeText] ?? diff.diff_type;
  return `#${id} ${type} · ${diff.summary}`;
};

const selectableDiffs = computed(() =>
  props.diffs.filter((diff) => {
    const inAnyDraft = props.drafts.some((draft) => draft.member_diff_ids.includes(diff.id));
    return !inAnyDraft;
  })
);

const draftCandidates = (draft: DiffMergeGroup): DiffResult[] => {
  const memberSet = new Set(draft.member_diff_ids);
  return [
    ...draft.member_diff_ids.map((id) => diffMap.value.get(id)).filter((d): d is DiffResult => Boolean(d)),
    ...selectableDiffs.value.filter((diff) => !memberSet.has(diff.id))
  ];
};

const isDraftMember = (groupId: number, diffId: number) =>
  (editableMembers.value[groupId] ?? []).includes(diffId);

const toggleDraftMember = (groupId: number, diffId: number) => {
  const current = editableMembers.value[groupId] ?? [];
  editableMembers.value[groupId] = current.includes(diffId)
    ? current.filter((id) => id !== diffId)
    : [...current, diffId];
};

const start = () => {
  if (props.selectedDiffIds.length < 2) return;
  emit("start", { diffIds: [...props.selectedDiffIds], summary: customSummary.value.trim() });
  customSummary.value = "";
};
</script>

<template>
  <section class="panel draft-panel">
    <h2>人工归并草稿</h2>
    <p class="muted">把“删除一条 + 新增一条”等实为同一业务条款的差异合到一起。草稿确认前不影响详情与待办统计。</p>

    <div class="start-box">
      <div class="start-head">
        <strong>新建归并</strong>
        <span :class="['pick-count', { ready: selectedDiffIds.length >= 2 }]">已选 {{ selectedDiffIds.length }} 项（至少 2 项）</span>
      </div>
      <ul v-if="selectedDiffIds.length" class="pick-list">
        <li v-for="id in selectedDiffIds" :key="id">{{ diffText(id) }}</li>
      </ul>
      <input v-model="customSummary" placeholder="归并说明（可选，默认自动汇总）" />
      <button class="primary" :disabled="selectedDiffIds.length < 2" @click="start">生成归并草稿</button>
    </div>

    <div v-if="drafts.length" class="draft-list">
      <article v-for="draft in drafts" :key="draft.id" class="draft-item">
        <header>
          <strong>草稿 #{{ draft.id }}</strong>
          <span class="muted">{{ draft.created_by }} · {{ formatDate(draft.created_at) }}</span>
        </header>
        <p class="draft-summary">{{ draft.summary }}</p>
        <div class="draft-members">
          <label v-for="diff in draftCandidates(draft)" :key="`cand-${draft.id}-${diff.id}`" class="member-check">
            <input
              type="checkbox"
              :checked="isDraftMember(draft.id, diff.id)"
              @change="toggleDraftMember(draft.id, diff.id)"
            />
            <span :class="{ 'muted-check': !isDraftMember(draft.id, diff.id) }">
              {{ isDraftMember(draft.id, diff.id) ? "" : "追加：" }}{{ diffText(diff.id) }}
            </span>
          </label>
        </div>
        <footer class="draft-actions">
          <button
            class="primary"
            :disabled="(editableMembers[draft.id] ?? []).length < 2"
            @click="emit('confirm', draft.id)"
          >确认归并</button>
          <button
            class="ghost"
            :disabled="
              (editableMembers[draft.id] ?? []).join(',') === draft.member_diff_ids.join(',') ||
              (editableMembers[draft.id] ?? []).length < 2
            "
            @click="emit('update-members', { groupId: draft.id, diffIds: editableMembers[draft.id] })"
          >保存成员调整</button>
          <button class="ghost danger" @click="emit('discard', draft.id)">废弃草稿</button>
        </footer>
        <p class="confirm-hint">确认后：风险取原项最高值，处理记录转入新项，旧项进入并档只读。</p>
      </article>
    </div>
    <p v-else class="muted">暂无草稿。在结果列表勾选差异后即可生成。</p>
  </section>
</template>
