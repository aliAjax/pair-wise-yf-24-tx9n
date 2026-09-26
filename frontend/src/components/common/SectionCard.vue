<script setup lang="ts">
import type { PolicySection } from "../../types/PolicySection";
import RiskTag from "./RiskTag.vue";

defineProps<{ section?: PolicySection }>();
</script>

<template>
  <article class="section-card" v-if="section">
    <header><strong>第 {{ section.section_no }} 条 · {{ section.heading }}</strong><RiskTag :level="section.risk_level" /></header>
    <p>{{ section.content }}</p>
    <footer>分类：{{ section.category }}</footer>
  </article>
</template>
