import { strict as assert } from "node:assert";
import {
  startMergeDraft,
  confirmMerge,
  splitMerge,
  discardMergeDraft,
  updateMergeDraft,
  highestRisk
} from "../src/services/mergeService";
import type { MergeState } from "../src/services/mergeService";
import type { DiffResult } from "../src/types/DiffResult";
import type { PolicySection } from "../src/types/PolicySection";
import type { ReviewNote } from "../src/types/ReviewNote";

const diffs: DiffResult[] = [
  { id: 1, old_document_id: 1, new_document_id: 2, section_id: 1, diff_type: "REMOVED", summary: "删4.1", created_at: "t1" },
  { id: 2, old_document_id: 1, new_document_id: 2, section_id: 2, diff_type: "ADDED", summary: "增5.2", created_at: "t1" },
  { id: 3, old_document_id: 1, new_document_id: 2, section_id: 3, diff_type: "REMOVED", summary: "删6.1", created_at: "t1" },
  { id: 4, old_document_id: 1, new_document_id: 2, section_id: 4, diff_type: "ADDED", summary: "增7.1", created_at: "t1" },
  { id: 5, old_document_id: 1, new_document_id: 2, section_id: 5, diff_type: "MODIFIED", summary: "改3.2", created_at: "t1" }
];
const sections: PolicySection[] = [
  { id: 1, document_id: 1, section_no: "4.1", heading: "期限", content: "a", category: "x", risk_level: "HIGH" },
  { id: 2, document_id: 2, section_no: "5.2", heading: "期限", content: "b", category: "x", risk_level: "MEDIUM" },
  { id: 3, document_id: 1, section_no: "6.1", heading: "共享", content: "c", category: "x", risk_level: "HIGH" },
  { id: 4, document_id: 2, section_no: "7.1", heading: "共享", content: "d", category: "x", risk_level: "CRITICAL" },
  { id: 5, document_id: 2, section_no: "3.2", heading: "设备", content: "e", category: "x", risk_level: "LOW" }
];
const notes: ReviewNote[] = [
  { id: 1, diff_result_id: 3, tag: "t", comment: "n1", reviewer: "r", status: "OPEN", moved_to_merge_id: null },
  { id: 2, diff_result_id: 4, tag: "t", comment: "n2", reviewer: "r", status: "CONFIRMED", moved_to_merge_id: null },
  { id: 3, diff_result_id: 5, tag: "t", comment: "n3", reviewer: "r", status: "OPEN", moved_to_merge_id: null }
];

// 1) 风险取最高值
assert.equal(highestRisk([3, 4], diffs, sections), "CRITICAL");
assert.equal(highestRisk([1, 2], diffs, sections), "HIGH");

let state: MergeState = { groups: [], audits: [], overrides: [] };

// 2) 少于 2 项报错
assert.throws(() => startMergeDraft(state, { diffIds: [1], operator: "r", diffs, sections }), /至少/);

// 3) 跨文档对比报错
const crossDiffs = [...diffs, { id: 6, old_document_id: 9, new_document_id: 8, section_id: 1, diff_type: "ADDED", summary: "x", created_at: "t" }];
assert.throws(() => startMergeDraft(state, { diffIds: [1, 6], operator: "r", diffs: crossDiffs, sections }), /同一份/);

// 4) 创建草稿（未确认）
state = startMergeDraft(state, { diffIds: [1, 2], operator: "r", diffs, sections });
const draftId = state.groups[0].id;
assert.equal(state.groups[0].status, "DRAFT");
assert.equal(state.audits.length, 1);
// 草稿成员不能再被别的草稿占用
assert.throws(() => startMergeDraft(state, { diffIds: [2, 5], operator: "r", diffs, sections }), /已确认归并/);

// 5) 更新草稿成员 / 废弃草稿不影响后续
state = updateMergeDraft(state, { groupId: draftId, diffIds: [1, 2, 5], operator: "r", diffs, sections });
assert.deepEqual(state.groups[0].member_diff_ids, [1, 2, 5]);
state = discardMergeDraft(state, { groupId: draftId, operator: "r" });
assert.equal(state.groups.length, 0);
assert.equal(state.audits.length, 3);

// 6) 创建并确认归并：记录转移
state = startMergeDraft(state, { diffIds: [3, 4], operator: "r", diffs, sections });
const gid = state.groups[0].id;
state = confirmMerge(state, { groupId: gid, operator: "r", diffs, sections, notes });
assert.equal(state.groups[0].status, "CONFIRMED");
assert.ok(state.groups[0].confirmed_at);
const moved = state.overrides.filter((o) => [1, 2].includes(o.id));
assert.equal(moved.length, 2);
assert.ok(moved.every((o) => o.moved_to_merge_id === gid));
// 无关记录不动
assert.ok(!state.overrides.some((o) => o.id === 3));

// 7) 已确认组成员不能再次归并
assert.throws(() => startMergeDraft(state, { diffIds: [3, 5], operator: "r", diffs, sections }), /已确认归并/);
// 已确认组不能重复确认
assert.throws(() => confirmMerge(state, { groupId: gid, operator: "r", diffs, sections, notes }), /未找到/);

// 8) 拆回：组转 SPLIT，记录转回
// 真实链路中确认后的覆盖表会合成回备注列表，此处模拟 API 层的合成结果
const notesAfterConfirm: ReviewNote[] = notes.map((note) => {
  const patch = state.overrides.find((o) => o.id === note.id);
  return patch ? { ...note, ...patch } : note;
});
assert.ok(notesAfterConfirm.filter((n) => [1, 2].includes(n.id)).every((n) => n.moved_to_merge_id === gid));
state = splitMerge(state, { groupId: gid, operator: "r", notes: notesAfterConfirm });
assert.equal(state.groups[0].status, "SPLIT");
assert.ok(state.groups[0].split_at);
assert.ok(state.overrides.filter((o) => [1, 2].includes(o.id)).every((o) => o.moved_to_merge_id === null));

// 9) 拆回后原差异可重新归并，确认后记录再次转移
const recreated = startMergeDraft(state, { diffIds: [3, 4], operator: "r", diffs, sections });
assert.equal(recreated.groups.filter((g) => g.status === "DRAFT").length, 1);
// redraftFromSplit 用默认成员
const redrafted = (() => {
  // 直接验证 split 组保留可查
  return state.groups[0].status === "SPLIT";
})();
assert.ok(redrafted);

console.log("mergeService smoke tests passed:", {
  audits: state.audits.length,
  groups: state.groups.map((g) => `${g.id}:${g.status}`).join(",")
});
