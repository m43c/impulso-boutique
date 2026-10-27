<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCw,
  Search,
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
import { formatMoveType } from '@/utils/inventoryMoves'
import { columns } from '@/components/products/history/columns'
import { features } from '@/components/products/features'
import TableSortDropdown from '@/components/common/TableSortDropdown.vue'
import TableFacetedFilters from '@/components/common/TableFacetedFilters.vue'
import ProductHistoryCardSkeleton from '@/components/products/history/ProductHistoryCardSkeleton.vue'

const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['refresh'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const TYPE_STYLES = {
  entry: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  exit: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  adjustment: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
}

const sortOptions = [
  {
    label: 'Fecha: más recientes',
    columnId: 'created_at',
    desc: true,
  },
  {
    label: 'Fecha: más antiguos',
    columnId: 'created_at',
    desc: false,
    separator: true,
  },
  {
    label: 'Tipo: A-Z',
    columnId: 'type',
    desc: false,
  },
  {
    label: 'Tipo: Z-A',
    columnId: 'type',
    desc: true,
    separator: true,
  },
  {
    label: 'Responsable: A-Z',
    columnId: 'profile_name',
    desc: false,
  },
  {
    label: 'Responsable: Z-A',
    columnId: 'profile_name',
    desc: true,
  },
]

const filterableColumns = [
  {
    columnId: 'type',
    label: 'Tipo',
  },
  {
    columnId: 'reason',
    label: 'Razón',
  },
  {
    columnId: 'profile_name',
    label: 'Responsable',
  },
]

const table = useTable({
  features,
  get data() {
    return props.history
  },
  columns,
  enableMultiSort: false,
  globalFilterFn: 'includesStringNormalized',
  initialState: {
    pagination: { pageIndex: 0, pageSize: isDesktop.value ? 10 : 5 },
  },
})

const search = computed({
  get: () => table.atoms.globalFilter.get() ?? '',
  set: (value) => {
    table.setGlobalFilter(value)
    table.setPageIndex(0)
  },
})

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

function getReferenceText(row) {
  if (row.sale_id) {
    return `Venta #${row.sale_id.slice(0, 8)}`
  }

  if (row.return_id) {
    return `Devolución #${row.return_id.slice(0, 8)}`
  }

  if (row.note) {
    return row.note
  }

  return 'Sin referencia / nota'
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div class="flex h-full min-h-0 flex-1 flex-col">
      <!-- Toolbar -->
      <div class="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <!-- Search -->
        <div class="relative w-full">
          <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            v-model="search"
            placeholder="Buscar movimiento..."
            class="pl-8 text-sm"
            :disabled="isLoading"
          />
        </div>
        <!-- Refresh -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="shrink-0"
              :disabled="isLoading"
              aria-label="Actualizar movimientos"
              @click="emit('refresh')"
            >
              <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Actualizar historial</p></TooltipContent>
        </Tooltip>
        <!-- Filters -->
        <TableFacetedFilters :table="table" :filterable-columns="filterableColumns" />
        <!-- Sort (mobile) -->
        <TableSortDropdown v-if="!isDesktop" :table="table" :options="sortOptions" />
      </div>
      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <!-- Desktop view -->
        <template v-if="isDesktop">
          <Table>
            <TableHeader class="bg-background/95 sticky top-0 z-10 backdrop-blur">
              <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <TableHead
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  :class="[
                    header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                    header.column.columnDef.meta?.cellClass || '',
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
                  <TableCell v-for="col in columns" :key="col.id || col.accessorKey">
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
                    :class="cell.column.columnDef.meta?.cellClass"
                  >
                    <FlexRender :cell="cell" />
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </template>
        <!-- Mobile view -->
        <div v-else class="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <!-- Skeleton -->
          <template v-if="isLoading">
            <ProductHistoryCardSkeleton v-for="c in 5" :key="`sk-m-${c}`" />
          </template>
          <!-- Data -->
          <template v-else-if="table.getRowModel().rows?.length">
            <Card v-for="row in table.getRowModel().rows" :key="row.id" class="py-0">
              <CardContent class="flex flex-col gap-1.5 p-4 text-xs">
                <!-- Date -->
                <div class="flex min-w-0 items-baseline gap-1">
                  <span class="text-muted-foreground shrink-0">Fecha:</span>
                  <span class="font-medium whitespace-nowrap">
                    {{ formatDateTime(row.original.created_at) }}
                  </span>
                </div>
                <!-- Unit -->
                <div class="flex min-w-0 items-baseline gap-1">
                  <span class="text-muted-foreground shrink-0">Unidad:</span>
                  <span class="min-w-0 flex-1 truncate font-mono">
                    {{ row.original.product_unit_id || '-' }}
                  </span>
                </div>
                <!-- Move type -->
                <div class="flex min-w-0 items-center gap-1.5">
                  <span class="text-muted-foreground shrink-0">Tipo:</span>
                  <Badge
                    variant="outline"
                    class="text-[11px]"
                    :class="TYPE_STYLES[row.original.type] ?? ''"
                  >
                    {{ formatMoveType(row.original.type) }}
                  </Badge>
                </div>
                <!-- Assignee -->
                <div class="flex min-w-0 items-baseline gap-1">
                  <span class="text-muted-foreground shrink-0">Responsable:</span>
                  <Tooltip v-if="row.original.profile_name">
                    <TooltipTrigger as-child>
                      <span class="min-w-0 flex-1 cursor-default truncate">
                        {{ row.original.profile_name }}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ row.original.profile_name }}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span v-else class="text-muted-foreground">—</span>
                </div>
                <!-- Ref/Note -->
                <div class="flex min-w-0 items-baseline gap-1">
                  <span class="text-muted-foreground shrink-0">Ref/Nota:</span>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <span class="min-w-0 flex-1 cursor-default truncate">
                        {{ getReferenceText(row.original) }}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ getReferenceText(row.original) }}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </template>
          <!-- Empty -->
          <div
            v-if="!isLoading && !table.getRowModel().rows?.length"
            class="flex flex-1 flex-col items-center justify-center px-6 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-4 rounded-full p-3">
              <History class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">Aún no hay movimientos</h3>
            <p class="text-muted-foreground mt-1 max-w-xs text-xs">
              Los registros de entradas y ajustes aparecerán aquí.
            </p>
          </div>
        </div>
        <!-- Desktop Empty -->
        <div
          v-if="isDesktop && !isLoading && !table.getRowModel().rows?.length"
          class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
        >
          <div class="bg-muted text-muted-foreground mb-4 rounded-full p-3">
            <History class="h-9 w-9" />
          </div>
          <h3 class="text-sm font-semibold">Aún no hay movimientos</h3>
          <p class="text-muted-foreground mt-1 max-w-xs text-xs">
            Los registros de entradas y ajustes aparecerán aquí
          </p>
        </div>
      </div>
      <!-- Pagination -->
      <div
        v-if="table.getRowModel().rows?.length"
        class="flex shrink-0 items-center justify-between border-t px-3 py-2"
      >
        <p class="text-muted-foreground text-[13px]">
          Página {{ table.atoms.pagination.get().pageIndex + 1 }} de
          {{ Math.max(table.getPageCount(), 1) }}
        </p>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            class="gap-1"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            <ChevronLeft class="h-4 w-4" />
            <span class="pb-0.5 text-xs lg:text-sm">Anterior</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="gap-1"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
          >
            <span class="pb-0.5 text-xs lg:text-sm">Siguiente</span>
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>
