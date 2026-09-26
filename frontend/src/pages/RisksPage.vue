<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { usePolicySectionStore } from "../stores/PolicySectionStore";
import { useReviewNoteStore } from "../stores/ReviewNoteStore";
import { useDiffResultStore } from "../stores/DiffResultStore";
import RiskTag from "../components/common/RiskTag.vue";
import EmptyState from "../components/common/EmptyState.vue";
import { PrivacyRiskLevel, PrivacyRiskLevelText } from "../constants/PrivacyRiskLevel";
import type { PolicySection } from "../types/PolicySection";

const sectionStore = usePolicySectionStore();
const noteStore = useReviewNoteStore();
const diffStore = useDiffResultStore();
const { rows: sections } = storeToRefs(sectionStore);
const { rows: notes } = storeToRefs(noteStore);
const { rows: diffs } = storeToRefs(diffStore);

onMounted(() => {
  sectionStore.load();
  noteStore.load();
  diffStore.load();
});

const activeRisk = ref("ALL");
const riskOptions = ["ALL", ...PrivacyRiskLevel];

/** 备注经 diff_result 关联到条款；归并确认后 moved_to_merge_id 非空的记录已转到新项 */
const openNoteCountForSection = (section: PolicySection) => {
  const diffIdsOnSection = new Set(
    diffs.value.filter((diff) => diff.section_id === section.id).map((diff) => diff.id)
  );
  return notes.value.filter(
    (note) =>
      diffIdsOnSection.has(note.diff_result_id) &&
      note.status === "OPEN" &&
      note.moved_to_merge_id === null
  ).length;
};

const grouped = computed(() =>
  PrivacyRiskLevel.map((risk) => ({
    risk,
    label: PrivacyRiskLevelText[risk],
    sections: sections.value
      .filter((section) => section.risk_level === risk)
      .filter((section) => activeRisk.value === "ALL" || activeRisk.value === risk)
  })).filter((group) => group.sections.length)
);
</script>

<template>
  <section class="risks-page">
    <section class="panel">
      <div class="filter-bar">
        <button
          v-for="risk in riskOptions"
          :key="risk"
          :class="{ active: activeRisk === risk }"
          @click="activeRisk = risk"
        >
          {{ risk === "ALL" ? "全部风险" : (PrivacyRiskLevelText[risk as keyof typeof PrivacyRiskLevelText] ?? risk) }}
        </button>
      </div>
      <p class="muted">已归并条款的处理记录转到新归并项后，不再在旧条款上重复计数。</p>
    </section>

    <div v-if="!sections.length"><EmptyState /></div>
    <section v-for="group in grouped" :key="group.risk" class="panel risk-group">
      <header class="risk-group-head">
        <RiskTag :level="group.risk" />
        <span class="muted">{{ group.sections.length }} 条条款</span>
      </header>
      <article v-for="section in group.sections" :key="section.id" class="risk-item">
        <div>
          <strong>第 {{ section.section_no }} 条 · {{ section.heading }}</strong>
          <p class="muted">{{ section.content }}</p>
        </div>
        <div class="risk-item-meta">
          <span>分类：{{ section.category }}</span>
          <span v-if="openNoteCountForSection(section)" class="todo-count">待办 {{ openNoteCountForSection(section) }}</span>
        </div>
      </article>
    </section>
  </section>
</template>
