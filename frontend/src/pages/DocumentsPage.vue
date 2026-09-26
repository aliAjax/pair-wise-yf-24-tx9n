<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { usePolicyDocumentStore } from "../stores/PolicyDocumentStore";
import { usePolicySectionStore } from "../stores/PolicySectionStore";
import ImportPanel from "../components/common/ImportPanel.vue";
import SectionCard from "../components/common/SectionCard.vue";
import EmptyState from "../components/common/EmptyState.vue";
import { formatDate } from "../utils/formatters";

const documentStore = usePolicyDocumentStore();
const sectionStore = usePolicySectionStore();
const { rows: documents } = storeToRefs(documentStore);
const { rows: sections } = storeToRefs(sectionStore);

onMounted(() => {
  documentStore.load();
  sectionStore.load();
});

const sectionsOf = (documentId: number) => sections.value.filter((section) => section.document_id === documentId);
</script>

<template>
  <section class="documents-page">
    <ImportPanel />
    <div v-if="!documents.length"><EmptyState /></div>
    <article v-for="document in documents" :key="document.id" class="panel doc-card">
      <header class="doc-head">
        <div>
          <strong>{{ document.title }}</strong>
          <span class="doc-version">{{ document.version_label }}</span>
        </div>
        <time>{{ formatDate(document.imported_at) }}</time>
      </header>
      <p class="muted">归一化分段：{{ document.normalized_sections }}</p>
      <div class="doc-sections">
        <SectionCard v-for="section in sectionsOf(document.id)" :key="section.id" :section="section" />
        <p v-if="!sectionsOf(document.id).length" class="muted">该版本暂无可展示条款。</p>
      </div>
    </article>
  </section>
</template>
