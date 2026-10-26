<script setup>
import { computed, watch } from 'vue'
import { z } from 'zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Loader2 } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import ProductImageUploader from '@/components/products/ProductImageUploader.vue'
import CreatableCombobox from '@/components/common/CreatableCombobox.vue'

const props = defineProps({
  product: { type: Object, default: null },
  mode: { type: String, default: null },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: null },
  options: { type: Object, default: () => ({ categories: [], brands: [], colors: [], sizes: [] }) },
})
const emit = defineEmits(['submit', 'cancel'])

const currentMode = computed(() => {
  if (props.mode) {
    return props.mode
  }

  return props.product ? 'edit' : 'create'
})

const isImageRequired = computed(() => currentMode.value === 'create')
const isVariantMode = computed(() => currentMode.value === 'variant')

const formSchema = computed(() =>
  toTypedSchema(
    z.object({
      image: isImageRequired.value
        ? z
            .instanceof(File, { message: 'Selecciona una imagen del producto' })
            .nullable()
            .refine((value) => value !== null, 'Selecciona una imagen del producto')
        : z.instanceof(File).nullable().default(null),
      name: z
        .string()
        .trim()
        .min(1, 'Ingresa el nombre del producto')
        .max(200, 'El nombre no puede superar 200 caracteres'),
      description: z
        .string()
        .trim()
        .max(200, 'La descripción no puede superar 200 caracteres')
        .transform((value) => (value.length === 0 ? null : value)),
      category: z
        .string()
        .trim()
        .min(1, 'Ingresa la categoría')
        .max(100, 'La categoría no puede superar 100 caracteres'),
      brand: z
        .string()
        .trim()
        .max(100, 'La marca no puede superar 100 caracteres')
        .transform((value) => (value.length === 0 ? null : value)),
      color: z
        .string()
        .trim()
        .max(50, 'El color no puede superar 50 caracteres')
        .transform((value) => (value.length === 0 ? null : value)),
      size: z
        .string()
        .trim()
        .max(20, 'La talla no puede superar 20 caracteres')
        .transform((value) => (value.length === 0 ? null : value)),
      price: z
        .number({
          required_error: 'Ingresa el precio',
          invalid_type_error: 'Ingresa un precio válido',
        })
        .positive('El precio debe ser mayor a 0')
        .refine((value) => Math.abs(value - Number(value.toFixed(2))) < 1e-9, 'Máximo 2 decimales'),
      minStock: z
        .number({
          required_error: 'Ingresa el stock mínimo',
          invalid_type_error: 'Ingresa un stock válido',
        })
        .int('Debe ser un número entero')
        .min(0, 'No puede ser negativo'),
    }),
  ),
)

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    image: null,
    name: '',
    description: '',
    category: '',
    brand: '',
    color: '',
    size: '',
    price: null,
    minStock: 0,
  },
})

function populateForm(product) {
  resetForm({
    values: product
      ? {
          image: null,
          name: product.name,
          description: product.description ?? '',
          category: product.category,
          brand: product.brand ?? '',
          color: product.color ?? '',
          size: product.size ?? '',
          price: Number(product.price),
          minStock: product.min_stock,
        }
      : {
          image: null,
          name: '',
          description: '',
          category: '',
          brand: '',
          color: '',
          size: '',
          price: null,
          minStock: 0,
        },
  })
}

watch(() => props.product, populateForm, { immediate: true })

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
})

