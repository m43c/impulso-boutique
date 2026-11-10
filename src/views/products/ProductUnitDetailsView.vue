<script setup>
import { computed, ref, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { toast } from 'vue-sonner'
import {
  CheckCircle2,
  Check,
  Copy,
  Loader2,
  Minus,
  RefreshCw,
  RotateCcw,
  XCircle,
} from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatUnitStatus } from '@/utils/productUnits'
import { formatMoveReason } from '@/utils/inventoryMoves'
import { useBreadcrumbs } from '@/composables/useBreadcrumbs'
import ProductImage from '@/components/products/ProductImage.vue'
import ProductUnitDetailsSkeleton from '@/components/products/units/skeletons/ProductUnitDetailsSkeleton.vue'
import { usePermissions } from '@/composables/usePermissions'
import ProductUnitExitModal from '@/components/products/units/modals/ProductUnitExitModal.vue'
import ProductUnitReactivateModal from '@/components/products/units/modals/ProductUnitReactivateModal.vue'

const route = useRoute()
const router = useRouter()

const productsStore = useProductsStore()
const { setBreadcrumbs, clearBreadcrumbs } = useBreadcrumbs()
const { can } = usePermissions()
const isDesktop = useMediaQuery('(min-width: 768px)')

const { scannedUnit, scannedProduct, productVariants, isFetchingVariants } =
  storeToRefs(productsStore)

const copied = ref(false)
const isExitModalOpen = ref(false)
const isReactivateModalOpen = ref(false)

const STATUS_SUFFIX = {
  available: 'para la venta',
  sold: 'a un cliente',
  returned: 'por un cliente',
  unavailable: 'para la venta',
}

const fullStatusText = computed(() => {
  const status = scannedUnit.value?.status

  if (!status) {
    return ''
  }

  const mainText = formatUnitStatus(status)
  const suffix = STATUS_SUFFIX[status] || ''

  return `${mainText} ${suffix}`.trim()
})

const viewProductVariant = computed(() => {
  return showExitButton.value || showReactivateButton.value ? 'outline' : 'default'
})

const showExitButton = computed(
  () => scannedUnit.value?.status === 'available' && can('inventory:register-exit'),
)
const showReactivateButton = computed(
  () => scannedUnit.value?.status === 'unavailable' && can('inventory:reactivate-unit'),
)

async function loadUnit(unitId) {
  try {
    productsStore.resetScannedUnit()
    productsStore.resetProductVariants()

    const result = await productsStore.fetchScannedUnit(unitId)

    if (result) {
      setBreadcrumbs([
        { title: 'Productos', to: { name: 'products' } },
        {
          title: 'Detalles de unidad',
          to: { name: 'unit-details', params: { unitId: result.unit.id } },
        },
        {
          title: result.product.name,
          to: { name: 'product-details', params: { id: result.product.id } },
          truncate: true,
        },
        {
          title: `Unidad ${result.unit.id.slice(0, 8)}`,
          current: true,
          tooltip: `UUID: ${result.unit.id}`,
        },
      ])

      if (result.product.variant_group_id) {
        await productsStore.fetchProductVariants(result.product.variant_group_id)
      }
    }

    return result
  } catch (error) {
    console.error('Error al cargar unidad y variantes:', error)
    toast.error('Error al cargar la información de la unidad')
  }
}

async function handleCopyUnitId(unitId) {
  try {
    await navigator.clipboard.writeText(unitId)
    copied.value = true
    toast.success('ID de unidad copiado')

    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    toast.error('No se pudo copiar el ID')
  }
}

const statusBannerClasses = computed(() => {
  switch (scannedUnit.value?.status) {
    case 'available':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
    case 'sold':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-500'
    case 'returned':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-500'
    case 'unavailable':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-500'
    default:
      return 'border-muted bg-muted text-muted-foreground'
  }
})

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL']

