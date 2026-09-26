<script setup lang="ts">
import { computed } from "vue";
import { formatRisk } from "../../utils/formatters";

const props = defineProps<{ level: string }>();

const className = computed(() => `risk risk-${props.level?.toLowerCase() ?? "low"}`);
</script>

<template>
  <span :class="className">{{ formatRisk(level) }}风险</span>
</template>
