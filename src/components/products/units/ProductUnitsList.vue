<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import QrcodeVue from 'qrcode.vue'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Eye,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from '@lucide/vue'
import { FlexRender, useTable } from '@tanstack/vue-table'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/utils/date'
import { formatUnitStatus } from '@/utils/productUnits'
import { formatMoveReason } from '@/utils/inventoryMoves'
import { columns } from '@/components/products/units/columns'
import { features } from '@/components/products/features'
import ProductUnitsCardSkeleton from '@/components/products/units/skeletons/ProductUnitsCardSkeleton.vue'
import TableSortDropdown from '@/components/common/TableSortDropdown.vue'
import TableFacetedFilters from '@/components/common/TableFacetedFilters.vue'
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps({
  units: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  highlightIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['add-units', 'view-qr', 'refresh', 'register-exit', 'reactivate-unit'])

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const STATUS_STYLES = {
  available: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  sold: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  returned: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  unavailable: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
}

const sortOptions = [
  { label: 'Unidad: A-Z', columnId: 'code', desc: false },
  { label: 'Unidad: Z-A', columnId: 'code', desc: true, separator: true },
  { label: 'Fecha: más recientes', columnId: 'created_at', desc: true },
  { label: 'Fecha: más antiguos', columnId: 'created_at', desc: false, separator: true },
  { label: 'Origen: A-Z', columnId: 'origin', desc: false },
  { label: 'Origen: Z-A', columnId: 'origin', desc: true },
]

const filterableColumns = [
  { columnId: 'status', label: 'Estado', getOptionLabel: formatUnitStatus },
  { columnId: 'origin', label: 'Origen' },
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
    pagination: {
      pageIndex: 0,
      pageSize: isDesktop.value ? 10 : 5,
    },
  },
  meta: {
    onViewQr: (unit) => emit('view-qr', unit),
    onRegisterExit: (unit) => emit('register-exit', unit),
    onReactivateUnit: (unit) => emit('reactivate-unit', unit),
    // Permissions
    canRegisterExit: () => can('inventory:register-exit'),
    canReactivateUnit: () => can('inventory:reactivate-unit'),
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

function isHighlighted(unit) {
  return props.highlightIds.includes(unit.id)
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
            placeholder="Buscar unidad..."
            class="pl-8 text-sm"
            :disabled="isLoading"
          />
        </div>
        <!-- Refresh button -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              :disabled="isLoading"
              aria-label="Actualizar unidades"
              @click="emit('refresh')"
            >
              <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Actualizar unidades</p>
          </TooltipContent>
        </Tooltip>
        <!-- Filters (NUEVO) -->
        <TableFacetedFilters :table="table" :filterable-columns="filterableColumns" />
        <!-- Sort Dropdown (Mobile) -->
        <TableSortDropdown v-if="!isDesktop" :table="table" :options="sortOptions" />
        <!-- Add product units button -->
        <Button
          v-if="can('inventory:register-entry')"
          class="hidden gap-2 pb-0.5 md:flex"
          size="sm"
          :disabled="isLoading"
          @click="emit('add-units')"
        >
          <Boxes class="h-4 w-4" />
          Agregar unidades
        </Button>
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
                <TableRow v-for="row in 10" :key="`skeleton-${row}`">
                  <TableCell
                    v-for="column in columns"
                    :key="column.id || column.accessorKey"
                    :class="column.meta?.cellClass || ''"
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
                  :class="isHighlighted(row.original) ? 'bg-zinc-500/6' : ''"
                >
                  <TableCell
                    v-for="cell in row.getAllCells()"
                    :key="cell.id"
                    :class="cell.column.columnDef.meta?.cellClass || ''"
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
            <ProductUnitsCardSkeleton v-for="card in 5" :key="`skeleton-card-${card}`" />
          </template>
          <!-- Data -->
          <Card
            v-for="row in table.getRowModel().rows"
            v-else-if="table.getRowModel().rows?.length"
            :key="row.id"
            class="py-0"
            :class="isHighlighted(row.original) ? 'bg-zinc-500/6' : ''"
          >
            <CardContent class="flex gap-3 p-2">
              <!-- QR -->
              <div
                class="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-white p-1"
              >
                <QrcodeVue
                  :value="row.original.id"
                  :size="100"
                  level="H"
                  render-as="svg"
                  class="block h-full w-full"
                />
              </div>
              <!-- Info -->
              <div class="flex min-w-0 flex-1 flex-col gap-1.5 text-xs">
                <!-- Unit -->
                <div class="flex items-baseline gap-1">
                  <span class="text-muted-foreground">Unidad:</span>
                  <span class="truncate font-mono font-medium">
                    {{ row.original.id.slice(0, 8) }}
                  </span>
                </div>
                <!-- Status -->
                <div class="flex items-center gap-1.5">
                  <span class="text-muted-foreground">Estado:</span>
                  <Badge
                    variant="outline"
                    class="px-1.5 py-0.5 text-[11px] lg:py-0"
                    :class="STATUS_STYLES[row.original.status] ?? ''"
                  >
                    {{ formatUnitStatus(row.original.status) }}
                  </Badge>
                </div>
                <!-- Entry date -->
                <div class="flex items-baseline gap-1">
                  <span class="text-muted-foreground">Ingreso:</span>
                  <span class="font-medium">{{ formatDate(row.original.created_at) }}</span>
                </div>
                <!-- Origin -->
                <div class="flex items-baseline gap-1">
                  <span class="text-muted-foreground">Origen:</span>
                  <span class="font-medium">
                    {{
                      row.original.origin_reason
                        ? formatMoveReason(row.original.origin_reason)
                        : 'Sin origen'
                    }}
                  </span>
                </div>
              </div>
              <!-- Action buttons -->
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="-mt-1 -mr-2 h-8 w-8 shrink-0 rounded-full"
                    :aria-label="`Opciones para unidad ${row.original.id.slice(0, 8)}`"
                  >
                    <EllipsisVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <!-- Show QR -->
                  <DropdownMenuItem class="cursor-pointer" @click="emit('view-qr', row.original)">
                    <Eye class="h-4 w-4" />
                    <span>Ver QR</span>
                  </DropdownMenuItem>
                  <!-- Register exit -->
                  <DropdownMenuItem
                    v-if="row.original.status === 'available' && can('inventory:register-exit')"
                    class="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                    @click="emit('register-exit', row.original)"
                  >
                    <XCircle class="text-destructive h-4 w-4" />
                    <span>Registrar salida</span>
                  </DropdownMenuItem>
                  <!-- Reactive unit -->
                  <DropdownMenuItem
                    v-if="row.original.status === 'unavailable' && can('inventory:reactivate-unit')"
                    class="cursor-pointer text-emerald-500 focus:text-emerald-500"
                    @click="emit('reactivate-unit', row.original)"
                  >
                    <RotateCcw class="h-4 w-4 text-emerald-500" />
                    <span>Reactivar unidad</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
          <!-- Empty -->
          <div
            v-if="!isLoading && !table.getRowModel().rows?.length"
            class="flex flex-1 flex-col items-center justify-center px-6 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-4 rounded-full p-3">
              <Package class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">Aún no hay unidades</h3>
            <p class="text-muted-foreground mt-1 max-w-xs text-xs">
              Registra la primera compra para generar QR
            </p>
          </div>
        </div>
        <!-- Desktop empty -->
        <div
          v-if="isDesktop && !isLoading && !table.getRowModel().rows?.length"
          class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
        >
          <div class="bg-muted text-muted-foreground mb-4 rounded-full p-3">
            <Package class="h-9 w-9" />
          </div>
          <h3 class="text-sm font-semibold">Aún no hay unidades</h3>
          <p class="text-muted-foreground mt-1 max-w-xs text-xs">
            Registra la primera compra para generar QR
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
        <!-- Previous -->
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            class="gap-0.5"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            <ChevronLeft class="mt-0.5 h-4 w-4 px-0 lg:mt-0" />
            <span class="mr-0.5 pb-0.5 text-xs lg:text-sm">Anterior</span>
          </Button>
          <!-- Next -->
          <Button
            variant="outline"
            size="sm"
            class="gap-0.5"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
          >
            <span class="ml-0.5 pb-0.5 text-xs lg:text-sm">Siguiente</span>
            <ChevronRight class="mt-0.5 h-4 w-4 px-0 lg:mt-0 lg:p-0" />
          </Button>
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>
