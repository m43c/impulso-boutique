<script setup>
import { computed, ref, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { CheckCircle2, Copy, Loader2, XCircle } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatUnitStatus } from '@/utils/productUnits'
import { formatMoveReason } from '@/utils/inventoryMoves'
import { useBreadcrumbs } from '@/composables/useBreadcrumbs'
import ProductImage from '@/components/products/ProductImage.vue'
import ProductUnitDetailsSkeleton from '@/components/products/units/ProductUnitDetailsSkeleton.vue'

const route = useRoute()
const router = useRouter()

const productsStore = useProductsStore()
const { setBreadcrumbs, clearBreadcrumbs } = useBreadcrumbs()

const { scannedUnit, scannedProduct } = storeToRefs(productsStore)
const copied = ref(false)

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

async function loadUnit(unitId) {
  productsStore.resetScannedUnit()

  const result = await productsStore.fetchScannedUnit(unitId)

  if (result) {
    setBreadcrumbs([
      { title: 'Productos', to: { name: 'products' } },
      {
        title: result.product.name,
        to: { name: 'product-details', params: { id: result.product.id } },
      },
      { title: `Unidad ${result.unit.id.slice(0, 8)}` },
    ])
  }

  return result
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
      <Card class="w-full max-w-md">
        <CardContent class="flex flex-col items-center justify-center p-8">
          <div class="bg-muted/50 mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <Loader2 class="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
          <h3 class="text-base font-semibold">Unidad no encontrada</h3>
          <p class="text-muted-foreground mt-1 mb-4 max-w-sm text-sm">
            Este código no existe en el sistema
          </p>
          <Button variant="outline" size="sm" @click="router.push({ name: 'home' })">
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
    <!-- Main content -->
    <div v-else class="w-full px-4 pb-6 lg:px-6">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <!-- Left column -->
        <div class="flex flex-col gap-4 lg:col-span-5">
          <!-- Status banner -->
          <div
            class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold tracking-wider lg:rounded-sm"
            :class="statusBannerClasses"
          >
            <CheckCircle2 v-if="scannedUnit.status === 'available'" class="h-4 w-4" />
            <XCircle v-else class="h-4 w-4" />
            {{ fullStatusText }}
          </div>
          <!-- Product -->
          <Card
            class="overflow-hidden p-0 shadow-sm lg:rounded-md lg:border lg:bg-transparent lg:shadow-none"
          >
            <CardContent class="flex flex-col gap-4 p-4 lg:px-6 lg:pb-6">
              <div class="flex w-full flex-col gap-2">
                <!-- Name -->
                <h3 class="line-clamp-2 text-base leading-tight font-semibold">
                  {{ scannedProduct.name }}
                </h3>
                <!-- Description -->
                <p class="text-muted-foreground line-clamp-3 text-xs leading-relaxed lg:text-sm">
                  {{ scannedProduct.description || 'Sin descripción' }}
                </p>
              </div>
              <div class="flex items-stretch gap-4 lg:gap-5">
                <!-- Image -->
                <div class="w-32 shrink-0 lg:w-52">
                  <ProductImage
                    :public-id="scannedProduct.image_public_id"
                    :alt="scannedProduct.name"
                    :size="IMAGE_SIZES.detail"
                    image-class="h-full w-full object-cover rounded-sm"
                    fallback-class="bg-muted flex justify-center h-full w-full items-center rounded-lg lg:rounded-sm"
                    icon-class="text-muted-foreground h-8 w-8"
                  />
                </div>
                <!-- Details -->
                <div class="flex min-w-0 flex-1 flex-col justify-between">
                  <div class="flex flex-col gap-2 text-xs sm:text-sm">
                    <!-- Category -->
                    <div class="flex justify-between gap-4">
                      <span class="text-muted-foreground shrink-0">Categoría</span>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <span class="min-w-0 cursor-default truncate text-right">
                            {{ scannedProduct.category || 'Sin categoría' }}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ scannedProduct.category || 'Sin categoría' }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <!-- Brand -->
                    <div class="flex justify-between gap-2">
                      <span class="text-muted-foreground">Marca</span>
                      <span>{{ scannedProduct.brand || 'Sin marca' }}</span>
                    </div>
                    <!-- Color -->
                    <div class="flex justify-between gap-2">
                      <span class="text-muted-foreground">Color</span>
                      <span>{{ scannedProduct.color || 'Sin color' }}</span>
                    </div>
                    <!-- Size -->
                    <div class="flex justify-between gap-2">
                      <span class="text-muted-foreground">Talla</span>
                      <span>{{ scannedProduct.size || 'Sin talla' }}</span>
                    </div>
                    <!-- Status -->
                    <div
                      v-if="!scannedProduct.is_active"
                      class="mt-0.5 flex items-center justify-between gap-2"
                    >
                      <span class="text-muted-foreground">Estado</span>
                      <Badge
                        variant="outline"
                        class="border-rose-500/30 bg-rose-500/10 text-rose-400"
                      >
                        Retirado
                      </Badge>
                    </div>
                    <!-- Price -->
                    <div class="flex justify-between gap-2">
                      <span class="text-muted-foreground">Precio</span>
                      <span class="font-bold">{{ formatCurrency(scannedProduct.price) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Unit -->
              <div class="flex flex-col gap-1.5 border-t pt-3 text-xs lg:text-sm">
                <div class="flex justify-between gap-2">
                  <!-- Id -->
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">Unidad:</span>
                    <div class="flex items-center gap-1">
                      <span class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs font-medium">
                        {{ scannedUnit.id.slice(0, 8) }}
                      </span>
                      <!-- Copy button -->
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="h-6 w-6"
                            @click="handleCopyUnitId(scannedUnit.id)"
                          >
                            <Copy class="h-3 w-3" :class="{ 'text-emerald-500': copied }" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ copied ? '¡Copiado!' : 'Copiar ID completo' }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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
                <div class="flex justify-between gap-2">
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
                <!-- Note -->
                <div v-if="scannedUnit.note" class="mt-1.5 flex items-start gap-1.5 border-t pt-2">
                  <span class="text-muted-foreground shrink-0">Nota:</span>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <span class="line-clamp-1 cursor-default text-left italic">
                        {{ scannedUnit.note || 'Sin referencia / nota' }}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent class="max-w-xs">
                      <p class="whitespace-pre-wrap">
                        {{ scannedUnit.note || 'Sin referencia / nota' }}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <!-- View full product button -->
              <Button
                class="mt-2 w-full lg:w-auto lg:self-end"
                @click="router.push({ name: 'product-details', params: { id: scannedProduct.id } })"
              >
                Ver producto completo
              </Button>
            </CardContent>
          </Card>
        </div>
        <!-- Right column -->
        <div class="flex flex-col lg:col-span-7">
          <!-- Title -->
          <!-- <h2 class="mb-3 mt-0 text-lg font-semibold lg:mb-0">Variantes de producto</h2> -->
          <!-- Matrix -->
          <Card
            class="bg-muted/20 flex-1 shadow-sm lg:border-0 lg:bg-transparent lg:py-0 lg:shadow-none"
          >
            <CardContent
              class="text-muted-foreground flex h-full min-h-75 flex-col items-center justify-center p-6 text-center lg:rounded-sm lg:border lg:border-dashed"
            >
              <p>Matriz de variantes (Próximamente)</p>
              <p class="mt-1 max-w-xs text-xs">
                Aquí se mostrará la tabla de tallas y colores con la disponibilidad de stock
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>