function handleCancel() {
  populateForm(props.product)
  emit('cancel')
}
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col" @submit="onSubmit">
    <!-- Error -->
    <Alert v-if="errorMessage" variant="destructive" class="mb-4">
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>
    <!-- Fields -->
    <FieldGroup class="min-h-0 flex-1 gap-4 overflow-y-auto">
      <!-- Image -->
      <VeeField v-slot="{ value, handleChange, errors }" name="image">
        <Field :data-invalid="!!errors.length">
          <ProductImageUploader
            :model-value="value"
            :existing-image-id="
              currentMode === 'edit' || currentMode === 'variant'
                ? (product?.image_public_id ?? null)
                : null
            "
            @update:model-value="handleChange"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" class="text-center" />
        </Field>
      </VeeField>
      <!-- Name -->
      <VeeField v-slot="{ componentField, errors }" name="name">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="name">Nombre</FieldLabel>
          <Input
            id="name"
            v-bind="componentField"
            type="text"
            placeholder="Camisa manga larga"
            :aria-invalid="!!errors.length"
            class="text-sm"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" />
        </Field>
      </VeeField>
      <!-- Description -->
      <VeeField v-slot="{ componentField, errors }" name="description">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="description">Descripción (opcional)</FieldLabel>
          <Textarea
            id="description"
            v-bind="componentField"
            placeholder="Camisa de manga larga, algodón 100%, corte slim fit..."
            :aria-invalid="!!errors.length"
            class="text-sm"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" />
        </Field>
      </VeeField>
      <div class="grid grid-cols-2 gap-4">
        <!-- Category -->
        <VeeField v-slot="{ value, handleChange, errors }" name="category">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="category">Categoría</FieldLabel>
            <CreatableCombobox
              id="category"
              :model-value="value"
              :options="options.categories"
              placeholder="Sin categoría"
              search-placeholder="Buscar o crear categoría..."
              :invalid="!!errors.length"
              :disabled="isVariantMode"
              @update:model-value="handleChange"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>
        <!-- Brand -->
        <VeeField v-slot="{ value, handleChange, errors }" name="brand">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="brand">Marca</FieldLabel>
            <CreatableCombobox
              id="brand"
              :model-value="value"
              :options="options.brands"
              placeholder="Sin marca"
              search-placeholder="Buscar o crear marca..."
              clearable
              clear-label="Sin marca"
              :invalid="!!errors.length"
              :disabled="isVariantMode"
              @update:model-value="handleChange"
            />
            <!-- <Input v-else id="brand" :model-value="value || 'Sin marca'" disabled class="text-sm" /> -->
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>
      </div>
      <!-- Color -->
      <div class="grid grid-cols-2 gap-4">
        <VeeField v-slot="{ value, handleChange, errors }" name="color">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="color">Color</FieldLabel>
            <CreatableCombobox
              id="color"
              :model-value="value"
              :options="options.colors"
              placeholder="Sin color"
              search-placeholder="Buscar o crear color..."
              clearable
              clear-label="Sin color"
              :invalid="!!errors.length"
              @update:model-value="handleChange"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>
        <!-- Size -->
        <VeeField v-slot="{ value, handleChange, errors }" name="size">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="size">Talla</FieldLabel>
            <CreatableCombobox
              id="size"
              :model-value="value"
              :options="options.sizes"
              placeholder="Sin talla"
              search-placeholder="Buscar o crear talla..."
              clearable
              clear-label="Sin talla"
              :invalid="!!errors.length"
              @update:model-value="handleChange"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>
      </div>
      <!-- Price -->
      <div class="grid grid-cols-2 gap-4">
        <VeeField v-slot="{ value, setValue, handleBlur, errors }" name="price">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="price">Precio</FieldLabel>
            <NumberField
              :model-value="value"
              :min="0.01"
              :step="0.01"
              :format-options="{ maximumFractionDigits: 2 }"
              @update:model-value="setValue"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput
                  id="price"
                  placeholder="0.00"
                  class="text-sm"
                  :aria-invalid="!!errors.length"
                  @blur="handleBlur"
                />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>

        <!-- Min stock -->
        <VeeField v-slot="{ value, setValue, handleBlur, errors }" name="minStock">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="minStock">Stock mínimo</FieldLabel>
            <NumberField
              :model-value="value"
              :min="0"
              :step="1"
              :allow-empty="false"
              :default-value="0"
              :format-options="{ maximumFractionDigits: 0 }"
              @update:model-value="setValue"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput
                  id="minStock"
                  placeholder="0"
                  class="text-sm"
                  :aria-invalid="!!errors.length"
                  @blur="handleBlur"
                />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <FieldError v-if="errors.length" :errors="[errors[0]]" />
          </Field>
        </VeeField>
      </div>
    </FieldGroup>
    <!-- Actions buttons -->
    <div class="grid grid-cols-1 gap-2 pt-6 md:grid-cols-2 md:gap-4">
      <Button type="submit" class="w-full md:order-2" :disabled="isSubmitting || isLoading">
        <Loader2 v-if="isSubmitting || isLoading" class="animate-spin" />
        {{ isSubmitting || isLoading ? 'Guardando...' : 'Guardar' }}
      </Button>
      <Button type="button" variant="outline" class="w-full md:order-1" @click="handleCancel">
        Cancelar
      </Button>
    </div>
  </form>
</template>
