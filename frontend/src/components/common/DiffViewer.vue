<script setup lang="ts">
import { computed } from "vue";
import { DiffTypeText } from "../../constants/DiffType";
import type { PolicySection } from "../../types/PolicySection";

const props = defineProps<{
  diffType: string;
  oldSection?: PolicySection;
  newSection?: PolicySection;
  merged?: boolean;
}>();

const typeText = computed(() => (props.merged ? "人工归并" : DiffTypeText[props.diffType as keyof typeof DiffTypeText] ?? props.diffType));
const sideClass = (side: "old" | "new") =>
  `diff-side ${side} ${side === "old" ? (props.oldSection ? "" : "missing") : props.newSection ? "" : "missing"}`;
</script>

<template>
  <div class="diff-viewer" :class="{ merged }">
    <div class="diff-type-row"><span class="diff-type">{{ typeText }}</span><slot name="type-extra" /></div>
    <div class="diff-grid">
      <div :class="sideClass('old')">
        <header><span class="side-tag">旧版</span><em v-if="oldSection">第 {{ oldSection.section_no }} 条 · {{ oldSection.heading }}</em></header>
        <p v-if="oldSection">{{ oldSection.content }}</p>
        <p v-else class="placeholder">无对应条款</p>
      </div>
      <div :class="sideClass('new')">
        <header><span class="side-tag">新版</span><em v-if="newSection">第 {{ newSection.section_no }} 条 · {{ newSection.heading }}</em></header>
        <p v-if="newSection">{{ newSection.content }}</p>
        <p v-else class="placeholder">无对应条款</p>
      </div>
    </div>
  </div>
</template>
