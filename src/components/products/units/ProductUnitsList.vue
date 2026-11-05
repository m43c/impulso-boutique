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
  ClipboardCheck,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

const emit = defineEmits([
  'add-units',
  'view-qr',
  'refresh',
  'register-exit',
  'reactivate-unit',
  'count-units',
])

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const availableUnitsCount = computed(
  () => props.units.filter((u) => u.status === 'available').length,
)

const STATUS_STYLES = {
  available: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  sold: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  returned: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  unavailable: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
}

const sortOptions = [
  { label: 'Estado: A-Z', columnId: 'status', desc: false },
  { label: 'Estado: Z-A', columnId: 'status', desc: true, separator: true },
  { label: 'Origen: A-Z', columnId: 'origin', desc: false },
  { label: 'Origen: Z-A', columnId: 'origin', desc: true, separator: true },
  { label: 'Fecha: más recientes', columnId: 'created_at', desc: true },
  { label: 'Fecha: más antiguos', columnId: 'created_at', desc: false },
]

const filterableColumns = [
  { columnId: 'status', label: 'Estado', getOptionLabel: formatUnitStatus },
  { columnId: 'origin', label: 'Origen', getOptionLabel: formatMoveReason },
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
    sorting: [{ id: 'created_at', desc: true }],
    pagination: {
      pageIndex: 0,
      pageSize: isDesktop.value ? 10 : 5,
    },
  },
  meta: {
    onViewQr: (unit) => emit('view-qr', unit),
    onRegisterExit: (unit) => emit('register-exit', unit),
    onReactivateUnit: (unit) => emit('reactivate-unit', unit),
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
      <div class="lg:bg-card flex shrink-0 items-center justify-between gap-2 border-b p-2">
        <!-- Search (Desktop) -->
        <div class="relative w-full">
          <Search class="text-muted-foreground absolute top-2 left-2.5 h-4 w-4" />
          <Input
            v-model="search"
            placeholder="Buscar unidad..."
            class="h-8 pl-8 text-[13px]! lg:text-xs!"
            :disabled="isLoading"
          />
        </div>
        <!-- Refresh button -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              :disabled="isLoading"
              aria-label="Actualizar unidades"
              class="p-2!"
              @click="emit('refresh')"
            >
              <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Actualizar unidades</p>
          </TooltipContent>
        </Tooltip>
        <!-- Filters -->
        <TableFacetedFilters :table="table" :filterable-columns="filterableColumns" />
        <!-- Sort Dropdown (Mobile) -->
        <TableSortDropdown v-if="!isDesktop" :table="table" :options="sortOptions" />
        <!-- Physical count button -->
        <Tooltip v-if="can('inventory:count')">
          <TooltipTrigger as-child>
            <span class="hidden md:flex">
              <Button
                variant="outline"
                size="sm"
                :disabled="isLoading || availableUnitsCount === 0"
                class="p-2! lg:p-2.5!"
                :aria-label="
                  availableUnitsCount === 0 ? 'No hay unidades disponibles' : 'Conteo físico'
                "
                @click="emit('count-units')"
              >
                <ClipboardCheck class="h-4 w-4" />
                <span class="hidden text-xs md:inline">Conteo físico</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p v-if="availableUnitsCount === 0">No hay unidades disponibles para contar</p>
            <p v-else>Verificar conteo físico</p>
          </TooltipContent>
        </Tooltip>
        <!-- Add product units button -->
        <Button
          v-if="can('inventory:register-entry')"
          size="sm"
          :disabled="isLoading"
          class="hidden text-xs md:flex"
          @click="emit('add-units')"
        >
          <Boxes class="h-4 w-4" />
          Agregar unidades
        </Button>
      </div>
      <div class="bg-background flex min-h-0 flex-1 flex-col overflow-y-auto">
        <!-- Desktop view -->
        <template v-if="isDesktop">
          <Table class="border-separate border-spacing-0 bg-transparent">
            <TableHeader class="sticky top-0 z-10">
              <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <TableHead
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  :class="[
                    header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                    header.column.columnDef.meta?.cellClass || '',
                    'bg-card border-b backdrop-blur',
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
                    :class="[column.meta?.cellClass || '', 'border-b']"
                  >
                    <div v-if="column.id === 'code'" class="flex items-center gap-3">
                      <Skeleton class="h-10 w-10 shrink-0 rounded-sm" />
                      <Skeleton class="h-4 w-14" />
                    </div>
                    <Skeleton v-else :class="column.meta?.skeletonClass || 'h-4 w-16'" />
                  </TableCell>
                </TableRow>
              </template>
              <!-- Data -->
              <template v-else-if="table.getRowModel().rows?.length">
                <TableRow
                  v-for="row in table.getRowModel().rows"
                  :key="row.id"
                  :class="isHighlighted(row.original) ? 'bg-zinc-500/10' : ''"
                >
                  <TableCell
                    v-for="cell in row.getAllCells()"
                    :key="cell.id"
                    :class="[
                      cell.column.columnDef.meta?.cellClass || '',
                      'border-b bg-transparent',
                    ]"
                  >
                    <FlexRender :cell="cell" />
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </template>
        <!-- Mobile view -->
        <div v-else class="flex min-h-0 flex-1 flex-col gap-4 p-4">
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
            <CardContent class="flex gap-4 p-4">
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
              <div class="flex min-w-0 flex-1 flex-col gap-1 text-xs">
                <!-- Unit -->
                <div class="flex gap-2">
                  <span class="text-muted-foreground">Unidad:</span>
                  <span class="truncate font-mono">
                    {{ row.original.id.slice(0, 8) }}
                  </span>
                </div>
                <!-- Status -->
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground">Estado:</span>
                  <Badge
                    variant="outline"
                    class="text-[11px]"
                    :class="STATUS_STYLES[row.original.status] ?? ''"
                  >
                    {{ formatUnitStatus(row.original.status) }}
                  </Badge>
                </div>
                <!-- Entry date -->
                <div class="flex items-baseline gap-2">
                  <span class="text-muted-foreground">Ingreso:</span>
                  <span>{{ formatDate(row.original.created_at) }}</span>
                </div>
                <!-- Origin -->
                <div class="flex items-baseline gap-2">
                  <span class="text-muted-foreground">Origen:</span>
                  <span>
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
                    class="-mt-1 -mr-2.5 h-8 w-8 shrink-0 rounded-full"
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
                    <span>Dar de baja</span>
                  </DropdownMenuItem>
                  <!-- Reactive unit -->
                  <DropdownMenuItem
                    v-if="row.original.status === 'unavailable' && can('inventory:reactivate-unit')"
                    class="cursor-pointer text-emerald-500 focus:text-emerald-500"
                    @click="emit('reactivate-unit', row.original)"
                  >
                    <RotateCcw class="h-4 w-4 text-emerald-500" />
                    <span>Reactivar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
          <!-- Empty state (Mobile) -->
          <div
            v-if="!isLoading && !table.getRowModel().rows?.length"
            class="flex flex-1 flex-col items-center justify-center px-6 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
              <Package class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">Aún no hay unidades</h3>
            <p class="text-muted-foreground max-w-xs text-xs">
              Registra la primera compra para generar QR
            </p>
          </div>
        </div>
        <!-- Empty state (Desktop) -->
        <div
          v-if="isDesktop && !isLoading && !table.getRowModel().rows?.length"
          class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
        >
          <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
            <Package class="h-9 w-9" />
          </div>
          <h3 class="text-[13px] font-semibold">Aún no hay unidades</h3>
          <p class="text-muted-foreground max-w-xs text-xs">
            Registra la primera compra para generar QR
          </p>
        </div>
      </div>
      <!-- Pagination -->
      <div
        v-if="table.getRowModel().rows?.length && table.getPageCount() > 1"
        class="lg:bg-card flex shrink-0 items-center justify-between p-2"
      >
        <p class="text-muted-foreground text-xs">
          Página {{ table.atoms.pagination.get().pageIndex + 1 }} de
          {{ Math.max(table.getPageCount(), 1) }}
        </p>
        <!-- Previous -->
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanPreviousPage()"
            class="gap-0.5"
            @click="table.previousPage()"
          >
            <ChevronLeft class="mt-0.5 h-4 w-4" />
            <span class="text-xs lg:pr-1">Anterior</span>
          </Button>
          <!-- Next -->
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanNextPage()"
            class="gap-0.5"
            @click="table.nextPage()"
          >
            <span class="text-xs lg:ml-1">Siguiente</span>
            <ChevronRight class="mt-0.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>
