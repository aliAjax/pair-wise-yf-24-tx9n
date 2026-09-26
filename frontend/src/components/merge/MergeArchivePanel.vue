<script setup lang="ts">
import { computed, ref } from "vue";
import type { MergeAuditLog } from "../../types/DiffMerge";
import { MergeStatusText } from "../../constants/MergeStatus";
import { formatDate } from "../../utils/formatters";
import RiskTag from "../common/RiskTag.vue";

interface ArchiveMemberView {
  id: number;
  diffType: string;
  summary: string;
  riskLevel: string;
}
interface ArchiveGroupView {
  group: {
    id: number;
    member_diff_ids: number[];
    summary: string;
    status: string;
    created_by: string;
    created_at: string;
    confirmed_at: string | null;
    split_at: string | null;
  };
  members: ArchiveMemberView[];
  audits: MergeAuditLog[];
  readOnly: boolean;
}

const props = defineProps<{ groups: ArchiveGroupView[] }>();

const emit = defineEmits<{ (event: "redraft", groupId: number): void }>();

const openId = ref<number | null>(null);
const toggle = (id: number) => {
  openId.value = openId.value === id ? null : id;
};
const isOpen = (id: number) => openId.value === id;
const statusText = (status: string) =>
  (MergeStatusText as Record<string, string>)[status] ?? status;

const orderedGroups = computed(() => [...props.groups].sort((a, b) => b.group.id - a.group.id));
</script>

<template>
  <section class="panel archive-panel">
    <h2>并档查询</h2>
    <p class="muted">归并确认后的旧差异在此可查，但保持只读，不能继续编辑；已拆回的归并组也留痕，可重新归并。</p>
    <div v-if="orderedGroups.length" class="archive-list">
      <article v-for="item in orderedGroups" :key="item.group.id" class="archive-item">
        <header class="archive-head" @click="toggle(item.group.id)">
          <div>
            <strong>归并 #{{ item.group.id }}</strong>
            <span class="archive-status" :class="item.group.status.toLowerCase()">{{ statusText(item.group.status) }}</span>
          </div>
          <span class="muted">{{ isOpen(item.group.id) ? "收起 ▲" : "展开 ▼" }}</span>
        </header>
        <div v-if="isOpen(item.group.id)" class="archive-body">
          <p class="draft-summary">{{ item.group.summary }}</p>
          <p class="muted">
            {{ item.group.created_by }} 于 {{ formatDate(item.group.created_at) }} 创建
            <template v-if="item.group.confirmed_at">，{{ formatDate(item.group.confirmed_at) }} 确认</template>
            <template v-if="item.group.split_at">，{{ formatDate(item.group.split_at) }} 拆回</template>
          </p>
          <table class="member-table">
            <thead><tr><th>原差异</th><th>类型</th><th>说明</th><th>风险</th><th>编辑</th></tr></thead>
            <tbody>
              <tr v-for="member in item.members" :key="member.id">
                <td>#{{ member.id }}</td>
                <td>{{ member.diffType }}</td>
                <td>{{ member.summary }}</td>
                <td><RiskTag :level="member.riskLevel" /></td>
                <td>
                  <span v-if="item.readOnly" class="readonly-tag">并档只读</span>
                  <span v-else class="restored-tag">已恢复可编辑</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="audit-box">
            <strong>操作留痕</strong>
            <ul>
              <li v-for="audit in item.audits" :key="audit.id">
                <span class="audit-action">{{ audit.action }}</span>
                <span>{{ audit.detail }}</span>
                <span class="muted">{{ audit.operator }} · {{ formatDate(audit.created_at) }}</span>
              </li>
            </ul>
          </div>
          <footer v-if="!item.readOnly" class="draft-actions">
            <button class="ghost" @click="emit('redraft', item.group.id)">对原差异重新归并</button>
          </footer>
        </div>
      </article>
    </div>
    <p v-else class="muted">暂无并档记录。确认归并或拆回后可在此追溯。</p>
  </section>
</template>
