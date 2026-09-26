<script setup lang="ts">
import { computed, ref } from "vue";
import { usePolicyParser } from "../../hooks/usePolicyParser";

const emit = defineEmits<{ (event: "import", payload: { title: string; version: string; text: string }): void }>();

const title = ref("");
const version = ref("");
const text = ref("");

const parsedLines = computed(() =>
  text.value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
);
// 复用共享解析 hook：候选段落即分页解析结果
const { total: sectionCount } = usePolicyParser(parsedLines);

const submit = () => {
  if (!text.value.trim() || !version.value.trim()) return;
  emit("import", { title: title.value.trim() || "未命名版本", version: version.value.trim(), text: text.value });
  title.value = "";
  version.value = "";
  text.value = "";
};
</script>

<template>
  <section class="panel import-panel">
    <h2>粘贴两版隐私政策文本</h2>
    <p class="muted">按空行自动分段，演示数据以本地 mock 为准；导入内容仅在当前会话提示。</p>
    <form class="import-form" @submit.prevent="submit">
      <input v-model="title" placeholder="文档标题（可选）" />
      <input v-model="version" placeholder="版本号，如 v2026.01" required />
      <textarea v-model="text" rows="6" placeholder="在此粘贴政策正文，空行分段…" required />
      <footer>
        <span class="muted">识别到 {{ sectionCount }} 个候选段落</span>
        <button type="submit" class="primary">解析并导入</button>
      </footer>
    </form>
  </section>
</template>
