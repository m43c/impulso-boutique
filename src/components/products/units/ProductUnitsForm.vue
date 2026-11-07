<script setup>
import { computed, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { z } from 'zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useProductsStore } from '@/stores/products'
import { Loader2 } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldInput,
  NumberFieldIncrement,
} from '@/components/ui/number-field'
import { getRegisterEntryErrorMessage } from '@/utils/inventoryErrors'

const props = defineProps({
  product: { type: Object, default: null },
  maxQuantity: { type: Number, default: 50 },
})

const emit = defineEmits(['submit', 'cancel'])

const productsStore = useProductsStore()
const isDesktop = useMediaQuery('(min-width: 768px)')

const reasons = [
  { value: 'purchase', label: 'Compra' },
  { value: 'count', label: 'Ajuste por conteo' },
]

const NOTE_MAX = 500

const formSchema = computed(() =>
  toTypedSchema(
    z.object({
      reason: z.enum(['purchase', 'count'], {
        message: 'Selecciona un motivo válido',
      }),
      quantity: z
        .number({ invalid_type_error: 'Ingresa una cantidad' })
        .int('La cantidad debe ser un número entero')
        .min(1, 'La cantidad debe ser al menos 1')
        .max(props.maxQuantity, `La cantidad no puede superar ${props.maxQuantity}`),
      note: z.string().trim().max(NOTE_MAX, `La nota no puede superar ${NOTE_MAX} caracteres`),
    }),
  ),
)

const { handleSubmit, isSubmitting, values } = useForm({
  validationSchema: formSchema,
  initialValues: {
    reason: 'purchase',
    quantity: 1,
    note: '',
  },
})

const errorMessage = ref(null)

const submitLabel = computed(() =>
  values.quantity === 1 ? 'Registrar 1 unidad' : `Registrar ${values.quantity} unidades`,
)

const helperText = computed(() =>
  values.quantity === 1
    ? 'Se creará 1 unidad con su QR único'
    : `Se crearán ${values.quantity} unidades, cada una con su QR único`,
)

const notePlaceholder = computed(() =>
  values.reason === 'purchase'
    ? 'Compra al proveedor/distribuidor'
    : 'Unidad encontrada en estante sin registrar',
)

const onSubmit = handleSubmit(async (formValues) => {
  errorMessage.value = null

  try {
    const unitIds = await productsStore.registerEntry({
      product_id: props.product?.id,
      quantity: formValues.quantity,
      reason: formValues.reason,
      note: formValues.note || null,
    })

    emit('submit', {
      unitIds,
      quantity: formValues.quantity,
      reason: formValues.reason,
    })
  } catch (e) {
    console.error('Error al registrar unidades:', e)
    errorMessage.value = getRegisterEntryErrorMessage(e)
  }
})

function handleCancel() {
  errorMessage.value = null
  emit('cancel')
}
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col gap-6" @submit="onSubmit">
    <!-- Error message -->
    <div v-if="errorMessage" class="px-6 pt-2">
      <Alert variant="destructive">
        <AlertDescription class="lg:text-xs">{{ errorMessage }}</AlertDescription>
      </Alert>
    </div>
    <!-- Fiels -->
    <div class="min-h-0 flex-1 overflow-y-auto px-6">
      <FieldGroup class="gap-2">
        <!-- Reason -->
        <VeeField v-slot="{ value, setValue, errors }" name="reason">
          <Field :data-invalid="!!errors.length">
            <FieldLabel class="lg:text-xs">Motivo</FieldLabel>
            <div class="border-border/60 inline-flex w-full rounded-md border p-0.5">
              <button
                v-for="r in reasons"
                :key="r.value"
                type="button"
                class="flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all lg:text-xs"
                :class="
                  value === r.value
                    ? 'dark:bg-muted text-foreground bg-zinc-100'
                    : 'text-muted-foreground hover:text-foreground'
                "
                @click="setValue(r.value)"
              >
                {{ r.label }}
              </button>
            </div>
            <p v-if="value === 'count'" class="text-muted-foreground mt-1.5 text-xs">
              Solo para unidades que nunca se registraron. Si ya tenía QR, reactívala desde la
              tabla.
            </p>
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>
        <!-- Quantity -->
        <VeeField v-slot="{ value, handleChange, errors }" name="quantity">
          <Field :data-invalid="!!errors.length">
            <div class="flex items-center justify-between">
              <FieldLabel for="quantity" class="lg:text-xs">Cantidad</FieldLabel>
              <span class="text-muted-foreground text-xs">Máximo {{ maxQuantity }}</span>
            </div>
            <NumberField
              id="quantity"
              :model-value="value"
              :min="1"
              :max="maxQuantity"
              @update:model-value="handleChange"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>
        <!-- Note -->
        <VeeField v-slot="{ componentField, errors }" name="note">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="note" class="lg:text-xs">Nota (opcional)</FieldLabel>
            <Textarea
              id="note"
              v-bind="componentField"
              :placeholder="notePlaceholder"
              rows="2"
              class="text-sm lg:text-xs!"
              :aria-invalid="!!errors.length"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>
        <!-- Helper -->
        <p class="text-muted-foreground text-xs">{{ helperText }}</p>
      </FieldGroup>
    </div>
    <!-- Action buttons -->
    <div
      class="border-border/60 flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end"
    >
      <Button type="button" :size="isDesktop ? 'sm' : ''" variant="outline" @click="handleCancel">
        <span class="lg:text-xs">Cancelar</span>
      </Button>
      <Button type="submit" :size="isDesktop ? 'sm' : ''" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
        <span class="lg:text-xs">{{ isSubmitting ? 'Registrando…' : submitLabel }}</span>
      </Button>
    </div>
  </form>
</template>
