# 隐私政策差异对比器

纯前端隐私政策版本对比与风险标注工具，用户粘贴两版文本后查看条款差异、风险标签和审阅清单；结果页支持对「换编号 / 条款拆分」造成的误判做**人工归并与拆回**，数据存 localStorage。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20112>

## 人工归并（结果页 /compare）

自动对比把同一条业务条款识别成「删一条 + 加一条」时，法务可在结果页：

1. 勾选属于同一业务条款的差异（至少 2 项）→ 生成**归并草稿**；草稿可调整成员、废弃。
2. **确认归并**后：多条差异合成 1 项；风险取原项最高值；处理记录转到新项；旧项进入**并档**可查但只读。
3. 误合时可在新项上「拆回原差异」，处理记录同步转回；拆回归并组留痕，并可重新归并。
4. 统计口径：详情列表、风险分布与「待办」数量都按**已确认的新归并**显示；**未确认草稿不影响统计**。

## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 领域规则冒烟测试：`cd frontend && node_modules/.bin/esbuild scripts/mergeService.smoke.ts --bundle --platform=node --format=esm --outfile=/tmp/merge-smoke.mjs && node /tmp/merge-smoke.mjs`

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router + localStorage |
| 后端 | - |
| 数据库 | 本地模拟数据（mock + localStorage 覆盖表） |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/
├── api/                  # DiffMerge / ReviewNote 等按模型分文件封装 async API
├── stores/               # Pinia 独立 store，DiffMergeStore 为归并 controller
├── types/                # DiffResult / ReviewNote / DiffMerge 等模型类型
├── constants/            # 枚举、日志模板、错误码与错误消息、状态文案
├── constructors/         # 默认对象、表单对象、响应对象构造器
├── services/             # mergeService 领域规则 + MergeServiceError 异常
├── components/common/    # DiffViewer、ReviewChecklist、RiskTag、SectionCard、ImportPanel 等
├── components/merge/     # MergeEntryCard、MergeDraftPanel、MergeArchivePanel
├── hooks/                # useMergeView（归并视图模型）、useTextDiff、usePolicyParser 等
├── pages/                # documents/compare/risks/review 四个路由页面
├── router/               # 路由表与 vue-router 实例
├── utils/                # formatters、logger、localStorage 读写
├── mocks/                # seedData 种子数据
└── scripts/              # mergeService 冒烟测试
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `policy-diff`
- `FRONTEND_PORT`: 前端端口，默认 `20112`

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: policy-diff`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-policy-diff}` 前缀。
- 前端为纯静态 Nginx 托管，无数据库卷；构建产物随镜像分发。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置本地归并草稿/记录时清除浏览器 localStorage（键名前缀 `policy-diff:`）。

## 核心数据模型

- **PolicyDocument**：政策文档（id, title, version_label, raw_text, normalized_sections, imported_at）
- **PolicySection**：条款段落（id, document_id, section_no, heading, content, category, risk_level）
- **DiffResult**：差异结果（id, old_document_id, new_document_id, section_id, diff_type, summary, created_at）
- **ReviewNote**：处理记录（id, diff_result_id, tag, comment, reviewer, status, moved_to_merge_id, created_at）
  - 归并确认后 `moved_to_merge_id` 指向新归并项；拆回后置回 `null`
- **DiffMergeGroup**：人工归并组（id, old_document_id, new_document_id, member_diff_ids, anchor_diff_id, summary, status[DRAFT/CONFIRMED/SPLIT], created_by, created_at, confirmed_at, split_at）
- **MergeAuditLog**：归并操作留痕（id, group_id, action, diff_ids, operator, detail, created_at）

## 枚举/常量出现位置清单

- DiffType (`ADDED / REMOVED / MODIFIED / MOVED / UNCHANGED`)：
  - 常量：`constants/DiffType.ts`；类型：同文件；聚合文案：`constants/statusText.ts`
  - 构造器：`constructors/DiffResultConstructor.ts`
  - 种子：`mocks/seedData.ts`
  - 筛选器/展示：`pages/ComparePage.vue`、`components/merge/MergeEntryCard.vue`、`components/merge/MergeDraftPanel.vue`、`components/common/DiffViewer.vue`
  - 视图模型：`hooks/useMergeView.ts`（按 REMOVED/MOVED 与 ADDED/MODIFIED 区分旧版/新版条款）
- PrivacyRiskLevel (`LOW / MEDIUM / HIGH / CRITICAL`)：
  - 常量：`constants/PrivacyRiskLevel.ts`；聚合文案：`constants/statusText.ts`
  - 格式化：`utils/formatters.ts`（formatRisk）
  - 领域规则：`services/mergeService.ts`（highestRisk 取原项最高值）
  - 展示：`components/common/RiskTag.vue`、`pages/ComparePage.vue`、`pages/RisksPage.vue`、`components/merge/MergeArchivePanel.vue`
- ReviewStatus (`OPEN / CONFIRMED / IGNORED / RESOLVED`)：
  - 常量：`constants/ReviewStatus.ts`；聚合文案：`constants/statusText.ts`
  - 构造器：`constructors/ReviewNoteConstructor.ts`
  - 待办统计：`hooks/useMergeView.ts`、`components/common/ReviewChecklist.vue`、`pages/ReviewPage.vue`
- MergeStatus (`DRAFT / CONFIRMED / SPLIT`)：
  - 常量+类型+文案：`constants/MergeStatus.ts`、`types/MergeStatus.ts`、`constants/statusText.ts`
  - 日志模板：`constants/logTemplates.ts`（DiffMerge 6 条模板）
  - 错误码/消息：`constants/errorCodes.ts`、`constants/errorMessages.ts`（MERGE_* 6 个码）
  - 构造器：`constructors/DiffMergeConstructor.ts`
  - 模型/API/存储：`types/DiffMerge.ts`、`api/DiffMerge.ts`、`stores/DiffMergeStore.ts`、`utils/localStorage.ts`
  - 领域规则：`services/mergeService.ts`、`services/MergeServiceError.ts`
  - 视图模型与筛选：`hooks/useMergeView.ts`（草稿不计统计、确认合成、拆回恢复）
  - 展示组件：`components/merge/MergeDraftPanel.vue`、`components/merge/MergeArchivePanel.vue`、`components/merge/MergeEntryCard.vue`
  - 页面：`pages/ComparePage.vue`、`pages/ReviewPage.vue`
- MergeAuditAction (`MERGE_DRAFT_CREATED / UPDATED / DISCARDED / CONFIRMED / SPLIT / REDRAFTED`)：
  - `constants/MergeAuditAction.ts` → `services/mergeService.ts` → `types/DiffMerge.ts` → 并档留痕展示

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；新增「归并」这一状态即同步触达类型（DiffMerge/ReviewNote）、常量（MergeStatus/MergeAuditAction/日志/错误码）、构造器、service、controller(store)、视图模型 hook、三个归并组件、结果页与审阅页、种子数据与 README。

## License

MIT
