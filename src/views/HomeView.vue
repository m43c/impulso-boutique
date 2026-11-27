<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { useReturnsStore } from '@/stores/returns'
import { CircleAlert, CheckCircle2, Undo2 } from '@lucide/vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePermissions } from '@/composables/usePermissions'
import { formatReturnReason, formatReturnType } from '@/utils/returns'

const router = useRouter()
const alertsStore = useAlertsStore()
const returnsStore = useReturnsStore()
const { can } = usePermissions()

const canViewLowStock = computed(() => can('dashboard:view-low-stock-alerts'))
const canViewReturned = computed(() => can('returns:review'))
const canViewAlerts = computed(() => canViewLowStock.value || canViewReturned.value)

const MAX_ROWS = 3

const returnedUnits = ref([])
const hasLoadedReturnedUnits = ref(false)
let returnedUnitsRequestId = 0

const returnedUnitsLabel = computed(() => {
  const count = alertsStore.returnedCount ?? 0
  return `${count} ${count === 1 ? 'unidad espera revisión' : 'unidades esperan revisión'}`
})

const visibleReturnedUnits = computed(() => returnedUnits.value.slice(0, MAX_ROWS))

const returnedRemaining = computed(() => (alertsStore.returnedCount ?? 0) - MAX_ROWS)

async function loadReturnedUnits() {
  const requestId = ++returnedUnitsRequestId
  const result = await returnsStore.fetchReturnedUnits()

  if (requestId !== returnedUnitsRequestId) {
    return
  }

  if (result.ok) {
    returnedUnits.value = result.units
  }

  hasLoadedReturnedUnits.value = true
}

function getUnitVariant(unit) {
  return [unit.color, unit.size].filter(Boolean).join(' · ')
}

function getReplacementVariant(unit) {
  return [unit.replacement_color, unit.replacement_size].filter(Boolean).join(' · ')
}

function getReturnedDate(unit) {
  if (!unit.return_created_at) {
    return null
  }

  const date = new Date(unit.return_created_at)
  return Number.isNaN(date.getTime()) ? null : date
}

function getWaitingDays(unit) {
  const date = getReturnedDate(unit)
  if (!date) {
    return null
  }

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}

function formatWaiting(days) {
  if (days === null) return 'Pendiente'
  if (days === 0) return 'Hoy'
  return `${days} ${days === 1 ? 'día' : 'días'}`
}

function getWaitingTooltip(unit) {
  const days = getWaitingDays(unit)
  const date = getReturnedDate(unit)

  if (days === null || !date) {
    return 'Pendiente de revisión'
  }

  const dateLabel = date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return days === 0
    ? `Devuelta hoy (${dateLabel})`
    : `Esperando revisión hace ${formatWaiting(days)} (devuelta el ${dateLabel})`
}

// A partir de 3 días sin revisar se marca en rojo
function getWaitingClass(unit) {
  const days = getWaitingDays(unit)

  return days !== null && days >= 3
    ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
}

// El conteo se actualiza en tiempo real (store de alertas); al cambiar, refrescamos la lista
watch(
  () => alertsStore.returnedCount,
  (count) => {
    if (!canViewReturned.value || count === null) {
      return
    }

    if (count === 0) {
      returnedUnitsRequestId += 1
      returnedUnits.value = []
      hasLoadedReturnedUnits.value = true
      return
    }

    loadReturnedUnits()
  },
  { immediate: true },
)

onMounted(() => {
  if (canViewLowStock.value) {
    alertsStore.fetchLowStockAlerts()
  }

  if (canViewReturned.value) {
    alertsStore.fetchReturnedCount()
  }
})

function goToLowStock() {
  router.push('/products?stock=low')
}

