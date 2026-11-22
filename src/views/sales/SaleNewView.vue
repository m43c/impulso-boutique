<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { useSaleStore } from '@/stores/sale'
import { Check, CircleAlert, CircleCheck, Loader2, Plus, ScanLine, Tag, Trash2 } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import SaleItemsList from '@/components/sales/SaleItemsList.vue'
import SaleQrScannerModal from '@/components/sales/SaleQrScannerModal.vue'
import { formatCurrency } from '@/utils/currency'
import { formatPaymentMethod, shortId } from '@/utils/sales'

const router = useRouter()
const saleStore = useSaleStore()
const isDesktop = useMediaQuery('(min-width: 768px)')

const manualCode = ref('')
const notice = ref(null)
const confirmError = ref(null)
const isScannerOpen = ref(false)

let noticeTimeout = null

const paymentModel = computed({
  get: () => saleStore.paymentMethod,
  set: (value) => saleStore.setPaymentMethod(value),
})

const isResultOpen = computed({
  get: () => !!saleStore.lastSale,
  set: (value) => {
    if (!value) {
      saleStore.clearLastSale()
    }
  },
})

const itemLabel = computed(() => (saleStore.count === 1 ? 'prenda' : 'prendas'))

function showNotice(type, message) {
  notice.value = { type, message }
  clearTimeout(noticeTimeout)
  noticeTimeout = setTimeout(() => {
    notice.value = null
  }, 4000)
}

function handleOpenScanner() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  isScannerOpen.value = true
}

async function handleAddCode() {
  const code = manualCode.value.trim()

  if (!code || saleStore.isResolving) {
    return
  }

  notice.value = null

  const result = await saleStore.addUnitByCode(code)

  if (result.ok) {
    manualCode.value = ''
    showNotice('success', `Unidad ${shortId(result.unit.id)} agregada`)
  } else {
    showNotice('error', result.message)
  }
}

async function handleConfirm() {
  if (!saleStore.canConfirm) {
    return
  }

  confirmError.value = null
  notice.value = null

  const result = await saleStore.confirmSale()

  if (!result.ok) {
    confirmError.value = {
      message: result.message,
      isBusinessError: Boolean(result.code),
    }
  }
}

function handleRemove(unitId) {
  const wasFailed = saleStore.failedUnitId === unitId

  saleStore.removeUnit(unitId)

  if (wasFailed) {
    confirmError.value = null
  }
}

function handleClear() {
  saleStore.clear()
  notice.value = null
  confirmError.value = null
}

function handleRetryWithoutFailed() {
  if (saleStore.failedUnitId) {
    saleStore.removeUnit(saleStore.failedUnitId)
  }

  confirmError.value = null
}

function handleNewSale() {
  saleStore.clearLastSale()
  manualCode.value = ''
  notice.value = null
  confirmError.value = null
}

function handleGoToSales() {
  saleStore.clearLastSale()
  router.push({ name: 'sales' })
}

onBeforeUnmount(() => {
  clearTimeout(noticeTimeout)
  saleStore.clearLastSale()
})
</script>

