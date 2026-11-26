<script setup>
import { computed, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { Check, CircleAlert, Loader2, TriangleAlert } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProductImage from '@/components/products/ProductImage.vue'
import QrScannerModal from '@/components/scan/QrScannerModal.vue'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { useReturnsStore } from '@/stores/returns'
import { formatCurrency } from '@/utils/currency'
import { formatPaymentMethod, shortId } from '@/utils/sales'
import { buildReturnSuccessMessage, RETURN_REASONS } from '@/utils/returns'

const props = defineProps({
  sale: { type: Object, default: null },
  unit: { type: Object, default: null },
})

const open = defineModel('open', { type: Boolean, default: false })

const emit = defineEmits(['success'])

const isDesktop = useMediaQuery('(min-width: 768px)')
const returnsStore = useReturnsStore()

const type = ref('exchange')
const reason = ref('')
const note = ref('')
const replacement = ref(null)
const replacementCode = ref('')
const replacementError = ref(null)
const formError = ref(null)
const errorUnitId = ref(null)
const isScannerOpen = ref(false)

const isSubmitting = computed(() => returnsStore.isRegistering)
const isResolving = computed(() => returnsStore.isResolvingReplacement)

const unitLabel = computed(() =>
  [props.unit?.product_name, props.unit?.color, props.unit?.size].filter(Boolean).join(' · '),
)

const saleCaption = computed(() => {
  if (!props.sale || !props.unit) {
    return ''
  }

  const price = formatCurrency(props.unit.unit_price)
  const method = props.sale.payment_method
    ? formatPaymentMethod(props.sale.payment_method)
    : 'sin cobro'

  return `${props.sale.payment_method ? 'Pagó' : ''} ${price} · ${method} · venta #${shortId(props.sale.id)}`.trim()
})

const canRefund = computed(() => !!props.unit?.can_refund)

const exchangeOnlyMessage = computed(() => {
  if (canRefund.value) {
    return null
  }

  if (props.unit?.is_replacement_unit) {
    return 'Se recibió en un cambio: solo puede cambiarse'
  }

  if (!props.sale?.payment_method) {
    return 'Esta venta no tiene cobro: solo puede cambiarse'
  }

  return 'Solo puede cambiarse'
})

const refundAmount = computed(() => Number(props.unit?.unit_price ?? 0))

const refundText = computed(() => {
  const amount = formatCurrency(refundAmount.value)

  if (props.sale?.payment_method === 'qr_transfer') {
    return `Se devolverán ${amount} por transferencia QR. La transferencia se hace a mano en tu banco.`
  }

  return `Se devolverán ${amount} en efectivo (mismo medio con que pagó).`
})

const replacementWarnings = computed(() => {
  if (!replacement.value || !props.unit) {
    return []
  }

  const warnings = []
  const paidPrice = Number(props.unit.unit_price)
  const replacementPrice = Number(replacement.value.price)

  if (replacement.value.id === props.unit.unit_id) {
    warnings.push('Es la misma unidad que se devuelve.')
  }

  if (replacementPrice !== paidPrice) {
    warnings.push(
      `Esta unidad cuesta ${formatCurrency(replacementPrice)}; debe costar ${formatCurrency(paidPrice)}.`,
    )
  }

  if (replacement.value.status !== 'available') {
    warnings.push('Esta unidad no está disponible.')
  }

  if (replacement.value.isActive === false) {
    warnings.push('Producto retirado: no puede usarse como reemplazo.')
  }

  return warnings
})

const canConfirm = computed(() => {
  if (!props.unit || !props.sale || isSubmitting.value || isResolving.value) {
    return false
  }

  if (!reason.value) {
    return false
  }

  if (type.value === 'refund') {
    return canRefund.value
  }

  return !!replacement.value && replacementWarnings.value.length === 0
})

const confirmLabel = computed(() =>
  type.value === 'exchange' ? 'Confirmar cambio' : 'Confirmar reembolso',
)

const isReplacementHighlighted = computed(
  () => !!errorUnitId.value && replacement.value?.id === errorUnitId.value,
)

watch(
  () => [open.value, props.unit?.sale_detail_id, props.sale?.id],
  ([isOpen]) => {
    if (!isOpen) {
      return
    }

    type.value = 'exchange'
    reason.value = ''
    note.value = ''
    replacement.value = null
    replacementCode.value = ''
    replacementError.value = null
    formError.value = null
    errorUnitId.value = null
    isScannerOpen.value = false
  },
  { immediate: true },
)

watch(canRefund, (value) => {
  if (!value) {
    type.value = 'exchange'
  }
})

function applyReplacement(unit) {
  replacement.value = unit
  replacementError.value = null
  formError.value = null
  errorUnitId.value = null
}

function clearReplacement() {
  replacement.value = null
  replacementCode.value = ''
  replacementError.value = null
  formError.value = null
  errorUnitId.value = null
}

async function addReplacementByCode() {
  if (isResolving.value) {
    return
  }

  const result = await returnsStore.resolveReplacement(replacementCode.value)

  if (!result.ok) {
    replacementError.value = result.message
    return
  }

  applyReplacement(result.unit)
  replacementCode.value = ''
}

async function handleScanned(unitId) {
  replacementCode.value = unitId
  await addReplacementByCode()
}

function resetError() {
  formError.value = null
  errorUnitId.value = null
}

async function submit() {
  if (!canConfirm.value) {
    return
  }

  resetError()

  const result = await returnsStore.registerReturn({
    saleDetailId: props.unit.sale_detail_id,
    type: type.value,
    reason: reason.value,
    note: note.value,
    replacementUnitId: type.value === 'exchange' ? replacement.value?.id : null,
  })

  if (!result.ok) {
    formError.value = result.message
    errorUnitId.value = result.unitId ?? null
    return
  }

  toast.success(
    buildReturnSuccessMessage({
      type: type.value,
      refundAmount: result.refundAmount,
      refundMethod: result.refundMethod,
      replacement: replacement.value,
    }),
  )

  emit('success', {
    saleId: props.sale?.id,
    type: type.value,
  })

  open.value = false
}
</script>

<template>
  <!-- Desktop view -->
  <Dialog v-if="isDesktop" v-model:open="open" class="">
    <DialogContent class="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-lg">
      <DialogHeader class="px-6 pt-6 pb-3">
        <DialogTitle class="text-sm">Registrar devolución</DialogTitle>
        <DialogDescription v-if="unit" class="text-xs">
          {{ unitLabel }} · {{ shortId(unit.unit_id) }}
        </DialogDescription>
      </DialogHeader>
      <div v-if="unit && sale" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-4">
        <p class="text-muted-foreground text-xs">{{ saleCaption }}</p>
        <!-- Return type -->
        <div class="flex flex-col gap-2">
          <p class="text-xs font-medium">Tipo</p>
          <RadioGroup v-model="type" class="grid gap-2 sm:grid-cols-2">
            <label
              class="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs"
            >
              <RadioGroupItem value="exchange" />
              <span>Cambio por otra unidad</span>
            </label>
            <label
              class="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
              :class="canRefund ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60'"
            >
              <RadioGroupItem value="refund" :disabled="!canRefund" />
              <span>Reembolso</span>
            </label>
          </RadioGroup>
          <p v-if="exchangeOnlyMessage" class="text-muted-foreground text-xs">
            {{ exchangeOnlyMessage }}
          </p>
          <p v-if="type === 'exchange'" class="text-muted-foreground pt-1 text-xs">
            Política de la tienda: ofrece primero un cambio por una unidad del mismo precio.
          </p>
        </div>
        <!-- Reason -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" for="return-reason-desktop">Motivo</label>
          <Select v-model="reason">
            <SelectTrigger id="return-reason-desktop" class="h-8! text-xs">
              <SelectValue placeholder="Selecciona un motivo" class="mb-0.5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in RETURN_REASONS"
                :key="option.value"
                :value="option.value"
              >
                <span class="text-xs">{{ option.label }}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <!-- Note -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" for="return-note-desktop">Nota (opcional)</label>
          <Textarea
            id="return-note-desktop"
            v-model="note"
            rows="2"
            placeholder="Agrega una nota si lo necesitas"
            class="min-h-16 text-xs!"
          />
        </div>
        <!-- Exchange -->
        <template v-if="type === 'exchange'">
          <div class="flex flex-col gap-2">
            <p class="text-xs font-medium">
              Unidad de reemplazo debe costar {{ formatCurrency(unit.unit_price) }}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="pb-0.5"
                :disabled="isResolving || isSubmitting"
                @click="isScannerOpen = true"
              >
                <span class="text-xs">Escanear</span>
              </Button>
              <Input
                v-model="replacementCode"
                placeholder="Ingresar código de unidad"
                class="h-8 min-w-0 flex-1 font-mono text-xs!"
                :disabled="isResolving || isSubmitting"
                @keyup.enter="addReplacementByCode"
              />
              <Button
                size="sm"
                :disabled="isResolving || isSubmitting || !replacementCode.trim()"
                class="pb-0.5"
                @click="addReplacementByCode"
              >
                <Loader2 v-if="isResolving" class="h-4 w-4 animate-spin" />
                <span class="text-xs">Agregar</span>
              </Button>
            </div>
            <p v-if="replacementError" class="text-destructive flex items-center gap-1.5 text-xs">
              <CircleAlert class="h-3.5 w-3.5 shrink-0" />
              {{ replacementError }}
            </p>
            <p v-if="isResolving" class="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2 class="h-3.5 w-3.5 animate-spin" />
              Buscando la unidad...
            </p>
          </div>
          <div
            v-if="replacement"
            class="flex items-start gap-3 rounded-md border p-3"
            :class="
              isReplacementHighlighted
                ? 'border-destructive ring-destructive/30 ring-2'
                : 'border-border'
            "
          >
            <ProductImage
              :public-id="replacement.imagePublicId"
              :alt="replacement.productName"
              :size="IMAGE_SIZES.thumb"
              image-class="h-12 w-12 shrink-0 rounded-md object-cover"
              fallback-class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
            />
            <div class="-mt-0.5 min-w-0 flex-1">
              <p class="truncate text-xs font-medium">{{ replacement.productName }}</p>
              <p class="text-muted-foreground mt-1.5 truncate text-xs">
                {{ [replacement.color, replacement.size].filter(Boolean).join(' · ') }}
              </p>
              <p class="text-muted-foreground font-mono text-[11px]">
                {{ shortId(replacement.id) }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-end justify-between self-stretch">
              <Button
                variant="outline"
                size="sm"
                :disabled="isSubmitting"
                @click="clearReplacement"
              >
                <span class="text-xs">Cambiar</span>
              </Button>
              <p class="flex items-center gap-1.5 text-xs">
                <span class="font-medium tabular-nums">
                  {{ formatCurrency(replacement.price) }}
                </span>
                <span class="text-muted-foreground">·</span>
                <span
                  :class="
                    replacement.status === 'available' && replacement.isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive'
                  "
                >
                  <Check
                    v-if="replacement.status === 'available' && replacement.isActive"
                    class="inline h-3 w-3"
                  />
                  {{
                    replacement.status === 'available'
                      ? 'disponible'
                      : replacement.status === 'sold'
                        ? 'vendida'
                        : replacement.status === 'returned'
                          ? 'devuelta'
                          : 'no disponible'
                  }}
                </span>
              </p>
            </div>
          </div>
          <ul v-if="replacementWarnings.length" class="flex flex-col gap-1">
            <li
              v-for="warning in replacementWarnings"
              :key="warning"
              class="text-destructive flex items-start gap-1.5 text-xs"
            >
              <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{{ warning }}</span>
            </li>
          </ul>
        </template>
        <!-- Refund -->
        <p v-else class="text-muted-foreground text-xs">
          {{ refundText }}
        </p>
        <!-- Register error -->
        <div
          v-if="formError"
          class="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
        >
          <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
          <div class="min-w-0">
            <p>{{ formError }}</p>
            <p class="mt-0.5 text-[11px] opacity-80">No se registró nada.</p>
          </div>
        </div>
      </div>
      <!-- Action buttons -->
      <div v-if="unit && sale" class="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" size="sm" :disabled="isSubmitting" @click="open = false">
          <span class="text-xs">Cancelar</span>
        </Button>
        <Button size="sm" :disabled="!canConfirm" @click="submit">
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <span class="text-xs">{{ confirmLabel }}</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Mobile view -->
  <Drawer v-else v-model:open="open">
    <DrawerContent class="flex max-h-[92dvh] flex-col pb-5">
      <DrawerHeader class="gap-0 px-5 pt-3 pb-2 text-left">
        <DrawerTitle class="text-sm">Registrar devolución</DrawerTitle>
        <DrawerDescription v-if="unit" class="text-xs">
          {{ unitLabel }} · {{ shortId(unit.unit_id) }}
        </DrawerDescription>
      </DrawerHeader>
      <div v-if="unit && sale" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-3">
        <p class="text-muted-foreground text-xs">{{ saleCaption }}</p>
        <!-- Return type -->
        <div class="flex flex-col gap-2">
          <p class="text-xs font-medium">Tipo</p>
          <RadioGroup v-model="type" class="grid gap-2">
            <label
              class="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs"
            >
              <RadioGroupItem value="exchange" />
              <span>Cambio por otra unidad</span>
            </label>
            <label
              class="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
              :class="canRefund ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60'"
            >
              <RadioGroupItem value="refund" :disabled="!canRefund" />
              <span>Reembolso</span>
            </label>
          </RadioGroup>
          <p v-if="exchangeOnlyMessage" class="text-muted-foreground text-xs">
            {{ exchangeOnlyMessage }}
          </p>
          <p v-if="type === 'exchange'" class="text-muted-foreground text-xs">
            Política de la tienda: ofrece primero un cambio por una unidad del mismo precio.
          </p>
        </div>
        <!-- Reason -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" for="return-reason-mobile">Motivo</label>
          <Select v-model="reason">
            <SelectTrigger id="return-reason-mobile" class="h-8! text-[13px]">
              <SelectValue placeholder="Selecciona un motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in RETURN_REASONS"
                :key="option.value"
                :value="option.value"
              >
                <span class="text-[13px]">{{ option.label }}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <!-- Note -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" for="return-note-mobile">Nota (opcional)</label>
          <Textarea
            id="return-note-mobile"
            v-model="note"
            rows="2"
            placeholder="Agrega una nota si lo necesitas"
            class="min-h-16 text-[13px]!"
          />
        </div>
        <!-- Exchange -->
        <template v-if="type === 'exchange'">
          <div class="flex flex-col gap-2">
            <p class="text-xs font-medium">
              Unidad de reemplazo debe costar {{ formatCurrency(unit.unit_price) }}
            </p>
            <Button
              variant="outline"
              size="sm"
              class="w-full"
              :disabled="isResolving || isSubmitting"
              @click="isScannerOpen = true"
            >
              <span class="text-xs">Escanear</span>
            </Button>
            <div class="flex items-center gap-2">
              <Input
                v-model="replacementCode"
                placeholder="Ingresar código de unidad"
                class="h-9 min-w-0 flex-1 font-mono text-[13px]!"
                :disabled="isResolving || isSubmitting"
                @keyup.enter="addReplacementByCode"
              />
              <Button
                size="sm"
                :disabled="isResolving || isSubmitting || !replacementCode.trim()"
                @click="addReplacementByCode"
              >
                <Loader2 v-if="isResolving" class="h-4 w-4 animate-spin" />
                <span class="text-xs">Agregar</span>
              </Button>
            </div>
            <p v-if="replacementError" class="text-destructive flex items-center gap-1.5 text-xs">
              <CircleAlert class="h-3.5 w-3.5 shrink-0" />
              {{ replacementError }}
            </p>
            <p v-if="isResolving" class="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2 class="h-3.5 w-3.5 animate-spin" />
              Buscando la unidad…
            </p>
          </div>
          <div
            v-if="replacement"
            class="flex items-start gap-3 rounded-md border p-3"
            :class="
              isReplacementHighlighted
                ? 'border-destructive ring-destructive/30 ring-2'
                : 'border-border'
            "
          >
            <ProductImage
              :public-id="replacement.imagePublicId"
              :alt="replacement.productName"
              :size="IMAGE_SIZES.thumb"
              image-class="h-12 w-12 shrink-0 rounded-md object-cover"
              fallback-class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
            />
            <div class="-mt-1 min-w-0 flex-1">
              <p class="truncate text-[13px] font-medium">{{ replacement.productName }}</p>
              <p class="text-muted-foreground truncate text-xs mt-1">
                {{ [replacement.color, replacement.size].filter(Boolean).join(' · ') }}
              </p>
              <p class="text-muted-foreground font-mono text-[11px]">
                {{ shortId(replacement.id) }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-end justify-between self-stretch">
              <Button
                variant="outline"
                size="sm"
                :disabled="isSubmitting"
                @click="clearReplacement"
              >
                <span class="text-xs">Cambiar</span>
              </Button>
              <p class="flex items-center gap-1.5 text-xs">
                <span class="font-medium tabular-nums">
                  {{ formatCurrency(replacement.price) }}
                </span>
                <span class="text-muted-foreground">·</span>
                <span
                  :class="
                    replacement.status === 'available' && replacement.isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive'
                  "
                >
                  <Check
                    v-if="replacement.status === 'available' && replacement.isActive"
                    class="inline h-3 w-3"
                  />
                  {{
                    replacement.status === 'available'
                      ? 'disponible'
                      : replacement.status === 'sold'
                        ? 'vendida'
                        : replacement.status === 'returned'
                          ? 'devuelta'
                          : 'no disponible'
                  }}
                </span>
              </p>
            </div>
          </div>
          <ul v-if="replacementWarnings.length" class="flex flex-col gap-1">
            <li
              v-for="warning in replacementWarnings"
              :key="warning"
              class="text-destructive flex items-start gap-1.5 text-xs"
            >
              <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{{ warning }}</span>
            </li>
          </ul>
        </template>
        <!-- Refund -->
        <p v-else class="text-muted-foreground text-xs">
          {{ refundText }}
        </p>
        <!-- Register error -->
        <div
          v-if="formError"
          class="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
        >
          <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
          <div class="min-w-0">
            <p>{{ formError }}</p>
            <p class="mt-0.5 text-[11px] opacity-80">No se registró nada.</p>
          </div>
        </div>
      </div>
      <div v-if="unit && sale" class="mt-auto flex flex-col gap-2 border-t px-5 pt-3">
        <Button size="sm" class="w-full" :disabled="!canConfirm" @click="submit">
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <span class="text-xs">{{ confirmLabel }}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="w-full"
          :disabled="isSubmitting"
          @click="open = false"
        >
          <span class="text-xs">Cancelar</span>
        </Button>
      </div>
    </DrawerContent>
  </Drawer>
  <QrScannerModal v-model:open="isScannerOpen" @detected="handleScanned" />
</template>
