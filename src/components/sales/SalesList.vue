<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  ShoppingBag,
  X,
} from '@lucide/vue'
import { FlexRender, useTable } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { columns, saleItemsPreview } from '@/components/sales/columns'
import { features } from '@/components/common/tableFeatures'
import TableFacetedFilters from '@/components/common/TableFacetedFilters.vue'
import TableSortDropdown from '@/components/common/TableSortDropdown.vue'
import SalesCardSkeleton from '@/components/sales/SalesCardSkeleton.vue'
import { formatDateTimeLaPaz } from '@/utils/date'
import { countReturnedUnits, formatReturnedUnitsCount } from '@/utils/returns'
import { formatItemsCount, formatPaymentMethod, formatSaleTotal } from '@/utils/sales'
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps({
  sales: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: null },
  search: { type: String, default: '' },
  showNewSale: { type: Boolean, default: true },
})

const emit = defineEmits([
  'search-input',
  'clear-search',
  'refresh',
  'retry',
  'open-sale',
  'new-sale',
])

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const inputRef = ref(null)

const table = useTable({
  features,
  get data() {
    return props.sales
  },
  columns,
  enableMultiSort: false,
  globalFilterFn: 'includesStringNormalized',
  initialState: {
    sorting: [{ id: 'created_at', desc: true }],
    pagination: {
      pageIndex: 0,
      pageSize: isDesktop.value ? 15 : 10,
    },
  },
})

watch(
  () => props.sales,
  () => table.setPageIndex(0),
)

const hasSearch = computed(() => props.search.trim().length > 0)

const sortOptions = [
  { label: 'Fecha: más recientes', columnId: 'created_at', desc: true },
  { label: 'Fecha: más antiguos', columnId: 'created_at', desc: false, separator: true },
  { label: 'Total: menor primero', columnId: 'total_amount', desc: false },
  { label: 'Total: mayor primero', columnId: 'total_amount', desc: true },
]

const filterableColumns = [
  {
    columnId: 'payment_method',
    label: 'Pago',
    getOptionLabel: (value) => formatPaymentMethod(value || null),
    emptyLabel: 'Cambio',
  },
  {
    columnId: 'return_status',
    label: 'Devolución',
    getOptionLabel: (value) => (value === 'with_returns' ? 'Con devoluciones' : 'Sin devoluciones'),
  },
  {
    columnId: 'profile_name',
    label: 'Usuario',
    useOriginalCasing: true,
    emptyLabel: 'Sin usuario',
  },
]

const hasActiveFilters = computed(
  () =>
    filterableColumns.reduce((total, { columnId }) => {
      const value = table.getColumn(columnId)?.getFilterValue()

      return total + (Array.isArray(value) ? value.length : 0)
    }, 0) > 0,
)
const hasQuery = computed(() => hasSearch.value || hasActiveFilters.value)

