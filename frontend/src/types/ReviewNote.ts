export interface ReviewNote {
  id: number;
  diff_result_id: number;
  tag: string;
  comment: string;
  reviewer: string;
  status: string;
  /** 归并确认后，原差异上的处理记录会转到归并项；非空表示该记录现归属哪个归并组 */
  moved_to_merge_id: number | null;
  created_at?: string;
}
