<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useReturnsStore } from '@/stores/returns'
import { Ban, CircleAlert, CircleCheck, ChevronDown, Undo2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ReturnModal from '@/components/sales/returns/ReturnModal.vue'
import { usePermissions } from '@/composables/usePermissions'
import { formatCurrency } from '@/utils/currency'
import { formatDateTimeLaPaz } from '@/utils/date'
import { formatReturnDeadline, formatReturnReason, formatReturnType } from '@/utils/returns'
import { formatPaymentMethod, shortId } from '@/utils/sales'

const props = defineProps({
  unitId: { type: String, default: null },
  unitStatus: { type: String, default: null },
  product: { type: Object, default: null },
})

const emit = defineEmits(['return-registered'])

const returnsStore = useReturnsStore()
const { can } = usePermissions()
const isDesktop = useMediaQuery('(min-width: 768px)')

const canViewUnitSale = computed(() => can('sales:view-unit'))
const canCreateReturn = computed(() => can('returns:create'))
const shouldFetch = computed(
  () => !!props.unitId && canViewUnitSale.value && ['sold', 'returned'].includes(props.unitStatus),
)

const sale = ref(null)
const error = ref(null)
const isLoading = ref(false)
const isReturnModalOpen = ref(false)
const showOtherUnits = ref(false)

const now = ref(Date.now())
let clockTimer = null
let requestId = 0

onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 60000)
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
})

async function loadSale() {
  const id = ++requestId
  showOtherUnits.value = false

  if (!shouldFetch.value) {
    sale.value = null
    error.value = null
    isLoading.value = false
    return
  }

  sale.value = null
  error.value = null
  isLoading.value = true

  const result = await returnsStore.fetchUnitSale(props.unitId)

  if (id !== requestId) {
    return
  }

  isLoading.value = false

  if (!result.ok) {
    error.value = result.message
    return
  }

  sale.value = result.sale
}

watch(() => [props.unitId, props.unitStatus], loadSale, { immediate: true })

const returnInfo = computed(() => sale.value?.return_info ?? null)

const statusLabel = computed(() =>
  props.unitStatus === 'returned' ? 'Unidad devuelta' : 'Unidad vendida',
)

const statusClasses = computed(() =>
  props.unitStatus === 'returned' ? 'text-amber-400' : 'text-sky-500',
)

const isExpired = computed(() => {
  if (!sale.value?.returnable_until) {
    return false
  }

  return new Date(sale.value.returnable_until).getTime() <= now.value
})

const deadlineText = computed(() =>
  sale.value?.returnable_until
    ? formatReturnDeadline(sale.value.returnable_until, now.value)
    : null,
)

const disabledReason = computed(() => {
  if (sale.value?.can_return) {
    return null
  }

  return isExpired.value
    ? 'El plazo de 24 horas venció'
    : 'Esta unidad no está disponible para devolución'
})

const paymentText = computed(() => {
  if (!sale.value) {
    return ''
  }

  if (!sale.value.payment_method) {
    return 'Sin cobro · Cambio'
  }

  return `Pagó ${formatCurrency(sale.value.unit_price)} · ${formatPaymentMethod(sale.value.payment_method)}`
})

const otherUnits = computed(() => sale.value?.other_units ?? [])

const replacementText = computed(() => {
  const info = returnInfo.value

  if (!info?.replacement_product_name) {
    return null
  }

  const variant = [info.replacement_color, info.replacement_size].filter(Boolean).join(' · ')
  const code = info.replacement_unit_code ? ` (${info.replacement_unit_code})` : ''

  return `Cambiada por: ${info.replacement_product_name}${variant ? ` · ${variant}` : ''}${code}`
})

const STATUS_DISPLAY = {
  available: {
    text: 'Unidad disponible para la venta',
    icon: CircleCheck,
    classes: 'text-emerald-500',
  },
  unavailable: {
    text: 'Unidad no disponible para la venta',
    icon: Ban,
    classes: 'text-rose-400',
  },
  sold: {
    text: 'Unidad vendida',
    icon: CircleCheck,
    classes: 'text-sky-500',
  },
  returned: {
    text: 'Unidad devuelta y en revisión',
    icon: Undo2,
    classes: 'text-amber-400',
  },
}

