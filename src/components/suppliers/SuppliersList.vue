<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  EllipsisVertical,
  Loader2,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from '@lucide/vue'
import { FlexRender, useTable } from '@tanstack/vue-table'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime, formatRelativeDate } from '@/utils/date'
import { columns } from '@/components/suppliers/columns'
import { features } from '@/components/common/tableFeatures'
import SupplierCardSkeleton from '@/components/suppliers/SupplierCardSkeleton.vue'
import TableSortDropdown from '@/components/common/TableSortDropdown.vue'
import TableFacetedFilters from '@/components/common/TableFacetedFilters.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps({
  suppliers: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isUpdatingStatus: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const emit = defineEmits(['add-supplier', 'edit-supplier', 'toggle-status', 'retry', 'refresh'])

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const sortOptions = [
  { label: 'Nombre: A-Z', columnId: 'name', desc: false },
  { label: 'Nombre: Z-A', columnId: 'name', desc: true, separator: true },
  { label: 'País: A-Z', columnId: 'country', desc: false },
  { label: 'País: Z-A', columnId: 'country', desc: true, separator: true },
  { label: 'Ciudad: A-Z', columnId: 'city', desc: false },
  { label: 'Ciudad: Z-A', columnId: 'city', desc: true, separator: true },
  { label: 'Fecha: más recientes', columnId: 'created_at', desc: true },
  { label: 'Fecha: más antiguos', columnId: 'created_at', desc: false },
]

const filterableColumns = [
  { columnId: 'country', label: 'País', useOriginalCasing: true, emptyLabel: 'Sin país' },
  { columnId: 'city', label: 'Ciudad', useOriginalCasing: true, emptyLabel: 'Sin ciudad' },
  { columnId: 'is_active', label: 'Estado' },
]

const table = useTable({
  features,
  get data() {
    return props.suppliers
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
    can,
    onEdit: (supplier) => emit('edit-supplier', supplier),
    onToggleStatus: (supplier) => emit('toggle-status', supplier),
  },
})

const search = computed({
  get: () => table.atoms.globalFilter.get() ?? '',
  set: (value) => {
    table.setGlobalFilter(value)
    table.setPageIndex(0)
  },
})

const hasAnySuppliers = computed(() => props.suppliers.length > 0)

const emptyTitle = computed(() =>
  hasAnySuppliers.value ? 'No se encontraron proveedores' : 'No hay proveedores registrados',
)

