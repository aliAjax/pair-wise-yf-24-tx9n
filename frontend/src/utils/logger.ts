import { LOG_TEMPLATES } from "../constants/logTemplates";

export function writeLog(template: string, params: Record<string, string | number> = {}): string {
  const message = Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
    template
  );
  console.info(`[policy-diff] ${message}`);
  return message;
}

export const mergeLogTemplates = LOG_TEMPLATES.DiffMerge;