<template>
  <div
    class="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 md:h-[calc(100dvh-5rem)] md:flex-none md:overflow-hidden md:pb-0"
    :class="saleStore.count > 0 ? 'pb-44' : 'pb-6'"
  >
    <div class="flex min-h-0 flex-1 flex-col gap-4">
      <!-- Add controls -->
      <div class="flex flex-col gap-3 md:flex-row md:items-center lg:gap-2">
        <Button
          variant="outline"
          :size="isDesktop ? 'sm' : ''"
          class="w-full md:w-auto lg:text-xs"
          @click="handleOpenScanner"
        >
          <ScanLine class="size-4 lg:size-3.5" />
          Escanear prenda
        </Button>
        <div class="flex flex-1 gap-2">
          <Input
            v-model="manualCode"
            placeholder="Ingresar código de prenda..."
            class="font-mono text-[13px]! lg:h-8 lg:text-xs!"
            autocomplete="off"
            spellcheck="false"
            @keyup.enter="handleAddCode"
          />
          <Button
            :disabled="saleStore.isResolving || !manualCode.trim()"
            :size="isDesktop ? 'sm' : ''"
            class="lg:text-xs"
            @click="handleAddCode"
          >
            <Loader2 v-if="saleStore.isResolving" class="size-4 animate-spin" />
            <Plus v-else class="size-3.5" />
            Agregar
          </Button>
        </div>
      </div>
      <!-- Add feedback -->
      <div
        v-if="notice"
        class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        :class="
          notice.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'border-destructive/30 bg-destructive/10 text-destructive'
        "
      >
        <Check v-if="notice.type === 'success'" class="size-4 shrink-0" />
        <CircleAlert v-else class="size-4 shrink-0" />
        <span class="min-w-0 lg:text-xs">{{ notice.message }}</span>
      </div>
      <!-- Confirm rejection -->
      <Alert v-if="confirmError" variant="destructive" class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <CircleAlert class="size-4" />
          <AlertTitle class="mb-0 text-xs font-medium lg:text-[13px]">
            No se pudo completar la venta
          </AlertTitle>
        </div>
        <AlertDescription class="flex flex-col gap-1">
          <p class="text-xs lg:text-[13px]">{{ confirmError.message }}</p>
          <p class="text-[11px] lg:text-xs">
            {{
              confirmError.isBusinessError
                ? 'No se registró nada.'
                : 'Revisa "Ventas" antes de reintentar.'
            }}
          </p>
          <Button
            v-if="saleStore.failedUnitId"
            variant="outline"
            size="sm"
            class="mt-2 w-fit text-xs!"
            @click="handleRetryWithoutFailed"
          >
            Quitarla y reintentar
          </Button>
        </AlertDescription>
      </Alert>
      <!-- Empty state -->
      <div
        v-if="saleStore.count === 0"
        class="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center"
      >
        <div class="bg-muted flex size-12 items-center justify-center rounded-full">
          <Tag class="text-muted-foreground size-6" />
        </div>
        <div>
          <p class="text-sm font-medium">Venta en curso</p>
          <p class="text-muted-foreground text-xs">
            Escanea la primera prenda o escribe su código para empezar
          </p>
        </div>
      </div>
      <!-- Current sale -->
      <template v-else>
        <div class="flex flex-col rounded-lg border md:min-h-0 md:overflow-hidden">
          <div class="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
            <p class="font-medium lg:text-xs">
              Venta en curso · {{ saleStore.count }} {{ itemLabel }}
            </p>
            <Button variant="outline" size="sm" class="lg:text-xs" @click="handleClear">
              <Trash2 class="size-4 lg:size-3.5" />
              Vaciar
            </Button>
          </div>
          <div class="relative isolate min-h-0 md:overflow-auto">
            <SaleItemsList
              :items="saleStore.items"
              :failed-unit-id="saleStore.failedUnitId"
              @remove="handleRemove"
            />
          </div>
        </div>
        <!-- Desktop summary -->
        <div class="hidden shrink-0 flex-col gap-3 md:flex">
          <div class="flex items-center justify-between">
            <span class="text-sm">Total referencial</span>
            <span class="text-base font-semibold">{{ formatCurrency(saleStore.total) }}</span>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-xs">Método de pago:</span>
              <RadioGroup v-model="paymentModel" class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-xs">
                  <RadioGroupItem value="cash" />
                  Efectivo
                </label>
                <label class="flex items-center gap-2 text-xs">
                  <RadioGroupItem value="qr_transfer" />
                  Transferencia QR
                </label>
              </RadioGroup>
            </div>
            <Button
              :disabled="!saleStore.canConfirm"
              size="sm"
              class="text-xs"
              @click="handleConfirm"
            >
              <Loader2 v-if="saleStore.isConfirming" class="size-4 animate-spin" />
              Confirmar venta
            </Button>
          </div>
        </div>
      </template>
    </div>
  </div>
  <!-- Mobile bottom bar -->
  <div
    v-if="saleStore.count > 0"
    class="bg-background fixed inset-x-0 bottom-0 z-40 flex flex-col gap-1.5 border-t px-4 pt-2 pb-4 backdrop-blur md:hidden"
  >
    <div class="flex items-center justify-between">
      <span class="text-lg">Total referencial</span>
      <span class="text-lg font-semibold">{{ formatCurrency(saleStore.total) }}</span>
    </div>
    <div class="flex items-center justify-between gap-2">
      <span>Método de pago</span>
      <RadioGroup v-model="paymentModel" class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm">
          <RadioGroupItem value="cash" />
          Efectivo
        </label>
        <label class="flex items-center gap-2 text-sm">
          <RadioGroupItem value="qr_transfer" />
          Transferencia QR
        </label>
      </RadioGroup>
    </div>
    <Button class="mt-4 w-full" :disabled="!saleStore.canConfirm" @click="handleConfirm">
      <Loader2 v-if="saleStore.isConfirming" class="size-4 animate-spin" />
      Confirmar venta
    </Button>
  </div>
  <!-- Scanner -->
  <SaleQrScannerModal v-model:open="isScannerOpen" />
  <!-- Success result (desktop) -->
  <Dialog v-if="isDesktop" v-model:open="isResultOpen">
    <DialogContent class="pt-4 pb-3 sm:max-w-xs">
      <DialogHeader class="sr-only">
        <DialogTitle>Venta registrada</DialogTitle>
        <DialogDescription>Resumen de la venta registrada</DialogDescription>
      </DialogHeader>
      <div class="flex flex-col items-center gap-3 py-2 text-center">
        <div
          class="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <CircleCheck class="size-7" />
        </div>
        <div>
          <p class="text-[13px] font-semibold">Venta registrada</p>
          <p class="text-muted-foreground mt-1 text-xs">
            #{{ shortId(saleStore.lastSale?.id) }} · {{ saleStore.lastSale?.itemsCount }}
            {{ saleStore.lastSale?.itemsCount === 1 ? 'prenda' : 'prendas' }}
          </p>
          <p class="mt-1 text-xs font-medium">
            {{ formatCurrency(saleStore.lastSale?.totalAmount) }} ·
            {{ formatPaymentMethod(saleStore.lastSale?.paymentMethod) }}
          </p>
        </div>
        <div class="mt-2 grid w-full grid-cols-2 gap-2">
          <Button variant="outline" size="sm" class="text-xs" @click="handleGoToSales">
            Ver ventas
          </Button>
          <Button size="sm" class="text-xs" @click="handleNewSale">Nueva venta</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Success result (mobile) -->
  <Drawer v-else v-model:open="isResultOpen">
    <DrawerContent>
      <DrawerHeader class="sr-only">
        <DrawerTitle>Venta registrada</DrawerTitle>
        <DrawerDescription>Resumen de la venta registrada</DrawerDescription>
      </DrawerHeader>
      <div class="flex flex-col items-center gap-3 px-6 py-4 text-center">
        <div
          class="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <CircleCheck class="size-7" />
        </div>
        <div>
          <p class="text-base font-semibold">Venta registrada</p>
          <p class="text-muted-foreground mt-1 text-sm">
            #{{ shortId(saleStore.lastSale?.id) }} · {{ saleStore.lastSale?.itemsCount }}
            {{ saleStore.lastSale?.itemsCount === 1 ? 'prenda' : 'prendas' }}
          </p>
          <p class="mt-1 text-sm font-medium">
            {{ formatCurrency(saleStore.lastSale?.totalAmount) }} ·
            {{ formatPaymentMethod(saleStore.lastSale?.paymentMethod) }}
          </p>
        </div>
        <div class="mt-1 grid w-full grid-cols-2 gap-2">
          <Button variant="outline" @click="handleGoToSales">Ver ventas</Button>
          <Button @click="handleNewSale">Nueva venta</Button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>