const emptyDescription = computed(() => {
  if (hasAnySuppliers.value) {
    return 'Intenta ajustar los filtros o la búsqueda.'
  }

  return can('suppliers:create')
    ? 'Agrega tu primer proveedor para empezar a gestionarlos.'
    : 'Aún no hay proveedores registrados.'
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
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 pb-6 lg:h-[calc(100dvh-5rem)] lg:flex-none lg:overflow-hidden lg:pb-0"
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
              v-model="search"
              placeholder="Buscar proveedor..."
              class="h-8 pl-8 text-[13px] lg:text-xs!"
            />
          </div>
          <!-- Refresh button -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="shrink-0 p-2!"
                :disabled="isLoading"
                aria-label="Actualizar lista"
                @click="emit('refresh')"
              >
                <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Actualizar lista</p>
            </TooltipContent>
          </Tooltip>
          <!-- Filters -->
          <TableFacetedFilters :table="table" :filterable-columns="filterableColumns" />
          <!-- Sorting button (mobile) -->
          <TableSortDropdown v-if="!isDesktop" :table="table" :options="sortOptions" />
          <!-- Add supplier button -->
          <Button
            v-if="can('suppliers:create')"
            size="sm"
            class="hidden gap-2 md:flex"
            :disabled="isLoading"
            @click="emit('add-supplier')"
          >
            <Plus class="h-4 w-4" />
            <span class="text-xs">Agregar proveedor</span>
          </Button>
        </div>
        <!-- Desktop view -->
        <div
          v-if="isDesktop"
          class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border"
        >
          <!-- Lock overlay -->
          <LoadingOverlay :show="isUpdatingStatus" text="Actualizando estado..." />
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
                  <TableRow v-for="row in 10" :key="`skeleton-${row}`">
                    <TableCell
                      v-for="column in columns"
                      :key="column.accessorKey || column.id"
                      :class="[column.meta?.cellClass || '', 'border-b']"
                    >
                      <Skeleton :class="column.meta?.skeletonClass || 'h-4 w-16'" />
                    </TableCell>
                  </TableRow>
                </template>
                <!-- Supplier data -->
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
              <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
                <Truck class="h-9 w-9" />
              </div>
              <h3 class="text-sm font-semibold">{{ emptyTitle }}</h3>
              <p class="text-muted-foreground max-w-xs text-xs">{{ emptyDescription }}</p>
            </div>
          </div>
        </div>
        <!-- Mobile view -->
        <div v-else class="relative flex min-h-0 flex-1 flex-col gap-4">
          <!-- Lock overlay -->
          <LoadingOverlay :show="isUpdatingStatus" text="Actualizando estado..." />
          <!-- Skeleton -->
          <template v-if="isLoading">
            <SupplierCardSkeleton v-for="card in 5" :key="`skeleton-card-${card}`" />
          </template>
          <!-- Empty state -->
          <div
            v-else-if="!table.getRowModel().rows?.length"
            class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
              <Truck class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">{{ emptyTitle }}</h3>
            <p class="text-muted-foreground max-w-xs text-xs">{{ emptyDescription }}</p>
          </div>
          <!-- Supplier data -->
          <Card v-for="row in table.getRowModel().rows" v-else :key="row.id" class="py-0">
            <CardContent class="flex flex-col gap-2 p-4 text-xs">
              <div class="flex items-start justify-between gap-2">
                <!-- Name -->
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      class="focus-visible:ring-ring line-clamp-2 min-w-0 flex-1 cursor-help rounded text-left text-sm leading-tight font-medium wrap-break-word whitespace-normal focus-visible:ring-1 focus-visible:outline-none"
                    >
                      {{ row.original.name }}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent class="max-w-[80vw]">
                    <p>{{ row.original.name }}</p>
                  </TooltipContent>
                </Tooltip>
                <!-- Actions menu -->
                <DropdownMenu v-if="can('suppliers:update') || can('suppliers:toggle-status')">
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="-mt-1 -mr-2 h-8 w-8 shrink-0 rounded-full"
                      :aria-label="`Opciones para ${row.original.name}`"
                    >
                      <EllipsisVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <!-- Edit supplier -->
                    <DropdownMenuItem
                      v-if="can('suppliers:update')"
                      class="cursor-pointer"
                      @click="emit('edit-supplier', row.original)"
                    >
                      <Pencil class="h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <!-- Toggle status -->
                    <template v-if="can('suppliers:toggle-status')">
                      <DropdownMenuSeparator v-if="can('suppliers:update')" />
                      <DropdownMenuItem
                        class="cursor-pointer"
                        :class="
                          row.original.is_active
                            ? 'text-destructive focus:text-destructive focus:bg-destructive/10'
                            : 'text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500'
                        "
                        @click="emit('toggle-status', row.original)"
                      >
                        <component
                          :is="row.original.is_active ? XCircle : PlusCircle"
                          class="h-4 w-4"
                          :class="row.original.is_active ? 'text-destructive' : 'text-emerald-500'"
                        />
                        <span>{{ row.original.is_active ? 'Desactivar' : 'Activar' }}</span>
                      </DropdownMenuItem>
                    </template>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <!-- Phone -->
              <div class="flex min-w-0 items-center gap-2">
                <span class="text-muted-foreground shrink-0">Teléfono:</span>
                <span class="truncate tabular-nums">{{ row.original.phone }}</span>
              </div>
              <!-- Country -->
              <div class="flex min-w-0 items-center gap-2">
                <span class="text-muted-foreground shrink-0">País:</span>
                <span
                  class="truncate"
                  :class="!row.original.country ? 'text-muted-foreground italic' : ''"
                >
                  {{ row.original.country || 'Sin país' }}
                </span>
              </div>
              <!-- City -->
              <div class="flex min-w-0 items-center gap-2">
                <span class="text-muted-foreground shrink-0">Ciudad:</span>
                <span
                  class="truncate"
                  :class="!row.original.city ? 'text-muted-foreground italic' : ''"
                >
                  {{ row.original.city || 'Sin ciudad' }}
                </span>
              </div>
              <!-- Status -->
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground">Estado:</span>
                <Badge
                  variant="outline"
                  class="px-1.5 py-0.5 text-[11px]"
                  :class="
                    row.original.is_active
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                  "
                >
                  {{ row.original.is_active ? 'Activo' : 'Inactivo' }}
                </Badge>
              </div>
              <!-- Date -->
              <div class="text-muted-foreground flex items-center gap-1">
                <span v-if="row.original.created_at === row.original.updated_at">Creado:</span>
                <span v-else>Actualizado:</span>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button type="button" class="cursor-default">
                      {{ formatRelativeDate(row.original.updated_at) }}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{{ formatDateTime(row.original.updated_at) }}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </div>
        <!-- Pagination -->
        <div
          v-if="table.getRowModel().rows?.length && table.getPageCount() > 1"
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
