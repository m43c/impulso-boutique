<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Eye,
  ImageOff,
  Loader2,
  PackageCheck,
  PackagePlus,
  PackageX,
  Pencil,
  Search,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime, formatRelativeDate } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { columns } from '@/components/products/columns'
import { features } from '@/components/products/features'
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton.vue'
import TableSortDropdown from '@/components/common/TableSortDropdown.vue'
import TableFacetedFilters from '@/components/common/TableFacetedFilters.vue'
import { buildImageUrl, IMAGE_SIZES } from '@/services/cloudinary'

const props = defineProps({
  products: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['add-product', 'retry', 'view-details', 'toggle-status', 'edit-product'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const sortOptions = [
  {
    label: 'Nombre: A-Z',
    columnId: 'name',
    desc: false,
  },
  {
    label: 'Nombre: Z-A',
    columnId: 'name',
    desc: true,
    separator: true,
  },
  {
    label: 'Precio: más bajo',
    columnId: 'price',
    desc: false,
  },
  {
    label: 'Precio: más alto',
    columnId: 'price',
    desc: true,
    separator: true,
  },
  {
    label: 'Fecha: más recientes',
    columnId: 'updated_at',
    desc: true,
  },
  {
    label: 'Fecha: más antiguos',
    columnId: 'updated_at',
    desc: false,
  },
]

const filterableColumns = [
  {
    columnId: 'category',
    label: 'Categoría',
    useOriginalCasing: true,
  },
  {
    columnId: 'brand',
    label: 'Marca',
    useOriginalCasing: true,
    emptyLabel: 'Sin marca',
  },
  {
    columnId: 'color',
    label: 'Color',
    useOriginalCasing: true,
  },
  {
    columnId: 'size',
    label: 'Talla',
    useOriginalCasing: true,
  },
]

const table = useTable({
  features,
  get data() {
    return props.products
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
    onViewDetails: (product) => emit('view-details', product),
    onEdit: (product) => emit('edit-product', product),
    onToggleStatus: (product) => emit('toggle-status', product),
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
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div class="flex min-h-0 flex-1 flex-col gap-4">
      <!-- Error -->
      <div v-if="error" class="flex flex-1 flex-col items-center justify-center text-center">
        <div class="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
          <CircleAlert />
        </div>
        <h3 class="text-base font-semibold">{{ error }}</h3>
        <p class="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">Inténtalo nuevamente</p>
        <Button variant="outline" size="sm" :disabled="isLoading" @click="emit('retry')">
          <Loader2 v-if="isLoading" class="animate-spin" />
          Reintentar
        </Button>
      </div>
      <template v-else>
        <!-- Toolbar -->
        <div class="flex items-center justify-between gap-3">
          <!-- Search -->
          <div class="relative w-full">
            <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input v-model="search" placeholder="Buscar producto..." class="pl-9" />
          </div>
          <!-- Filters -->
          <TableFacetedFilters :table="table" :filterable-columns="filterableColumns" />
          <!-- Sorting button (mobile) -->
          <TableSortDropdown v-if="!isDesktop" :table="table" :options="sortOptions" />
          <!-- Add product button -->
          <Button class="hidden gap-2 md:flex" @click="emit('add-product')">
            <PackagePlus class="h-4 w-4" />
            Agregar producto
          </Button>
        </div>
        <!-- Desktop view -->
        <div v-if="isDesktop" class="rounded-md border">
          <Table>
            <TableHeader>
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
                    :key="column.accessorKey || column.id"
                    :class="column.meta?.cellClass || ''"
                  >
                    <Skeleton :class="column.meta?.skeletonClass || 'h-4 w-16'" />
                  </TableCell>
                </TableRow>
              </template>
              <!-- Product data -->
              <template v-else-if="table.getRowModel().rows?.length">
                <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                  <TableCell
                    v-for="cell in row.getAllCells()"
                    :key="cell.id"
                    :class="cell.column.columnDef.meta?.cellClass || ''"
                  >
                    <FlexRender :cell="cell" />
                  </TableCell>
                </TableRow>
              </template>
              <!-- Empty state -->
              <template v-else>
                <TableRow>
                  <TableCell
                    :colspan="columns.length"
                    class="text-muted-foreground h-24 text-center"
                  >
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>
        <!-- Mobile view -->
        <div v-else class="flex flex-col gap-4">
          <!-- Skeleton -->
          <template v-if="isLoading">
            <ProductCardSkeleton v-for="card in 5" :key="`skeleton-card-${card}`" />
          </template>
          <!-- Empty state -->
          <p
            v-else-if="!table.getRowModel().rows?.length"
            class="text-muted-foreground py-8 text-center text-sm"
          >
            No se encontraron productos
          </p>
          <!-- Product data -->
          <Card v-for="row in table.getRowModel().rows" v-else :key="row.id" class="py-0">
            <CardContent class="flex flex-col gap-1 p-4">
              <div class="items-star flex justify-between gap-2">
                <!-- Name -->
                <p class="truncate text-base leading-tight font-medium">
                  {{ row.original.name }}
                </p>
                <!-- Actions menu -->
                <DropdownMenu>
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
                    <!-- Show details -->
                    <DropdownMenuItem
                      class="cursor-pointer"
                      @click="emit('view-details', row.original)"
                    >
                      <Eye class="mr-2 h-4 w-4" />
                      <span>Ver detalles</span>
                    </DropdownMenuItem>
                    <!-- Edit product -->
                    <DropdownMenuItem
                      class="cursor-pointer"
                      @click="emit('edit-product', row.original)"
                    >
                      <Pencil class="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <!-- Toggle status -->
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
                        :is="row.original.is_active ? PackageX : PackageCheck"
                        class="mr-2 h-4 w-4"
                        :class="row.original.is_active ? 'text-destructive' : 'text-emerald-500'"
                      />
                      <span>{{ row.original.is_active ? 'Retirar' : 'Reponer' }}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div
                class="flex items-stretch gap-3"
                :class="row.original.description ? 'pb-1' : 'pb-2'"
              >
                <!-- Image -->
                <img
                  v-if="row.original.image_public_id"
                  :src="buildImageUrl(row.original.image_public_id, IMAGE_SIZES.card)"
                  :alt="row.original.name"
                  loading="lazy"
                  decoding="async"
                  class="h-28 w-28 shrink-0 rounded-md object-cover"
                />
                <div
                  v-else
                  class="bg-muted flex h-28 w-28 shrink-0 items-center justify-center rounded-md"
                >
                  <ImageOff class="text-muted-foreground h-6 w-6" />
                </div>
                <div class="flex min-w-0 flex-1 flex-col justify-between text-xs">
                  <!-- Brand -->
                  <div class="flex items-baseline gap-1 truncate">
                    <span class="text-muted-foreground">Marca:</span>
                    <span class="truncate font-medium">
                      {{ row.original.brand || 'Sin marca' }}
                    </span>
                  </div>
                  <!-- Size -->
                  <div class="flex items-baseline gap-1 truncate">
                    <span class="text-muted-foreground">Talla:</span>
                    <span class="truncate font-medium">{{ row.original.size || 'Sin talla' }}</span>
                  </div>
                  <!-- Color -->
                  <div class="flex items-baseline gap-1 truncate">
                    <span class="text-muted-foreground">Color:</span>
                    <span class="truncate font-medium">
                      {{ row.original.color || 'Sin color' }}
                    </span>
                  </div>
                  <!-- Category -->
                  <div class="flex items-baseline gap-1 truncate">
                    <span class="text-muted-foreground">Categoría:</span>
                    <span class="truncate font-medium">{{ row.original.category }}</span>
                  </div>
                  <!-- Status -->
                  <div class="flex items-center gap-1.5 pt-0.5">
                    <span class="text-muted-foreground">Estado:</span>
                    <Badge
                      variant="outline"
                      class="px-2 py-0 text-[10px]"
                      :class="
                        row.original.is_active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      "
                    >
                      {{ row.original.is_active ? 'Vigente' : 'Retirado' }}
                    </Badge>
                  </div>
                </div>
              </div>
              <!-- Description -->
              <p class="text-muted-foreground line-clamp-2 pb-1 text-xs leading-relaxed">
                {{ row.original.description || 'Sin descripción' }}
              </p>
              <div class="flex flex-col gap-1 border-t pt-1">
                <div class="flex items-center justify-between">
                  <!-- Price -->
                  <span class="text-base font-semibold">
                    {{ formatCurrency(row.original.price) }}
                  </span>
                  <!-- Min Stock -->
                  <span class="text-muted-foreground text-xs">
                    Stock mín.: {{ row.original.min_stock }}
                  </span>
                </div>
                <!-- Date -->
                <div class="text-muted-foreground flex gap-1 text-[11px]">
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
              </div>
            </CardContent>
          </Card>
        </div>
        <!-- Pagination -->
        <div class="flex items-center justify-between">
          <p class="text-muted-foreground text-sm">
            Página {{ table.atoms.pagination.get().pageIndex + 1 }} de
            {{ Math.max(table.getPageCount(), 1) }}
          </p>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanPreviousPage()"
              @click="table.previousPage()"
            >
              <ChevronLeft class="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanNextPage()"
              @click="table.nextPage()"
            >
              Siguiente
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </template>
    </div>
  </TooltipProvider>
</template>
