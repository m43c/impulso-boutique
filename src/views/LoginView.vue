<script setup>
import { ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Eye, EyeOff, Loader2 } from '@lucide/vue'
import { z } from 'zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getAuthErrorMessage } from '@/utils/authErrors'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isDesktop = useMediaQuery('(min-width: 768px)')

const showPassword = ref(false)
const errorMessage = ref('')

const formSchema = toTypedSchema(
  z
    .object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'Ingrese el correo electrónico')
        .email('Ingresa un correo electrónico válido'),
      password: z.string().min(1, 'Ingresa la contraseña'),
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

    const redirect =
      typeof route.query.redirect === 'string' &&
      route.query.redirect.startsWith('/') &&
      !route.query.redirect.startsWith('//')
        ? route.query.redirect
        : null

    await router.replace(redirect ?? { name: 'home' })
  } catch (error) {
    if (error?.code === 'ACCOUNT_INACTIVE') {
      toast.error('Tu cuenta está inactiva. Contacta al administrador')
      return
    }

    errorMessage.value = getAuthErrorMessage(error)
  }
})
</script>

<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <Card class="gap-4">
        <CardHeader class="gap-0">
          <CardTitle class="text-lg">Inicia Sesión</CardTitle>
          <CardDescription class="lg:text-xs">Ingresa tus credenciales para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit">
            <!-- Form fields -->
            <FieldGroup class="gap-4">
              <!-- Error message -->
              <Alert v-if="errorMessage" variant="destructive">
                <AlertDescription class="lg:text-xs">{{ errorMessage }}</AlertDescription>
              </Alert>
              <!-- Email -->
              <VeeField v-slot="{ componentField, errors }" name="email">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="email" class="lg:text-xs">Correo electrónico</FieldLabel>
                  <Input
                    id="email"
                    v-bind="componentField"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    autocomplete="username"
                    :aria-invalid="!!errors.length"
                    class="text-sm! lg:text-xs!"
                  />
                  <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs"/>
                </Field>
              </VeeField>
              <!-- Password -->
              <VeeField v-slot="{ componentField, errors }" name="password">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="password" class="lg:text-xs">Contraseña</FieldLabel>
                  <div class="relative flex items-center">
                    <Input
                      id="password"
                      v-bind="componentField"
                      :type="showPassword ? 'text' : 'password'"
                      class="pr-10 text-sm! lg:text-xs!"
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
                  <FieldError v-if="errors.length" :errors="[errors[0]]" class="lg:text-xs"/>
                </Field>
              </VeeField>
              <!-- Submit button -->
              <Field class="mt-2">
                <Button type="submit" :size="isDesktop ? 'sm' : ''" :disabled="isSubmitting">
                  <Loader2 v-if="isSubmitting" class="animate-spin" />
                  <span class="lg:text-xs">{{ isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión' }}</span>
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
