import { computed, ref, toValue, type MaybeRefOrGetter } from "vue";

/** 简单分页 hook，行源支持响应式 ref/getter */
export function useLocalStorageState<T>(rows: MaybeRefOrGetter<T[]> = []) {
  const page = ref(1);
  const pageSize = ref(8);
  const allRows = computed(() => toValue(rows));
  const pageRows = computed(() =>
    allRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
  );
  const totalPages = computed(() => Math.max(1, Math.ceil(allRows.value.length / pageSize.value)));
  return { page, pageSize, pageRows, totalPages, total: computed(() => allRows.value.length) };
}