function goToReturns() {
  router.push('/sales?tab=returns')
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <!-- Alerts -->
    <div v-if="canViewAlerts" class="flex flex-wrap items-start gap-6">
      <TooltipProvider :delay-duration="200">
        <!-- Low stock -->
        <template v-if="canViewLowStock">
          <!-- Skeleton -->
          <Card
            v-if="alertsStore.isLoading"
            class="border-border/50 w-full max-w-md gap-3 rounded-md p-0 shadow-sm lg:max-w-xs"
          >
            <CardHeader class="gap-0 px-4 pt-4">
              <CardTitle class="flex items-center justify-between gap-2">
                <div class="flex gap-1.5">
                  <Skeleton class="h-5 w-5 rounded-full" />
                  <Skeleton class="h-5 w-48" />
                </div>
                <Skeleton class="h-5 w-5 rounded-full" />
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4 px-4 pt-2 pb-4">
              <div v-for="i in 3" :key="i" class="flex items-center justify-between">
                <Skeleton class="h-4 w-3/4" />
                <Skeleton class="ml-2 h-5 w-16 rounded-full" />
              </div>
              <Skeleton class="h-6 w-full rounded-md" />
            </CardContent>
          </Card>
          <!-- Info -->
          <Card
            v-else-if="alertsStore.lowStockCount > 0"
            class="w-full max-w-md gap-3 rounded-md border-amber-500/20 p-0 shadow-sm lg:max-w-xs"
          >
            <CardHeader class="gap-0 px-4 pt-4">
              <CardTitle class="flex items-start justify-between">
                <div class="flex gap-1.5 text-amber-500">
                  <CircleAlert class="h-4 w-4" />
                  <span class="text-xs">Productos con stock bajo</span>
                </div>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button type="button" class="shrink-0 cursor-default">
                      <Badge
                        variant="outline"
                        class="h-5 w-5 rounded-full border-amber-500/30 pb-1 text-[11px] text-amber-500"
                      >
                        {{ alertsStore.lowStockCount }}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {{ alertsStore.lowStockCount }}
                      {{ alertsStore.lowStockCount === 1 ? 'producto' : 'productos' }} con stock
                      bajo
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 px-4 pb-4">
              <div
                v-for="item in alertsStore.lowStockProducts.slice(0, MAX_ROWS)"
                :key="item.id"
                class="flex items-center justify-between text-sm"
              >
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      type="button"
                      class="min-w-0 cursor-default truncate pr-4 text-left text-xs"
                    >
                      {{ item.product.name }}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{{ item.product.name }}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button type="button" class="shrink-0 cursor-default">
                      <Badge
                        variant="outline"
                        class="text-[11px]"
                        :class="
                          item.stock_available === 0
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        "
                      >
                        {{ item.stock_available }} / mín. {{ item.product.min_stock }}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {{
                        item.stock_available === 0
                          ? 'Sin stock disponible'
                          : `${item.stock_available} disponible${item.stock_available === 1 ? '' : 's'}`
                      }}
                      · Mínimo requerido: {{ item.product.min_stock }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p
                v-if="alertsStore.lowStockCount > MAX_ROWS"
                class="text-muted-foreground text-center text-xs"
              >
                Y {{ alertsStore.lowStockCount - MAX_ROWS }}
                {{ alertsStore.lowStockCount - MAX_ROWS > 1 ? 'productos' : 'producto' }}
                más...
              </p>
              <Button variant="secondary" size="sm" class="w-full" @click="goToLowStock">
                <span class="text-[13px] lg:text-xs">Ver todos los productos</span>
              </Button>
            </CardContent>
          </Card>
          <Card v-else class="w-full max-w-md rounded-md p-0 shadow-sm lg:max-w-sm">
            <CardContent class="flex items-start gap-1.5 p-4">
              <CheckCircle2 class="h-4 w-4" />
              <p class="text-xs font-medium">Todo el inventario está en niveles óptimos</p>
            </CardContent>
          </Card>
        </template>
        <!-- Returns to review -->
        <template v-if="canViewReturned">
          <!-- Skeleton -->
          <Card
            v-if="alertsStore.returnedCount === null && alertsStore.isLoadingReturned"
            class="border-border/50 w-full max-w-md gap-3 rounded-md p-0 shadow-sm lg:max-w-xs"
          >
            <CardHeader class="px-4 pt-4">
              <CardTitle class="flex items-center justify-between gap-2">
                <div class="flex gap-1.5">
                  <Skeleton class="h-5 w-5 rounded-full" />
                  <Skeleton class="h-5 w-52" />
                </div>
                <Skeleton class="h-5 w-5 rounded-full" />
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4 px-4 pt-2 pb-4">
              <div v-for="i in 3" :key="i" class="flex items-center justify-between">
                <Skeleton class="h-4 w-3/4" />
                <Skeleton class="h-5 w-16 rounded-full" />
              </div>
              <Skeleton class="mt-2 h-6 w-full rounded-md" />
            </CardContent>
          </Card>
          <!-- Info -->
          <Card
            v-else-if="alertsStore.returnedCount > 0"
            class="w-full max-w-md gap-3 rounded-md border-amber-500/20 p-0 shadow-sm lg:max-w-xs"
          >
            <CardHeader class="gap-0 px-4 pt-4">
              <CardTitle class="flex items-start justify-between">
                <div class="flex gap-1.5 text-amber-500">
                  <Undo2 class="h-4 w-4" />
                  <span class="text-xs">Devoluciones por revisar</span>
                </div>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button type="button" class="shrink-0 cursor-default">
                      <Badge
                        variant="outline"
                        class="h-5 w-5 rounded-full border-amber-500/30 pb-1 text-[11px] text-amber-500"
                      >
                        {{ alertsStore.returnedCount }}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{{ returnedUnitsLabel }}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 px-4 pb-4">
              <!-- Rows -->
              <template v-if="hasLoadedReturnedUnits && visibleReturnedUnits.length > 0">
                <div
                  v-for="unit in visibleReturnedUnits"
                  :key="unit.unit_id"
                  class="flex items-center justify-between text-sm"
                >
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        type="button"
                        class="min-w-0 cursor-default truncate pr-4 text-left text-xs"
                      >
                        {{ unit.product_name }}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ unit.product_name }}</p>
                      <p v-if="getUnitVariant(unit)" class="opacity-70">
                        {{ getUnitVariant(unit) }}
                      </p>
                      <p class="opacity-70">Código: {{ unit.unit_code }}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button type="button" class="shrink-0 cursor-default">
                        <Badge variant="outline" class="text-[11px]" :class="getWaitingClass(unit)">
                          {{ formatWaiting(getWaitingDays(unit)) }}
                        </Badge>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ getWaitingTooltip(unit) }}</p>
                      <p class="opacity-70">
                        {{ formatReturnType(unit.return_type) }} ·
                        {{ formatReturnReason(unit.return_reason) }}
                      </p>
                      <p v-if="unit.return_note" class="opacity-70">Nota: {{ unit.return_note }}</p>
                      <p v-if="unit.return_profile_name" class="opacity-70">
                        Registrada por {{ unit.return_profile_name }}
                      </p>
                      <p v-if="unit.replacement_product_name" class="opacity-70">
                        Reemplazo: {{ unit.replacement_product_name }}
                        <template v-if="getReplacementVariant(unit)">
                          ({{ getReplacementVariant(unit) }})
                        </template>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p v-if="returnedRemaining > 0" class="text-muted-foreground text-center text-xs">
                  Y {{ returnedRemaining }}
                  {{ returnedRemaining > 1 ? 'unidades' : 'unidad' }}
                  más...
                </p>
              </template>
              <!-- Rows loading -->
              <template v-else-if="!hasLoadedReturnedUnits">
                <div v-for="i in 3" :key="i" class="flex items-center justify-between">
                  <Skeleton class="h-4 w-3/4" />
                  <Skeleton class="h-5 w-12 rounded-full" />
                </div>
              </template>
              <!-- Fallback if the list could not be loaded -->
              <p v-else class="text-xs">{{ returnedUnitsLabel }}</p>
              <Button variant="secondary" size="sm" class="w-full" @click="goToReturns">
                <span class="text-[13px] lg:text-xs">Ver todas las devoluciones</span>
              </Button>
            </CardContent>
          </Card>
          <!-- No returns -->
          <Card
            v-else-if="alertsStore.returnedCount === 0"
            class="w-full max-w-md rounded-md p-0 shadow-sm lg:max-w-xs"
          >
            <CardContent class="flex items-start gap-1.5 p-4">
              <CheckCircle2 class="h-4 w-4" />
              <p class="text-xs font-medium">No hay devoluciones pendientes de revisión</p>
            </CardContent>
          </Card>
        </template>
      </TooltipProvider>
    </div>
  </div>
</template>
