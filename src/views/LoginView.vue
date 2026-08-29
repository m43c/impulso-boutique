<script setup>
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import { z } from 'zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const showPassword = ref(false)

const formSchema = toTypedSchema(
  z
    .object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'Campo requerido')
        .email('El correo electrónico es inválido'),
      password: z
        .string()
        .min(1, 'Campo requerido')
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    })
    .strict(),
)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: '',
    password: '',
  },
})

const onSubmit = handleSubmit((values) => {
  console.log('Credenciales:', values)
})
</script>

<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader class="text-center text-xl">
          <CardTitle>Inicio de Sesión</CardTitle>
          <CardDescription>Ingresa tu correo y contraseña para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit">
            <FieldGroup>
              <VeeField v-slot="{ componentField, errors }" name="email">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="email">Correo Electrónico</FieldLabel>
                  <Input
                    id="email"
                    v-bind="componentField"
                    type="email"
                    placeholder="usuario@gmail.com"
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
                      :aria-invalid="!!errors.length"
                    />
                    <button
                      type="button"
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
              <Field>
                <Button type="submit" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
