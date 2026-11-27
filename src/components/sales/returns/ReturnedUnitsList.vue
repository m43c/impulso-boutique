<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  RefreshCw,
  Search,
  SearchX,
  Undo2,
  X,
} from '@lucide/vue'
import { FlexRender, useTable } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import ProductImage from '@/components/products/ProductImage.vue'
import ReturnUnitActions from '@/components/sales/returns/ReturnUnitActions.vue'
import { columns } from '@/components/sales/returns/columns'
import { features } from '@/components/common/tableFeatures'
import TableFacetedFilters from '@/components/common/TableFacetedFilters.vue'
import TableSortDropdown from '@/components/common/TableSortDropdown.vue'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { formatCurrency } from '@/utils/currency'
import { formatDateTimeLaPaz } from '@/utils/date'
import { formatReturnReason, formatReturnReplacement, formatReturnType } from '@/utils/returns'

const props = defineProps({
  units: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isReviewing: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const emit = defineEmits(['refresh', 'retry', 'approve', 'discard', 'reprint'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const inputRef = ref(null)

const sortOptions = [
  { label: 'Devuelta: más antiguas', columnId: 'return_created_at', desc: false },
  { label: 'Devuelta: más recientes', columnId: 'return_created_at', desc: true, separator: true },
  { label: 'Pago: menor primero', columnId: 'unit_price', desc: false },
  { label: 'Pago: mayor primero', columnId: 'unit_price', desc: true, separator: true },
  { label: 'Producto: A-Z', columnId: 'product_name', desc: false },
  { label: 'Producto: Z-A', columnId: 'product_name', desc: true },
]

const filterableColumns = [
  {
    columnId: 'return_type',
    label: 'Tipo',
    getOptionLabel: (value) => value,
  },
  {
    columnId: 'return_reason',
    label: 'Motivo',
    getOptionLabel: (value) => value,
  },
  {
    columnId: 'return_profile_name',
    label: 'Registró',
    useOriginalCasing: true,
    emptyLabel: 'Sin registrador',
  },
]

const table = useTable({
  features,
  get data() {
    return props.units
  },
  columns,
  enableMultiSort: false,
  globalFilterFn: 'includesStringNormalized',
  initialState: {
    sorting: [{ id: 'return_created_at', desc: false }],
    pagination: {
      pageIndex: 0,
      pageSize: isDesktop.value ? 10 : 5,
    },
  },
  meta: {
    isReviewing: () => props.isReviewing,
    onApprove: (unit) => emit('approve', unit),
    onDiscard: (unit) => emit('discard', unit),
    onReprint: (unit) => emit('reprint', unit),
  },
})

watch(
  () => props.units,
  () => table.setPageIndex(0),
)

const search = computed({
  get: () => table.atoms.globalFilter.get() ?? '',
  set: (value) => {
    table.setGlobalFilter(value)
    table.setPageIndex(0)
  },
})

const hasSearch = computed(() => search.value.trim().length > 0)
const hasActiveFilters = computed(
  () =>
    filterableColumns.reduce((total, { columnId }) => {
      const value = table.getColumn(columnId)?.getFilterValue()

      return total + (Array.isArray(value) ? value.length : 0)
    }, 0) > 0,
)
const hasQuery = computed(() => hasSearch.value || hasActiveFilters.value)

function clearAll() {
  table.setGlobalFilter('')
  table.resetColumnFilters()
  table.setPageIndex(0)
}

function handleClearSearch() {
  search.value = ''
  nextTick(() => inputRef.value?.$el?.focus?.())
}

function variantLabel(unit) {
  return [unit.color, unit.size].filter(Boolean).join(' · ')
}

function dateLabel(unit) {
  return unit.return_created_at ? formatDateTimeLaPaz(unit.return_created_at) : '—'
}

function replacementLabel(unit) {
  return formatReturnReplacement(unit)
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
              v-model="search"
              placeholder="Buscar producto, código o usuario"
              class="h-8 pr-8 pl-8 text-[13px]! text-ellipsis lg:text-xs!"
              :disabled="isLoading"
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
          <!-- Refresh -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="shrink-0 p-2!"
                :disabled="isLoading"
                aria-label="Actualizar devoluciones"
                @click="emit('refresh')"
              >
                <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Actualizar devoluciones</p></TooltipContent>
          </Tooltip>
          <!-- Filters -->
          <TableFacetedFilters :table="table" :filterable-columns="filterableColumns" />
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
                  <TableRow v-for="row in 10" :key="`sk-${row}`">
                    <TableCell
                      v-for="column in columns"
                      :key="column.id || column.accessorKey"
                      :class="[column.meta?.cellClass || '', 'border-b align-top']"
                    >
                      <Skeleton :class="column.meta?.skeletonClass || 'h-4 w-16'" />
                    </TableCell>
                  </TableRow>
                </template>
                <!-- Rows -->
                <template v-else-if="table.getRowModel().rows?.length">
                  <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                    <TableCell
                      v-for="cell in row.getAllCells()"
                      :key="cell.id"
                      :class="[cell.column.columnDef.meta?.cellClass || '', 'border-b align-top']"
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
                <CheckCircle2 v-else class="h-8 w-8" />
              </div>
              <h3 class="text-xs font-semibold">
                {{
                  hasQuery
                    ? 'No se encontraron devoluciones'
                    : 'No hay devoluciones pendientes de revisión'
                }}
              </h3>
              <p class="text-muted-foreground max-w-xs text-xs">
                {{
                  hasQuery
                    ? 'Ajusta los filtros o la búsqueda.'
                    : 'Las unidades devueltas aparecerán aquí hasta que las revises.'
                }}
              </p>
              <Button
                v-if="hasQuery"
                variant="outline"
                size="sm"
                class="mt-3 text-xs"
                @click="clearAll"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
        <!-- Mobile view -->
        <div v-else class="flex min-h-0 flex-1 flex-col gap-4">
          <!-- Skeleton -->
          <template v-if="isLoading">
            <Card v-for="card in 5" :key="`sk-card-${card}`" class="py-0">
              <CardContent class="flex flex-col gap-3 p-4">
                <div class="flex items-start gap-3">
                  <Skeleton class="h-12 w-12 rounded-md" />
                  <div class="flex flex-1 flex-col gap-1">
                    <Skeleton class="h-3.5 w-56" />
                    <Skeleton class="h-3 w-28" />
                    <Skeleton class="h-3 w-20" />
                  </div>
                  <Skeleton class="h-6 w-6 rounded-full" />
                </div>
                <div class="flex justify-between gap-2">
                  <div class="flex flex-col gap-1.5">
                    <Skeleton class="h-3.5 w-40" />
                    <Skeleton class="h-3 w-32" />
                  </div>
                  <Skeleton class="h-5 w-20" />
                </div>
                <Skeleton class="h-3 w-60" />
                <Skeleton class="h-4 w-24" />
              </CardContent>
            </Card>
          </template>
          <!-- Data -->
          <template v-else-if="table.getRowModel().rows?.length">
            <Card v-for="row in table.getRowModel().rows" :key="row.id" class="py-0">
              <CardContent class="flex flex-col gap-2 p-4">
                <div class="flex items-start gap-3">
                  <!-- Image -->
                  <ProductImage
                    :public-id="row.original.image_public_id"
                    :alt="row.original.product_name"
                    :size="IMAGE_SIZES.thumb"
                    image-class="h-12 w-12 shrink-0 rounded-md object-cover"
                    fallback-class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
                  />
                  <div class="-mt-0.5 min-w-0 flex-1">
                    <!-- Product name + status -->
                    <div class="flex items-start gap-1.5">
                      <!-- Product name -->
                      <p class="truncate text-xs font-medium">{{ row.original.product_name }}</p>
                      <!-- status -->
                      <Badge
                        v-if="row.original.product_is_active === false"
                        variant="outline"
                        class="shrink-0 border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-400"
                      >
                        Inactivo
                      </Badge>
                    </div>
                    <!-- Color + size -->
                    <p
                      v-if="variantLabel(row.original)"
                      class="text-muted-foreground truncate text-xs"
                    >
                      {{ variantLabel(row.original) }}
                    </p>
                    <!-- Unit code -->
                    <p class="text-muted-foreground font-mono text-[11px]">
                      {{ row.original.unit_code }}
                    </p>
                  </div>
                  <ReturnUnitActions
                    :unit="row.original"
                    :reviewing="() => isReviewing"
                    :on-approve="() => emit('approve', row.original)"
                    :on-discard="() => emit('discard', row.original)"
                    :on-reprint="() => emit('reprint', row.original)"
                    trigger-class="-mt-1 -mr-2.5 h-8 w-8"
                  />
                </div>
                <!-- Date + reason -->
                <div class="flex items-center justify-between gap-2">
                  <!-- Date -->
                  <span class="text-xs">Devuelta {{ dateLabel(row.original) }}</span>
                  <!-- Return type -->
                  <Badge
                    variant="outline"
                    class="text-[11px]"
                    :class="
                      row.original.return_type === 'exchange'
                        ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    "
                  >
                    {{ formatReturnType(row.original.return_type) }}
                  </Badge>
                </div>
                <!-- Return reason -->
                <p class="text-muted-foreground -mt-2.5 text-xs">
                  {{ formatReturnReason(row.original.return_reason) }}
                </p>
                <!-- Exchange -->
                <div>
                  <p v-if="replacementLabel(row.original)" class="text-muted-foreground text-xs">
                    {{ replacementLabel(row.original) }}
                  </p>
                  <!-- User -->
                  <p v-if="row.original.return_profile_name" class="text-muted-foreground text-xs">
                    Registró: {{ row.original.return_profile_name }}
                  </p>
                </div>
                <!-- Price -->
                <p class="text-xs font-medium tabular-nums">
                  Pagó {{ formatCurrency(row.original.unit_price) }}
                </p>
                <!-- Note -->
                <p v-if="row.original.return_note" class="text-muted-foreground text-xs italic">
                  Nota: {{ row.original.return_note }}
                </p>
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
              <Undo2 v-else class="h-9 w-9" />
            </div>
            <h3 class="text-xs font-semibold">
              {{
                hasQuery
                  ? 'No se encontraron devoluciones'
                  : 'No hay devoluciones pendientes de revisión'
              }}
            </h3>
            <p class="text-muted-foreground max-w-xs text-xs">
              {{
                hasQuery
                  ? 'Ajusta los filtros o la búsqueda.'
                  : 'Las unidades devueltas aparecerán aquí hasta que las revises.'
              }}
            </p>
            <Button
              v-if="hasQuery"
              variant="outline"
              size="sm"
              class="mt-3 text-xs"
              @click="clearAll"
            >
              Limpiar filtros
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