const fallbackStatus = computed(() => {
  const status = STATUS_DISPLAY[props.unitStatus]

  if (!status) {
    return null
  }

  if (props.unitStatus === 'sold' && canViewUnitSale.value) {
    return { ...status, text: 'Unidad vendida sin una venta registrada' }
  }

  return status
})

const modalSale = computed(() =>
  sale.value
    ? {
        id: sale.value.sale_id,
        payment_method: sale.value.payment_method,
      }
    : null,
)

const modalUnit = computed(() =>
  sale.value
    ? {
        unit_id: sale.value.unit_id,
        sale_detail_id: sale.value.sale_detail_id,
        product_name: props.product?.name ?? '',
        color: props.product?.color ?? null,
        size: props.product?.size ?? null,
        unit_price: sale.value.unit_price,
        can_refund: sale.value.can_refund,
        is_replacement_unit: sale.value.is_replacement_unit,
      }
    : null,
)

function openReturnModal() {
  if (!sale.value?.can_return) {
    return
  }

  isReturnModalOpen.value = true
}

function handleReturnSuccess(payload) {
  emit('return-registered', payload)
}

function formatOtherUnitStatus(unit) {
  if (unit?.status === 'returned') {
    return `Devuelta · ${formatReturnType(unit.return_type)}`
  }

  return 'Vendida'
}
</script>

