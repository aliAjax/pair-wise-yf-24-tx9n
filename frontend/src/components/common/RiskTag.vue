<script setup lang="ts">
import { computed } from "vue";
import { formatRisk } from "../../utils/formatters";

const props = defineProps<{ value: string }>();
const className = computed(() => `risk risk-${props.value.toLowerCase()}`);
</script>

<template>
  <span :class="className">{{ formatRisk(value) }}</span>
</template>