function sortSizes(a, b) {
  const indexA = sizeOrder.indexOf(a.toUpperCase())
  const indexB = sizeOrder.indexOf(b.toUpperCase())

  if (indexA !== -1 && indexB !== -1) {
    return indexA - indexB
  }

  if (indexA !== -1) {
    return -1
  }

  if (indexB !== -1) {
    return 1
  }

  const numA = Number(a)
  const numB = Number(b)

  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }

  return a.localeCompare(b)
}

const variantMatrix = computed(() => {
  if (!productVariants.value || productVariants.value.length === 0) {
    return null
  }

  const colors = [...new Set(productVariants.value.map((p) => p.color || 'Sin color'))].sort()
  const sizes = [...new Set(productVariants.value.map((p) => p.size || 'Sin talla'))].sort(
    sortSizes,
  )

  const matrix = colors.map((color) => {
    const row = { color, cells: {} }

    sizes.forEach((size) => {
      const variant = productVariants.value.find(
        (p) => (p.color || 'Sin color') === color && (p.size || 'Sin talla') === size,
      )

      row.cells[size] = variant || null
    })

    return row
  })

  return { colors, sizes, matrix }
})

async function refreshVariants() {
  const variantGroupId = scannedProduct.value?.variant_group_id

  if (!variantGroupId) {
    return
  }

  try {
    await productsStore.fetchProductVariants(variantGroupId)
    toast.success('Variantes actualizadas correctamente')
  } catch (error) {
    console.error('Error al actualizar variantes:', error)
    toast.error('Error al actualizar las variantes')
  }
}

async function handleExitSuccess({ reason }) {
  const label = reason === 'damage' ? 'daño' : 'pérdida'
  toast.success(`Unidad dada de baja por ${label}`)
  await loadUnit(route.params.unitId)
}

async function handleReactivateSuccess() {
  toast.success('Unidad reactivada (mismo QR)')
  await loadUnit(route.params.unitId)
}

watch(
  () => route.params.unitId,
  async (unitId) => {
    await loadUnit(unitId)
  },
  { immediate: true },
)

