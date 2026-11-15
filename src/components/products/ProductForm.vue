<script setup>
import { computed, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProductImageUploader from '@/components/products/ProductImageUploader.vue'
import CreatableCombobox from '@/components/common/CreatableCombobox.vue'

const NO_SUPPLIER = '__none__'

const props = defineProps({
  product: { type: Object, default: null },
  mode: { type: String, default: null },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: null },
  options: { type: Object, default: () => ({ categories: [], brands: [], colors: [], sizes: [] }) },
  suppliers: { type: Array, default: () => [] },
})

const emit = defineEmits(['submit', 'cancel'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const currentMode = computed(() => {
  if (props.mode) {
    return props.mode
  }

  return props.product ? 'edit' : 'create'
})

const isImageRequired = computed(() => currentMode.value === 'create')
const isVariantMode = computed(() => currentMode.value === 'variant')

const supplierOptions = computed(() => {
  const currentSupplierId = props.product?.supplier_id ?? null

  return props.suppliers
    .filter((supplier) => supplier.is_active || supplier.id === currentSupplierId)
    .map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      is_active: supplier.is_active,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
})

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
      supplierId: z.string().uuid('Selecciona un proveedor válido').nullable().default(null),
      isActive: z.boolean().default(true),
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
    supplierId: null,
    isActive: true,
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
          supplierId: product.supplier_id ?? null,
          isActive: product.is_active ?? true,
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
          supplierId: null,
          isActive: true,
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

function getSupplier(id) {
  return supplierOptions.value.find((s) => s.id === id)
}
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col" @submit="onSubmit">
    <!-- Error message -->
    <Alert v-if="errorMessage" variant="destructive" class="mt-2 mb-3 lg:mt-0">
      <AlertDescription class="lg:text-xs">{{ errorMessage }}</AlertDescription>
    </Alert>
    <!-- Fields -->
    <FieldGroup class="min-h-0 flex-1 gap-4 overflow-y-auto">
      <!-- Image -->
      <VeeField v-slot="{ value, handleChange, errors }" name="image">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="image" class="lg:text-xs">Imagen del producto</FieldLabel>
          <ProductImageUploader
            :model-value="value"
            :existing-image-id="
              currentMode === 'edit' || currentMode === 'variant'
                ? (product?.image_public_id ?? null)
                : null
            "
            @update:model-value="handleChange"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" class="text-center lg:text-xs" />
        </Field>
      </VeeField>
      <!-- Name -->
      <VeeField v-slot="{ componentField, errors }" name="name">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="name" class="lg:text-xs">Nombre</FieldLabel>
          <Input
            id="name"
            v-bind="componentField"
            type="text"
            placeholder="Camisa manga larga"
            :aria-invalid="!!errors.length"
            aria-required="true"
            class="text-sm lg:text-xs!"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
        </Field>
      </VeeField>
      <!-- Description -->
      <VeeField v-slot="{ componentField, errors }" name="description">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="description" class="lg:text-xs">Descripción (opcional)</FieldLabel>
          <Textarea
            id="description"
            v-bind="componentField"
            placeholder="Camisa de manga larga, algodón 100%, corte slim fit..."
            :aria-invalid="!!errors.length"
            class="text-sm lg:text-xs!"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
        </Field>
      </VeeField>
      <!-- Details -->
      <!-- <div class="grid grid-cols-2 gap-4"> -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Category -->
        <VeeField v-slot="{ value, handleChange, errors }" name="category">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="category" class="lg:text-xs">Categoría</FieldLabel>
            <CreatableCombobox
              id="category"
              :model-value="value"
              :options="options.categories"
              placeholder="Sin categoría"
              search-placeholder="Buscar categoría..."
              :invalid="!!errors.length"
              :disabled="isVariantMode"
              aria-required="true"
              @update:model-value="handleChange"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
        <!-- Brand -->
        <VeeField v-slot="{ value, handleChange, errors }" name="brand">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="brand" class="lg:text-xs">Marca (opcional)</FieldLabel>
            <CreatableCombobox
              id="brand"
              :model-value="value"
              :options="options.brands"
              placeholder="Sin marca"
              search-placeholder="Buscar marca..."
              clearable
              clear-label="Sin marca"
              :invalid="!!errors.length"
              :disabled="isVariantMode"
              @update:model-value="handleChange"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
      </div>
      <!-- Color -->
      <div class="grid grid-cols-2 gap-4">
        <VeeField v-slot="{ value, handleChange, errors }" name="color">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="color" class="lg:text-xs">Color (opcional)</FieldLabel>
            <CreatableCombobox
              id="color"
              :model-value="value"
              :options="options.colors"
              placeholder="Sin color"
              search-placeholder="Buscar color..."
              clearable
              clear-label="Sin color"
              :invalid="!!errors.length"
              @update:model-value="handleChange"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
        <!-- Size -->
        <VeeField v-slot="{ value, handleChange, errors }" name="size">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="size" class="lg:text-xs">Talla (opcional)</FieldLabel>
            <CreatableCombobox
              id="size"
              :model-value="value"
              :options="options.sizes"
              placeholder="Sin talla"
              search-placeholder="Buscar talla..."
              clearable
              clear-label="Sin talla"
              :invalid="!!errors.length"
              @update:model-value="handleChange"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
      </div>

      <!-- Price and stock min. -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Price -->
        <VeeField v-slot="{ value, setValue, handleBlur, errors }" name="price">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="price" class="lg:text-xs">Precio</FieldLabel>
            <NumberField
              :model-value="value"
              :min="0.01"
              :step="0.01"
              :format-options="{ maximumFractionDigits: 2 }"
              :disabled="isVariantMode"
              @update:model-value="setValue"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput
                  id="price"
                  placeholder="0.00"
                  class="text-xs!"
                  :aria-invalid="!!errors.length"
                  aria-required="true"
                  @blur="handleBlur"
                />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
        <!-- Min stock -->
        <VeeField v-slot="{ value, setValue, handleBlur, errors }" name="minStock">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="minStock" class="lg:text-xs">Stock mínimo</FieldLabel>
            <NumberField
              :model-value="value"
              :min="0"
              :step="1"
              :allow-empty="false"
              :default-value="0"
              :format-options="{ maximumFractionDigits: 0 }"
              :disabled="isVariantMode"
              @update:model-value="setValue"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput
                  id="minStock"
                  placeholder="0"
                  class="text-xs!"
                  :aria-invalid="!!errors.length"
                  aria-required="true"
                  @blur="handleBlur"
                />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
      </div>
      <!-- Supplier -->
      <div>
        <VeeField v-slot="{ value, handleChange, errors }" name="supplierId">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="supplier" class="lg:text-xs">Proveedor (opcional)</FieldLabel>
            <Select
              :model-value="value ?? NO_SUPPLIER"
              :disabled="isVariantMode"
              @update:model-value="
                (selected) => handleChange(selected === NO_SUPPLIER ? null : selected)
              "
            >
              <SelectTrigger
                id="supplier"
                class="text-sm lg:text-xs"
                :aria-invalid="!!errors.length"
              >
                <SelectValue placeholder="Sin proveedor">
                  <div
                    v-if="value && value !== NO_SUPPLIER"
                    class="flex w-full min-w-0 items-center gap-1.5"
                  >
                    <span class="min-w-0 truncate">
                      {{ getSupplier(value)?.name || 'Proveedor' }}
                    </span>
                    <span
                      v-if="getSupplier(value)?.is_active === false"
                      class="text-muted-foreground shrink-0 italic"
                    >
                      (inactivo)
                    </span>
                  </div>
                  <span v-else class="text-muted-foreground truncate">Sin proveedor</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                class="max-h-[min(14rem,var(--reka-select-content-available-height,100vh))] w-(--reka-select-trigger-width) max-w-(--reka-select-trigger-width) md:max-h-[min(20rem,var(--reka-select-content-available-height,100vh))]"
              >
                <SelectItem :value="NO_SUPPLIER" class="text-muted-foreground">
                  <span class="lg:text-xs">Sin proveedor</span>
                </SelectItem>
                <SelectItem
                  v-for="supplier in supplierOptions"
                  :key="supplier.id"
                  :value="supplier.id"
                  class="*:[span]:last:min-w-0 *:[span]:last:flex-1"
                >
                  <div class="flex w-full min-w-0 items-center gap-1.5">
                    <span class="min-w-0 truncate lg:text-xs" :title="supplier.name">
                      {{ supplier.name }}
                    </span>
                    <span
                      v-if="!supplier.is_active"
                      class="text-muted-foreground shrink-0 italic lg:text-xs"
                    >
                      (inactivo)
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
      </div>
    </FieldGroup>
    <!-- Actions buttons -->
    <div class="flex flex-col gap-2 pt-6 md:flex-row md:justify-end">
      <Button
        type="submit"
        :size="isDesktop ? 'sm' : ''"
        :disabled="isSubmitting || isLoading"
        class="w-full md:order-2 md:w-auto md:min-w-24"
      >
        <Loader2 v-if="isSubmitting || isLoading" class="animate-spin" />
        <span class="lg:text-xs">{{ isSubmitting || isLoading ? 'Guardando...' : 'Guardar' }}</span>
      </Button>
      <Button
        type="button"
        :size="isDesktop ? 'sm' : ''"
        variant="outline"
        class="w-full md:order-1 md:w-auto"
        @click="handleCancel"
      >
        <span class="lg:text-xs">Cancelar</span>
      </Button>
    </div>
  </form>
</template>
