import type { MergeErrorCode } from "../constants/errorCodes";

/** service 层统一包装的归并业务异常，controller/store 需各自再处理，禁止全局吞掉 */
export class MergeServiceError extends Error {
  readonly code: MergeErrorCode;
  constructor(code: MergeErrorCode, message: string) {
    super(message);
    this.name = "MergeServiceError";
    this.code = code;
  }
}
