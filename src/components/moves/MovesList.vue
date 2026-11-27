<script setup>
import { computed, nextTick, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  History,
  Loader2,
  RefreshCw,
  Search,
  SearchX,
  X,
} from '@lucide/vue'
import { FlexRender, useTable } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/utils/date'
import { formatMoveType, formatMoveReason } from '@/utils/inventoryMoves'
import { formatUnitStatus } from '@/utils/productUnits'
import { columns } from '@/components/moves/columns'
import { features } from '@/components/common/tableFeatures'
import TableSortDropdown from '@/components/common/TableSortDropdown.vue'
import TableFacetedFilters from '@/components/common/TableFacetedFilters.vue'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'
import MovesCardSkeleton from '@/components/moves/MovesCardSkeleton.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: null },
  search: { type: String, default: '' },
  dateRange: {
    type: Object,
    default: () => ({ preset: 'all', from: null, to: null }),
  },
  facets: { type: Object, default: null },
  sorting: { type: Array, default: () => [] },
  columnFilters: { type: Array, default: () => [] },
  pageIndex: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 },
  pageCount: { type: Number, default: 0 },
})

const emit = defineEmits([
  'search-input',
  'clear-search',
  'refresh',
  'retry',
  'view-product',
  'view-unit',
  'sorting-change',
  'column-filters-change',
  'pagination-change',
  'date-range-change',
])

const isDesktop = useMediaQuery('(min-width: 768px)')

const inputRef = ref(null)

