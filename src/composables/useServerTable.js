import { computed, onBeforeUnmount, ref, unref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

const DEFAULT_DATE_RANGE = {
  preset: '24h',
  from: null,
  to: null,
}

function normalizeDateRange(value) {
  if (!value) {
    return { ...DEFAULT_DATE_RANGE }
  }

  if (typeof value === 'string') {
    return { preset: value, from: null, to: null }
  }

  return {
    preset: value.preset ?? DEFAULT_DATE_RANGE.preset,
    from: value.from ?? null,
    to: value.to ?? null,
  }
}

function resolveUpdater(updater, current) {
  return typeof updater === 'function' ? updater(current) : updater
}

function isSameState(first, second) {
  return JSON.stringify(first) === JSON.stringify(second)
}

export function useServerTable({
  fetcher,
  buildParams = (state) => state,
  pageSize: pageSizeOption = 15,
  debounceMs: debounceMsOption = 300,
  initialSorting = [{ id: 'created_at', desc: true }],
  initialDateRange = DEFAULT_DATE_RANGE,
  errorMessage = 'No se pudieron cargar los datos',
}) {
  const rows = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const totalCount = ref(0)
  const facets = ref(null)

  const search = ref('')
  const sorting = ref([...initialSorting])
  const columnFilters = ref([])
  const dateRange = ref(normalizeDateRange(initialDateRange))
  const pageIndex = ref(0)

  const resolvedPageSize = computed(() => unref(pageSizeOption) ?? 15)
  const resolvedDebounceMs = computed(() => unref(debounceMsOption) ?? 300)
  const pageCount = computed(() =>
    resolvedPageSize.value > 0 ? Math.ceil(totalCount.value / resolvedPageSize.value) : 0,
  )

  const tableState = computed(() => ({
    sorting: sorting.value,
    columnFilters: columnFilters.value,
    pagination: {
      pageIndex: pageIndex.value,
      pageSize: resolvedPageSize.value,
    },
  }))

  let requestId = 0
  let searchVersion = 0

  function invalidateSearchDebounce() {
    searchVersion++
  }

  async function fetchPage() {
    const id = ++requestId

    isLoading.value = true
    error.value = null

    try {
      const params = buildParams({
        search: search.value,
        sorting: sorting.value,
        columnFilters: columnFilters.value,
        dateRange: dateRange.value,
        pageIndex: pageIndex.value,
        pageSize: resolvedPageSize.value,
      })

      const result = await fetcher(params)

      if (id !== requestId) {
        return
      }

      rows.value = result?.rows ?? []
      totalCount.value = Number(result?.totalCount ?? rows.value.length)
      facets.value = result?.facets ?? null

      const pages = pageCount.value

      if (pageIndex.value > 0 && (pages === 0 || pageIndex.value >= pages)) {
        pageIndex.value = Math.max(pages - 1, 0)

        return fetchPage()
      }
    } catch (e) {
      if (id !== requestId) {
        return
      }

      console.error('Error al cargar datos:', e)
      error.value = errorMessage
      rows.value = []
      totalCount.value = 0
      facets.value = null
    } finally {
      if (id === requestId) {
        isLoading.value = false
      }
    }
  }

  const debouncedSearch = useDebounceFn(
    (version) => {
      if (version !== searchVersion) {
        return
      }

      fetchPage()
    },
    () => resolvedDebounceMs.value,
  )

  function load() {
    return fetchPage()
  }

  function refresh() {
    invalidateSearchDebounce()

    return fetchPage()
  }

  function setSearch(value) {
    search.value = value

    const term = value.trim()

    if (term.length === 1) {
      invalidateSearchDebounce()

      return
    }

    pageIndex.value = 0
    debouncedSearch(++searchVersion)
  }

  function clearSearch() {
    invalidateSearchDebounce()
    search.value = ''
    pageIndex.value = 0

    return fetchPage()
  }

  function setDateRange(value) {
    const next = normalizeDateRange(value)

    if (isSameState(next, dateRange.value)) {
      return
    }

    invalidateSearchDebounce()
    dateRange.value = next
    pageIndex.value = 0

    return fetchPage()
  }

  function setSorting(updater) {
    const resolved = resolveUpdater(updater, sorting.value)
    const next = Array.isArray(resolved) && resolved.length > 0 ? resolved : [...initialSorting]

    if (isSameState(next, sorting.value)) {
      return
    }

    invalidateSearchDebounce()
    sorting.value = next
    pageIndex.value = 0

    return fetchPage()
  }

  function setColumnFilters(updater) {
    const next = resolveUpdater(updater, columnFilters.value)

    if (isSameState(next, columnFilters.value)) {
      return
    }

    invalidateSearchDebounce()
    columnFilters.value = next
    pageIndex.value = 0

    return fetchPage()
  }

  function setPageIndex(index) {
    const maxIndex = Math.max(pageCount.value - 1, 0)
    const next = Math.min(Math.max(index, 0), maxIndex)

    if (next === pageIndex.value) {
      return
    }

    invalidateSearchDebounce()
    pageIndex.value = next

    return fetchPage()
  }

  function setPagination(updater) {
    const current = {
      pageIndex: pageIndex.value,
      pageSize: resolvedPageSize.value,
    }
    const next = resolveUpdater(updater, current)

    if (!next || next.pageIndex === undefined) {
      return
    }

    return setPageIndex(next.pageIndex)
  }

  function nextPage() {
    return setPageIndex(pageIndex.value + 1)
  }

  function previousPage() {
    return setPageIndex(pageIndex.value - 1)
  }

  function resetColumnFilters() {
    if (columnFilters.value.length === 0) {
      return
    }

    invalidateSearchDebounce()
    columnFilters.value = []
    pageIndex.value = 0

    return fetchPage()
  }

  function resetAll() {
    invalidateSearchDebounce()
    search.value = ''
    sorting.value = [...initialSorting]
    columnFilters.value = []
    dateRange.value = normalizeDateRange(initialDateRange)
    pageIndex.value = 0

    return fetchPage()
  }

  watch(resolvedPageSize, () => {
    invalidateSearchDebounce()
    pageIndex.value = 0
    fetchPage()
  })

  onBeforeUnmount(() => {
    requestId++
    searchVersion++
  })

  return {
    rows,
    isLoading,
    error,
    totalCount,
    facets,
    pageCount,
    tableState,
    search,
    sorting,
    columnFilters,
    dateRange,
    pageIndex,
    pageSize: resolvedPageSize,
    load,
    refresh,
    setSearch,
    clearSearch,
    setDateRange,
    setSorting,
    setColumnFilters,
    setPagination,
    setPageIndex,
    nextPage,
    previousPage,
    resetColumnFilters,
    resetAll,
  }
}
