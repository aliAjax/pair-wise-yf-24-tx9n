export const mockData = {
  "policyDocument": [
    {
      "id": 1,
      "title": "隐私政策",
      "version_label": "v2.3（旧版）",
      "raw_text": "旧版隐私政策全文……",
      "normalized_sections": "第一条 信息收集；第五条 Cookie 与同类技术；第七条 数据共享；第八条 保存期限",
      "imported_at": "2026-06-11T09:00:00Z"
    },
    {
      "id": 2,
      "title": "隐私政策",
      "version_label": "v3.0（新版）",
      "raw_text": "新版隐私政策全文……",
      "normalized_sections": "第三条 信息收集；第五条 Cookie 使用；第六条 同类追踪技术；第九条 数据共享与转让；第十条 保存期限",
      "imported_at": "2026-06-12T09:00:00Z"
    }
  ],
  "policySection": [
    {
      "id": 1,
      "document_id": 1,
      "section_no": "第七条",
      "heading": "数据共享",
      "content": "我们不会向第三方共享您的个人信息，法律法规要求的情形除外。",
      "category": "数据共享",
      "risk_level": "HIGH"
    },
    {
      "id": 2,
      "document_id": 2,
      "section_no": "第九条",
      "heading": "数据共享与转让",
      "content": "我们不会向第三方共享或转让您的个人信息，法律法规要求的情形除外。",
      "category": "数据共享",
      "risk_level": "HIGH"
    },
    {
      "id": 3,
      "document_id": 1,
      "section_no": "第五条",
      "heading": "Cookie 与同类技术",
      "content": "我们使用 Cookie 及同类追踪技术改善服务体验。",
      "category": "Cookie",
      "risk_level": "MEDIUM"
    },
    {
      "id": 4,
      "document_id": 2,
      "section_no": "第五条",
      "heading": "Cookie 使用",
      "content": "我们使用 Cookie 改善服务体验。",
      "category": "Cookie",
      "risk_level": "MEDIUM"
    },
    {
      "id": 5,
      "document_id": 2,
      "section_no": "第六条",
      "heading": "同类追踪技术",
      "content": "我们使用像素标签等同类追踪技术统计访问量。",
      "category": "Cookie",
      "risk_level": "LOW"
    },
    {
      "id": 6,
      "document_id": 1,
      "section_no": "第八条",
      "heading": "保存期限",
      "content": "您的个人信息将保存三年。",
      "category": "保存期限",
      "risk_level": "HIGH"
    },
    {
      "id": 7,
      "document_id": 2,
      "section_no": "第十条",
      "heading": "保存期限",
      "content": "您的个人信息将保存一年，超期后删除或匿名化。",
      "category": "保存期限",
      "risk_level": "CRITICAL"
    },
    {
      "id": 8,
      "document_id": 1,
      "section_no": "第一条",
      "heading": "信息收集",
      "content": "我们收集您主动提供的注册信息。",
      "category": "信息收集",
      "risk_level": "LOW"
    },
    {
      "id": 9,
      "document_id": 2,
      "section_no": "第三条",
      "heading": "信息收集",
      "content": "我们收集您主动提供或授权我们获取的注册信息。",
      "category": "信息收集",
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
      "summary": "旧版第七条「数据共享」在新版中未找到对应编号",
      "risk_level": "HIGH",
      "origin": "AUTO",
      "merge_state": "ACTIVE",
      "merged_into_id": null,
      "merged_from_ids": [],
      "created_at": "2026-06-12T10:00:00Z"
    },
    {
      "id": 2,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 2,
      "diff_type": "ADDED",
      "summary": "新版新增第九条「数据共享与转让」",
      "risk_level": "HIGH",
      "origin": "AUTO",
      "merge_state": "ACTIVE",
      "merged_into_id": null,
      "merged_from_ids": [],
      "created_at": "2026-06-12T10:00:00Z"
    },
    {
      "id": 3,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 3,
      "diff_type": "REMOVED",
      "summary": "旧版第五条「Cookie 与同类技术」被整体移除",
      "risk_level": "MEDIUM",
      "origin": "AUTO",
      "merge_state": "ACTIVE",
      "merged_into_id": null,
      "merged_from_ids": [],
      "created_at": "2026-06-12T10:00:00Z"
    },
    {
      "id": 4,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 4,
      "diff_type": "ADDED",
      "summary": "新版新增第五条「Cookie 使用」",
      "risk_level": "MEDIUM",
      "origin": "AUTO",
      "merge_state": "ACTIVE",
      "merged_into_id": null,
      "merged_from_ids": [],
      "created_at": "2026-06-12T10:00:00Z"
    },
    {
      "id": 5,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 5,
      "diff_type": "ADDED",
      "summary": "新版新增第六条「同类追踪技术」",
      "risk_level": "LOW",
      "origin": "AUTO",
      "merge_state": "ACTIVE",
      "merged_into_id": null,
      "merged_from_ids": [],
      "created_at": "2026-06-12T10:00:00Z"
    },
    {
      "id": 6,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 7,
      "diff_type": "MODIFIED",
      "summary": "保存期限由三年缩短为一年，并补充超期处理方式",
      "risk_level": "CRITICAL",
      "origin": "AUTO",
      "merge_state": "ACTIVE",
      "merged_into_id": null,
      "merged_from_ids": [],
      "created_at": "2026-06-12T10:00:00Z"
    },
    {
      "id": 7,
      "old_document_id": 1,
      "new_document_id": 2,
      "section_id": 9,
      "diff_type": "MODIFIED",
      "summary": "信息收集条款由第一条调整为第三条，表述微调",
      "risk_level": "LOW",
      "origin": "AUTO",
      "merge_state": "ACTIVE",
      "merged_into_id": null,
      "merged_from_ids": [],
      "created_at": "2026-06-12T10:00:00Z"
    }
  ],
  "reviewNote": [
    {
      "id": 1,
      "diff_result_id": 1,
      "tag": "数据共享",
      "comment": "确认是否为条款换编号，而非真正删除",
      "reviewer": "法务-王",
      "status": "OPEN"
    },
    {
      "id": 2,
      "diff_result_id": 2,
      "tag": "数据共享",
      "comment": "与旧版第七条内容基本一致，仅条款号变动",
      "reviewer": "法务-李",
      "status": "CONFIRMED"
    },
    {
      "id": 3,
      "diff_result_id": 3,
      "tag": "Cookie",
      "comment": "旧条款疑似被拆分为新版两条，需合并审阅",
      "reviewer": "法务-王",
      "status": "OPEN"
    },
    {
      "id": 4,
      "diff_result_id": 6,
      "tag": "保存期限",
      "comment": "保存期限缩短需合规复核并同步整改留存策略",
      "reviewer": "法务-赵",
      "status": "OPEN"
    },
    {
      "id": 5,
      "diff_result_id": 4,
      "tag": "Cookie",
      "comment": "新版第五条已读，与旧条款前半部分对应",
      "reviewer": "法务-李",
      "status": "RESOLVED"
    }
  ],
  "diffMerge": [
    {
      "id": 1,
      "member_diff_ids": [1, 2],
      "result_diff_id": null,
      "status": "DRAFT",
      "note": "疑似同一条款换编号：旧第七条 → 新第九条",
      "created_at": "2026-06-13T09:00:00Z",
      "confirmed_at": null
    }
  ]
} as const;
