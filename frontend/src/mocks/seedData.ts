export const mockData = {
  "policyDocument": [
    {
      "id": 1,
      "title": "隐私政策（旧版）",
      "version_label": "v2025.08",
      "raw_text": "4.1 信息保存期限……6.1 第三方共享……",
      "normalized_sections": "4.1 / 6.1 / 3.2",
      "imported_at": "2026-08-10T09:00:00Z"
    },
    {
      "id": 2,
      "title": "隐私政策（新版）",
      "version_label": "v2026.01",
      "raw_text": "5.2 保存期限与注销……7.1 SDK 合作方共享……",
      "normalized_sections": "5.2 / 7.1 / 3.2",
      "imported_at": "2026-09-20T09:00:00Z"
    },
    {
      "id": 3,
      "title": "隐私政策（历史版）",
      "version_label": "v2024.12",
      "raw_text": "历史版本存档",
      "normalized_sections": "3.2",
      "imported_at": "2025-12-01T09:00:00Z"
    }
  ],
  "policySection": [
    {
      "id": 1,
      "document_id": 1,
      "section_no": "4.1",
      "heading": "信息保存期限",
      "content": "我们仅在实现目的所必需的最长期限内保留您的个人信息。",
      "category": "数据保存",
      "risk_level": "HIGH"
    },
    {
      "id": 2,
      "document_id": 2,
      "section_no": "5.2",
      "heading": "保存期限与注销",
      "content": "我们在必要期限内保留信息，账号注销后删除或匿名化处理。",
      "category": "数据保存",
      "risk_level": "MEDIUM"
    },
    {
      "id": 3,
      "document_id": 1,
      "section_no": "6.1",
      "heading": "第三方共享",
      "content": "我们可能向合作第三方共享您的信息，将要求其保密。",
      "category": "对外共享",
      "risk_level": "HIGH"
    },
    {
      "id": 4,
      "document_id": 2,
      "section_no": "7.1",
      "heading": "SDK 合作方共享",
      "content": "接入第三方 SDK 时可能收集设备标识并共享给合作方用于风控。",
      "category": "对外共享",
      "risk_level": "CRITICAL"
    },
    {
      "id": 5,
      "document_id": 1,
      "section_no": "3.2",
      "heading": "收集设备信息",
      "content": "我们收集设备型号、操作系统版本等基本设备信息。",
      "category": "数据收集",
      "risk_level": "MEDIUM"
    },
    {
      "id": 6,
      "document_id": 2,
      "section_no": "3.2",
      "heading": "收集设备信息",
      "content": "我们收集设备型号、系统版本，并在授权后读取传感器信息。",
      "category": "数据收集",
      "risk_level": "MEDIUM"
    },
    {
      "id": 7,
      "document_id": 3,
      "section_no": "3.2",
      "heading": "收集设备信息",
      "content": "历史版本：收集设备型号等基本信息。",
      "category": "数据收集",
      "risk_level": "LOW"
    }
  ],
  "diffResult": [
    {
      "id": 1,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 1,
      "diff_type": "REMOVED",
      "summary": "第 4.1 条「信息保存期限」在新版中删除（疑似换编号为 5.2）",
      "created_at": "2026-09-20T09:05:00Z"
    },
    {
      "id": 2,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 2,
      "diff_type": "ADDED",
      "summary": "新增第 5.2 条「保存期限与注销」（疑似旧 4.1 换编号）",
      "created_at": "2026-09-20T09:05:00Z"
    },
    {
      "id": 3,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 3,
      "diff_type": "REMOVED",
      "summary": "第 6.1 条「第三方共享」在新版中删除（疑似拆分换编号）",
      "created_at": "2026-09-20T09:05:00Z"
    },
    {
      "id": 4,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 4,
      "diff_type": "ADDED",
      "summary": "新增第 7.1 条「SDK 合作方共享」（疑似旧 6.1 拆分而来）",
      "created_at": "2026-09-20T09:05:00Z"
    },
    {
      "id": 5,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 6,
      "diff_type": "MODIFIED",
      "summary": "第 3.2 条「收集设备信息」新增传感器字段说明",
      "created_at": "2026-09-20T09:05:00Z"
    }
  ],
  "reviewNote": [
    {
      "id": 1,
      "diff_result_id": 1,
      "tag": "待评估",
      "comment": "保存期限条款疑似只是换编号，先不要按删除处理。",
      "reviewer": "法务-王敏",
      "status": "OPEN",
      "moved_to_merge_id": null,
      "created_at": "2026-09-20T09:20:00Z"
    },
    {
      "id": 2,
      "diff_result_id": 3,
      "tag": "高风险-共享",
      "comment": "共享对象清单需与新版 SDK 合作方列表核对。",
      "reviewer": "法务-王敏",
      "status": "CONFIRMED",
      "moved_to_merge_id": 101,
      "created_at": "2026-09-20T10:02:00Z"
    },
    {
      "id": 3,
      "diff_result_id": 4,
      "tag": "待评估",
      "comment": "新增 SDK 共享是否由旧 6.1 拆分，需归并后统一审阅。",
      "reviewer": "法务-李晨",
      "status": "OPEN",
      "moved_to_merge_id": 101,
      "created_at": "2026-09-20T10:10:00Z"
    },
    {
      "id": 4,
      "diff_result_id": 5,
      "tag": "可接受",
      "comment": "仅补充传感器字段说明，风险可控。",
      "reviewer": "法务-李晨",
      "status": "RESOLVED",
      "moved_to_merge_id": null,
      "created_at": "2026-09-21T01:00:00Z"
    }
  ],
  "diffMergeGroup": [
    {
      "id": 101,
      "old_document_id": 1,
      "new_document_id": 2,
      "member_diff_ids": [3, 4],
      "anchor_diff_id": 3,
      "summary": "同一业务条款：第三方共享（旧 6.1）→ 新版 7.1「SDK 合作方共享」，删除/新增实为拆分换编号",
      "status": "CONFIRMED",
      "created_by": "法务-王敏",
      "created_at": "2026-09-21T02:10:00Z",
      "confirmed_at": "2026-09-21T02:15:00Z",
      "split_at": null
    },
    {
      "id": 102,
      "old_document_id": 1,
      "new_document_id": 2,
      "member_diff_ids": [1, 2],
      "anchor_diff_id": 1,
      "summary": "人工归并 2 项（REMOVED、ADDED）：信息保存期限换编号",
      "status": "DRAFT",
      "created_by": "法务-王敏",
      "created_at": "2026-09-22T03:00:00Z",
      "confirmed_at": null,
      "split_at": null
    }
  ],
  "mergeAuditLog": [
    {
      "id": 1,
      "group_id": 101,
      "action": "MERGE_DRAFT_CREATED",
      "diff_ids": [3, 4],
      "operator": "法务-王敏",
      "detail": "创建归并草稿，成员 3、4",
      "created_at": "2026-09-21T02:10:00Z"
    },
    {
      "id": 2,
      "group_id": 101,
      "action": "MERGE_CONFIRMED",
      "diff_ids": [3, 4],
      "operator": "法务-王敏",
      "detail": "确认归并，风险取最高值 CRITICAL，2 条处理记录转入新项，旧项转入并档只读",
      "created_at": "2026-09-21T02:15:00Z"
    }
  ]
} as const;