<template>
  <Card class="shrink-0 overflow-hidden p-0 shadow-sm lg:rounded-md">
    <CardContent class="flex flex-col gap-2 p-3 lg:px-4 lg:py-3">
      <!-- Skeleton -->
      <template v-if="isLoading">
        <div class="flex items-center justify-between gap-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-3 w-36" />
        </div>
        <Skeleton class="h-3 w-48" />
        <div class="flex items-center gap-3">
          <Skeleton class="h-12 w-12 shrink-0 rounded-md" />
          <div class="flex flex-1 flex-col gap-1.5">
            <Skeleton class="h-3 w-40" />
            <Skeleton class="h-3 w-28" />
          </div>
        </div>
        <Skeleton class="h-8 w-full rounded-md" />
      </template>
      <!-- Error message -->
      <div v-else-if="error" class="flex flex-col gap-2">
        <p class="text-destructive flex items-start gap-1.5 text-xs">
          <CircleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{{ error }}</span>
        </p>
        <Button variant="outline" size="sm" class="w-full sm:w-auto" @click="loadSale">
          Reintentar
        </Button>
      </div>
      <!-- Sale found -->
      <template v-else-if="sale">
        <!-- Returned unit -->
        <template v-if="unitStatus === 'returned'">
          <div
            class="flex flex-wrap items-center justify-between"
            :class="!isDesktop ? 'flex flex-col items-start' : ''"
          >
            <span
              class="flex items-center gap-1.5 text-xs font-semibold tracking-wider"
              :class="statusClasses"
            >
              <Undo2 class="h-3.5 w-3.5" />
              {{ statusLabel }}
            </span>
            <span v-if="returnInfo?.created_at" class="text-muted-foreground text-[11px]">
              En revisión desde {{ formatDateTimeLaPaz(returnInfo.created_at) }}
            </span>
          </div>
          <p v-if="returnInfo" class="text-xs font-medium">
            {{ formatReturnType(returnInfo.type) }} · {{ formatReturnReason(returnInfo.reason) }}
          </p>
          <div>
            <p v-if="returnInfo?.profile_name" class="text-muted-foreground text-[11px]">
              Registró: {{ returnInfo.profile_name }}
            </p>
            <p v-if="replacementText" class="text-muted-foreground text-[11px]">
              {{ replacementText }}
            </p>
            <p v-else class="text-muted-foreground text-[11px]">
              La unidad quedó en revisión y no volverá al stock hasta que se apruebe.
            </p>
          </div>
        </template>
        <!-- Sold unit -->
        <template v-else>
          <!-- Status -->
          <div
            class="flex flex-wrap items-center justify-between"
            :class="!isDesktop ? 'flex flex-col items-start' : ''"
          >
            <span
              class="flex items-center gap-1.5 text-xs font-semibold tracking-wider"
              :class="statusClasses"
            >
              <CircleCheck class="h-3.5 w-3.5" />
              {{ statusLabel }}
            </span>
            <span class="text-muted-foreground text-[11px]">
              Venta #{{ shortId(sale.sale_id) }} · {{ formatDateTimeLaPaz(sale.sale_created_at) }}
            </span>
          </div>
          <!-- Deadline -->
          <p v-if="deadlineText" class="text-xs" :class="isExpired ? 'text-rose-500' : ''">
            {{ deadlineText }} para su devolución
          </p>
          <!-- User -->
          <div class="min-w-0 flex-1">
            <div>
              <p class="text-muted-foreground text-[11px]">{{ paymentText }}</p>
              <div class="flex justify-between gap-2" :class="!isDesktop ? 'flex flex-col' : ''">
                <p class="text-muted-foreground truncate text-[11px]">
                  Cajero: {{ sale.profile_name }}
                </p>
                <p
                  v-if="!sale.can_return && disabledReason"
                  class="text-muted-foreground text-[11px]"
                >
                  {{ disabledReason }}
                </p>
              </div>
            </div>
          </div>
          <!-- Other sales -->
          <div v-if="otherUnits.length" class="border-t pt-2">
            <button
              type="button"
              class="text-muted-foreground hover:text-foreground flex w-full items-center justify-between text-[11px] font-medium transition-colors"
              :aria-expanded="showOtherUnits"
              @click="showOtherUnits = !showOtherUnits"
            >
              <span>
                {{ showOtherUnits ? 'Ocultar' : 'Ver' }} otras unidades de la venta ({{
                  otherUnits.length
                }})
              </span>
              <ChevronDown
                class="h-3.5 w-3.5 transition-transform"
                :class="showOtherUnits ? 'rotate-180' : ''"
              />
            </button>
            <div v-if="showOtherUnits" class="mt-1 max-h-28 overflow-auto overscroll-contain">
              <ul class="flex w-max min-w-full flex-col pr-1 pb-1">
                <li
                  v-for="unit in otherUnits"
                  :key="unit.sale_detail_id"
                  class="flex items-start justify-between gap-4 text-[11px] whitespace-nowrap"
                >
                  <span>
                    {{ unit.product_name }}
                    <span
                      v-if="[unit.color, unit.size].filter(Boolean).length"
                      class="text-muted-foreground"
                    >
                      · {{ [unit.color, unit.size].filter(Boolean).join(' · ') }}
                    </span>
                  </span>
                  <span
                    class="shrink-0"
                    :class="unit.status === 'returned' ? 'text-amber-500' : 'text-muted-foreground'"
                  >
                    {{ formatOtherUnitStatus(unit) }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <!-- Action button -->
          <Button
            v-if="canCreateReturn"
            size="sm"
            class="w-full lg:text-xs"
            :disabled="!sale.can_return"
            @click="openReturnModal"
          >
            {{ sale.is_replacement_unit ? 'Cambiar otra vez' : 'Registrar devolución' }}
          </Button>
        </template>
      </template>
      <!-- No active sale -->
      <span
        v-else-if="fallbackStatus"
        class="flex items-center gap-1.5 text-xs font-semibold"
        :class="fallbackStatus.classes"
      >
        <component :is="fallbackStatus.icon" class="h-3.5 w-3.5" />
        {{ fallbackStatus.text }}
      </span>
    </CardContent>
  </Card>
  <ReturnModal
    v-model:open="isReturnModalOpen"
    :sale="modalSale"
    :unit="modalUnit"
    @success="handleReturnSuccess"
  />
</template>
