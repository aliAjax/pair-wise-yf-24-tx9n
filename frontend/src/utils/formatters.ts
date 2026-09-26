export const formatDate = (value: string) => new Date(value).toLocaleString("zh-CN");
export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
export const formatRisk = (value: string) => ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);
export const formatMergeStatus = (value: string) => ({ DRAFT: "草稿", CONFIRMED: "已确认", REVERTED: "已拆回" }[value] ?? value);

const RISK_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const maxRiskLevel = (levels: string[]) =>
  levels.reduce((top, current) => (RISK_ORDER.indexOf(current) > RISK_ORDER.indexOf(top) ? current : top), "LOW");
