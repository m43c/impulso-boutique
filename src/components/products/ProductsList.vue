<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayersPlus,
  EllipsisVertical,
  Eye,
  Loader2,
  PackagePlus,
  PackageSearch,
  PlusCircle,
  Pencil,
  RefreshCw,
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
import { IMAGE_SIZES } from '@/services/cloudinary'
import ProductImage from '@/components/products/ProductImage.vue'
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps({
  products: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const emit = defineEmits([
  'add-product',
  'edit-product',
  'toggle-status',
  'create-variant',
  'retry',
  'refresh',
])

const route = useRoute()
const router = useRouter()

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const expandedCards = ref(new Set())

const sortOptions = [
  { label: 'Nombre: A-Z', columnId: 'name', desc: false },
  { label: 'Nombre: Z-A', columnId: 'name', desc: true, separator: true },
  { label: 'Precio: más bajo', columnId: 'price', desc: false },
  { label: 'Precio: más alto', columnId: 'price', desc: true, separator: true },
  { label: 'Stock: menor primero', columnId: 'stock', desc: false },
  { label: 'Stock: mayor primero', columnId: 'stock', desc: true, separator: true },
  { label: 'Fecha: más recientes', columnId: 'updated_at', desc: true },
  { label: 'Fecha: más antiguos', columnId: 'updated_at', desc: false },
]

const filterableColumns = [
  { columnId: 'category', label: 'Categoría', useOriginalCasing: true },
  { columnId: 'brand', label: 'Marca', useOriginalCasing: true, emptyLabel: 'Sin marca' },
  { columnId: 'color', label: 'Color', useOriginalCasing: true },
  { columnId: 'size', label: 'Talla', useOriginalCasing: true },
  { columnId: 'stock_status', label: 'Stock' },
]

function goToDetails(product) {
  router.push({ name: 'product-details', params: { id: product.id } })
}

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
    columnFilters:
      route.query.stock === 'low' ? [{ id: 'stock_status', value: ['Stock mínimo'] }] : [],
  },
  meta: {
    can,
    onViewDetails: goToDetails,
    onCreateVariant: (product) => emit('create-variant', product),
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

function toggleExpand(id) {
  if (expandedCards.value.has(id)) {
    expandedCards.value.delete(id)
  } else {
    expandedCards.value.add(id)
  }
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
              placeholder="Buscar producto..."
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
                aria-label="Actualizar tabla"
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
          <!-- Add product button -->
          <Button
            v-if="can('products:create')"
            size="sm"
            class="hidden md:flex"
            :disabled="isLoading"
            @click="emit('add-product')"
          >
            <PackagePlus class="h-4 w-4" />
            <span class="text-xs">Agregar producto</span>
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
                <!-- Product data -->
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
                <PackageSearch class="h-9 w-9" />
              </div>
              <h3 class="text-sm font-semibold">No se encontraron productos</h3>
              <p class="text-muted-foreground max-w-xs text-xs">
                Intenta ajustar los filtros o la búsqueda, o agrega un nuevo producto.
              </p>
            </div>
          </div>
        </div>
        <!-- Mobile view -->
        <div v-else class="flex min-h-0 flex-1 flex-col gap-4">
          <!-- Skeleton -->
          <template v-if="isLoading">
            <ProductCardSkeleton v-for="card in 5" :key="`skeleton-card-${card}`" />
          </template>
          <!-- Empty state -->
          <div
            v-else-if="!table.getRowModel().rows?.length"
            class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
              <PackageSearch class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">No se encontraron productos</h3>
            <p class="text-muted-foreground max-w-xs text-xs">
              Intenta ajustar los filtros o la búsqueda, o agrega un nuevo producto.
            </p>
          </div>
          <!-- Product data -->
          <Card v-for="row in table.getRowModel().rows" v-else :key="row.id" class="py-0">
            <CardContent class="flex flex-col gap-1 p-4">
              <div class="flex items-start justify-between gap-2">
                <!-- Name -->
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      class="focus-visible:ring-ring mb-2.5 line-clamp-2 min-w-0 flex-1 cursor-help rounded text-left text-sm leading-tight font-medium wrap-break-word whitespace-normal focus-visible:ring-1 focus-visible:outline-none"
                    >
                      {{ row.original.name }}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent class="max-w-[80vw]">
                    <p>{{ row.original.name }}</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="-mt-1 -mr-2 h-8 w-8 shrink-0 rounded-full"
                      :aria-label="`Opciones para ${row.original.name}`"
                    >
                      <EllipsisVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <!-- Show details -->
                    <DropdownMenuItem class="cursor-pointer" @click="goToDetails(row.original)">
                      <Eye class="h-4 w-4" />
                      <span>Ver detalles</span>
                    </DropdownMenuItem>
                    <!-- Create variant-->
                    <DropdownMenuItem
                      v-if="can('products:create')"
                      class="cursor-pointer"
                      @click="emit('create-variant', row.original)"
                    >
                      <LayersPlus class="h-4 w-4" />
                      <span>Crear variante</span>
                    </DropdownMenuItem>
                    <!-- Edit product -->
                    <DropdownMenuItem
                      v-if="can('products:update')"
                      class="cursor-pointer"
                      @click="emit('edit-product', row.original)"
                    >
                      <Pencil class="h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <template v-if="can('products:toggle-status')">
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
                          :is="row.original.is_active ? XCircle : PlusCircle"
                          class="h-4 w-4"
                          :class="row.original.is_active ? 'text-destructive' : 'text-emerald-500'"
                        />
                        <span>{{ row.original.is_active ? 'Retirar' : 'Reponer' }}</span>
                      </DropdownMenuItem>
                    </template>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <!-- Details -->
              <div class="flex items-stretch gap-4 pb-2">
                <!-- Image -->
                <ProductImage
                  :public-id="row.original.image_public_id"
                  :alt="row.original.name"
                  :size="IMAGE_SIZES.card"
                  image-class="aspect-5/5 w-32 shrink-0 rounded-md object-cover"
                  fallback-class="bg-muted flex aspect-5/5 w-32 shrink-0 items-center justify-center rounded-md"
                  icon-class="text-muted-foreground h-6 w-6"
                />
                <div class="-mt-0.5 flex min-w-0 flex-1 flex-col gap-2.5 text-xs leading-none">
                  <!-- Category -->
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="text-muted-foreground shrink-0">Categoría:</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button class="min-w-0 truncate text-left">
                          {{ row.original.category }}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ row.original.category }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <!-- Brand -->
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground shrink-0">Marca:</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          class="min-w-0 truncate text-left"
                          :class="!row.original.brand ? 'text-muted-foreground italic' : ''"
                        >
                          {{ row.original.brand || 'Sin marca' }}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ row.original.brand || 'Sin marca' }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <!-- Color -->
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">Color:</span>
                    <span :class="!row.original.color ? 'text-muted-foreground italic' : ''">
                      {{ row.original.color || 'Sin color' }}
                    </span>
                  </div>
                  <!-- Size -->
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">Talla:</span>
                    <span :class="!row.original.size ? 'text-muted-foreground italic' : ''">
                      {{ row.original.size || 'Sin talla' }}
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
                      {{ row.original.is_active ? 'Vigente' : 'Retirado' }}
                    </Badge>
                  </div>
                </div>
              </div>
              <!-- Description -->
              <div class="flex flex-col items-start pb-1">
                <p
                  class="text-muted-foreground text-xs leading-relaxed wrap-break-word transition-all"
                  :class="[
                    !row.original.description ? 'italic' : '',
                    expandedCards.has(row.original.id) ? '' : 'line-clamp-2',
                  ]"
                >
                  {{ row.original.description || 'Sin descripción' }}
                </p>
                <!-- Show more button -->
                <button
                  v-if="row.original.description && row.original.description.length > 80"
                  @click="toggleExpand(row.original.id)"
                  :aria-expanded="expandedCards.has(row.original.id)"
                  class="text-primary hover:text-primary/80 focus-visible:ring-ring mt-1 -ml-1 flex items-center gap-0.5 rounded px-1 py-1 text-[11px] font-medium transition-colors hover:underline focus-visible:ring-1 focus-visible:outline-none"
                >
                  {{ expandedCards.has(row.original.id) ? 'Ver menos' : 'Ver más' }}
                  <component
                    :is="expandedCards.has(row.original.id) ? ChevronUp : ChevronDown"
                    class="h-3 w-3"
                  />
                </button>
              </div>
              <div class="flex flex-col gap-1 border-t pt-2">
                <div class="flex justify-between">
                  <!-- Price -->
                  <span class="text-sm font-semibold">
                    {{ formatCurrency(row.original.price) }}
                  </span>
                  <!-- Stock -->
                  <div class="flex flex-col items-end gap-0.5">
                    <span
                      class="inline-flex items-center gap-1 text-xs font-medium tabular-nums"
                      :class="
                        (row.original.stock_available ?? 0) === 0
                          ? 'text-rose-400'
                          : row.original.is_low_stock
                            ? 'text-amber-400'
                            : ''
                      "
                    >
                      Disponibles: {{ row.original.stock_available ?? 0 }}
                      <CircleAlert
                        v-if="row.original.is_low_stock && (row.original.stock_available ?? 0) > 0"
                        class="h-3 w-3"
                      />
                    </span>
                    <!-- Stock min. -->
                    <span class="text-muted-foreground text-[11px]">
                      Stock mín.: {{ row.original.min_stock }}
                    </span>
                  </div>
                </div>
                <!-- Date -->
                <div class="text-muted-foreground flex gap-2 text-xs">
                  <span v-if="row.original.created_at === row.original.updated_at">Creado:</span>
                  <span v-else>Actualizado:</span>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button class="text-left">
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
