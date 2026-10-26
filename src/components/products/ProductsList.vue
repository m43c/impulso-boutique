<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  LayersPlus,
  EllipsisVertical,
  Eye,
  Loader2,
  PackagePlus,
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
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div class="flex w-full min-w-0 flex-col gap-4 lg:h-[calc(100dvh-5rem)] lg:overflow-hidden">
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
        <div class="flex shrink-0 items-center justify-between gap-2">
          <!-- Search -->
          <div class="relative w-full">
            <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input v-model="search" placeholder="Buscar producto..." class="pl-8" />
          </div>
          <!-- Refresh button -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                class="shrink-0"
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
            class="hidden gap-2 md:flex"
            :disabled="isLoading"
            @click="emit('add-product')"
          >
            <PackagePlus class="h-4 w-4" />
            Agregar producto
          </Button>
        </div>
        <!-- Desktop view -->
        <div
          v-if="isDesktop"
          class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border"
        >
          <div class="relative isolate flex-1 overflow-auto">
            <Table class="border-separate border-spacing-0">
              <TableHeader class="bg-background sticky top-0 z-10 shadow-sm">
                <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                  <TableHead
                    v-for="header in headerGroup.headers"
                    :key="header.id"
                    :class="[
                      header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                      header.column.columnDef.meta?.cellClass || '',
                      'bg-background border-b',
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
              <div
                class="flex items-stretch gap-4"
                :class="row.original.description ? 'pb-1' : 'pb-2'"
              >
                <!-- Image -->
                <ProductImage
                  :public-id="row.original.image_public_id"
                  :alt="row.original.name"
                  :size="IMAGE_SIZES.card"
                  image-class="aspect-5/5 w-32 shrink-0 rounded-md object-cover"
                  fallback-class="bg-muted flex aspect-5/5 w-32 shrink-0 items-center justify-center rounded-md"
                  icon-class="text-muted-foreground h-6 w-6"
                />
                <div class="flex min-w-0 flex-1 flex-col justify-between text-xs">
                  <!-- Category -->
                  <div class="flex min-w-0 justify-between gap-2">
                    <span class="text-muted-foreground shrink-0">Categoria</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button class="min-w-0 cursor-default truncate">
                          {{ row.original.category }}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ row.original.category }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <!-- Brand -->
                  <div class="item-center flex justify-between gap-2">
                    <span class="text-muted-foreground">Marca</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button class="min-w-0 cursor-default truncate">
                          {{ row.original.brand || 'Sin marca' }}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ row.original.brand || 'Sin marca' }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <!-- Color -->
                  <div class="item-center flex justify-between gap-2">
                    <span class="text-muted-foreground">Color:</span>
                    <span>
                      {{ row.original.color || 'Sin color' }}
                    </span>
                  </div>
                  <!-- Size -->
                  <div class="item-center flex justify-between gap-2">
                    <span class="text-muted-foreground">Talla:</span>
                    <span>{{ row.original.size || 'Sin talla' }}</span>
                  </div>
                  <!-- Status -->
                  <div class="flex items-center justify-between gap-2">
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
              <p class="text-muted-foreground line-clamp-2 pb-1 text-xs leading-relaxed">
                {{ row.original.description || 'Sin descripción' }}
              </p>
              <div class="flex flex-col gap-1 border-t pt-1">
                <div class="flex justify-between">
                  <!-- Price -->
                  <span class="text-base font-semibold">
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
        <div class="flex shrink-0 items-center justify-between pb-4 lg:pb-0">
          <p class="text-muted-foreground text-sm">
            Página {{ table.atoms.pagination.get().pageIndex + 1 }} de
            {{ Math.max(table.getPageCount(), 1) }}
          </p>
          <div class="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanPreviousPage()"
              class="gap-0.5 text-[13px]"
              @click="table.previousPage()"
            >
              <ChevronLeft class="h-4 w-4 px-0 pt-0.5 lg:pt-0" />
              <span class="mr-1">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanNextPage()"
              class="gap-0.5 text-[13px]"
              @click="table.nextPage()"
            >
              <span class="ml-1">Siguiente</span>
              <ChevronRight class="h-4 w-4 pt-0.5 lg:pt-0" />
            </Button>
          </div>
        </div>
      </template>
    </div>
  </TooltipProvider>
</template>
