import { strict as assert } from "node:assert";
import { ref } from "vue";
import { useMergeView } from "../src/hooks/useMergeView";
import { listReviewNote } from "../src/api/ReviewNote";
import { mockData } from "../src/mocks/seedData";
import { confirmMerge, splitMerge, type MergeState } from "../src/services/mergeService";

const diffsRef = ref(mockData.diffResult);
const sectionsRef = ref(mockData.policySection);
const groupsRef = ref(mockData.diffMergeGroup.map((g) => ({ ...g, member_diff_ids: [...g.member_diff_ids] })));
const notesRef = ref(await listReviewNote());
const auditsRef = ref(mockData.mergeAuditLog);

const view = useMergeView({
  diffs: diffsRef,
  sections: sectionsRef,
  notes: notesRef,
  groups: groupsRef,
  audits: auditsRef
});

// 初始：草稿 102 不计统计（成员 1/2 仍独立显示）；确认组 101 合成 1 项
assert.equal(view.stats.value.total, 4, "merge101 + standalone diffs 1,2,5");
assert.equal(view.stats.value.merged, 1);
assert.equal(view.stats.value.draftCount, 1);
assert.equal(view.stats.value.archivedDiffCount, 2);
assert.equal(view.stats.value.openTodos, 2, "note#1 still on draft-member diff1 + note#3 under merge101");
const merged101 = view.entries.value.find((e) => e.key === "merge-101");
assert.ok(merged101 && merged101.riskLevel === "CRITICAL", "highest risk CRITICAL");
assert.equal(merged101!.notes.length, 2, "notes transferred to new item");
// 旧差异 3/4 不出现在列表
assert.ok(!view.entries.value.some((e) => e.diffId === 3 || e.diffId === 4));
// 草稿成员 1/2 仍独立显示且带草稿标记
const diff1 = view.entries.value.find((e) => e.diffId === 1);
assert.ok(diff1 && diff1.inDraftGroupId === 102);
// 并档含已确认组、只读
assert.equal(view.archiveGroups.value.length, 1);
assert.equal(view.archiveGroups.value[0].readOnly, true);

// 确认草稿 102：note #1（OPEN）转到新项
let state: MergeState = { groups: groupsRef.value, audits: auditsRef.value, overrides: [] };
state = confirmMerge(state, {
  groupId: 102,
  operator: "r",
  diffs: diffsRef.value,
  sections: sectionsRef.value,
  notes: notesRef.value
});
groupsRef.value = state.groups;
auditsRef.value = state.audits;
// 模拟 API 覆盖表合成
notesRef.value = notesRef.value.map((n) => {
  const patch = state.overrides.find((o) => o.id === n.id);
  return patch ? { ...n, ...patch } : n;
});
assert.equal(view.stats.value.total, 3);
assert.equal(view.stats.value.merged, 2);
assert.equal(view.stats.value.draftCount, 0);
assert.equal(view.stats.value.archivedDiffCount, 4);
assert.equal(view.stats.value.openTodos, 2, "note#1 moved to merge102 + note#3 on merge101");
assert.equal(view.entries.value.find((e) => e.key === "merge-102")!.riskLevel, "HIGH", "merge102 risk HIGH (max HIGH/MEDIUM)");

// 拆回 101：3/4 恢复独立，记录转回
state = { groups: groupsRef.value, audits: auditsRef.value, overrides: state.overrides };
state = splitMerge(state, { groupId: 101, operator: "r", notes: notesRef.value });
groupsRef.value = state.groups;
auditsRef.value = state.audits;
notesRef.value = notesRef.value.map((n) => {
  const patch = state.overrides.find((o) => o.id === n.id);
  return patch ? { ...n, ...patch } : n;
});
assert.equal(view.stats.value.total, 4, "merge102 + diffs 3,4,5");
assert.equal(view.stats.value.merged, 1);
assert.equal(view.stats.value.archivedDiffCount, 2, "merge102 members 1,2 stay archived");
assert.equal(view.stats.value.openTodos, 2, "merge102 note#1 + restored diff4 note#3");
assert.ok(view.entries.value.some((e) => e.diffId === 3) && view.entries.value.some((e) => e.diffId === 4));
// 并档含确认组 102（只读）与拆回组 101（可重新归并）
assert.equal(view.archiveGroups.value.length, 2);
const splitArchive = view.archiveGroups.value.find((a) => a.group.id === 101);
assert.equal(splitArchive!.readOnly, false);

console.log("useMergeView stats flow passed");
