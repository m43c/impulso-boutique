<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import SaleDetailUnits from '@/components/sales/SaleDetailUnits.vue'
import ReturnModal from '@/components/sales/returns/ReturnModal.vue'
import { usePermissions } from '@/composables/usePermissions'
import { formatDateTimeLaPaz } from '@/utils/date'
import { formatReturnDeadline } from '@/utils/returns'
import { formatItemsCount, formatPaymentMethod, formatSaleTotal, shortId } from '@/utils/sales'

const props = defineProps({
  sale: { type: Object, default: null },
})

const emit = defineEmits(['return-registered'])

const open = defineModel('open', { type: Boolean, default: false })

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const canCreateReturn = computed(() => can('returns:create'))

const returnUnit = ref(null)
const isReturnModalOpen = ref(false)

const now = ref(Date.now())
let clockTimer = null

onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 60000)
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
})

const saleTitle = computed(() => {
  const base = `Venta #${shortId(props.sale?.id)}`
  return props.sale && !props.sale.payment_method ? `${base} · Cambio` : base
})

const saleSubtitle = computed(() => {
  if (!props.sale) {
    return ''
  }

  const method = props.sale.payment_method
    ? formatPaymentMethod(props.sale.payment_method)
    : 'sin cobro'

  return `${formatDateTimeLaPaz(props.sale.created_at)} · ${method}`
})

const deadlineText = computed(() =>
  props.sale?.returnable_until
    ? formatReturnDeadline(props.sale.returnable_until, now.value)
    : null,
)

async function openReturnModal(unit) {
  returnUnit.value = unit

  if (!isDesktop.value) {
    open.value = false
    await nextTick()
  }

  isReturnModalOpen.value = true
}

watch(isReturnModalOpen, (isOpen) => {
  if (isOpen) {
    return
  }

  returnUnit.value = null

  if (!isDesktop.value) {
    open.value = true
  }
})

function handleReturnSuccess(payload) {
  emit('return-registered', payload)
}
</script>

<template>
  <!-- Desktop view (sheet) -->
  <Sheet v-if="isDesktop" v-model:open="open">
    <SheetContent class="flex w-full flex-col gap-0 px-5 py-4 sm:max-w-md">
      <SheetHeader class="gap-0.5 p-0 pb-3">
        <SheetTitle class="lg:text-[13px]">
          <span>{{ saleTitle }}</span>
        </SheetTitle>
        <SheetDescription v-if="sale" class="lg:text-xs">
          {{ saleSubtitle }}
        </SheetDescription>
      </SheetHeader>
      <template v-if="sale">
        <div class="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
          <span class="shrink-0">Responsable:</span>
          <span class="text-foreground truncate">{{ sale.profile_name }}</span>
        </div>
        <div class="flex gap-2 text-xs">
          <span class="text-muted-foreground shrink-0">Unidades vendidas:</span>
          <p class="text-xs">{{ formatItemsCount(sale.items_count) }}</p>
        </div>
        <div v-if="deadlineText" class="flex items-center gap-1.5 text-xs">
          <span class="text-muted-foreground">Fecha de devolución:</span>
          <span>{{ deadlineText }}</span>
        </div>
        <div class="mt-4 min-h-0 flex-1 overflow-y-auto">
          <SaleDetailUnits
            :units="sale.units"
            :can-create-return="canCreateReturn"
            @return-unit="openReturnModal"
          />
        </div>
        <div class="mt-4 flex items-center justify-between border-t pt-3">
          <span class="text-sm">Total</span>
          <span class="text-base font-semibold tabular-nums">
            {{ formatSaleTotal(sale.total_amount) }}
          </span>
        </div>
      </template>
    </SheetContent>
  </Sheet>
  <!-- Mobile view (drawer) -->
  <Drawer v-else v-model:open="open">
    <DrawerContent class="flex max-h-[90dvh] flex-col pb-4">
      <DrawerHeader class="gap-0 px-5 pt-3 pb-2 text-left">
        <DrawerTitle class="text-sm">{{ saleTitle }}</DrawerTitle>
        <DrawerDescription v-if="sale" class="text-xs">
          {{ saleSubtitle }}
        </DrawerDescription>
      </DrawerHeader>
      <div v-if="sale" class="flex min-h-0 flex-1 flex-col px-5">
        <div class="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
          <span class="shrink-0">Responsable:</span>
          <span class="text-foreground truncate">{{ sale.profile_name }}</span>
        </div>
        <div class="flex gap-2">
          <span class="text-muted-foreground shrink-0 text-xs">Unidades vendidas:</span>
          <p class="text-xs">{{ formatItemsCount(sale.items_count) }}</p>
        </div>
        <div v-if="deadlineText" class="flex items-center gap-1.5 text-xs">
          Fecha de devolución:
          <span>{{ deadlineText }}</span>
        </div>
        <div class="mt-4 min-h-0 flex-1 overflow-y-auto">
          <SaleDetailUnits
            :units="sale.units"
            :can-create-return="canCreateReturn"
            @return-unit="openReturnModal"
          />
        </div>
        <div class="mt-4 flex items-center justify-between border-t pt-3">
          <span class="text-sm">Total</span>
          <span class="text-base font-semibold tabular-nums">
            {{ formatSaleTotal(sale.total_amount) }}
          </span>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
  <ReturnModal
    v-model:open="isReturnModalOpen"
    :sale="sale"
    :unit="returnUnit"
    @success="handleReturnSuccess"
  />
</template>
