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

const props = defineProps({
  supplier: { type: Object, default: null },
  mode: { type: String, default: null },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: null },
})

const emit = defineEmits(['submit', 'cancel'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const formSchema = computed(() =>
  toTypedSchema(
    z.object({
      name: z
        .string()
        .trim()
        .min(1, 'Ingresa el nombre')
        .max(200, 'El nombre no puede superar 200 caracteres'),
      phone: z
        .string()
        .trim()
        .min(1, 'Ingresa el teléfono')
        .min(6, 'Ingresa un teléfono válido')
        .max(30, 'El teléfono no puede superar 30 caracteres')
        .regex(/^[0-9+\s()-]+$/, 'Ingresa un teléfono válido'),
      country: z
        .string()
        .trim()
        .min(1, 'Ingresa el país')
        .max(100, 'El país no puede superar 100 caracteres'),
      city: z
        .string()
        .trim()
        .max(100, 'La ciudad no puede superar 100 caracteres')
        .transform((value) => (value.length === 0 ? null : value)),
    }),
  ),
)

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    phone: '',
    country: 'Bolivia',
    city: '',
  },
})

function populateForm(supplier) {
  resetForm({
    values: supplier
      ? {
          name: supplier.name,
          phone: supplier.phone,
          country: supplier.country ?? 'Bolivia',
          city: supplier.city ?? '',
        }
      : {
          name: '',
          phone: '',
          country: 'Bolivia',
          city: '',
        },
  })
}

watch(() => props.supplier, populateForm, { immediate: true })

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
})

function handleCancel() {
  populateForm(props.supplier)
  emit('cancel')
}
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col" @submit="onSubmit">
    <!-- Error message -->
    <Alert v-if="errorMessage" variant="destructive" class="mb-4 lg:mt-0">
      <AlertDescription class="lg:text-xs">{{ errorMessage }}</AlertDescription>
    </Alert>
    <!-- Fields -->
    <FieldGroup class="min-h-0 flex-1 gap-4 overflow-y-auto">
      <!-- Name -->
      <VeeField v-slot="{ componentField, errors }" name="name">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="name" class="lg:text-xs">Nombre</FieldLabel>
          <Input
            id="name"
            v-bind="componentField"
            type="text"
            placeholder="Distribuidora Bolivia"
            :aria-invalid="!!errors.length"
            aria-required="true"
            class="text-sm lg:text-xs!"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
        </Field>
      </VeeField>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- Phone -->
        <VeeField v-slot="{ componentField, errors }" name="phone">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="phone" class="lg:text-xs">Teléfono</FieldLabel>
            <Input
              id="phone"
              v-bind="componentField"
              type="tel"
              placeholder="+591 67692197"
              :aria-invalid="!!errors.length"
              aria-required="true"
              class="focus-visible:border-primary text-sm focus-visible:border focus-visible:ring-0 focus-visible:outline-none lg:text-xs!"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
        <!-- Country -->
        <VeeField v-slot="{ componentField, errors }" name="country">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="country" class="lg:text-xs">País</FieldLabel>
            <Input
              id="country"
              v-bind="componentField"
              type="text"
              placeholder="Bolivia"
              :aria-invalid="!!errors.length"
              aria-required="true"
              class="focus-visible:border-primary text-sm focus-visible:border focus-visible:ring-0 focus-visible:outline-none lg:text-xs!"
            />
            <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
          </Field>
        </VeeField>
      </div>
      <!-- City -->
      <VeeField v-slot="{ componentField, errors }" name="city">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="city" class="lg:text-xs">Ciudad (opcional)</FieldLabel>
          <Input
            id="city"
            v-bind="componentField"
            type="text"
            placeholder="Yacuíba"
            :aria-invalid="!!errors.length"
            class="focus-visible:border-primary text-sm focus-visible:border focus-visible:ring-0 focus-visible:outline-none lg:text-xs!"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs" />
        </Field>
      </VeeField>
    </FieldGroup>
    <!-- Actions buttons -->
    <div class="grid grid-cols-1 gap-2 pt-6 md:grid-cols-2 md:gap-4">
      <Button
        type="submit"
        :size="isDesktop ? 'sm' : ''"
        :disabled="isSubmitting || isLoading"
        class="w-full md:order-2"
      >
        <Loader2 v-if="isSubmitting || isLoading" class="animate-spin" />
        <span class="lg:text-xs">{{ isSubmitting || isLoading ? 'Guardando...' : 'Guardar' }}</span>
      </Button>
      <Button
        type="button"
        :size="isDesktop ? 'sm' : ''"
        variant="outline"
        class="w-full md:order-1"
        @click="handleCancel"
      >
        <span class="lg:text-xs">Cancelar</span>
      </Button>
    </div>
  </form>
</template>
