<script setup>
import { computed, onMounted } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import MovesList from '@/components/moves/MovesList.vue'
import { useServerTable } from '@/composables/useServerTable'
import { resolveLaPazDateRange } from '@/utils/date'

const router = useRouter()

const isDesktop = useMediaQuery('(min-width: 768px)')
const pageSize = computed(() => (isDesktop.value ? 12 : 5))
const searchDebounceMs = computed(() => (isDesktop.value ? 300 : 400))

function buildMovesParams(state) {
  const { from, to } = resolveLaPazDateRange(state.dateRange)
  const filters = state.columnFilters ?? []
  const filterValues = (columnId) => {
    const filter = filters.find((item) => item.id === columnId)

    return Array.isArray(filter?.value) ? filter.value : []
  }

  const types = filterValues('type')
  const reasons = filterValues('reason')
  const profileIds = filterValues('profile_id')
  const sort = state.sorting?.[0]
  const sortBy = sort?.id === 'profile_id' ? 'profile_name' : sort?.id || 'created_at'
  const sortDir = sort?.desc === false ? 'asc' : 'desc'

  return {
    p_search: state.search?.trim() || null,
    p_from: from ? from.toISOString() : null,
    p_to: to ? to.toISOString() : null,
    p_types: types.length ? types : null,
    p_reasons: reasons.length ? reasons : null,
    p_profile_ids: profileIds.length ? profileIds : null,
    p_sort_by: sortBy,
    p_sort_dir: sortDir,
    p_page_index: state.pageIndex,
    p_page_size: state.pageSize,
  }
}

async function fetchMovesPage(params) {
  const [pageResult, facetsResult] = await Promise.all([
    supabase.rpc('get_inventory_moves_page', params),
    supabase.rpc('get_inventory_moves_facets', {
      p_search: params.p_search,
      p_from: params.p_from,
      p_to: params.p_to,
      p_types: params.p_types,
      p_reasons: params.p_reasons,
      p_profile_ids: params.p_profile_ids,
    }),
  ])

  if (pageResult.error) {
    throw pageResult.error
  }

  if (facetsResult.error) {
    throw facetsResult.error
  }

  const rows = pageResult.data ?? []

  return {
    rows,
    totalCount: Number(rows[0]?.total_count ?? 0),
    facets: facetsResult.data ?? null,
  }
}

const {
  rows: movements,
  isLoading,
  error,
  search,
  facets,
  pageCount,
  dateRange,
  sorting,
  columnFilters,
  pageIndex,
  load: loadMovements,
  refresh,
  setSearch,
  clearSearch,
  setDateRange,
  setSorting,
  setColumnFilters,
  setPagination,
} = useServerTable({
  fetcher: fetchMovesPage,
  buildParams: buildMovesParams,
  pageSize,
  debounceMs: searchDebounceMs,
  initialSorting: [{ id: 'created_at', desc: true }],
  initialDateRange: { preset: 'all', from: null, to: null },
  errorMessage: 'No se pudieron cargar los movimientos',
})

onMounted(loadMovements)

function handleViewProduct(productId) {
  if (!productId) {
    return
  }

  router.push({ name: 'product-details', params: { id: productId } })
}

function handleViewUnit(unitId) {
  if (!unitId) {
    return
  }

  router.push({ name: 'unit-details', params: { id: unitId } })
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <MovesList
      :rows="movements"
      :is-loading="isLoading"
      :error="error"
      :search="search"
      :date-range="dateRange"
      :facets="facets"
      :sorting="sorting"
      :column-filters="columnFilters"
      :page-index="pageIndex"
      :page-size="pageSize"
      :page-count="pageCount"
      @search-input="setSearch"
      @clear-search="clearSearch"
      @refresh="refresh"
      @retry="refresh"
      @sorting-change="setSorting"
      @column-filters-change="setColumnFilters"
      @pagination-change="setPagination"
      @date-range-change="setDateRange"
      @view-product="handleViewProduct"
      @view-unit="handleViewUnit"
    />
  </div>
</template>