onUnmounted(() => {
  productsStore.resetScannedUnit()
  clearBreadcrumbs()
})
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <!-- Skeleton -->
    <div v-if="productsStore.isFetchingScannedUnit" class="w-full px-4 pb-6 lg:px-6 lg:pb-0">
      <ProductUnitDetailsSkeleton />
    </div>
    <!-- Not found -->
    <div
      v-else-if="!scannedUnit"
      class="flex min-h-[calc(100vh-5rem)] w-full flex-col items-center justify-center px-4 pb-6 text-center lg:px-6 lg:pb-0"
    >
      <Card class="w-full max-w-sm">
        <CardContent class="flex flex-col items-center justify-center p-8">
          <div class="bg-muted/50 mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <Loader2 class="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
          <h3 class="text-sm font-semibold lg:text-[13px]">Unidad no encontrada</h3>
          <p class="text-muted-foreground mb-3 max-w-sm text-sm lg:text-xs">
            Este código no existe en el sistema.
          </p>
          <Button variant="outline" size="sm" @click="router.push({ name: 'home' })">
            <span class="lg:text-xs">Volver al inicio</span>
          </Button>
        </CardContent>
      </Card>
    </div>
    <!-- Main content -->
    <div v-else class="w-full px-6 pb-6 lg:overflow-hidden lg:px-6">
      <div class="grid grid-cols-1 gap-6 lg:h-[calc(100vh-5rem)] lg:grid-cols-12">
        <!-- Left column -->
        <div class="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:h-full lg:min-h-0">
          <!-- Status banner -->
          <div
            class="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold tracking-wider lg:rounded-sm lg:text-xs"
            :class="statusBannerClasses"
          >
            <CheckCircle2 v-if="scannedUnit.status === 'available'" class="h-4 w-4" />
            <XCircle v-else class="h-4 w-4" />
            {{ fullStatusText }}
          </div>
          <!-- Product -->
          <Card class="overflow-hidden p-0 shadow-sm lg:overflow-y-auto lg:rounded-md">
            <CardContent class="flex flex-col gap-4 p-4 lg:px-5 lg:py-4">
              <div class="flex w-full flex-col gap-2">
                <!-- Name -->
                <h3 class="line-clamp-2 text-sm leading-tight font-semibold lg:text-[13px]">
                  {{ scannedProduct.name }}
                </h3>
                <!-- Description -->
                <p class="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                  {{ scannedProduct.description || 'Sin descripción' }}
                </p>
              </div>
              <div class="flex w-full items-stretch gap-4">
                <!-- Image -->
                <div
                  class="mx-auto aspect-square w-32 shrink-0 overflow-hidden rounded-lg lg:w-44 lg:rounded-sm"
                >
                  <ProductImage
                    :public-id="scannedProduct.image_public_id"
                    :alt="scannedProduct.name"
                    :size="IMAGE_SIZES.detail"
                    image-class="h-full w-full object-cover"
                    fallback-class="bg-muted flex justify-center h-full w-full items-center"
                    icon-class="text-muted-foreground h-8 w-8"
                  />
                </div>
                <!-- Details -->
                <div class="-mt-0.5 flex min-w-0 flex-1 flex-col justify-between lg:-mt-1">
                  <div class="flex flex-col gap-2.5 text-xs leading-none lg:leading-tight">
                    <!-- Category -->
                    <div class="flex min-w-0 gap-2">
                      <span class="text-muted-foreground shrink-0">Categoría:</span>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button
                            class="lg:border-muted-foreground/50 min-w-0 truncate text-left lg:cursor-help lg:border-b lg:border-dashed"
                          >
                            {{ scannedProduct.category || 'Sin categoría' }}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ scannedProduct.category || 'Sin categoría' }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <!-- Brand -->
                    <div class="flex min-w-0 items-center gap-2">
                      <span class="text-muted-foreground shrink-0">Marca:</span>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button
                            class="lg:border-muted-foreground/50 min-w-0 truncate text-left lg:cursor-help lg:border-b lg:border-dashed"
                          >
                            {{ scannedProduct.brand || 'Sin marca' }}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ scannedProduct.brand || 'Sin marca' }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <!-- Color -->
                    <div class="flex min-w-0 items-center gap-2">
                      <span class="text-muted-foreground shrink-0">Color:</span>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button
                            class="lg:border-muted-foreground/50 min-w-0 truncate text-left lg:cursor-help lg:border-b lg:border-dashed"
                          >
                            {{ scannedProduct.color || 'Sin color' }}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ scannedProduct.color || 'Sin color' }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <!-- Size -->
                    <div class="flex items-center gap-2">
                      <span class="text-muted-foreground">Talla:</span>
                      <span>{{ scannedProduct.size || 'Sin talla' }}</span>
                    </div>
                    <!-- Status -->
                    <div v-if="!scannedProduct.is_active" class="flex items-center gap-2">
                      <span class="text-muted-foreground">Estado</span>
                      <Badge
                        variant="outline"
                        class="border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-400"
                      >
                        Retirado
                      </Badge>
                    </div>
                    <!-- Price -->
                    <div class="flex items-center gap-2">
                      <span class="text-muted-foreground">Precio:</span>
                      <span class="font-bold">{{ formatCurrency(scannedProduct.price) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Unit -->
              <div class="flex flex-col gap-1.5 border-t pt-3 text-xs">
                <div class="flex flex-wrap justify-between gap-2">
                  <!-- Id -->
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">Unidad:</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          @click="handleCopyUnitId(scannedUnit.id)"
                          class="bg-muted/80 hover:bg-muted active:bg-muted/60 group flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-xs shadow-sm transition-colors"
                        >
                          <span :class="{ 'text-emerald-500': copied, 'text-foreground': !copied }">
                            {{ scannedUnit.id.slice(0, 8) }}
                          </span>
                          <Check v-if="copied" class="h-3.5 w-3.5 text-emerald-500" />
                          <Copy v-else class="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ copied ? '¡Copiado!' : 'Copiar ID completo' }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <!-- Origin -->
                  <div class="flex min-w-0 items-center gap-1.5">
                    <span class="text-muted-foreground shrink-0">Origen:</span>
                    <span class="min-w-0 cursor-default truncate text-right lg:text-left">
                      {{
                        scannedUnit.origin_reason
                          ? formatMoveReason(scannedUnit.origin_reason)
                          : 'Sin origen'
                      }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-wrap justify-between gap-2">
                  <!-- Entry date -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-muted-foreground">Ingreso:</span>
                    <span>{{ formatDate(scannedUnit.created_at) }}</span>
                  </div>
                  <!-- Update date -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-muted-foreground">Actualización:</span>
                    <span>{{ formatDate(scannedUnit.updated_at) }}</span>
                  </div>
                </div>
                <!-- Ref/note -->
                <div v-if="scannedUnit.note" class="mt-1.5 flex items-start gap-1.5 border-t pt-2">
                  <span class="text-muted-foreground shrink-0">Nota:</span>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button class="line-clamp-1 text-left italic lg:cursor-help">
                        {{ scannedUnit.note || 'Sin referencia/nota' }}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent class="max-w-xs">
                      <p class="whitespace-pre-wrap">
                        {{ scannedUnit.note || 'Sin referencia/nota' }}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <!-- Action buttons -->
              <div class="mt-2 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <!-- View full product -->
                <Button
                  :variant="viewProductVariant"
                  :size="isDesktop ? 'sm' : ''"
                  class="w-full sm:w-auto"
                  @click="
                    router.push({ name: 'product-details', params: { id: scannedProduct.id } })
                  "
                >
                  <span class="lg:text-xs">Ver producto completo</span>
                </Button>
                <!-- Register exit -->
                <Button
                  v-if="showExitButton"
                  :size="isDesktop ? 'sm' : ''"
                  class="w-full sm:w-auto"
                  @click="isExitModalOpen = true"
                >
                  <span class="lg:text-xs">Dar de baja</span>
                </Button>
                <!-- Reactive unit -->
                <Button
                  v-if="showReactivateButton"
                  :size="isDesktop ? 'sm' : ''"
                  class="w-full sm:w-auto"
                  @click="isReactivateModalOpen = true"
                >
                  <RotateCcw class="h-4 w-4" />
                  <span class="lg:text-xs">Reactivar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <!-- Right column -->
        <div
          class="flex min-w-0 flex-col gap-2.5 lg:col-span-7 lg:h-full lg:min-h-0 lg:overflow-y-auto"
        >
          <Card
            class="gap-0 overflow-hidden border p-0 shadow-sm lg:rounded-md lg:border lg:bg-transparent lg:shadow-none"
          >
            <div
              class="lg:dark:bg-card flex items-center justify-between border-b bg-zinc-100 px-4 py-2 dark:bg-zinc-800"
            >
              <!-- Title -->
              <h2 class="text-sm font-semibold lg:text-[13px]">Otras variantes disponibles</h2>
              <Tooltip>
                <!-- Refresh button -->
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-8 w-8 p-2!"
                    :disabled="isFetchingVariants || !scannedProduct?.variant_group_id"
                    aria-label="Actualizar variantes"
                    @click="refreshVariants"
                  >
                    <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isFetchingVariants }" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Actualizar variantes</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <!-- Loading state -->
            <div v-if="isFetchingVariants" class="flex h-40 items-center justify-center">
              <Loader2 class="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
            <!-- Empty state -->
            <div
              v-else-if="!variantMatrix"
              class="flex h-40 flex-col items-center justify-center p-6 text-center"
            >
              <p class="text-muted-foreground text-xs">
                Este producto no tiene otras variantes registradas.
              </p>
            </div>
            <!-- Variant table -->
            <template v-else>
              <div class="relative w-full overflow-x-auto">
                <Table class="w-full text-left text-sm whitespace-nowrap">
                  <TableHeader class="lg:dark:bg-card border-b bg-zinc-100 dark:bg-zinc-800">
                    <TableRow>
                      <TableHead
                        class="lg:dark:bg-card sticky left-0 z-30 w-32 max-w-32 bg-zinc-100 px-2 py-3 font-medium shadow-[1px_0_0_0_var(--color-border)] before:absolute before:inset-y-0 before:-left-4 before:w-4 before:bg-inherit lg:w-40 lg:max-w-40 lg:px-4 lg:text-xs dark:bg-zinc-800"
                      >
                        Color/Talla
                      </TableHead>
                      <TableHead
                        v-for="size in variantMatrix.sizes"
                        :key="size"
                        class="lg:dark:bg-card bg-zinc-100 px-4 py-3 text-center font-medium lg:text-xs dark:bg-zinc-800"
                      >
                        {{ size }}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="row in variantMatrix.matrix"
                      :key="row.color"
                      class="divide-x-0"
                    >
                      <TableCell
                        class="lg:dark:bg-card sticky left-0 z-30 w-32 max-w-32 bg-zinc-100 px-2 py-3 font-medium shadow-[1px_0_0_0_var(--color-border)] before:absolute before:inset-y-0 before:-left-4 before:w-4 before:bg-inherit lg:w-40 lg:max-w-40 lg:px-4 lg:text-xs dark:bg-zinc-800"
                      >
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <button
                              class="lg:border-muted-foreground/50 inline-block max-w-full truncate text-left lg:cursor-help lg:border-b lg:border-dashed"
                            >
                              {{ row.color }}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{{ row.color }}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        v-for="size in variantMatrix.sizes"
                        :key="size"
                        class="px-4 py-3 text-center transition-colors lg:text-xs"
                        :class="{
                          'border border-emerald-500/30 bg-emerald-500/10 font-bold text-emerald-600':
                            row.cells[size]?.id === scannedProduct.id,
                          'hover:bg-muted/50 cursor-pointer':
                            row.cells[size] &&
                            row.cells[size].id !== scannedProduct.id &&
                            row.cells[size].available_stock > 0,
                        }"
                        @click="
                          row.cells[size] &&
                          row.cells[size].id !== scannedProduct.id &&
                          row.cells[size].available_stock > 0
                            ? router.push({
                                name: 'product-details',
                                params: { id: row.cells[size].id },
                              })
                            : null
                        "
                      >
                        <!-- Empty cell -->
                        <span v-if="!row.cells[size]" class="text-muted-foreground/40">
                          <Minus class="mx-auto h-4 w-4 text-gray-400" />
                        </span>
                        <!-- Cell with stock -->
                        <span v-else class="flex items-center justify-center gap-1">
                          <span
                            :class="row.cells[size].available_stock === 0 ? 'text-destructive' : ''"
                          >
                            {{ row.cells[size].available_stock }}
                          </span>
                          <!-- Current variant -->
                          <span
                            v-if="row.cells[size].id === scannedProduct.id"
                            class="text-[10px]"
                          />
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <!-- Legend -->
              <div
                class="bg-muted/20 text-muted-foreground flex flex-wrap justify-between gap-x-4 gap-y-1 border-t px-3 py-2 text-xs"
              >
                <div class="flex gap-4">
                  <div>
                    <span class="text-destructive">0</span>
                    = agotado
                  </div>
                  <div class="flex items-center">
                    <Minus class="h-4 w-4 text-gray-400" />
                    <span>= no existe</span>
                  </div>
                </div>
                <div class="flex self-end">
                  <em>Toca una celda con stock para ver esa variante</em>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
    <!-- Register exit -->
    <ProductUnitExitModal
      v-model:open="isExitModalOpen"
      :unit="scannedUnit"
      :product="scannedProduct"
      @success="handleExitSuccess"
    />
    <!-- Reactive unit -->
    <ProductUnitReactivateModal
      v-model:open="isReactivateModalOpen"
      :unit="scannedUnit"
      :product="scannedProduct"
      @success="handleReactivateSuccess"
    />
  </TooltipProvider>
</template>