function clearAll() {
  table.resetColumnFilters()
  table.setPageIndex(0)

  if (hasSearch.value) {
    emit('clear-search')
  }
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

function handleClearSearch() {
  emit('clear-search')
  nextTick(() => inputRef.value?.$el?.focus?.())
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 pb-6 lg:h-[calc(100dvh-8rem)] lg:flex-none lg:overflow-hidden lg:pb-0"
    >
      <!-- Error message -->
      <div v-if="error" class="flex flex-1 flex-col items-center justify-center text-center">
        <div class="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
          <CircleAlert />
        </div>
        <h3 class="text-sm font-semibold">{{ error }}</h3>
        <p class="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">Inténtalo nuevamente</p>
        <Button variant="outline" size="sm" :disabled="isLoading" @click="emit('retry')">
          <Loader2 v-if="isLoading" class="animate-spin" />
          <span class="lg:text-xs">Reintentar</span>
        </Button>
      </div>
      <template v-else>
        <!-- Toolbar -->
        <div class="flex shrink-0 items-center justify-between gap-2">
          <!-- Search -->
          <div class="relative w-full">
            <Search class="text-muted-foreground absolute top-2 left-2.5 h-4 w-4" />
            <Input
              ref="inputRef"
              :model-value="search"
              placeholder="Buscar producto, color o talla..."
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
          <!-- Period badge -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Badge
                variant="outline"
                tabindex="0"
                class="text-muted-foreground h-8 shrink-0 gap-2 rounded-md px-2.5 text-xs font-normal select-none"
              >
                <Clock class="h-3 w-3" />
                24 h
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>Ventas de las últimas 24 horas</p></TooltipContent>
          </Tooltip>
          <!-- Refresh -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="shrink-0 p-2!"
                :disabled="isLoading"
                aria-label="Actualizar ventas"
                @click="emit('refresh')"
              >
                <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Actualizar ventas</p></TooltipContent>
          </Tooltip>
          <!-- Filters -->
          <TableFacetedFilters :table="table" :filterable-columns="filterableColumns" />
          <!-- Sort (mobile) -->
          <TableSortDropdown v-if="!isDesktop" :table="table" :options="sortOptions" />
          <!-- New sale (desktop) -->
          <Button
            v-if="isDesktop && showNewSale && can('sales:create')"
            size="sm"
            :disabled="isLoading"
            @click="emit('new-sale')"
          >
            <Plus class="h-4 w-4" />
            <span class="text-xs">Nueva venta</span>
          </Button>
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
                  <TableRow v-for="row in 15" :key="`sk-${row}`">
                    <TableCell
                      v-for="column in columns"
                      :key="column.id || column.accessorKey"
                      :class="[column.meta?.cellClass || '', 'border-b']"
                    >
                      <Skeleton :class="column.meta?.skeletonClass || 'h-4 w-16'" />
                    </TableCell>
                  </TableRow>
                </template>
                <!-- Data -->
                <template v-else-if="table.getRowModel().rows?.length">
                  <TableRow
                    v-for="row in table.getRowModel().rows"
                    :key="row.id"
                    class="cursor-pointer"
                    @click="emit('open-sale', row.original)"
                  >
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
              <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
                <SearchX v-if="hasQuery" class="h-8 w-8" />
                <ShoppingBag v-else class="h-8 w-8" />
              </div>
              <h3 class="text-xs font-semibold">
                {{
                  hasQuery ? 'No se encontraron ventas' : 'No hay ventas en las últimas 24 horas'
                }}
              </h3>
              <p class="text-muted-foreground max-w-xs text-xs">
                {{
                  hasQuery
                    ? 'Ajusta los filtros o la búsqueda.'
                    : 'Las ventas registradas aparecerán aquí.'
                }}
              </p>
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
            <SalesCardSkeleton v-for="card in 10" :key="`sk-card-${card}`" />
          </template>
          <!-- Data -->
          <template v-else-if="table.getRowModel().rows?.length">
            <Card
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-muted/50 cursor-pointer py-0 transition-colors"
              @click="emit('open-sale', row.original)"
            >
              <CardContent class="flex flex-col gap-1 p-4">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-muted-foreground text-xs">
                    {{ formatDateTimeLaPaz(row.original.created_at) }}
                  </span>
                  <span class="shrink-0 text-sm font-semibold tabular-nums">
                    {{ formatSaleTotal(row.original.total_amount) }}
                  </span>
                </div>
                <p class="truncate text-sm">{{ saleItemsPreview(row.original) }}</p>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-muted-foreground min-w-0 truncate text-xs">
                    {{ formatItemsCount(row.original.items_count) }} ·
                    {{ formatPaymentMethod(row.original.payment_method) }}
                    <template v-if="countReturnedUnits(row.original)">
                      · {{ formatReturnedUnitsCount(countReturnedUnits(row.original)) }}
                    </template>
                  </span>
                  <ChevronRight class="text-muted-foreground h-4 w-4 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </template>
          <!-- Empty state -->
          <div
            v-else
            class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
              <SearchX v-if="hasQuery" class="h-9 w-9" />
              <ShoppingBag v-else class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">
              {{ hasQuery ? 'No se encontraron ventas' : 'No hay ventas en las últimas 24 horas' }}
            </h3>
            <p class="text-muted-foreground max-w-xs text-xs">
              {{
                hasQuery
                  ? 'Ajusta los filtros o la búsqueda.'
                  : 'Las ventas registradas aparecerán aquí.'
              }}
            </p>
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
          v-if="!isLoading && table.getRowModel().rows?.length && table.getPageCount() > 1"
          class="flex shrink-0 items-center justify-between"
        >
          <p class="text-muted-foreground text-xs">
            Página {{ table.atoms.pagination.get().pageIndex + 1 }} de
            {{ Math.max(table.getPageCount(), 1) }}
          </p>
          <div class="flex items-center justify-center gap-2">
            <!-- Previous -->
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanPreviousPage()"
              class="gap-0.5"
              @click="table.previousPage()"
            >
              <ChevronLeft class="mt-0.5 h-4 w-4" />
              <span class="pr-1 text-xs">Anterior</span>
            </Button>
            <!-- Next -->
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanNextPage()"
              class="gap-0.5"
              @click="table.nextPage()"
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
