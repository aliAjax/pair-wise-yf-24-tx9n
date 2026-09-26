<script setup lang="ts">
import type { MergeViewEntry } from "../../hooks/useMergeView";
import DiffViewer from "../common/DiffViewer.vue";
import RiskTag from "../common/RiskTag.vue";
import ReviewChecklist from "../common/ReviewChecklist.vue";
import StatusBadge from "../common/StatusBadge.vue";
import { DiffTypeText } from "../../constants/DiffType";

const props = defineProps<{
  entry: MergeViewEntry;
  selected: boolean;
  selectDisabled: boolean;
}>();

const emit = defineEmits<{
  (event: "toggle", entry: MergeViewEntry): void;
  (event: "split", entry: MergeViewEntry): void;
  (event: "add-note", payload: { entry: MergeViewEntry; tag: string; comment: string }): void;
}>();

const diffTypeText = (type: string) =>
  DiffTypeText[type as keyof typeof DiffTypeText] ?? type;
</script>

<template>
  <article class="entry-card" :class="{ merged: entry.kind === 'MERGED', selected }">
    <header class="entry-head">
      <label class="entry-select" v-if="entry.kind === 'DIFF'">
        <input
          type="checkbox"
          :checked="selected"
          :disabled="selectDisabled || Boolean(entry.inDraftGroupId)"
          @change="emit('toggle', entry)"
        />
      </label>
      <div class="entry-title">
        <div class="title-line">
          <StatusBadge v-if="entry.kind === 'MERGED'" value="已归并" />
          <StatusBadge v-else :value="diffTypeText(entry.diffType)" />
          <RiskTag :level="entry.riskLevel" />
          <span v-if="entry.inDraftGroupId" class="draft-flag">归并草稿 #{{ entry.inDraftGroupId }} 中，确认前仍按原差异统计</span>
        </div>
        <p class="summary">{{ entry.summary }}</p>
        <p class="member-line" v-if="entry.kind === 'MERGED'">
          由原差异
          <span v-for="id in entry.memberDiffIds" :key="id" class="member-chip">#{{ id }}</span>
          合成，风险取原项最高值
        </p>
      </div>
      <div class="entry-actions">
        <button
          v-if="entry.kind === 'MERGED'"
          class="ghost danger"
          @click="emit('split', entry)"
          title="误合时拆回原来的差异，处理记录同步转回"
        >拆回原差异</button>
      </div>
    </header>
    <DiffViewer
      :diff-type="entry.diffType"
      :old-section="entry.oldSection"
      :new-section="entry.newSection"
      :merged="entry.kind === 'MERGED'"
    />
    <ReviewChecklist
      :notes="entry.notes"
      :editable="entry.editable"
      readonly-hint="该差异已在并档中归档只读，请在归并新项上继续处理。"
      @add="(payload) => emit('add-note', { entry, ...payload })"
    />
  </article>
</template>
