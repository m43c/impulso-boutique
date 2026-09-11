<script setup>
import { ref } from 'vue'
import { Eye, EyeOff, Loader2 } from '@lucide/vue'
import { z } from 'zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const props = defineProps({ isLoading: { type: Boolean, default: false } })
const emit = defineEmits(['submit', 'cancel'])

const showPassword = ref(false)

const formSchema = toTypedSchema(
  z
    .object({
      fullName: z
        .string()
        .trim()
        .min(1, 'Ingresa el nombre completo')
        .min(5, 'El nombre completo debe tener al menos 5 caracteres')
        .regex(
          /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/,
          'El nombre completo solo puede contener letras, espacios, apóstrofes y guiones',
        )
        .refine((value) => value.includes(' '), 'Ingresa nombre y apellido'),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'Ingresa el correo electrónico')
        .email('Ingresa un correo electrónico válido'),
      password: z.string().min(1, 'Ingresa la contraseña'),
      role: z.enum(['admin', 'advisor', 'cashier'], {
        errorMap: () => ({ message: 'Selecciona un rol' }),
      }),
    })
    .strict(),
)

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    fullName: '',
    email: '',
    password: '',
    role: '',
  },
})

const onSubmit = handleSubmit(async (values) => emit('submit', { ...values }))

function handleCancel() {
  resetForm()
  showPassword.value = false
  emit('cancel')
}
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col px-4" @submit="onSubmit">
    <FieldGroup class="min-h-0 flex-1 gap-4 overflow-y-auto">
      <VeeField v-slot="{ componentField, errors }" name="fullName">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="fullName">Nombre completo</FieldLabel>
          <Input
            id="fullName"
            v-bind="componentField"
            type="text"
            placeholder="Marco Encinas"
            :aria-invalid="!!errors.length"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" />
        </Field>
      </VeeField>
      <VeeField v-slot="{ componentField, errors }" name="email">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            v-bind="componentField"
            type="email"
            placeholder="correo@ejemplo.com"
            autocomplete="username"
            :aria-invalid="!!errors.length"
          />
          <FieldError v-if="errors.length" :errors="[errors[0]]" />
        </Field>
      </VeeField>
      <VeeField v-slot="{ componentField, errors }" name="password">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="password">Contraseña</FieldLabel>
          <div class="relative flex items-center">
            <Input
              id="password"
              v-bind="componentField"
              :type="showPassword ? 'text' : 'password'"
              class="pr-10"
              autocomplete="new-password"
              :aria-invalid="!!errors.length"
            />
            <button
              type="button"
              tabindex="-1"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              class="text-muted-foreground hover:text-foreground absolute right-3 flex items-center"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" class="h-4 w-4" />
              <EyeOff v-else class="h-4 w-4" />
            </button>
          </div>
          <FieldError v-if="errors.length" :errors="[errors[0]]" />
        </Field>
      </VeeField>
      <VeeField v-slot="{ componentField, errors }" name="role">
        <FieldSet :data-invalid="!!errors.length">
          <FieldLegend variant="label" :class="errors.length ? 'text-destructive' : ''">
            Rol
          </FieldLegend>
          <RadioGroup v-bind="componentField" :aria-invalid="!!errors.length">
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="admin" value="admin" :aria-invalid="!!errors.length" />
              <Label for="admin" class="cursor-pointer">Administrador</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="advisor" value="advisor" :aria-invalid="!!errors.length" />
              <Label for="advisor" class="cursor-pointer">Vendedor</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="cashier" value="cashier" :aria-invalid="!!errors.length" />
              <Label for="cashier" class="cursor-pointer">Cajero</Label>
            </div>
          </RadioGroup>
          <FieldError v-if="errors.length" :errors="[errors[0]]" />
        </FieldSet>
      </VeeField>
    </FieldGroup>
    <div class="flex flex-col gap-2 pt-4">
      <Button type="submit" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting || isLoading" class="animate-spin" />
        {{ isSubmitting || isLoading ? 'Guardando...' : 'Guardar' }}
      </Button>
      <Button type="button" variant="outline" @click="handleCancel">Cancelar</Button>
    </div>
  </form>
</template>
