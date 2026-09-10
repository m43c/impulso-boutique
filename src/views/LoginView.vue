<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2 } from '@lucide/vue'
import { z } from 'zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getAuthErrorMessage } from '@/utils/authErrors'

const authStore = useAuthStore()
const router = useRouter()

const showPassword = ref(false)
const errorMessage = ref('')

const formSchema = toTypedSchema(
  z
    .object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'El correo electrónico es requerido')
        .email('Ingresa un correo electrónico válido'),
      password: z.string().min(1, 'La contraseña es requedida'),
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

const onSubmit = handleSubmit(async (credentials) => {
  errorMessage.value = ''

  try {
    await authStore.login(credentials)
    router.push({ name: 'home' })
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  }
})
</script>

<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader class="text-xl">
          <CardTitle>Inicia Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit">
            <FieldGroup>
              <p
                v-if="errorMessage"
                role="alert"
                class="bg-destructive/10 text-destructive rounded-md p-3 text-sm"
              >
                {{ errorMessage }}
              </p>
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
                      autocomplete="current-password"
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
              <Field>
                <Button type="submit" :disabled="isSubmitting">
                  <Loader2 v-if="isSubmitting" class="animate-spin" />
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
