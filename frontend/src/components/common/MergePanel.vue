<script setup lang="ts">
import RiskTag from "./RiskTag.vue";
import { DiffTypeZh } from "../../constants/DiffType";
import type { DiffMerge } from "../../types/DiffMerge";
import type { DiffResult } from "../../types/DiffResult";

defineProps<{ draft: DiffMerge; members: DiffResult[]; mergedRisk: string; noteCount: number }>();
const emit = defineEmits<{ confirm: [id: number]; discard: [id: number] }>();

const typeText = (value: string) => (DiffTypeZh as Record<string, string>)[value] ?? value;
</script>

<template>
  <div class="panel merge-panel">
    <h2>
      归并草稿 #{{ draft.id }}
      <span class="badge">草稿 · 未确认不计入统计</span>
    </h2>
    <p v-if="draft.note" class="muted">备注：{{ draft.note }}</p>
    <ul class="member-list">
      <li v-for="member in members" :key="member.id">
        <span class="badge">{{ typeText(member.diff_type) }}</span>
        #{{ member.id }} {{ member.summary }}
        <RiskTag :value="member.risk_level" />
      </li>
    </ul>
    <p class="merge-effect">
      确认后：风险取原项最高值 <RiskTag :value="mergedRisk" />，{{ noteCount }} 条处理记录转入新项，原条目移入并档且不可再编辑。
    </p>
    <div class="actions">
      <button class="btn primary" @click="emit('confirm', draft.id)">确认归并</button>
      <button class="btn" @click="emit('discard', draft.id)">废弃草稿</button>
    </div>
  </div>
</template>
