<script setup>
import { computed, ref } from 'vue'
import { useProductsStore } from '@/stores/products'
import { Loader2 } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldInput,
  NumberFieldIncrement,
} from '@/components/ui/number-field'
import { getRegisterEntryErrorMessage } from '@/utils/productErrors'

const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
  maxQuantity: {
    type: Number,
    default: 50,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const productsStore = useProductsStore()

const reasons = [
  { value: 'purchase', label: 'Compra' },
  { value: 'count', label: 'Ajuste por conteo' },
]

const quantity = ref(1)
const reason = ref('purchase')
const note = ref('')
const isSubmitting = ref(false)
const errorMessage = ref(null)

const submitLabel = computed(() =>
  quantity.value === 1 ? 'Registrar 1 unidad' : `Registrar ${quantity.value} unidades`,
)

const helperText = computed(() =>
  quantity.value === 1
    ? 'Se creará 1 unidad con su QR único'
    : `Se crearán ${quantity.value} unidades, cada una con su QR único`,
)

const notePlaceholder = computed(() =>
  reason.value === 'purchase'
    ? 'Compra al provedor Marco'
    : 'Prenda encontrada en bodega sin registrar',
)

async function handleSubmit() {
  if (isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const unitIds = await productsStore.registerEntry({
      product_id: props.product?.id,
      quantity: quantity.value,
      reason: reason.value,
      note: note.value.trim() || null,
    })

    emit('submit', { unitIds, reason: reason.value, quantity: quantity.value })

    quantity.value = 1
    reason.value = 'purchase'
    note.value = ''
  } catch (e) {
    console.error('Error al registrar unidades:', e)
    errorMessage.value = getRegisterEntryErrorMessage(e)
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  errorMessage.value = null
  emit('cancel')
}
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col gap-6" @submit.prevent="handleSubmit">
    <!-- Error alert -->
    <div v-if="errorMessage" class="px-6 pt-2">
      <Alert variant="destructive">
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto px-6">
      <FieldGroup class="gap-4">
        <!-- Reason -->
        <Field>
          <FieldLabel>Motivo</FieldLabel>
          <div class="border-border/60 inline-flex w-full rounded-md border p-0.5">
            <button
              v-for="r in reasons"
              :key="r.value"
              type="button"
              class="flex-1 rounded px-3 py-1.5 text-sm font-medium transition"
              :class="
                reason === r.value
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="reason = r.value"
            >
              {{ r.label }}
            </button>
          </div>
          <p v-if="reason === 'count'" class="text-muted-foreground mt-1.5 text-xs">
            Usar si se encontro una prenda sin registrar al contar el inventario
          </p>
        </Field>
        <!-- Quantity -->
        <Field>
          <div class="flex items-center justify-between">
            <FieldLabel for="quantity">Cantidad</FieldLabel>
            <span class="text-muted-foreground text-xs">Máximo {{ maxQuantity }}</span>
          </div>
          <NumberField id="quantity" v-model="quantity" :min="1" :max="maxQuantity">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </Field>
        <!-- Note -->
        <Field>
          <FieldLabel for="note">Nota (opcional)</FieldLabel>
          <Textarea id="note" v-model="note" :placeholder="notePlaceholder" rows="2" class="text-sm"/>
        </Field>
        <!-- Helper -->
        <p class="text-muted-foreground text-xs">{{ helperText }}</p>
      </FieldGroup>
    </div>
    <!-- Acction button -->
    <div
      class="border-border/60 flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end"
    >
      <Button type="button" variant="outline" @click="handleCancel">Cancelar</Button>
      <Button type="submit" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ isSubmitting ? 'Registrando…' : submitLabel }}
      </Button>
    </div>
  </form>
</template>