const movesPresets = [
  { value: 'all', label: 'Todo el historial' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
]

const TYPE_STYLES = {
  entry: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  exit: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  adjustment: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
}

const sortOptions = [
  { label: 'Fecha: más recientes', columnId: 'created_at', desc: true },
  { label: 'Fecha: más antiguos', columnId: 'created_at', desc: false, separator: true },
  { label: 'Producto: A-Z', columnId: 'product_name', desc: false },
  { label: 'Producto: Z-A', columnId: 'product_name', desc: true, separator: true },
  { label: 'Tipo: A-Z', columnId: 'type', desc: false },
  { label: 'Tipo: Z-A', columnId: 'type', desc: true, separator: true },
  { label: 'Usuario: A-Z', columnId: 'profile_id', desc: false },
  { label: 'Usuario: Z-A', columnId: 'profile_id', desc: true },
]

const filterableColumns = [
  { columnId: 'type', label: 'Tipo' },
  { columnId: 'reason', label: 'Razón' },
  { columnId: 'profile_id', label: 'Usuario' },
]

const serverFacetGroups = computed(() => {
  if (!props.facets) {
    return null
  }

  return [
    { columnId: 'type', options: props.facets.type ?? [] },
    { columnId: 'reason', options: props.facets.reason ?? [] },
    { columnId: 'profile_id', options: props.facets.profile ?? [] },
  ]
})

const tableState = computed(() => ({
  sorting: props.sorting,
  columnFilters: props.columnFilters,
  pagination: {
    pageIndex: props.pageIndex,
    pageSize: props.pageSize,
  },
}))

const table = useTable({
  features,
  get data() {
    return props.rows
  },
  columns,
  enableMultiSort: false,
  initialState: {
    sorting: [{ id: 'created_at', desc: true }],
  },
  state: tableState,
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  pageCount: computed(() => props.pageCount),
  onSortingChange: (updater) => emit('sorting-change', updater),
  onColumnFiltersChange: (updater) => emit('column-filters-change', updater),
  onPaginationChange: (updater) => emit('pagination-change', updater),
  meta: {
    onViewProduct: (productId) => emit('view-product', productId),
    onViewUnit: (unitId) => emit('view-unit', unitId),
  },
})

const hasSearch = computed(() => props.search.trim().length > 0)

const hasActiveFilters = computed(
  () =>
    filterableColumns.reduce((total, { columnId }) => {
      const value = table.getColumn(columnId)?.getFilterValue()

      return total + (Array.isArray(value) ? value.length : 0)
    }, 0) > 0,
)
const hasQuery = computed(() => hasSearch.value || hasActiveFilters.value)
const isAllDateRange = computed(() => (props.dateRange?.preset ?? 'all') === 'all')
const emptyTitle = computed(() => {
  if (hasQuery.value) {
    return 'No se encontraron movimientos'
  }

  return isAllDateRange.value
    ? 'Aún no hay movimientos'
    : 'No hay movimientos en el rango seleccionado'
})
const emptyDescription = computed(() => {
  if (hasQuery.value) {
    return 'Ajusta los filtros o la búsqueda.'
  }

  return isAllDateRange.value
    ? 'Los registros de entradas, salidas y ajustes aparecerán aquí.'
    : 'Prueba con otro rango de fechas.'
})

function clearAll() {
  table.resetColumnFilters()
  table.setPageIndex(0)

  if (hasSearch.value) {
    emit('clear-search')
  }
}

function handleClearSearch() {
  emit('clear-search')
  nextTick(() => inputRef.value?.$el?.focus?.())
}

function sortIcon(column) {
  if (!column.getCanSort()) {
    return null
  }

  const state = column.getIsSorted()

  if (state === 'asc') {
    return ArrowUp
  }
  if (state === 'desc') {
    return ArrowDown
  }

  return ArrowUpDown
}

function referenceText(row) {
  if (row.sale_id) {
    return `Venta #${row.sale_id.slice(0, 8)}`
  }

  if (row.return_id) {
    return `Devolución #${row.return_id.slice(0, 8)}`
  }

  if (row.note) {
    return row.note
  }

  return 'Sin ref/nota'
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 lg:h-[calc(100dvh-5rem)] lg:flex-none lg:overflow-hidden"
    >
      <!-- Error message -->
      <div v-if="error" class="flex flex-1 flex-col items-center justify-center text-center">
        <div class="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
          <CircleAlert />
        </div>
        <h3 class="text-sm font-semibold">{{ error }}</h3>
        <p class="text-muted-foreground mt-1 mb-2 max-w-sm text-xs">Inténtalo nuevamente</p>
        <Button variant="outline" size="sm" :disabled="isLoading" @click="emit('retry')">
          <Loader2 v-if="isLoading" class="animate-spin" />
          <span class="lg:text-xs">Reintentar</span>
        </Button>
      </div>
      <template v-else>
        <!-- Toolbar -->
        <div class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 lg:flex-nowrap">
          <!-- Search -->
          <div class="relative w-full">
            <Search class="text-muted-foreground absolute top-2 left-2.5 h-4 w-4" />
            <Input
              ref="inputRef"
              :model-value="search"
              placeholder="Buscar producto, usuario o unidad..."
              class="h-8 pr-8 pl-8 text-[13px]! text-ellipsis lg:text-xs!"
              @update:model-value="emit('search-input', $event)"
            />
            <Button
              v-if="search"
              variant="ghost"
              size="icon"
              class="absolute top-1 right-1 h-6 w-6 rounded-full"
              aria-label="Limpiar búsqueda"
              @click="handleClearSearch"
            >
              <X class="h-3.5 w-3.5" />
            </Button>
          </div>
          <!-- Date range -->
          <DateRangeFilter
            :model-value="dateRange"
            :presets="movesPresets"
            @update:model-value="emit('date-range-change', $event)"
          />
          <!-- Refresh -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="shrink-0 p-2!"
                :disabled="isLoading"
                aria-label="Actualizar movimientos"
                @click="emit('refresh')"
              >
                <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Actualizar movimientos</p></TooltipContent>
          </Tooltip>
          <!-- Filters -->
          <TableFacetedFilters
            :table="table"
            :filterable-columns="filterableColumns"
            :facets="serverFacetGroups"
          />
          <!-- Sort (mobile) -->
          <TableSortDropdown v-if="!isDesktop" :table="table" :options="sortOptions" />
        </div>
        <!-- Desktop view -->
        <div
          v-if="isDesktop"
          class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border"
        >
          <div class="relative isolate flex-1 overflow-auto">
            <Table class="border-separate border-spacing-0">
              <TableHeader class="sticky top-0 z-10">
                <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                  <TableHead
                    v-for="header in headerGroup.headers"
                    :key="header.id"
                    :class="[
                      header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                      header.column.columnDef.meta?.cellClass || '',
                      'bg-background/95 border-b backdrop-blur',
                    ]"
                    @click="header.column.getToggleSortingHandler()?.($event)"
                  >
                    <div
                      class="flex items-center gap-1"
                      :class="header.column.columnDef.meta?.headerClass || 'justify-start'"
                    >
                      <FlexRender v-if="!header.isPlaceholder" :header="header" />
                      <component
                        :is="sortIcon(header.column)"
                        v-if="sortIcon(header.column)"
                        class="h-3.5 w-3.5"
                      />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <!-- Skeleton -->
                <template v-if="isLoading">
                  <TableRow v-for="row in pageSize" :key="`sk-${row}`">
                    <TableCell
                      v-for="col in columns"
                      :key="col.id || col.accessorKey"
                      :class="[col.meta?.cellClass || '', 'border-b']"
                    >
                      <Skeleton :class="col.meta?.skeletonClass || 'h-4 w-16'" />
                    </TableCell>
                  </TableRow>
                </template>
                <!-- Data -->
                <template v-else-if="table.getRowModel().rows?.length">
                  <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                    <TableCell
                      v-for="cell in row.getAllCells()"
                      :key="cell.id"
                      :class="[cell.column.columnDef.meta?.cellClass || '', 'border-b']"
                    >
                      <FlexRender :cell="cell" />
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
            <!-- Empty state -->
            <div
              v-if="!isLoading && !table.getRowModel().rows?.length"
              class="absolute inset-x-0 top-10 bottom-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <div class="bg-muted text-muted-foreground mb-4 rounded-full p-3">
                <SearchX v-if="hasQuery" class="h-9 w-9" />
                <History v-else class="h-9 w-9" />
              </div>
              <h3 class="text-sm font-semibold">{{ emptyTitle }}</h3>
              <p class="text-muted-foreground max-w-xs text-xs">{{ emptyDescription }}</p>
              <Button
                v-if="hasQuery"
                variant="outline"
                size="sm"
                class="mt-3 text-xs"
                @click="clearAll"
              >
                {{ hasSearch ? 'Limpiar búsqueda' : 'Limpiar filtros' }}
              </Button>
            </div>
          </div>
        </div>
        <!-- Mobile view -->
        <div v-else class="flex min-h-0 flex-1 flex-col gap-4">
          <!-- Skeleton -->
          <template v-if="isLoading">
            <MovesCardSkeleton v-for="c in pageSize" :key="`sk-m-${c}`" />
          </template>
          <!-- Data -->
          <template v-else-if="table.getRowModel().rows?.length">
            <Card v-for="row in table.getRowModel().rows" :key="row.id" class="py-0">
              <CardContent class="flex flex-col gap-2 p-4 text-xs">
                <!-- Fecha -->
                <div class="flex min-w-0 items-center gap-2">
                  <span class="text-muted-foreground shrink-0">Fecha:</span>
                  <span>
                    {{ formatDateTime(row.original.created_at) }}
                  </span>
                </div>
                <!-- Product -->
                <div class="flex min-w-0 items-center gap-2">
                  <span class="text-muted-foreground shrink-0">Producto:</span>
                  <!-- Name -->
                  <div class="flex min-w-0 flex-1 items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          class="min-w-0 flex-1 truncate text-left"
                          :class="!row.original.product_name ? 'text-muted-foreground italic' : ''"
                          @click="emit('view-product', row.original.product_id)"
                        >
                          {{ row.original.product_name || 'Producto sin nombre' }}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent v-if="row.original.product_name" class="max-w-xs">
                        <p>{{ row.original.product_name }}</p>
                      </TooltipContent>
                    </Tooltip>
                    <!-- Status (dot) -->
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button class="inline-flex shrink-0 items-center justify-center p-1">
                          <span
                            class="block h-2 w-2 shrink-0 rounded-full"
                            :class="
                              row.original.product_is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            "
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ row.original.product_is_active ? 'Activo' : 'Inactivo' }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <!-- Unit -->
                <div class="flex min-w-0 items-center gap-2">
                  <span class="text-muted-foreground shrink-0">Unidad:</span>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        v-if="row.original.product_unit_id"
                        class="min-w-0 flex-1 truncate text-left font-mono"
                        @click="emit('view-unit', row.original.product_unit_id)"
                      >
                        {{ row.original.product_unit_id.slice(0, 8) }}
                      </button>
                      <span v-else class="text-muted-foreground italic">Sin unidad</span>
                    </TooltipTrigger>
                    <TooltipContent v-if="row.original.product_unit_id">
                      <p>{{ row.original.product_unit_id }}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <!-- Type -->
                <div class="flex min-w-0 items-center gap-2">
                  <span class="text-muted-foreground shrink-0">Tipo:</span>
                  <Badge
                    variant="outline"
                    class="text-[10px]"
                    :class="TYPE_STYLES[row.original.type] ?? ''"
                  >
                    {{ formatMoveType(row.original.type) }}
                  </Badge>
                </div>
                <!-- Reason -->
                <div class="flex min-w-0 items-center gap-2">
                  <span class="text-muted-foreground shrink-0">Razón:</span>
                  <span
                    class="min-w-0 flex-1 truncate"
                    :class="!row.original.reason ? 'text-muted-foreground italic' : ''"
                  >
                    {{ row.original.reason ? formatMoveReason(row.original.reason) : 'Sin razón' }}
                  </span>
                </div>
                <!-- Status change -->
                <div class="flex min-w-0 items-center gap-2">
                  <span class="text-muted-foreground shrink-0">Cambio:</span>
                  <div class="flex min-w-0 items-center gap-1">
                    <template v-if="!row.original.new_status">
                      <span class="text-muted-foreground italic">Sin cambio</span>
                    </template>
                    <template v-else>
                      <span
                        :class="!row.original.previous_status ? 'text-muted-foreground italic' : ''"
                      >
                        {{
                          row.original.previous_status
                            ? formatUnitStatus(row.original.previous_status)
                            : 'Nuevo'
                        }}
                      </span>
                      <ArrowRight class="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{{ formatUnitStatus(row.original.new_status) }}</span>
                    </template>
                  </div>
                </div>
                <!-- User -->
                <div class="flex min-w-0 items-baseline gap-2">
                  <span class="text-muted-foreground shrink-0">Usuario:</span>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        class="min-w-0 flex-1 truncate text-left"
                        :class="!row.original.profile_name ? 'text-muted-foreground italic' : ''"
                      >
                        {{ row.original.profile_name || 'Usuario inactivo' }}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ row.original.profile_name || 'Usuario inactivo' }}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <!-- Ref/note -->
                <div class="flex min-w-0 items-baseline gap-2">
                  <span class="text-muted-foreground shrink-0">Ref/Nota:</span>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        class="min-w-0 flex-1 truncate text-left"
                        :class="
                          referenceText(row.original) === 'Sin ref/nota'
                            ? 'text-muted-foreground italic'
                            : ''
                        "
                      >
                        {{ referenceText(row.original) }}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent class="max-w-xs">
                      <p class="wrap-break-word whitespace-pre-wrap">
                        {{ referenceText(row.original) }}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </template>
          <!-- Empty state -->
          <div
            v-if="!isLoading && !table.getRowModel().rows?.length"
            class="flex flex-1 flex-col items-center justify-center px-6 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
              <SearchX v-if="hasQuery" class="h-9 w-9" />
              <History v-else class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">{{ emptyTitle }}</h3>
            <p class="text-muted-foreground max-w-xs text-xs">{{ emptyDescription }}</p>
            <Button
              v-if="hasQuery"
              variant="outline"
              size="sm"
              class="mt-3 text-xs"
              @click="clearAll"
            >
              {{ hasSearch ? 'Limpiar búsqueda' : 'Limpiar filtros' }}
            </Button>
          </div>
        </div>
        <!-- Pagination -->
        <div
          v-if="!isLoading && rows.length && pageCount > 1"
          class="flex shrink-0 items-center justify-between pb-4 lg:pb-0"
        >
          <p class="text-muted-foreground text-xs">
            Página {{ pageIndex + 1 }} de {{ Math.max(pageCount, 1) }}
          </p>
          <div class="flex items-center justify-center gap-2">
            <!-- Previous -->
            <Button
              variant="outline"
              size="sm"
              :disabled="pageIndex <= 0"
              class="gap-0.5"
              @click="emit('pagination-change', { pageIndex: pageIndex - 1, pageSize })"
            >
              <ChevronLeft class="mt-0.5 h-4 w-4" />
              <span class="pr-1 text-xs">Anterior</span>
            </Button>
            <!-- Next -->
            <Button
              variant="outline"
              size="sm"
              :disabled="pageIndex >= pageCount - 1"
              class="gap-0.5"
              @click="emit('pagination-change', { pageIndex: pageIndex + 1, pageSize })"
            >
              <span class="ml-1 text-xs">Siguiente</span>
              <ChevronRight class="mt-0.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </template>
    </div>
  </TooltipProvider>
</template>
