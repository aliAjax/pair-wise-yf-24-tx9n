<script setup lang="ts">
import { computed, ref } from "vue";
import type { ReviewNote } from "../../types/ReviewNote";
import StatusBadge from "./StatusBadge.vue";
import { ReviewStatusText } from "../../constants/ReviewStatus";
import { formatDate } from "../../utils/formatters";

const props = defineProps<{
  notes: ReviewNote[];
  editable: boolean;
  readonlyHint?: string;
}>();

const emit = defineEmits<{ (event: "add", payload: { tag: string; comment: string }): void }>();

const tag = ref("待评估");
const comment = ref("");
const openCount = computed(() => props.notes.filter((note) => note.status === "OPEN").length);

const submit = () => {
  if (!comment.value.trim()) return;
  emit("add", { tag: tag.value || "待评估", comment: comment.value.trim() });
  comment.value = "";
};

const statusText = (status: string) =>
  ReviewStatusText[status as keyof typeof ReviewStatusText] ?? status;
</script>

<template>
  <div class="checklist">
    <header class="checklist-head">
      <strong>处理记录</strong>
      <span class="muted">共 {{ notes.length }} 条，待办 {{ openCount }} 条</span>
    </header>
    <p v-if="!editable && readonlyHint" class="readonly-hint">{{ readonlyHint }}</p>
    <ul v-if="notes.length">
      <li v-for="note in notes" :key="note.id" class="note">
        <div class="note-row"><span class="note-tag">{{ note.tag }}</span><StatusBadge :value="statusText(note.status)" /></div>
        <p>{{ note.comment }}</p>
        <footer>{{ note.reviewer }}<template v-if="note.created_at"> · {{ formatDate(note.created_at) }}</template></footer>
      </li>
    </ul>
    <p v-else class="muted">暂无处理记录</p>
    <form v-if="editable" class="note-form" @submit.prevent="submit">
      <input v-model="tag" placeholder="标签" aria-label="记录标签" />
      <textarea v-model="comment" placeholder="补充审阅意见，将挂到当前差异/归并项" rows="2" />
      <button type="submit" class="primary">添加记录</button>
    </form>
  </div>
</template>
